---
title: ESP32/8266 烧录 MicroPython 并搭建 VS Code 开发环境
date: 2023-06-11 20:10:56 GMT+0800
categories: [IoT]
tags: [Python]
---

::: abstract
[ESP](https://www.espressif.com/zh-hans/products/socs/esp32) 国内乐鑫公司生产的芯片，[MicroPython](https://docs.micropython.org/en/latest/) 是为硬件设备打造的 Python 实现。记录了 Linux 下的 VS Code 搭建环境，并实现智能提示与跳转。
:::

<!-- more -->

## 相关知识

### 通信协议

- Wifi：可以直接接入互联网，耗能高，最好能连接电源
- BLE（Bluetooth Low Energy）：需要额外的通信网关处理协议转换，耗能低，可以用电池供电

### NodeMCU 开发板

NodeMCU 多种芯片，包括支持 WiFi 的 ESP8266 芯片（十几块钱）以及同时支持 WiFi 和 BLE 的 ESP32 芯片（二十几块钱）。这里以 ESP32 为例。

## 烧录固件与串口通信

### 电脑连接板子

USB 连接板子，执行下面看看是否有输出：

::: code-group

```terminal [Linux]
$ ls /dev/ttyUSB* # 可能一开始没有输出，需要添加用户权限
$ sudo usermod -a -G uucp $USER # Arch Linux
$ sudo usermod -a -G dialout $USER # not Arch Linux
$ sudo reboot
$ ls /dev/ttyUSB*
/dev/ttyUSB0
```

```terminal [Mac OS]
$ ls /dev/cu.*
```

:::

### 下载 MicroPython 固件

需要在[官方下载页面](https://micropython.org/download/?port=esp32)根据开发板型号下载适合的固件，我下载的是目前最新的 [v1.20.0](https://micropython.org/resources/firmware/esp32-20230426-v1.20.0.bin) 的固件。

### 安装烧录工具

[esptool](https://github.com/espressif/esptool)用于与 ESP8266 和 ESP32 系列芯片中的 ROM 引导加载程序进行通信，可以将二进制数据写入闪存。

```terminal
$ pipx install esptool
$ esptool.py --port /dev/ttyUSB0 erase_flash # 擦除flash
$ esptool.py --chip esp32 --port /dev/ttyUSB0 \
write_flash -z 0x1000 esp32-20230426-v1.20.0.bin # 烧写MicroPython固件
```

### 安装串口终端工具

安装[picocom](https://github.com/npat-efault/picocom)

```terminal
$ mkdir -p ~/install && cd ~/install
$ git clone https://github.com/npat-efault/picocom.git
$ cd picocom
$ make
$ cp picocom ~/bin
```

### 串口通信

进入开发板的 Python 交互命令行：

```terminal
$ picocom -b 115200 /dev/ttyUSB0
picocom v3.2a

port is        : /dev/ttyUSB0
flowcontrol    : none
baudrate is    : 115200
parity is      : none
databits are   : 8
stopbits are   : 1
escape is      : C-a
local echo is  : no
noinit is      : no
noreset is     : no
hangup is      : no
nolock is      : no
send_cmd is    : sz -vv
receive_cmd is : rz -vv -E
imap is        :
omap is        :
emap is        : crcrlf,delbs,
logfile is     : none
initstring     : none
exit_after is  : not set
exit is        : no

Type [C-a] [C-h] to see available commands
Terminal ready
# 这里需要按一下回车才会展示命令提示符 // [!code hl]
>>> 1+1
2
>>> import machine
>>> help(machine)
object <module 'umachine'> is of type module
  __name__ -- umachine
  mem8 -- <8-bit memory>
  mem16 -- <16-bit memory>
  mem32 -- <32-bit memory>
  freq -- <function>
  reset -- <function>
  soft_reset -- <function>
  unique_id -- <function>
  sleep -- <function>
  lightsleep -- <function>
  deepsleep -- <function>
  idle -- <function>
  disable_irq -- <function>
  enable_irq -- <function>
  bitstream -- <function>
  time_pulse_us -- <function>
  dht_readinto -- <function>
  Timer -- <class 'Timer'>
  WDT -- <class 'WDT'>
  SDCard -- <class 'SDCard'>
  SLEEP -- 2
  DEEPSLEEP -- 4
  Pin -- <class 'Pin'>
  Signal -- <class 'Signal'>
  TouchPad -- <class 'TouchPad'>
  ADC -- <class 'ADC'>
  ADCBlock -- <class 'ADCBlock'>
  DAC -- <class 'DAC'>
  I2C -- <class 'I2C'>
  SoftI2C -- <class 'SoftI2C'>
  I2S -- <class 'I2S'>
  PWM -- <class 'PWM'>
  RTC -- <class 'RTC'>
  SPI -- <class 'SPI'>
  SoftSPI -- <class 'SoftSPI'>
  UART -- <class 'UART'>
  reset_cause -- <function>
  HARD_RESET -- 2
  PWRON_RESET -- 1
  WDT_RESET -- 3
  DEEPSLEEP_RESET -- 4
  SOFT_RESET -- 5
  wake_reason -- <function>
  PIN_WAKE -- 2
  EXT0_WAKE -- 2
  EXT1_WAKE -- 3
  TIMER_WAKE -- 4
  TOUCHPAD_WAKE -- 5
  ULP_WAKE -- 6
```

> 先按下<kbd>Ctrl</kbd>+<kbd>a</kbd>前缀，再按下<kbd>Ctrl</kbd>+<kbd>x</kbd>来中断通信。

## 搭建开发环境

VS Code 默认是用的电脑上的 Python 解释器及对应的库代码，所以在导入 MicroPython 的包（比如 machine）的时候会飘红，而且没有代码提示，所以需要配置 VS Code 从指定的文件夹里找库代码。

安装[Micropy CLI](https://github.com/BradenM/micropy-cli)与环境初始化：

```terminal
$ pipx install micropy-cli
  installed package micropy-cli 4.2.1, installed using Python 3.11.3
  These apps are now globally available
    - micropy
done! ✨ 🌟 ✨
$ micropy stubs search esp32 # 搜索esp32相关的固件源码

MicroPy  Results for esp32:
MicroPy  micropy-stubs     ::  esp32-micropython-1.10.0 (1fece8044812db84c74903309b5f27732c562b0e7b7326a626576316546cd153)
MicroPy  micropy-stubs     ::  esp32-micropython-1.11.0 (f95d1051b1a547b41ac4b441bcb46152dac4a9367b7f48de93a191f29e4856b0)
MicroPy  micropy-stubs     ::  esp32-micropython-1.12.0 (b3634afcb491835ee437837e9a3d3a746fc027333d0a0704b24424e30ec533f9)
MicroPy  micropy-stubs     ::  esp32-micropython-1.15.0 (ae01ef84269541e9f91bb0620c3f9c39fd77a4cc982780df795994069ae69bfa)
MicroPy  micropy-stubs     ::  esp32-micropython-1.9.4 (c01b7c6bb781e952edf356c36c0e33bb9bb38a461f6e4f11ae805fa64d643206)
MicroPy  micropy-stubs     ::  esp32-pycopy-1.11.0 (491d1032a9a2e9b427cd4a56dc6e6263bbb7c9d8d4ce15ec72e05eed27c8de77)
MicroPy  micropy-stubs     ::  esp32-pycopy-2.11.0.1 (292f7d0d58d56b169d1728b1de9343ec982660ad588b4f321df9f0c03c2d25a4)
MicroPy  micropy-stubs     ::  esp32-pycopy-2.11.0.5 (ad276f24575d2d3bb582fa19e5e9f4e500b16469ddf668700b8c81fbf32b96e5)
MicroPy  micropy-stubs     ::  esp32-pycopy-3.0.0 (79a88333490eb4c57124c7375246d6697802ba5ac30cbfd37777868562f5b5f9)
MicroPy  micropy-stubs     ::  esp32_LoBo (2aeb0e220d8db0d2fce21c1a936228ee94824edf402ac42dda6fef0e45ded197)
MicroPy  micropy-stubs     ::  esp32_LoBo-esp32_LoBo-3.2.24 (7677021c96e1484a8768451b5d8866d19e0585c7340edba5dbfda0ffdc122881)
MicroPy  micropy-stubs     ::  esp32s2-micropython-1.15.0 (b20dd0296bddf4e37f72e222a2bfedb8450040004f7d99e4810e70ff17ce8b5e)
MicroPy  micropython-stubs ::  micropython-esp32-ota-stubs (1.20.0.post1)
MicroPy  micropython-stubs ::  micropython-esp32-stubs (1.20.0.post1)
MicroPy  micropython-stubs ::  micropython-esp32-um_tinypico-stubs (1.19.1.post6)
$ micropy stubs add micropython-esp32-stubs # 下载指定的固件源码

MicroPy  Adding micropython-esp32-stubs to stubs
MicroPy  micropython_esp32_stubs-1.20.0.post1: 100%|█████████████████████| [104k/104k @ 538MB/s]
MicroPy  micropython-stdlib-stubs-0.9.0: 100%|█████████████████████| [52.7k/52.7k @ 492MB/s]
MicroPy  micropython: 100%|█████████████████████| [43.6k/43.6k @ 572MB/s]
MicroPy  ✔ micropython-esp32-stubs added!
$ mkdir -p ~/workspace/micropython/esp32/demo
$ cd ~/workspace/micropython/esp32/demo
$ micropy init # 配置开发环境
? Project Name demo
? Choose any Templates to Generate done (4 selections)
? Which stubs would you like to use? done (2 selections)

MicroPy  Creating New Project

MicroPy  Initiating micropython-demo
MicroPy  Stubs: micropython-stdlib-stubs micropython-esp32-stubs

MicroPy  Rendering Templates
MicroPy  Populating Stub Info...
MicroPy  Vscode File Generated!
MicroPy  Pylint File Generated!
MicroPy  Vsextensions File Generated!
MicroPy  Main File Generated!
MicroPy  Boot File Generated!
MicroPy  Gitignore File Generated!
MicroPy  ✔ Stubs Injected!
MicroPy  ✔ Project Created!

MicroPy  Created micropython-demo at ./.
```

然后重新加载 VS Code 窗口就可以实现代码跳转了。