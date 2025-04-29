---
title: REPL的正确打开方式
date: 2025-03-15 21:49:01 GMT+0800
categories: [生产力]
tags: [Linux, Neovim]
disable: true
---

::: abstract
开发中经常需要和 [REPL](https://en.wikipedia.org/wiki/Read%E2%80%93eval%E2%80%93print_loop) 交互，比如用终端时离不开 Shell，用 Python 自带的 REPL 来快速调试脚本，用`sqlite`或者`mysql`等命令临时查看数据库。
但是会有些问题，比如 nix 安装的`sqlite`没法通过按“上”调出上一个命令，而是会直接回显`^[[A`。于是我写了一百行 Lua ，通过 NeoVim 来优化这个工作流，按回车就会把代码发到 REPL，支持高亮。
看别人的 Python 脚本时，可以一行一行执行，理解得更透彻。写 LeetCode 时，写完可以发给 REPL 快速调试。
:::

<!-- more -->

## 演示

## 实现

1. 垂直切分一个窗口，可以通过 `vim.cmd("vsplit")` 然后获取 win id 来实现，我使用的是 [Snacks](https://github.com/folke/snacks.nvim) 包装的函数。

```lua
local repl_win = Snacks.win.new { position = 'right', enter = true, bo = { filetype = 'repl' } }
```

2. 在新窗口中打开终端，这里用 python 举例，因为 python repl 没有高亮，所以可以用 neovim treesitter 来帮它高亮。

```lua
local chan_id = vim.fn.termopen {'python'}
vim.treesitter.start(repl_win.buf, 'python')
```
