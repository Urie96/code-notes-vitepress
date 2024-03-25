---
title: Debian 配置主路由并开启代理
date: 2022-11-29 14:58:17 GMT+0800
categories: [家庭服务]
tags: [Linux, Clash, DHCP, Proxy, iptables]
---

::: abstract
前面的全局代理是通过旁路由实现的，理论上在终端设备跑满带宽的情况下，旁路由网卡上行和下行全都占满了，而且光猫需要处理三个网卡的流量转发（与终端设备、旁路由、公网），所以性能要求可能很高。这一章通过配置`iptables`、`isc-dhcp-server`、`route`实现一个 Linux 主路由。
:::

<!-- more -->

主路由至少要两张物理网卡，一张连接 WAN 侧广域网，一张连接 LAN 侧局域网。

要实现的网络结构：

```plantuml
node node1 as "光猫 192.168.1.1"
node node2 as "PC 192.168.2.2"
node node3 as "主路由 192.168.2.1"
node node4 as "无线AP"
node node5 as "手机 192.168.2.4"
node node6 as "电视盒子 192.168.2.5"
node4 <-- node2
node1 <-- node3 : 192.168.1.7
node3 <-- node4
node4 <-- node5
node4 <-- node6
```

## 无 NAT 的版本

给 LAN 网卡配置不同网段的 IP 192.168.2.1

```terminal
$ sudo route -n # route命令用于控制一个IP包应该传递给谁
Kernel IP routing table
Destination     Gateway         Genmask         Flags Metric Ref    Use Iface
0.0.0.0         192.168.1.1     0.0.0.0         UG    0      0        0 enp3s0 # 1
192.168.1.0     0.0.0.0         255.255.255.0   U     0      0        0 enp3s0 # 2
# 1: 默认路由，没配置到的IP包都通过enp3s0发给网关192.168.1.1，通常是发给广域网
# 2: 目标网段在192.168.1的包，从enp3s0网卡发出
$ cat /etc/network/interfaces
auto lo
iface lo inet loopback

auto enp3s0 # WAN侧网卡
iface enp3s0 inet static
        address 192.168.1.7/24
        gateway 192.168.1.1

auto enp4s0 # LAN侧网卡
iface enp4s0 inet static
        address 192.168.2.1/24
$ sudo ifconfig enp4s0 up
$ sudo systemctl restart networking
$ sudo route -n
Kernel IP routing table
Destination     Gateway         Genmask         Flags Metric Ref    Use Iface
0.0.0.0         192.168.1.1     0.0.0.0         UG    0      0        0 enp3s0
192.168.1.0     0.0.0.0         255.255.255.0   U     0      0        0 enp3s0
192.168.2.0     0.0.0.0         255.255.255.0   U     0      0        0 enp4s0
```

这时候 LAN 侧网卡可以连接电脑进行测试，需要手动配置电脑的 IP 和子网掩码在同一网段`192.168.2.2/24`，网关为`192.168.2.1`，然后测试一下：

```terminal
$ ping 192.168.2.1 # 可以通主路由LAN网口
PING 192.168.2.1 (192.168.2.1) 56(84) bytes of data.
64 bytes from 192.168.2.1: icmp_seq=1 ttl=64 time=0.131 ms
64 bytes from 192.168.2.1: icmp_seq=2 ttl=64 time=0.142 ms
^C
$ ping 192.168.1.7 # 也可以通WAN网口
...
$ ping 192.168.1.1 # 但是不能通光猫
# ICMP包可以到达光猫，但是光猫回应的时候找不到 192.168.2.1 的路由，所以包传不回来
```

所以需要再给光猫加路由表，ssh 连接光猫（下面是脑补的，因为没找到光猫超级密码，连不了 ssh）：

```terminal
$ route add -net 192.168.2.0 netmask 255.255.255.0 gw 192.168.1.7
$ # 让光猫把192.168.2.0/24网段的包都发给主路由
```

理论上这时候主路由 LAN 侧的设备能够上网了。

## 有 NAT 的版本

**NAT** 用于 IP 地址转换，可以将对内的多个 IP 映射为对外的一个（或多个）IP:HOST 组合。

以光猫为例，假如光猫的公网 IP 为 `123.119.102.209`，电脑 IP 为 `192.168.1.2`，电脑的 HTTP 客户端通过 `60000` 端口请求 `1.1.1.1:443`，当请求到达光猫时，光猫的 **SNAT** 会把请求里的源 IP 替换为公网 IP，源端口也会换一个，并记录到 NAT 映射表里（源`192.168.1.2:60000`，目标`1.1.1.1:443`，使用端口`60000`）,`1.1.1.1:443`处理完并发送`123.119.102.209:60000`，光猫核对映射表存在记录，所以会把 IP 包的目标 IP 和端口分别换成`192.168.1.2`和`60000`，然后就会发送到电脑了。

下面简单画了 IP 包在`iptables`里的传递（只考虑 filter 和 nat 两张表）：

```plantuml
(*) ->[收到包] "nat: PREROUTING"

if "目标IP是本机？" then
  ->[Y] "filter: INPUT"
  -> "本机处理"
  -> if "是否需要发包？" then
    -->[Y] "nat: OUTPUT"
    --> "filter: OUTPUT"
    --> "nat: POSTROUTING"
  else
    ->[F] (*)
  endif
else
  -->[F] "filter: FORWARD"
  --> "nat: POSTROUTING"
  ->[发出包] (*)
endif
```

::: tip

1. **DNAT** 可以作为一种端口映射，比如把路由器的 `8080` 端口映射到下游`192.168.2.2`的`8443`端口上，外网请求主路由的 `8080` 就等于请求内部的`192.168.1.2:8443`；

```terminal
$ sudo iptables -t nat -I PREROUTING -d 192.168.1.2 -p tcp --dport 8080 -j DNAT --to-destination 192.168.2.2:8443
```

2. **P2P** 打洞：两个在不同 NAT 下的局域网设备通常无法直接连接，但是可以通过一台公网设备作为信使，三端配合来“欺骗”两个 NAT 映射表，实现两台局域网设备直连。（貌似[`pwnat`](https://github.com/samyk/pwnat)可以不需要公网设备，通过 ICMP 来“欺骗”NAT 映射表实现直连）；
3. **SNAT** 加在 nat 表的 **POSTROUTING** 链，**DNAT**加在 nat 表的 **PREROUTING** 链。

:::

只需要在主路由的出口处配置一下 **SNAT** 就能实现：

```terminal
$ sudo iptables -t nat -I POSTROUTING -s 192.168.2.0/24 -o enp3s0 -j MASQUERADE
```

> 因为 WAN 侧只有一个 IP， 可以用`-j MASQUERADE`代替`-j SNAT -to-source xxx`。

然后将电脑网线插到主路由的 LAN 口，并手动配置好电脑的 IP、子网掩码、网关和 DNS，就可以上网了。

由于主路由做了 NAT，所以电脑发出的请求到了光猫那儿，源 IP 就成了主路由的 IP，所以光猫不用做任何修改也能正确地把传回的包通过主路由传回电脑。

如果要配置主路由的 LAN 侧请求走代理，可以给 nat 表的 PREROUTING 链加规则：

```terminal
$ sudo iptables -t nat -I PREROUTING -i enp4s0 -j CLASH
$ # 配置enp4s0网卡进来的包走CLASH链
```

> <Badge text="2023.02.21+" />
> 1. 配置主路由本机走代理：
>
> - Dockerfile 里添加一行`USER 0:2023`，以帮助 iptables 区分 clash 的出流量。
> - 启动脚本`iptables.sh`添加一行：
>
> ```terminal
> $ iptables -t nat -A OUTPUT -p tcp -m owner ! --gid-owner 2023 -j CLASH # 除了clash的出流量，都转发到CLASH链
> ```
>
> 2. 避免直接请求透明代理端口导致流量无限回环打满 CPU：
>
> ```terminal
> $ iptables -A OUTPUT -d 192.168.1.7 -p tcp --dport 7892 -m owner --gid-owner 2023 -j REJECT
> ```

## 配置 DHCP 服务

最后就是配置 DHCP 服务，实现对 LAN 侧设备的 IP、子网掩码、网关、DNS 的自动配置。

**Debian**使用的是`isc-dhcp-server`，编辑其配置文件：

```ini
# /etc/dhcp/dhcpd.conf
ddns-update-style none;

subnet 192.168.2.0 netmask 255.255.255.0 {
    range 192.168.2.100 192.168.2.199; # LAN设备要分配的IP范围
    default-lease-time 86400; # 默认租期
    max-lease-time 864000;
    option domain-name-servers 192.168.2.1, 114.114.114.114; # 指定DNS，LAN设备没配置的话就走这个
    option routers 192.168.2.1; # LAN设备的网关地址
    option subnet-mask 255.255.255.0; # LAN设备的子网掩码
    host mac-inet { # 根据MAC地址固定分配IP
        hardware ethernet 14:98:77:48:a2:8c;
        fixed-address 192.168.2.2;
    }
}
```

启动 `isc-dhcp-server`：

```terminal
$ sudo dpkg-reconfigure isc-dhcp-server
# 在弹出的UI中输入LAN侧网卡enp4s0并确定，这会写入/etc/default/isc-dhcp-server
# 启动后如果没有消息，那就是正常了
```