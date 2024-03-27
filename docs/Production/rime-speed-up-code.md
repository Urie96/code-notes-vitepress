---
title: 通过 Rime 输入法实现快速连按输入不同符号
date: 2024-03-25 20:49:53 GMT+0800
categories: [生产力]
tags: [keyboard]
---

::: abstract
在写代码时经常需要输入成对出现的符号，比如 `!=` `<=` `>=`， Golang 的 `:=`， Javascript 的 `!==`， Lua 的 `~=` 等等，挨个按不仅浪费时间，而且有按错的可能。
于是我通过 Rime 输入法的 Lua 插件来实现连按两下<kbd>!</kbd> 来输入 `!=`，第一次按<kbd>!</kbd>会立即输出`!`，50ms 内第二次按会立即输出`=`，所以不会对单独使用`!`带来任何延迟。
另外还支持快速切换环境的，比如在 Javascript 环境下连按三下<kbd>!</kbd> 输入 `!==`，
在 Golang 环境下连按两下<kbd>:</kbd>输入 `:=`，还可以把<kbd>;</kbd> 映射为<kbd>:</kbd>因为 Golang 不需要分号。
:::

<!-- more -->

## Rime 的简单介绍

Rime 是一种配置化程度极高的开源输入法，Mac/Windows/Linux 三种平台有各自的软件实现，没有 GUI 配置界面，全靠文件配置，非常适合程序猿使用。
个人感觉 Rime 入门门槛不低，需要静下心来逐行学习[官方文档](https://github.com/rime/home/wiki/Configuration)。

- Mac 端的 Rime 叫鼠须管（[Squirrel](https://github.com/rime/squirrel)）
- Windows 端叫小狼毫（[Weasel](https://github.com/rime/weasel)）
- Linux 端叫中州韵（[ibus-rime](https://github.com/rime/ibus-rime)）

**移除 Mac 默认 abc 输入法**

因为需要 Rime 来接管英文输入法，有时候 Mac 系统会自动切换成系统自带的 abc 输入法，很烦人，系统设置里面还没法直接删除 abc 输入法，但可以通过下面 shell 脚本删除，然后注销重新登录即可。

```sh
cd ~/Library/Preferences/ || return
count=$(/usr/libexec/PlistBuddy -c "Print AppleEnabledInputSources" com.apple.HIToolbox.plist | grep -c "Dict")

for ((i = 0; i < count; i++)); do
  if [ "$(/usr/libexec/PlistBuddy -c "Print AppleEnabledInputSources:$i:KeyboardLayout\ Name" com.apple.HIToolbox.plist 2>/dev/null)" = "ABC" ]; then

    read -p "Confirm to remove default abc input method?(Y/n)" -n 1 -r choice && echo
    case "$choice" in
    y | Y | '') ;;
    *) return ;;
    esac

    /usr/libexec/PlistBuddy -c "Delete :AppleEnabledInputSources:$i" com.apple.HIToolbox.plist
    return
  fi
done
```

因为 Mac 默认使用<kbd>Ctrl</kbd>+<kbd>Space</kbd>来切换输入法，为了保持肌肉记忆习惯，需要在系统设置里解绑这个快捷键，并通过配置给 Rime 绑定快捷键：

```yaml
# ~/Library/Rime/default.yaml 文件内配置 key_binder
---
key_binder:
  bindings:
    # 切换中英文输入
    - { accept: 'Control+space', toggle: ascii_mode, when: always }
    # 有时候想输入英文但忘了切换，为了不重新打这些已经输入到候选框的字符，按esc直接上屏并切成英文输入法，另外也确保vim normal模式是英文状态
    - { accept: 'Escape', send: Caps_Lock, when: has_menu }
    # Shift+BackSpace 删除候选框内所有字符
    - { accept: 'Shift+BackSpace', send: Escape, when: has_menu }
```

## 通过 Lua 插件 Hook 键盘输入

给输入法的 processors 第一行配置 lua 插件，每次键盘按键都会调用此 lua

```yaml
# ~/Library/Rime/double_pinyin_flypy.schema.yaml
---
engine: # 輸入引擎設定，即掛接組件的「處方」
  processors: # 一、這批組件處理各類按鍵消息
    - lua_processor@*code_processor # 在processors的ascii_composer前面添加这行, 指向lua插件 # [!code highlight]
    - ascii_composer # ※ 處理西文模式及中西文切換
```

新增一个 hello world 级别的插件，每一次按键都会调用 func 函数，在 info 日志里打印 keycode 和人类可读的表达式：

```lua
-- ~/Library/Rime/lua/code_processor.lua
local M = {}

function M.func(key, env)
  log.info(string.format("keycode: %d, expr: %s", key.keycode, key:repr()))
  return 2
  -- 返回0表示中断rime处理，不消费键盘事件，操作系统继续处理
  -- 返回1表示不再调用rime其他，键盘事件被消费
  -- 返回2表示继续调用下游rime组件
end

return M
```

重新加载 Squirrel 之后，按键盘上任意字符，可在日志中查看到，127 及以下的 keycode 对应 ascii 码（a 对应 97，A 对应 65）

```terminal
$ /Library/Input\ Methods/Squirrel.app/Contents/MacOS/Squirrel --reload
$ grep keycode "$TMPDIR/rime.squirrel.INFO"
I20240326 16:32:13.501492 165398364 types.cc:1332] keycode: 65362, expr: Up
I20240326 16:32:14.586297 165398364 types.cc:1332] keycode: 65293, expr: Return
I20240326 16:32:15.824174 165398364 types.cc:1332] keycode: 97, expr: a
I20240326 16:32:17.072093 165398364 types.cc:1332] keycode: 115, expr: s
I20240326 16:32:17.567049 165398364 types.cc:1332] keycode: 65293, expr: Return
I20240326 16:32:18.804587 165398364 types.cc:1332] keycode: 65507, expr: Control+Control_L
I20240326 16:32:19.040910 165398364 types.cc:1332] keycode: 99, expr: Control+c
I20240326 16:32:19.057579 165398364 types.cc:1332] keycode: 65507, expr: Release+Control_L
I20240326 16:32:19.334019 165398364 types.cc:1332] keycode: 65362, expr: Up
I20240326 16:32:19.581195 165398364 types.cc:1332] keycode: 65293, expr: Return
I20240326 16:32:22.776937 165398364 types.cc:1332] keycode: 97, expr: a
```

::: tip
如果没有日志文件，需要通过`killall Squirrel`命令杀死输入法，Squirrel 会自动重启会生成日志文件
:::

继续迭代，只处理英文状态下，键盘上的字母和符号。
为了验证效果，判断如果按下的是 A，就上屏`hit`，后续组件不再处理。

```lua
local M = {}

function M.func(key, env)
  local ascii_mode = env.engine.context:get_option("ascii_mode")

  if key.keycode > 127 or not ascii_mode then
    return 2
  end

  if key.keycode == 65 then
    log.info(string.format("keycode: %d, expr: %s", key.keycode, key:repr()))
    env.engine:commit_text("hit")
    return 1
  end

  return 2
end

return M
```

reload 之后再按<kbd>A</kbd>就会输出 `hit`，证明 rime 提供的 API 能实现对键盘输入的 hook 修改。

## 第一版实现：连按时篡改第二次键盘输入

```lua
local M = {}

local last_time = 0

function M.func(key, env)
  local ascii_mode = env.engine.context:get_option("ascii_mode")

  if key.keycode > 127 or not ascii_mode then
    return 2
  end

  local keyname = string.char(key.keycode)

  if keyname == "!" then
    local now = os.time()
    if now - last_time < 1 then
      env.engine:commit_text("=")
      return 1
    end
    last_time = now
  else
    last_time = 0
  end

  return 2
end

return M
```

reload 之后，如果输入的是<kbd>!</kbd>，就会记录当前时间戳，如果两次按下<kbd>!</kbd>的时间小于 1s，当前就会输出<kbd>=</kbd>。

上面的超时时间是 1s，这个时间太长了，有个不太友好的体验，如果真正想输入`!!`时，第一次按下会立即上屏`!`没问题，但是需要等 1s 才能再按第二次，否则会输出`=`。

可惜 lua 原生没有提供获取毫秒时间戳的函数，librime-lua 也不打算提供此 API，我去提了[issue](https://github.com/hchunhui/librime-lua/issues/311)，但没有说服维护者。

一种办法是安装`luasocket`，通过`require('socket').gettime()`来获取毫秒时间：

```terminal
$ brew install luarocks # 安装lua包管理器
$ luarocks install luasocket # 安装luasocket库
Warning: falling back to wget - install luasec to get native HTTPS support
Installing https://luarocks.org/luasocket-3.1.0-1.src.rock

luasocket 3.1.0-1 depends on lua >= 5.1 (5.4-1 provided by VM)
env MACOSX_DEPLOYMENT_TARGET=11.0 gcc -O2 -fPIC -I/usr/local/opt/lua/include/lua5.4 -c src/mime.c -o src/mime.o -DLUASOCKET_DEBUG -DUNIX_HAS_SUN_LEN
...

luasocket 3.1.0-1 is now installed in /usr/local (license: MIT)
$ lua
Lua 5.4.6  Copyright (C) 1994-2023 Lua.org, PUC-Rio
> require('socket').gettime()
1711450150.9801
>
```

但是这种办法安装的依赖太多了，而且只是为了获取一个时间戳，就引入一个网络库，有点杀鸡用牛刀的感觉。

另一种办法是自己写一个 Lua API 编译为动态共享库，交给 lua 调用。

## C 语言编译动态共享库供 Lua 调用

C Lua API 见[官方文档](https://www.lua.org/pil/24.1.html)。

```c
#include <sys/time.h>
#include <lauxlib.h>
#include <lua.h>

static int timeInMilliseconds(lua_State *L) {
  struct timeval tv;
  gettimeofday(&tv, NULL); // 通过C API获取系统当前毫秒时间
  long long now_milli = (((long long)tv.tv_sec) * 1000) + (tv.tv_usec / 1000);
  lua_pushnumber(L, now_milli); // 将时间戳压入栈
  return 1; // 函数返回参数个数
}

int luaopen_timer(lua_State *L) {
  // 给lua虚拟机暴露now函数来调用timeInMilliseconds
  static const struct luaL_Reg nativeFuncLib[] = {{"now", timeInMilliseconds},
                                                  {NULL, NULL}};
  luaL_newlib(L, nativeFuncLib);
  return 1;
}
```

这段代码依赖 lua 的头文件，需要确保机器上安装了`lua`，然后编译为`.so`文件

```terminal
$ export BREW_LUA_PATH="$(brew --prefix lua)"
$ gcc -L "${BREW_LUA_PATH}/lib" -I "${BREW_LUA_PATH}/include/lua" timer.c -shared -o libtimer.so -fPIC -llua
$ nm libtimer.so
                 U _gettimeofday
                 U _luaL_checkversion_
                 U _luaL_setfuncs
                 U _lua_createtable
                 U _lua_pushnumber
0000000000003ee0 T _luaopen_timer
0000000000004030 s _luaopen_timer.nativeFuncLib
0000000000003f30 t _timeInMillisecond
```

将这个.so 文件的绝对路径添加到 lua 的 cpath，在 require 的时候，cpath 中的问号会被替换为 require 的参数进行遍历查找，将找到的第一个进行加载。
cpath 可以通过外部环境变量`LUA_CPATH`进行添加，也可以在 lua 代码 require 前修改`package.cpath`变量进行添加。

```terminal
$ echo "print(require('timer').now())" | LUA_CPATH="./lib?.so;" lua
1711453898644.0
$ lua
Lua 5.4.6  Copyright (C) 1994-2023 Lua.org, PUC-Rio
> package.cpath="./lib?.so;"
> timer=require("timer")
> timer.now()
1711453974451.0
> timer.now()
1711453975946.0
>
```

如果有多台 Mac 机器，又不想每台机器上挨个编译，可以用过 Mac 提供的`lipo`命令打包 x86 和 arm 的版本为单个二进制文件，分发给其他架构的机器。
交叉编译的命令也需要做一些更改，不再将本机的 lua lib 链接到 so 上，而是指定`-bundle -undefined dynamic_lookup`参数，在运行时进行动态链接。

```terminal
$ gcc timer.c -I "${BREW_LUA_PATH}/include/lua" -bundle -undefined dynamic_lookup -o libtimer.so -fPIC -target arm64-apple-macos
ld: warning: -undefined dynamic_lookup may not work with chained fixups
$ gcc timer.c -I "${BREW_LUA_PATH}/include/lua" -bundle -undefined dynamic_lookup -o libtimer_x86.so -fPIC -target x86_64-apple-macos
ld: warning: -undefined dynamic_lookup may not work with chained fixups
$ lipo -archs ./libtimer_x86.so
x86_64
$ lipo -archs ./libtimer_arm.so
arm64
$ lipo -create -output libtimer.so ./libtimer_x86.so ./libtimer_arm.so
$ lipo -archs ./libtimer.so
x86_64 arm64
$ echo "print(require('timer').now())" | LUA_CPATH="./lib?.so;" lua
1711454438241.0
```

## 通过候选栏来切换语言环境

在写 Golang 时希望双击 <kbd>:</kbd>能够输出`:=`，在 Rust 时希望双击<kbd>:</kbd>就是输出`:=`，所以配置当前语言环境是有必要的。

在 Rime 中文输入法中，输入的字符不会立即上屏而是进入候选栏，所以我们可以通过`/`这种中文下不常用的字符来识别用户切换环境的意图。

首先编辑中文的 yaml 配置，让`/`符号进入候选栏而不是直接上屏：

```yaml
# ~/Library/Rime/double_pinyin_flypy.schema.yaml
--
speller:
  alphabet: zyxwvutsrqponmlkjihgfedcbaZYXWVUTSRQPONMLKJIHGFEDCBA`/ # 末尾添加了/
```

为了不干扰正常输入单个`/`，所以只好给`//`配置候选项为当前支持的语言环境，也就是中文状态按两次 <kbd>/</kbd>才会触发：

```yaml
--
punctuator:
  import_preset: default
  symbols:
    '//': [/no, /go] # 中文状态下两个/会将 /no 和 /go 推入候选项
```

![Alt text](./images/image-4.png)

然后需要在 lua 插件里监听用户选了上面哪个选项，从而切换环境。
显而易见的想法是在用户按空格时判断当前所选中的候选项，但是中文状态的空格使用太多了，不想要太频繁地去触发检测，所以继续选择使用`/`进行选中。
选中之后插件会切换成新的语言环境配置，并且将当前的中文状态切换为英文状态。

```lua
package.cpath = os.getenv("HOME") .. "/Library/Rime/lua/lib/lib?.so;" .. package.cpath
local timer = require("timer")

local M = {
  Rejected = 0,
  Accepted = 1,
  Noop = 2,
}

local function getTime()
  return timer.now() -- milliseconds
end

local config = {
  timeout = 300,
  global = {
    ["<"] = {
      timeout = 1000,
      "<",
      {
        accept = ",",
        send = "=",
      },
    },
    [">"] = {
      timeout = 1000,
      ">",
      {
        accept = ".",
        send = "=",
      },
    },
    ["!"] = {
      "!",
      {
        accept = "!",
        send = "=",
      },
    },
    ["#"] = {
      "#",
      {
        accept = "#",
        send = "!",
      },
    },
  },
  ["/go"] = {
    [":"] = {
      ":",
      {
        accept = ":",
        send = "=",
      },
    },
  },
  ["/no"] = {},
}

local function merge(t1, t2)
  local t3 = {}
  for key, value in pairs(t1) do
    t3[key] = value
  end
  for key, value in pairs(t2) do
    t3[key] = value
  end
  return t3
end

local config_cache = {
  timeout = config.timeout,
  key = config.global,
}

function M.init()
  log.info("code_processor init")
end

-- 切换开关函数
local function apply_switch(env, keyword, target_state)
  local ctx = env.engine.context
  local swt = Switcher(env.engine)
  local conf = swt.user_config
  ctx:set_option(keyword, target_state)
  if swt:is_auto_save(keyword) and conf ~= nil then
    conf:set_bool("var/option/" .. keyword, target_state)
  end
end

local last = {
  time = 0,
  count = 0,
  cfg = nil,
}

function M.func(key, env)
  local ctx = env.engine.context

  if key.keycode == 47 and (ctx:is_composing() or ctx:has_menu()) then
    local text = ctx.input
    if ctx:get_selected_candidate() then
      text = ctx:get_selected_candidate().text
    end
    text = text:lower()
    if config[text] then
      config_cache = {
        timeout = config.timeout,
        key = merge(config.global, config[text]),
      }
      ctx:clear()
      apply_switch(env, "ascii_mode", true)
      apply_switch(env, "code_mode", true)
      return M.Accepted
    end
  end

  local ascii_mode = env.engine.context:get_option("ascii_mode")
  local code_mode = env.engine.context:get_option("code_mode")
  if key.keycode > 127 or not ascii_mode or not code_mode then
    return M.Noop
  end
  local keyname = string.char(key.keycode)

  if last.cfg then
    local cfg = last.cfg[last.count]
    if cfg then
      local now = getTime()
      local timeout = last.cfg.timeout or config_cache.timeout
      if now - last.time < timeout then
        if cfg.accept == keyname then
          last.time = now
          env.engine:commit_text(last.cfg[last.count].send)
          last.count = last.count + 1
          return M.Accepted
        end
      end
    end
  end

  last.time = 0
  last.count = 0
  last.cfg = nil

  local cfg = config_cache.key[keyname]
  if cfg then
    last.time = getTime()
    last.cfg = cfg
    last.count = 2
    env.engine:commit_text(cfg[1])
    return M.Accepted
  end

  return M.Noop
end

return M
```