---
title: 日常的一些小问题处理
date: 2023-06-06 12:44:54 GMT+0800
categories: [其它]
tags: []
---

## 在`tmux`中 ssh 到其他主机`clear`命令报错`terminals database is inaccessible`

原因是在 ssh server 中 TERM 环境变量是 tmux-color-256，但是~/.terminfo 中没有对应的信息，一种解决办法是在 ssh client 中给 ssh 命令配置 TERM 环境变量：

::: code-group

```fish
# ~/.config/fish/config.fish
if status is-interactive
  if test "$TMUX" != ""
    # command意思是使用PATH的命令，否则会死循环
    alias ssh="TERM=xterm command ssh" // [!code ++]
  end
end
```

:::

## 我的 Alacritty 配置

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

安装 FiraMono 字体：

::: code-group

```terminal [Mac OS]
$ brew tap homebrew/cask-fonts
$ brew install font-fira-mono-nerd-font
```

```terminal [Arch Linux]
$ yay -S otf-firamono-nerd
```

:::

## VS Code 通过 Remote SSH 连接远程服务器超时

在本地 VS Code 设置中添加：

```json
// xxx/settings.json
{
  "remote.SSH.useLocalServer": false // [!code focus]
}
```

## Linux 无法使用 Windows 免驱设备

为了给 Windows 提供驱动进行安装，usb 免驱设备一开始是在 CDROM 模式，需要安装`usb_modeswitch`切换模式。

```terminal
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

## Arch Linux

### 安装 nvidia 驱动

```terminal
$ sudoedit /etc/pacman.conf # uncomment multilib
# 为了安装lib32-nvidia-utils
$ sudo pacman -Sy
$ sudo pacman -S nvidia nvidia-settings lib32-nvidia-utils
$ sudoedit /etc/mkinitcpio.conf # delete kms from HOOK
# 为了关闭内核自带的nouveau驱动，从而使用nvidia驱动
$ sudo reboot

$ sudo dmesg # 仍然报错，因为nvidia-utils没能禁用nouveau
[    3.818839] nvidia-nvlink: Nvlink Core is being initialized, major device number 511
[    3.818844] NVRM: The NVIDIA probe routine was not called for 1 device(s).
[    3.819827] NVRM: This can occur when a driver such as:
               NVRM: nouveau, rivafb, nvidiafb or rivatv
               NVRM: was loaded and obtained ownership of the NVIDIA device(s).
[    3.819828] NVRM: Try unloading the conflicting kernel module (and/or
               NVRM: reconfigure your kernel without the conflicting
               NVRM: driver(s)), then try loading the NVIDIA kernel module
               NVRM: again.
[    3.819828] NVRM: No NVIDIA devices probed.
[    3.819952] nvidia-nvlink: Unregistered Nvlink Core, major device number 511
$ lsmod | grep -E "nvidia|nouveau" # 仍然加载了nouveau
nouveau              3440640  0
drm_ttm_helper         12288  1 nouveau
ttm                    98304  2 drm_ttm_helper,nouveau
i2c_algo_bit           20480  1 nouveau
mxm_wmi                12288  1 nouveau
drm_display_helper    204800  1 nouveau
video                  73728  1 nouveau
wmi                    45056  4 video,wmi_bmof,mxm_wmi,nouveau
$ echo 'blacklist nouveau'|sudo tee /etc/modprobe.d/nouveau-blacklist.conf # 手动禁用nouveau
$ sudo mkinitcpio -p linux
$ sudo reboot

$ lsmod | grep -E "nvidia|nouveau"
nvidia_drm             94208  0
nvidia_modeset       1556480  1 nvidia_drm
nvidia_uvm           3469312  0
nvidia              62513152  2 nvidia_uvm,nvidia_modeset
video                  73728  1 nvidia_modeset
$ nvidia-smi # 成功
Fri Jul  7 13:25:33 2023
+---------------------------------------------------------------------------------------+
| NVIDIA-SMI 535.54.03              Driver Version: 535.54.03    CUDA Version: 12.2     |
|-----------------------------------------+----------------------+----------------------+
| GPU  Name                 Persistence-M | Bus-Id        Disp.A | Volatile Uncorr. ECC |
| Fan  Temp   Perf          Pwr:Usage/Cap |         Memory-Usage | GPU-Util  Compute M. |
|                                         |                      |               MIG M. |
|=========================================+======================+======================|
|   0  NVIDIA GeForce RTX 3060        Off | 00000000:01:00.0 Off |                  N/A |
|  0%   60C    P0              43W / 170W |      1MiB / 12288MiB |      0%      Default |
|                                         |                      |                  N/A |
+-----------------------------------------+----------------------+----------------------+

+---------------------------------------------------------------------------------------+
| Processes:                                                                            |
|  GPU   GI   CI        PID   Type   Process name                            GPU Memory |
|        ID   ID                                                             Usage      |
|=======================================================================================|
|  No running processes found                                                           |
+---------------------------------------------------------------------------------------+
$ sudo pacman -S cuda
```