---
title: Linux 安装 AX210 无线网卡与蓝牙
date: 2022-12-08 09:39:02 GMT+0800
categories: [家庭服务]
tags: [Linux]
---

::: abstract

包括 AX210 的网卡驱动安装、蓝牙驱动安装、配置无线 AP、命令行下使用蓝牙。

:::

<!-- more -->

安装好 AX210 硬件后进入系统，执行`sudo dmesg|grep 'iwlwifi\|Bluetooth'`可以看到网卡和蓝牙都加载失败了。

## 驱动安装

### 安装网卡驱动

`/lib/firmware/`目录下对于`iwlwifi-ty-a0-gf-a0`前缀仅保留编号为 **59** 的驱动：

```terminal
$ ls /lib/firmware/ |grep iwlwifi-ty-a0-gf-a0
iwlwifi-ty-a0-gf-a0-59.ucode
iwlwifi-ty-a0-gf-a0-63.ucode.bak # 其余编号的把它删了，或者重命名改掉
iwlwifi-ty-a0-gf-a0-66.ucode.bak
$ sudo reboot
$ sudo dmesg|grep 'iwlwifi'
[    4.020883] iwlwifi 0000:06:00.0: enabling device (0000 -> 0002)
[    4.021629] iwlwifi 0000:06:00.0: Direct firmware load for iwlwifi-ty-a0-gf-a0-66.ucode failed with error -2
[    4.021650] iwlwifi 0000:06:00.0: Direct firmware load for iwlwifi-ty-a0-gf-a0-65.ucode failed with error -2
[    4.021673] iwlwifi 0000:06:00.0: Direct firmware load for iwlwifi-ty-a0-gf-a0-64.ucode failed with error -2
[    4.021689] iwlwifi 0000:06:00.0: Direct firmware load for iwlwifi-ty-a0-gf-a0-63.ucode failed with error -2
[    4.021704] iwlwifi 0000:06:00.0: Direct firmware load for iwlwifi-ty-a0-gf-a0-62.ucode failed with error -2
[    4.021720] iwlwifi 0000:06:00.0: Direct firmware load for iwlwifi-ty-a0-gf-a0-61.ucode failed with error -2
[    4.021735] iwlwifi 0000:06:00.0: Direct firmware load for iwlwifi-ty-a0-gf-a0-60.ucode failed with error -2
[    4.023787] iwlwifi 0000:06:00.0: api flags index 2 larger than supported by driver
[    4.023803] iwlwifi 0000:06:00.0: TLV_FW_FSEQ_VERSION: FSEQ Version: 93.8.63.28
[    4.024065] iwlwifi 0000:06:00.0: loaded firmware version 59.601f3a66.0 ty-a0-gf-a0-59.ucode op_mode iwlmvm
[    4.102859] iwlwifi 0000:06:00.0: Detected Intel(R) Wi-Fi 6 AX210 160MHz, REV=0x420
[    4.254983] iwlwifi 0000:06:00.0: Detected RF GF, rfid=0x10d000
[    4.320286] iwlwifi 0000:06:00.0: base HW address: 40:1c:83:8d:fd:97
[    4.335000] iwlwifi 0000:06:00.0 wlp6s0: renamed from wlan0
$ ip a|grep wlp6s0 # 安装成功
6: wlp6s0: <BROADCAST,MULTICAST> mtu 1500 qdisc noop state DOWN group default qlen 1000
```

> 如果`/lib/firmware/`目录下没有`iwlwifi-ty-a0-gf-a0-59.ucode`，可以在[这里](https://git.kernel.org/pub/scm/linux/kernel/git/firmware/linux-firmware.git/tree/)搜索并下载。

### 安装蓝牙驱动

在[这里](https://git.kernel.org/pub/scm/linux/kernel/git/firmware/linux-firmware.git/tree/intel)下载`ibt-0041-0041.ddc`和`ibt-0041-0041.sfi`放到`/lib/firmware/intel`目录下。

```terminal
$ cd /lib/firmware/intel
$ sudo wget https://git.kernel.org/pub/scm/linux/kernel/git/firmware/linux-firmware.git/plain/intel/ibt-0041-0041.ddc
...
$ sudo wget https://git.kernel.org/pub/scm/linux/kernel/git/firmware/linux-firmware.git/plain/intel/ibt-0041-0041.sfi
...
$ sudo reboot
$ sudo dmesg|grep 'Bluetooth'
[    4.086057] Bluetooth: Core ver 2.22
[    4.086081] Bluetooth: HCI device and connection manager initialized
[    4.086085] Bluetooth: HCI socket layer initialized
[    4.086087] Bluetooth: L2CAP socket layer initialized
[    4.086091] Bluetooth: SCO socket layer initialized
[    4.112191] Bluetooth: hci0: Firmware timestamp 2021.28 buildtype 1 build 28502
[    4.115941] Bluetooth: hci0: Found device firmware: intel/ibt-0041-0041.sfi
[    4.115983] Bluetooth: hci0: Boot Address: 0x100800
[    4.115984] Bluetooth: hci0: Firmware Version: 86-28.21
[    4.115985] Bluetooth: hci0: Firmware already loaded
[    4.213178] Bluetooth: hci0: MSFT filter_enable is already on
[    4.582673] Bluetooth: BNEP (Ethernet Emulation) ver 1.3
[    4.582676] Bluetooth: BNEP filters: protocol multicast
[    4.582681] Bluetooth: BNEP socket layer initialized
$ sudo apt install bluetooth bluez
...
$ hcitool dev # 安装成功
Devices:
        hci0    40:1C:83:8D:FD:9B
```

## 连接 WiFi

```terminal
$ sudo iwlist wlp6s0 scan|grep SSID # 扫描WiFi
                    ESSID:"CU_urie"
                    ESSID:"urie_home"
$ wpa_passphrase "urie_home" "password" |sudo tee /etc/wpa_supplicant/default.conf # 生成要连接的WiFi的配置
network={
        ssid="urie_home"
        #psk="password"
        psk=047efb080c730f2bf930f2bebaa6cc0326b3a5aca75f3c9398fa1197222a5de0
}
$ sudo ifconfig wlp6s0 up
$ sudo wpa_supplicant -i wlp6s0 -c /etc/wpa_supplicant/default.conf -B # 连接WiFi
Successfully initialized wpa_supplicant
$ sudo dhclient wlp6s0 # 通过DHCP获取IP
$ ifconfig wlp6s0
wlp6s0: flags=4099<UP,BROADCAST,MULTICAST>  mtu 1500
        inet 192.168.1.109  netmask 255.255.255.0  broadcast 192.168.1.255
        ether 40:1c:83:8d:fd:97  txqueuelen 1000  (Ethernet)
        RX packets 2173578  bytes 3064439784 (2.8 GiB)
        RX errors 0  dropped 0  overruns 0  frame 0
        TX packets 52868  bytes 721336342 (687.9 MiB)
        TX errors 0  dropped 0 overruns 0  carrier 0  collisions 0
```

## 配置无线 AP

> AX210 这块网卡的 AP 模式真够废的，由于 Intel 的合规要求，这块网卡只能用 2.5GHz，并且速度只有 10Mbps 左右。

```terminal
$ sudo apt install hostapd
...
$ sudo systemctl unmask hostapd # 启用hostapd
$ sudo systemctl status hostapd
● hostapd.service - Access point and authentication server for Wi-Fi and Ethernet
     Loaded: loaded (/lib/systemd/system/hostapd.service; enabled; vendor preset: enabled)
     Active: failed (Result: exit-code) since Thu 2022-12-08 10:15:40 CST; 46min ago
       Docs: man:hostapd(8)
        CPU: 0

Dec 08 10:15:40 pve systemd[1]: hostapd.service: Failed to schedule restart job: Unit hostapd.servic>
Dec 08 10:15:40 pve systemd[1]: hostapd.service: Failed with result 'exit-code'.
$ cat /lib/systemd/system/hostapd.service # 可以看到配置文件位置
[Unit]
Description=Access point and authentication server for Wi-Fi and Ethernet
Documentation=man:hostapd(8)
After=network.target

[Service]
Type=forking
PIDFile=/run/hostapd.pid
Restart=on-failure
RestartSec=2
Environment=DAEMON_CONF=/etc/hostapd/hostapd.conf
EnvironmentFile=-/etc/default/hostapd
ExecStart=/usr/sbin/hostapd -B -P /run/hostapd.pid -B $DAEMON_OPTS ${DAEMON_CONF}

[Install]
WantedBy=multi-user.target
```

编辑配置文件：

```ini
# /etc/hostapd/hostapd.conf
driver=nl80211
ssid=urie_home_2
interface=wlp6s0
country_code=CN
utf8_ssid=1

# Operation mode (a = IEEE 802.11a (5 GHz), b = IEEE 802.11b (2.4 GHz),
# g = IEEE 802.11g (2.4 GHz), ad = IEEE 802.11ad (60 GHz); a/g options are used
# with IEEE 802.11n (HT), too, to specify band). For IEEE 802.11ac (VHT), this
# needs to be set to hw_mode=a. When using ACS (see channel parameter), a
# special value "any" can be used to indicate that any support band can be used.
# This special case is currently supported only with drivers with which
# offloaded ACS is used.
# Default: IEEE 802.11b
hw_mode=g
# Channel number (IEEE 802.11)
# (default: 0, i.e., not set)
# Please note that some drivers do not use this value from hostapd and the
# channel will need to be configured separately with iwconfig.
#
# If CONFIG_ACS build option is enabled, the channel can be selected
# automatically at run time by setting channel=acs_survey or channel=0, both of
# which will enable the ACS survey based algorithm.
channel=6

# IEEE 802.11 specifies two authentication algorithms. hostapd can be
# configured to allow both of these or only one. Open system authentication
# should be used with IEEE 802.1X.
# Bit fields of allowed authentication algorithms:
# bit 0 = Open System Authentication
# bit 1 = Shared Key Authentication (requires WEP)
auth_algs=3

# 1: wpa, 2: wpa2, 3: both
wpa=3
wpa_key_mgmt=WPA-PSK
wpa_passphrase=www.1234
wpa_pairwise=CCMP
rsn_pairwise=CCMP

# Default WMM parameters (IEEE 802.11 draft; 11-03-0504-03-000e):
# for 802.11a or 802.11g networks
# These parameters are sent to WMM clients when they associate.
# The parameters will be used by WMM clients for frames transmitted to the
# access point.
#
# note - txop_limit is in units of 32microseconds
# note - acm is admission control mandatory flag. 0 = admission control not
# required, 1 = mandatory
# note - Here cwMin and cmMax are in exponent form. The actual cw value used
# will be (2^n)-1 where n is the value given here. The allowed range for these
# wmm_ac_??_{cwmin,cwmax} is 0..15 with cwmax >= cwmin.
wmm_enabled=1

# ieee80211n: Whether IEEE 802.11n (HT) is enabled
# 0 = disabled (default)
# 1 = enabled
# Note: You will also need to enable WMM for full HT functionality.
# Note: hw_mode=g (2.4 GHz) and hw_mode=a (5 GHz) is used to specify the band.
ieee80211n=1
ieee80211d=1
```

```terminal
$ sudo ip addr add 192.168.3.1/24 dev wlp6s0 # 给无线网卡分配ip
$ sudo start hostapd
$ svc status hostapd
● hostapd.service - Access point and authentication server for Wi-Fi and Ethernet
     Loaded: loaded (/lib/systemd/system/hostapd.service; enabled; vendor preset: enabled)
     Active: active (running) since Thu 2022-12-08 11:08:00 CST; 6s ago
       Docs: man:hostapd(8)
    Process: 225446 ExecStart=/usr/sbin/hostapd -B -P /run/hostapd.pid -B $DAEMON_OPTS ${DAEMON_CONF}>
   Main PID: 225457 (hostapd)
      Tasks: 1 (limit: 18817)
     Memory: 724.0K
        CPU: 12ms
     CGroup: /system.slice/hostapd.service
             └─225457 /usr/sbin/hostapd -B -P /run/hostapd.pid -B /etc/hostapd/hostapd.conf

Dec 08 11:08:00 pve systemd[1]: Starting Access point and authentication server for Wi-Fi and Etherne>
Dec 08 11:08:00 pve hostapd[225446]: Configuration file: /etc/hostapd/hostapd.conf
Dec 08 11:08:00 pve hostapd[225446]: wlp6s0: interface state UNINITIALIZED->COUNTRY_UPDATE
Dec 08 11:08:00 pve systemd[1]: Started Access point and authentication server for Wi-Fi and Ethernet.
```

到这里手机就能搜到这个 WiFi，但由于没有给这个网卡配置 **DHCP** ，所以需要手动配置手机的 IP、网关、掩码；并且由于没有配置 **NAT**，手机只能访问路由器上的服务，无法访问公网。

### 配置 DHCP

修改`isc-dhcp-server`配置:

```ini
# /etc/dhcp/dhcpd.conf
ddns-update-style none;

subnet 192.168.3.0 netmask 255.255.255.0 {
        range 192.168.3.100 192.168.3.199;
        default-lease-time 86400;
        max-lease-time 864000;
        option domain-name-servers 192.168.3.1, 114.114.114.114;
        option routers 192.168.3.1;
        option subnet-mask 255.255.255.0;
}
```

通过`sudo dpkg-reconfigure isc-dhcp-server`命令启动，配置 DHCP 网卡为无线网卡`wlp6s0`。

然后修改手机的 IP 为自动，就可以自动分配到 IP 了。

### 配置 NAT

```terminal
$ sudo iptables -t nat -I POSTROUTING -s 192.168.3.0/24 -o wlp6s0 -j MASQUERADE
```

然后手机重连一下 WiFi 就可以上外网了。

### 配置桥接

配置桥接是为了虚拟一个交换机，让多个有线网口和 WiFi 网口可以连接起来用同一个网段。

在`/etc/network/interfaces`文件底部追加虚拟网桥的信息，并配置 IP：

```terminal
$ cat <<EOF | sudo tee -a /etc/network/interfaces
auto vmbr1
iface vmbr1 inet static
        address 192.168.2.1/24
        bridge-ports enp3s0 enp4s0 enp5s0 wlp6s0
        bridge-stp off
        bridge-fd 0
EOF
$ sudo systemctl restart networking
$ ifconfig vmbr1
vmbr1: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500
        inet 192.168.2.1  netmask 255.255.255.0  broadcast 0.0.0.0
        inet6 fe80::62be:b4ff:fe05:a67d  prefixlen 64  scopeid 0x20<link>
        ether 60:be:b4:05:a6:7d  txqueuelen 1000  (Ethernet)
        RX packets 862398  bytes 149198861 (142.2 MiB)
        RX errors 0  dropped 0  overruns 0  frame 0
        TX packets 1379782  bytes 2363724824 (2.2 GiB)
        TX errors 0  dropped 0 overruns 0  carrier 0  collisions 0
```

::: tip

1. 如果没有`networking`服务，可以用`brctl`和`ip`命令来实现
2. 被桥接的网口不需要再配 IP 了
3. 虚拟网桥名可以直接用于`iptables`等命令里

:::

## 使用蓝牙

```terminal
$ sudo hcitool scan # 扫描周围蓝牙
Scanning ...
        FC:E8:06:8A:62:C3       EDIFIER R101V
        08:16:D5:01:16:6B       Pico Neo 3
        F0:B0:40:A0:54:6D       客厅的小米电视
$ sudo hcitool cc FC:E8:06:8A:62:C3 # 连接蓝牙，但是没连上
$ sudo bluetoothctl
Agent registered
[CHG] Controller 40:1C:83:8D:FD:9B Pairable: yes
[EDIFIER R101V]# connect FC:E8:06:8A:62:C3
Attempting to connect to FC:E8:06:8A:62:C3
Connection successful
[CHG] Device FC:E8:06:8A:62:C3 ServicesResolved: yes
```

### 连接蓝牙音箱播放音频

```terminal
$ sudo apt install pulseaudio-module-bluetooth # 蓝牙音频需要安装这个
...
$ ffplay -nodisp -autoexit example.wav
```