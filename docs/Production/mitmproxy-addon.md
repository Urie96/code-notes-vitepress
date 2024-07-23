---
title: 为命令行抓包工具 mitmproxy 添加一些实用插件
date: 2024-03-29 11:46:47 GMT+0800
categories: [生产力]
tags: [Linux]
disable: false
---

::: abstract
`mitmproxy`是一个开源的可配置的 TUI 的抓包工具，可以方便地在远程机上开启代理。
默认的修改请求响应功能只能针对单条请求实时进行修改，可用但不方便。
我添加了一些插件来支持快速过滤请求、修改请求/响应、跨 SSH 复制 curl/请求/响应。
:::

<!-- more -->

## `mitmproxy`插件的基本概念

mitmproxy 遍历脚本的 addons 数组，每个元素是一个类，实现了一些方法。
`request()`会在请求到 mitmproxy 的时候调用，修改原来的请求再发到服务端，`response()`会在响应到来的时候调用，修改实际响应之后回复给服务端。
`load()`用于添加 mitmproxy 的选项，脚本可以监听这些选项的变更来实现相应的操作。
`@command.command()`装饰器可以给 mitmproxy 添加命令，可以通过 <kbd>:</kbd> 快捷键来调用任意命令。

```python
# ~/.mitmproxy/scripts/extra_commands.py
import logging

from mitmproxy import command, ctx, flow, http
from mitmproxy.log import ALERT

class ExtraCommands:
    def __init__(self):
        logging.info("init")

    def load(self, loader):
        logging.info(loader)

    def request(self, flow):
        pass # 修改每次请求

    def response(self, flow):
        pass # 修改每次响应

    @command.command("extra.my_command") # 通过装饰器添加命令extra.my_command，mitmproxy会校验方法的参数类型，不可省略
    def my_command(self, flow: flow.Flow) -> None:
        # 入参是自定义的，支持的类型有限，flow表示命令需要传入一个请求
        logging.info(flow) # 打印到mitmproxy事件窗口里面，即快捷键E打开的界面
        logging.log(ALERT, "Done") # 在mitmproxy界面底部进行提示

addons = [ExtraCommands()]
```

配置快捷键，比如下面的配置，在流列表界面或者流详情页按 <kbd>c</kbd> 的时候会调用 `extra.my_command @focus`命令，也就是上面的`my_command()`方法，**@focus**表示当前光标所在的流。

```yaml
# ~/.mitmproxy/keys.yaml

- key: c
  cmd: extra.my_command @focus
  ctx:
    - flowlist # 主页，即流列表界面
    - flowview # 流的详情页
```

配置自定义的插件为自加载，这样不用每次都通过`mitmproxy -s`命令手动加载插件

```yaml
# ~/.mitmproxy/config.yaml

scripts:
  - ./scripts/extra_commands.py
```

## 快速过滤请求

抓包的时候经常 app 的有些 log 请求特别频繁，非常干扰，需要对请求进行过滤。
mitmproxy 默认是通过快捷键 <kbd>f</kbd> 编辑过滤请求的正则，比如输入 `! ~u log` 表示不展示 url 中包含"log"的请求，输入`(~u https://xxx.com) & (! ~u log)`表示只展示对"https://xxx.com"请求且url不包含"log"的请求。
在使用中，不想去记忆这些复杂隐晦的语法，也不想输入这么多字符，就想简单通过快捷键就能把当前光标指向的请求所对应的域名或者 url 拉黑或者加白，这就需要通过自己编写 mitmproxy 插件来实现。

最终实现的目标是通过按 <kbd>F</kbd> 弹出一个选项栏，包括**只展示当前光标请求的域名**、**只展示当前光标请求的 url**、**不展示当前光标请求的域名**、**不展示当前光标请求的 url**，并且过滤是可叠加的，即先过滤了 "https://foo.com"，又过滤了"https://bar.com"，那这两个域名都会被过滤，操作如下：

<Asciinema src="/asciinema/mitmproxy-filter.cast" startAt=27 />

代码如下：

```python
# ~/.mitmproxy/scripts/extra_commands.py
class ExtraCommands:
    def __init__(self):
        self.filters = [] # 保存当前所有过滤规则，取交集

    @command.command("extra.filter_similar_options") # 这个命令专门返回弹窗的所有选项
    def filter_url_options(self) -> Sequence[str]:
        return [
            "only show this host",
            "only show this url",
            "hide this host",
            "hide this url",
            "clear filter",
        ]

    @command.command("extra.filter_similar")
    def filter_url(self, action: str) -> None: # action 接收上面选项之一，根据不同选项做不同操作
        options = self.filter_url_options()
        if action == options[4]:
            self.filters.clear()
            ctx.master.commands.call("set", "view_filter", "") # 将view_filter的option置空，这会展示所有流
            logging.log(ALERT, "clear")
            return

        if len(self.filters) == 0 and ctx.master.options.view_filter:
            self.filters.append("(" + ctx.master.options.view_filter + ")") # 提前将用户手动输入的view_filter存起来，不然后面就失效了

        flow = ctx.master.addons.get("view").focus.flow # 获取当前光标所在的流
        host, path, _ = split_url(flow)

        if action == options[0]:
            self.filters.append(f"~u {host}") # 添加过滤项，只展示当前域名的请求
        elif action == options[1]:
            self.filters.append(f"~u {host+path}")
        elif action == options[2]:
            self.filters.append(f"!(~u {host})")
        elif action == options[3]:
            self.filters.append(f"!(~u {host+path})")
        ctx.master.commands.call("set", "view_filter", " & ".join(self.filters)) # 规则用&连接，表示需要全满足才展示，配置view_filter，mitmproxy内置命令会处理过滤
        logging.log(ALERT, "done")

def split_url(flow: http.HTTPFlow): # 提取http请求的域名、路径、query
    host = flow.request.host
    path, *query = flow.request.path.split("?", 1) # path的标准定义是包括query的，需要通过?截取一下
    query = query[0] if len(query) > 0 else ""
    return host, path, query
```

配置快捷键：

```yaml
# ~/.mitmproxy/keys.yaml

- key: F
  cmd: |
    console.choose.cmd Action extra.filter_similar_options
    extra.filter_similar {choice}
  ctx:
    - flowlist
```

> 内置命令`console.choose.cmd`会根据`extra.filter_similar_options`命令返回的数组弹出弹窗供用户选择，选的选项会传递给`extra.filter_similar`命令的`{choice}`参数

## 从 SSH 会话中复制

内置的 <kbd>x</kbd> 快捷键支持将当前请求的`curl`、`httpie`、`raw`、`raw_request`、`raw_response`复制到系统剪切板。
但是这在 SSH 会话中无效，因为 ssh 服务端根本无法拿到客户端的剪切板。

不过可以通过 [OCS52](<https://en.wikipedia.org/wiki/ANSI_escape_code#OSC_(Operating_System_Command)_sequences>) 来实现。如下：

```terminal
$ echo -ne "\e]52;c;$(echo -n helloworld | base64)\a"
$ pbpaste
helloworld
```

原理就是在 ssh 会话中打印 ANSI 控制字符传递到终端，终端模拟器识别到这是要求复制剪切板，就会将对应的内容存到系统剪切板，而这些内容不会真正打印到终端屏幕上。

插件代码如下：

```python
# ~/.mitmproxy/scripts/extra_commands.py
import base64

class ExtraCommands:
    @command.command("extra.osc_copy")
    def osc_copy(self, format: str, flow: flow.Flow) -> None:
        curl_str = ctx.master.commands.call("export", format, flow) # 调用内置的export命令，返回需要复制的内容
        print("\033]52;c;" + base64.b64encode(curl_str.encode()).decode() + "\007") # 通过osc52协议，打印内容到终端
        logging.log(ALERT, f"{format} copied to system clipboard")
```

配置快捷键，复用内置的导出请求的`export.formats`的选项，传递给自定义的`extra.osc_copy`命令：

```yaml
# ~/.mitmproxy/keys.yaml

- key: c
  cmd: |
    console.choose.cmd Format export.formats
    extra.osc_copy {choice} @focus
  ctx:
    - flowlist
    - flowview
```

## 持久地修改请求响应

mitmproxy 默认支持的修改请求功能是：先配置好 intercept，匹配的请求会被阻塞，这段时间里可以编辑请求或响应，然后恢复请求，完成修改。
这有两个弊端，首先客户端可能配置了较短 http 超时，如果短时间内未收到响应就已经报错了，后续的响应不会处理。
其次是只能针对单次请求，下次请求还是不会修改，还得手动再编辑一次。

我添加的插件是想实现先正常请求响应一次，然后编辑这条请求或响应并配置对后续匹配的请求应用该此次编辑的请求或响应，后面客户端再请求就全是被修改的了：

<Asciinema src="/asciinema/mitmproxy-modify.cast" startAt=5 />

插件代码实现：

```python
class ExtraCommands:
    def __init__(self):
        self.modify_request_map = dict() # 保存对多个请求的修改，key是method+url
        self.modify_response_map = dict() # 保存对多个响应的修改

    def request(self, flow):
        if not isinstance(flow, http.HTTPFlow):
            return
        key = flow.request.method + flow.request.url
        modify_to = self.modify_request_map.get(key)
        if modify_to: # 如果请求的url和method匹配，就把替换掉header和body
            flow.request.headers = modify_to.get("headers")
            flow.request.set_text(modify_to.get("body"))
            logging.log(ALERT, "request modified")

    def response(self, flow):
        if not isinstance(flow, http.HTTPFlow):
            return
        key = flow.request.method + flow.request.url
        modify_to = self.modify_response_map.get(key)
        if modify_to:
            flow.response.headers = modify_to.get("headers")
            flow.response.set_text(modify_to.get("body"))
            logging.log(ALERT, "response modified")

    @command.command("extra.modify_later_options")
    def modify_for_later_options(self) -> Sequence[str]:
        return [
            "modify later response",
            "modify later request",
            "clear all",
        ]

    @command.command("extra.modify_later")
    def modify_for_later(self, action: str) -> None:
        options = self.modify_for_later_options()
        if action == options[2]:
            self.modify_response_map.clear()
            self.modify_request_map.clear()
            return
        flow = ctx.master.addons.get("view").focus.flow
        key = flow.request.method + flow.request.url
        if action == options[0]:
            self.modify_response_map[key] = {
                "headers": flow.response.headers,
                "body": flow.response.get_text(),
            }
        elif action == options[1]:
            self.modify_request_map[key] = {
                "headers": flow.request.headers,
                "body": flow.request.get_text(),
            }
```

配置快捷键：

```yaml
# ~/.mitmproxy/keys.yaml

- key: M
  cmd: |
    console.choose.cmd Action extra.modify_later_options
    extra.modify_later {choice}
  ctx:
    - flowlist
    - flowview
```

> 如果不想在编辑前发送一次请求，可以通过 <kbd>n</kbd>新建一条流，填好后面要 hook 的 url，和需要的 header 和 body，然后再用 <kbd>M</kbd>快捷键进行修改。

## 设置请求环境

在开发测试时有时候需要给请求加上 env 的 header，使得请求打到 feature 环境上（不加 env header 会打到线上生产环境），就需要通过快捷键来快速变更请求环境。
请求环境需要预设到插件里，比如怎么改 header，然后在抓包时通过快捷键来应用某一个环境，后续的请求都会被修改。

<Asciinema src="/asciinema/mitmproxy-env-select.cast" startAt=8 />

插件代码：

```python
class ExtraCommands:
    def __init__(self):
        self.modify_request_map = dict()
        self.modify_response_map = dict()
        self.filters = []
        self.extra_headers = dict()
        self.env = 0

    def load(self, loader): # 添加mitmproxy选项
        loader.add_option(
            name="custom_env",
            typespec=str,
            default="",
            help="Select env for request",
        )

    def request(self, flow):
        if not isinstance(flow, http.HTTPFlow):
            return
        custom_env = ctx.options.custom_env
        if custom_env.startswith("ppe_"):
            flow.request.headers.pop("x-use-boe", None)
            flow.request.headers["x-use-ppe"] = "1"
            flow.request.headers["x-tt-env"] = custom_env
        elif custom_env.startswith("boe_"):
            flow.request.headers.pop("x-use-ppe", None)
            flow.request.headers["x-use-boe"] = "1"
            flow.request.headers["x-tt-env"] = custom_env
        elif custom_env != "":
            logging.log(ALERT, f"Unkown custom env: {custom_env}")
```

配置快捷键：

```yaml
# ~/.mitmproxy/keys.yaml

- key: H
  cmd: console.command.set custom_env
  ctx:
    - flowlist
```