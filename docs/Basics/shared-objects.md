---
title: 动态共享库.so的一些皮毛
date: 2022-10-26 16:51:42 GMT+0800
categories: [基础]
tags: [C]
---

::: abstract
动态共享库`.so`文件（Windows 下是`.dll`文件）是一堆编译后的二进制机器码，可以被其他程序（可以是不同语言）调用。可以理解成一个函数库，有输入和输出，其他程序在调用的时候把输入放到合适的栈内存，动态库调用完成后，主程序可以从栈中拿到返回值。
:::

<!-- more -->

::: warning
网上说是放到寄存器，但是一个函数的参数可以有很多，放到寄存器不可能，所以我理解应该是放到栈内存，然后动态库自己去处理寄存器。
:::

## 动态库`.so`的命名规范

`.so`文件的命名规范是`libxxx.so.123`，其中`xxx`是动态库的名字，`123`是版本号（可选的）。

## C 语言调用动态库

首先生成一个`libadd.so`，返回输入的两个整数之和：

```c
// add.c
int add(int x, int y) {
    return (x + y);
}
```

```terminal
$ gcc add.c -shared -o libadd.so
$ nm -D libadd.so # nm命令可以看到动态库包含的函数
00000000000010f9 T add
                 w __cxa_finalize
                 w __gmon_start__
                 w _ITM_deregisterTMCloneTable
                 w _ITM_registerTMCloneTable
```

### 方法一：编译时指定动态库

```c
// main.c
#include <stdio.h>

int add(int x, int y);

int main()
{
    printf("%d\n", add(10, 20));

    return 0;
}
```

编译并执行：

```terminal
$ gcc main.c -L./ -ladd -o main
# 编译：-L指定动态库的路径，-l指定动态库的名字，动态库不会在编译期间被链接，而是在运行期间被加载
$ LD_LIBRARY_PATH=$PWD ./main
# 执行：LD_LIBRARY_PATH指定动态库的路径，不然只会在系统默认的路径中查找，如 /lib /usr/lib
30
```

#### 替换`libadd.so`动态库

- 修改`add.c`，变成两数之差：

```c
int add(int x, int y) {
    return (x - y);
}
```

编译动态库，然后直接执行 main：

```terminal
$ gcc add.c -shared -o libadd.so
$ LD_LIBRARY_PATH=$PWD ./main
-10
```

- 修改`add.c`的函数参数个数：

```c
int add(int x) {
    return (x + 1);
}
// main output:
// 11
```

- 修改`add.c`的函数参数类型：

```c
char add() {
  return 'a';
}
// main output:
// 97
```

- 修改函数名:

```c
char add2() {
  return 'a';
}
// main output:
// ./main: symbol lookup error: ./main: undefined symbol: add
```

### 方法二：使用`dl`库

```c
// main2.c
#include <stdio.h>
#include <dlfcn.h>

int (*add)(int a, int b);

int main()
{
    void* handle = dlopen("./libadd.so", RTLD_LAZY);

    add = dlsym(handle, "add");

    printf("%d\n", add(10,20));

    dlclose(handle);

    return 0;
}
```

```terminal
$ gcc main2.c -ldl -o main2 # 编译时依赖dl头文件，不依赖libadd动态库
$ ./main2 # 运行时依赖动态库，但没有手动指定动态库路径，因为是写死在代码里的
30
```

## Go 调用动态库

```go
package main

/*
#cgo LDFLAGS: -L./ -ladd
int add(int x, int y);
*/
import "C"
import (
	"fmt"
)

func main() {
	val := C.add(10, 20)
	fmt.Println("run c: ", val)
}
```

::: tip
`import "C"`上面紧挨的注释是 C 语言代码，里面的`#cgo`是编译时给`gcc`传的参数
:::

然后将`libadd.so`放到`main.go`所在的目录下，执行：

```terminal
$ go build -o main # 和C语言一样需要在编译时指定动态库的路径
$ ./main # 如果运行时不指定动态库路径
./main: error while loading shared libraries: libadd.so: cannot open shared object file: No such file or directory
$ LD_LIBRARY_PATH=$PWD ./main
30
```

和[上面](#替换libadd-so动态库) C 语言一样替换`libadd.so`，然后直接执行`main`，结果是一样的。

## Go 导出 C 动态库

```go
package main

import "C"

func main() {}

//export add
func add(a, b C.int) C.int {
	return (a + b)
}
```

::: tip
`main()`函数不可缺少，不然会编译错误；`add()`函数上的`export add`注释表示要导出的动态库函数；
:::

导出 C 动态库：

```terminal
$ go build -buildmode=c-shared -o libadd.so # 编译成动态库和头文件libadd.h
$ nm -D
                 U abort
0000000000086890 T add
0000000000086880 T _cgoexp_4a7338d1815b_add
0000000000086b50 T _cgo_get_context_function
00000000000871b0 T _cgo_libc_setegid
... # 此处省略许多行
```

导出静态库并与 C 代码静态链接：

```terminal
$ go build -buildmode=c-archive -o add.a # 会生成add.h头文件
$ cat <<EOF > _main.c
#include <stdio.h>
#include "add.h"

int main()
{
    printf("%d\n", add(10, 20));

    return 0;
}
EOF
$ gcc _main.c add.a -lpthread -o main # 因为add.a里面有依赖，所以需要链接pthread
$ ./main
30
```

::: danger 疑惑
Go 语言有比较重的运行时（垃圾回收、协程调度等），导出共享库我感觉是不是不太合适？
:::

## Rust 调用动态库

```rust
// main.rs
extern "C" {
    fn add(a: i32, b: i32) -> i32;
}

fn main() {
    unsafe { // 调用动态库函数需要unsafe
        println!("{}", add(10, 20));
    }
}
```

```terminal
$ rustc ./main.rs -l add -L .
$ LD_LIBRARY_PATH=$PWD ./main
30
```

## Rust 导出动态库

`Cargo.toml`加`[lib]`，表示把 lib 编译为动态库：

```toml
[package]
name = "add"
version = "0.1.0"
edition = "2021"

[lib]
crate-type = ["cdylib"]
```

添加`lib.rs`:

```rust
#[no_mangle]
pub extern "C" fn add(a: i32, b: i32) -> i32 {
    return a - b;
}
```

```terminal
$ tree
.
├── Cargo.toml
└── src
    └── lib.rs

1 directory, 2 files
$ cargo build
   Compiling add v0.1.0 (/home/ubuntu/workplace/c/learn-so/add)
    Finished dev [unoptimized + debuginfo] target(s) in 0.28s
$ nm -D target/debug/libadd.so
                 U abort
0000000000006670 T add
                 U bcmp
                 U calloc
                 U close
... # 省略若干行
```