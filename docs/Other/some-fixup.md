---
title: 日常的一些小问题处理
date: 2023-06-06 12:44:54 GMT+0800
categories: [其它]
tags: []
---

## 在`tmux`中ssh到其他主机`clear`命令报错`terminals database is inaccessible`

原因是在ssh server中TERM环境变量是tmux-color-256，但是~/.terminfo中没有对应的信息，一种解决办法是在ssh client中给ssh命令配置TERM环境变量：

::: code-group

```fish [fish]
# ~/.config/fish/config.fish
if status is-interactive
  if test "$TMUX" != ""
    # command意思是使用PATH的命令，否则会死循环
    alias ssh="TERM=xterm command ssh" // [!code ++]
  end
end
```
:::

## 我的Alacritty配置

```yaml
# ~/.config/alacritty/alacritty.yml
window:
  padding:
    x: 10
    y: 10
  decorations: none
  opacity: 0.9
font:
  normal:
    family: FiraMono Nerd Font
  size: 15.0
```

安装FiraMono字体：

::: code-group

```zsh [Mac OS]
$ brew tap homebrew/cask-fonts
$ brew install font-fira-mono-nerd-font
```

```zsh [Arch Linux]
$ yay -S otf-firamono-nerd
```
:::

## VS Code通过Remote SSH连接远程服务器超时

在本地VS Code设置中添加：

```json
// xxx/settings.json
{
  "remote.SSH.useLocalServer": false, // [!code focus]
}
```

## Linux无法使用Windows免驱设备

为了给Windows提供驱动进行安装，usb免驱设备一开始是在CDROM模式，需要安装`usb_modeswitch`切换模式。

```zsh
# 出现问题
$ lsusb # 模式是在CDROM
Bus 003 Device 003 .... [CDROM MODE]
$ sudo bluetoothctl -- connect "XX:XX:XX:XX:XX:XX" # 找不到设备
No default controller available
$ sudo dmesg|grep 'wifi\|Bluetooth' # 蓝牙没有hci0
[   46.019733] Bluetooth: Core ver 2.22
[   46.019760] Bluetooth: HCI device and connection manager initialized
[   46.019765] Bluetooth: HCI socket layer initialized
[   46.019767] Bluetooth: L2CAP socket layer initialized
[   46.019771] Bluetooth: SCO socket layer initialized
# 开始解决
$ sudo pacman -S usb_modeswitch
$ sudo reboot # 似乎此时重启能彻底解决
$ lsusb --verbose
Bus 003 Device 004: ID 0bda:c820 Realtek Semiconductor Corp. 802.11ac NIC
Couldn't open device, some information will be missing
Device Descriptor:
  bLength                18
  bDescriptorType         1
  bcdUSB               2.00
  bDeviceClass          239 Miscellaneous Device
  bDeviceSubClass         2
  bDeviceProtocol         1 Interface Association
  bMaxPacketSize0        64
  idVendor           0x0bda Realtek Semiconductor Corp.
  idProduct          0xc820
  bcdDevice            2.00
  iManufacturer           1 Realtek
  iProduct                2 802.11ac NIC
  iSerial                 3 123456
  bNumConfigurations      1
  Configuration Descriptor:
    bLength                 9
...
$ sudo usb_modeswitch --default-vendor 0x0bda --default-product 0xc820 -W # 用上面输出的参数
# 成功
$ sudo dmesg|grep 'wifi\|Bluetooth' # 有hci0了
[   46.019733] Bluetooth: Core ver 2.22
[   46.019760] Bluetooth: HCI device and connection manager initialized
[   46.019765] Bluetooth: HCI socket layer initialized
[   46.019767] Bluetooth: L2CAP socket layer initialized
[   46.019771] Bluetooth: SCO socket layer initialized
[   46.059974] Bluetooth: hci0: RTL: examining hci_ver=08 hci_rev=000c lmp_ver=08 lmp_subver=8821
[   46.060968] Bluetooth: hci0: RTL: rom_version status=0 version=1
[   46.060971] Bluetooth: hci0: RTL: loading rtl_bt/rtl8821c_fw.bin
[   46.064226] Bluetooth: hci0: RTL: loading rtl_bt/rtl8821c_config.bin
[   46.064890] Bluetooth: hci0: RTL: cfg_sz 10, total sz 34926
[   46.527981] Bluetooth: hci0: RTL: fw version 0x75b8f098
[   46.539705] Bluetooth: BNEP (Ethernet Emulation) ver 1.3
[   46.539715] Bluetooth: BNEP filters: protocol multicast
[   46.539718] Bluetooth: BNEP socket layer initialized
[   46.593133] Bluetooth: MGMT ver 1.22
$ lsusb
Bus 003 Device 003: ID 0406:2814 Fujitsu-ICL Computers USB Composite Device
$ sudo bluetoothctl -- scan on
Discovery started
[CHG] Controller 90:91:64:28:6C:98 Discovering: yes
[NEW] Device 3C:9B:A5:64:43:EE 3C-9B-A5-64-43-EE
...
```