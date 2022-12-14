---
title: 使用MicroPython开发远程联网开关
date: 2021-02-03 11:59:11 GMT+0800
categories: [IoT]
tags: [Python]
---

[MicroPython](https://docs.micropython.org/en/latest/)为硬件设备打造的 Python 实现。这里用它来制作一个可以在手机上远程控制的开关。

<!-- more -->

## 前提知识

### 通信协议

- Wifi：可以直接接入互联网，耗能高，最好能连接电源
- BLE（Bluetooth Low Energy）：需要额外的通信网关处理协议转换，耗能低，可以用电池供电

### NodeMCU 开发板

NodeMCU 多种芯片，包括支持 WiFi 的 ESP8266 芯片（十几块钱）以及同时支持 WiFi 和 BLE 的 ESP32 芯片（二十几块钱）。由于开关处可以很方便地连接电源，所以采用 ESP8266 芯片。

## 步骤

### 下载 MicroPython 固件

```sh
wget https://micropython.org/resources/firmware/esp8266-20210202-v1.14.bin
```

## 安装烧录工具

[esptool](https://github.com/espressif/esptool)用于与 ESP8266 和 ESP32 系列芯片中的 ROM 引导加载程序进行通信，可以将二进制数据写入闪存。

```zsh
$ pipx install esptool
$ esptool.py read_mac
```
