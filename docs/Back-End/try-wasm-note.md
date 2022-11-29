---
title: WasmEdge
date: 2022-11-24 11:04:29 GMT+0800
categories: [后端]
tags: [wasm]
disable: true
---

<!-- more -->

安装 **WasmEdge** :

```zsh
$ curl -sSf https://raw.githubusercontent.com/WasmEdge/WasmEdge/master/utils/install.sh | bash
Detected Darwin-arm64
No path provided
Installing in /Users/urie/.wasmedge
WasmEdge Installation at /Users/urie/.wasmedge
Fetching WasmEdge-0.11.2
/tmp/wasmedge.91415 ~/workplace/go/temp
######################################################################## 100.0%
~/workplace/go/temp
Installing WasmEdge-0.11.2-Darwin in /Users/urie/.wasmedge/include
Installing WasmEdge-0.11.2-Darwin in /Users/urie/.wasmedge/lib
Installing WasmEdge-0.11.2-Darwin in /Users/urie/.wasmedge/bin

source /Users/urie/.wasmedge/env to use wasmedge binaries
$ source /Users/urie/.wasmedge/env
```

> `wasmedge`依赖 **LLVM**(Mac OS 的 C 编译器 Clang 就是 LLVM 的一个子项目)

先在 Mac Arm 写一个简单的 Go 代码编译为 Wasm 进行测试：

```go
package main

import "fmt"

func main() {
	fmt.Println("Hello, World!")
}
```

```zsh
$ tinygo build -wasm-abi=generic -target=wasi -o main.wasm main.go
$ ls -l main.wasm
-rwxr-xr-x  1 urie  staff  412011 11 25 10:59 main.wasm
$ wasmedge main.wasm
Hello, World!
$ wasmtime main.wasm # 所有 wasm 运行时都能跑
Hello, World!
$ uname -a
Darwin yangruideMac-mini.local 22.1.0 Darwin Kernel Version 22.1.0: Sun Oct  9 20:14:30 PDT 2022; root:xnu-8792.41.9~2/RELEASE_ARM64_T8103 arm64
```

> `tinygo`是另一个 Go 编译器，精简了标准 Go 的运行时，来支持在嵌入式设备上运行。同时也支持编译为 WebAssembly。

::: tip
通过下面的 Go 命令编译的 Wasm 只能用于浏览器(可能是我命令不对吧)，用 `wasmedge` 会报错：

```zsh
$ GOARCH=wasm GOOS=js go build -o test.wasm main.go
$ wasmedge test.wasm
instantiation failed: unknown import, Code: 0x62
    When linking module: "go" , function name: "debug"
    At AST node: import description
    At AST node: import section
    At AST node: module
$ GOARCH=wasm go build -o test.wasm main.go
go: unsupported GOOS/GOARCH pair darwin/wasm
```

:::

然后把上面生成的 main.wasm 编译产物复制到 Linux X86 上并运行：

```zsh
$ scp ./main.wasm home.lubui.com:/tmp
main.wasm                                          100%  402KB  16.5MB/s   00:00
$ ssh home.lubui.com wasmedge /tmp/main.wasm # 可以直接运行
Hello, World!
$ ssh home.lubui.com uname -a
Linux pve 5.15.30-2-pve #1 SMP PVE 5.15.30-3 (Fri, 22 Apr 2022 18:08:27 +0200) x86_64 GNU/Linux
```

对于上面生成的 main.wasm ，wasmedge 是以解释器模式来执行的，启动速度较慢。可以使用 wasmedge 的 AOT（Ahead Of Time）编译器进一步优化：

```zsh
$ wasmedgec main.wasm main_aot.wasm
[2022-11-25 11:54:49.886] [info] compile start
[2022-11-25 11:54:49.908] [info] verify start
[2022-11-25 11:54:49.926] [info] optimize start
[2022-11-25 11:54:51.236] [info] codegen start
[2022-11-25 11:54:52.890] [info] output start
lld: warning: /Users/urie/workplace/go/temp/main_aot.6a619b98c2.a050074990.o has version 13.0.0, which is newer than target minimum of 10.0
[2022-11-25 11:54:52.931] [info] compile done
[2022-11-25 11:54:52.947] [info] output start
$ ls -l main_aot.wasm # 变小了很多
-rwxr-xr-x  1 urie  staff  707934 11 25 11:54 main_aot.wasm
$ wasmedge main_aot.wasm
Hello, world!
$ wasmtime main_aot.wasm # AOT编译的产物同样是通用的，其他运行时也能用
Hello, world!
$ scp ./main_aot.wasm home.lubui.com:/tmp
main_aot.wasm                                             100%  691KB  15.3MB/s   00:00
$ wasmedge main_aot.wasm
[2022-11-25 13:16:45.437] [info] loading failed: malformed section id, Code: 0x25
[2022-11-25 13:16:45.438] [info]     AOT OS type unmatched.
[2022-11-25 13:16:45.438] [info]     Load AOT section failed. Use interpreter mode instead.
Hello, world!
$ ssh home.lubui.com wasmtime /tmp/main_aot.wasm
Hello, world!
```

> 对于 AOT 编译产物，wasmedge 会优先从里面提取本机二进制文件来以 AOT 模式执行，如果嵌入的二进制不与本机匹配，则会退回使用解释器模式执行。

如果代码里有网络请求或者端口监听等，依赖操作系统的 socket（不同操作系统有不一样的接口，编程语言提供的 lib 或者运行时会帮我们屏蔽底层差异），则需要把引入的相关的网络 lib 替换为 wasm 运行时提供的 lib（因为 wasm 运行时是提供了统一的系统接口，不需要编程语言操心自己跑在什么系统里）。
