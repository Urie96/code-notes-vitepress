---
title: 自定义 Neovim（一）：浏览 Golang 所有可用包及其导出函数
date: 2024-07-23 19:18:22 GMT+0800
disable: true
categories: [生产力]
tags: [Golang, Neovim]
---

::: abstract
通常，在写 Golang 代码时，如果需要导入某个包，要么输入包名通过 gopls 补全，要么通过 goimports 命令补全，我感觉两种方法的检索速度都是比较慢的。
所以我基于 Neovim 的 Telescope 插件，遍历当前项目所有可用包并缓存起来，以及通过 AST 解析包导出的函数签名与变量，实现可模糊搜索可用包，浏览包导出，一键导入到当前文件。
:::

<!-- more -->

## 效果预览

## Golang 是如何找到某个包的

### `go list`命令

可以通过`go list all`列出所有可用包，通过`-json`还能知道各个包在哪个 lujk，非常方便。
但是美中不足的是，如果`go get`了一个新包，这时候立即运行`go list all`，新包是不会列出来的，需要在代码里面用到才会列出来，这不符合我需要导出“所有”可用包的要求。

### `goimports`命令行工具

这个工具可以对代码中用到但没导入的包进行自动补全，比如代码里写了一行`strings.Join`，但没加在 import 语句，这时候运行`goimports`，
它会检索所有可用包，找到符合这个包名并且有`Join`函数的包，即`strings`，加到 import 语句里面。

通过测试，这个命令可以对刚刚`go get`的包进行补全，所以看了下它的[源码](https://cs.opensource.google/go/x/tools/+/refs/tags/v0.23.0:internal/imports/mod.go;l=93) ，大致是对四个位置进行检索：

1. 当前项目的其他包
2. 当前项目的 vendor 文件夹（我几乎不会运行`go mod vendor`这个命令，所以可以省略对这部分的检索）
3. 标准库 GOROOT 下的 /src
4. 第三方包代码库，变量 GOMODCACHE 或 GOPATH 下的 /pkg/mod

### Neovim Lua 中列举所有可用包

如果是用单线程 lua 来逐个扫描文件夹，肯定慢，所以考虑用`fd`命令来扫描。
如果是可以 import 的，一定是文件夹内有`*.go`文件，再添加一些其他过滤，如下：

```console
$ cd "$(go env GOROOT)/src" && fd -e go -E '*test*' -E examples -E cmd -E vendor -E main.go -E doc.go -E _test.go . | sed -E -e 's#@[^/]+##g' -e 's#/?[^/]+\.go$##g' | sort | uniq
archive/tar
archive/zip
arena
bufio
builtin
bytes
cmp
compress/bzip2
compress/flate
compress/gzip
compress/lzw
compress/zlib
container/heap
container/list
container/ring
context
crypto
crypto/aes
crypto/boring
crypto/cipher
crypto/des
crypto/dsa
crypto/ecdh
crypto/ecdsa
crypto/ed25519
crypto/elliptic
crypto/hmac
...
```

在 lua 内实现:

```lua
local cmd_cache={}

---@param cwd string
---@param dir_name_list string[]|nil
---@return Promise
local function list_go_modules_in_dir(use_cache, cwd, dir_name_list)
  dir_name_list = dir_name_list or {}
  table.sort(dir_name_list)

  local key=cwd .. table.concat(dir_name_list," ")

  local dir_quote = {}
  for _, item in pairs(dir_name_list) do
    table.insert(dir_quote, string.format("%q", item))
  end

  local cmd = {
    "sh",
    "-c",
    string.format(
      [[ fd -e go -E '*test*' -E examples -E cmd -E vendor -E main.go -E doc.go -E _test.go . %s | sed -E -e 's#@[^/]+##g' -e 's#/?[^/]+\.go$##g' | sort | uniq ]],
      table.concat(dir_quote, " ")
    ),
  }

  return Job.async_exec(cmd, { cwd = cwd, use_cache = use_cache })
end

```
