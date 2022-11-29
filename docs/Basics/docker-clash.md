---
title: Docker 容器内运行 Clash 旁路由实现自动配置 iptables 及监听配置文件
date: 2022-11-23 09:50:06 GMT+0800
categories: [家庭服务]
tags: [iptables, Clash, Proxy, Docker]
---

::: abstract
前面一章是通过宿主机直接运行 **Clash** 和开机执行`iptables`命令实现旁路由，缺点是如果宿主机重启后 **Clash** 没跑起来，由于`iptables`会将入口 TCP 流量重定向到 **Clash**，全屋都会断网。所以这次把 **Clash** 放到容器内，实现容器启动时配置`iptables`，停止或者错误时清理`iptables`。除此之外，还可以在容器内监听 **Clash** 配置文件变化来重启。
:::

<!-- more -->

目录结构：

```zsh
$ tree
.
├── docker-compose.yml
├── Dockerfile
└── scripts
    ├── entrypoint.sh
    ├── iptables-down.sh
    └── iptables.sh
```

Dockerfile 以 [Clash 官方镜像](https://hub.docker.com/u/dreamacro)为基础镜像，导入`iptables`脚本，导入 [yacd](https://github.com/haishanh/yacd) 的静态网页，覆盖 entrypoint，方便将镜像分享给其他人：

```Docker
# Dockerfile
FROM dreamacro/clash-premium
RUN set -e \
    && sed -i 's/dl-cdn.alpinelinux.org/mirrors.tuna.tsinghua.edu.cn/g' /etc/apk/repositories \
    && apk add --no-cache iptables inotify-tools tini \
    && wget https://kgithub.com/haishanh/yacd/releases/download/v0.3.8/yacd.tar.xz \
    && tar xf yacd.tar.xz \
    && mv public ui
COPY scripts/* /
ENTRYPOINT ["tini","-g", "--", "/entrypoint.sh"]
```

::: tip
这里的`tini`的作用是：当`tini`收到 SIG 信号时，给其所有子进程传递 SIG 信号，方便在 entrypoint 脚本里捕获信号完成 iptables 清理。
:::

容器启动时会执行的`iptables`命令:

```sh
# scripts/iptables.sh
#!/bin/sh

set -e
iptables --policy FORWARD ACCEPT
iptables -t nat -N CLASH || echo 'CLASH链已存在--即将清空' # 给nat表新增一个名为 CLASH 的链
iptables -t nat -F CLASH # 清空CLASH链，保证二次执行没问题
iptables -t nat -A CLASH -d 10.0.0.0/8 -j RETURN
iptables -t nat -A CLASH -d 127.0.0.0/8 -j RETURN
iptables -t nat -A CLASH -d 169.254.0.0/16 -j RETURN
iptables -t nat -A CLASH -d 172.16.0.0/12 -j RETURN
iptables -t nat -A CLASH -d 192.168.0.0/16 -j RETURN
iptables -t nat -A CLASH -d 224.0.0.0/4 -j RETURN
iptables -t nat -A CLASH -d 240.0.0.0/4 -j RETURN
iptables -t nat -A CLASH -i enp3s0 -p tcp -j REDIRECT --to-ports 7892 # 到这一步还没return就全走代理
iptables -t nat -D PREROUTING -p tcp -j CLASH || echo '无规则需要清理--跳过'
iptables -t nat -I PREROUTING -p tcp -j CLASH # 在 PREROUTING 链的最前面插入 CLASH 链

# 如果需要拦截入口收到的DNS请求，需要配置下面
iptables -t nat -N CLASH_DNS || echo 'CLASH_DNS链已存在--即将清空'
iptables -t nat -F CLASH_DNS
iptables -t nat -A CLASH_DNS -p udp -i docker0 -j RETURN # docker容器的dns跳过
iptables -t nat -A CLASH_DNS -p udp -j REDIRECT --to-port 53
iptables -t nat -D PREROUTING -p udp --dport 53 -j CLASH_DNS || echo '无规则需要清理--跳过'
iptables -t nat -I PREROUTING -p udp --dport 53 -j CLASH_DNS

iptables -t nat -L -v -n
```

::: tip
DNS 劫持：比如我电脑配置的 DNS 是`114.114.114.114`，发出 DNS 请求后，该请求在途经的任意路由都可能被拦截，然后给返回一个错误的 IP，并且我电脑还无法判断，如果请求的网站是 http 的，完全就可能进入钓鱼网站。所以现在的 DNS 也出现了 DoT(DNS over TLS)、DoH(DNS over HTTPS)，目的就是为了防止中间人篡改。

上面 iptables 拦截 DNS 是为了强制将所有路由到此处的 DNS 重定向到 **Clash**，这样屋里的设备就不用配置 DNS 了，都走 **Clash** 的 fake-ip，节省 DNS 请求的时间。
:::

容器停止会执行的`iptables`清理脚本：

```sh
# scripts/iptables-down.up
#!/bin/sh

iptables -t nat -D PREROUTING -p tcp -j CLASH
iptables -t nat -X CLASH
iptables -t nat -D PREROUTING -p udp --dport 53 -j CLASH_DNS
iptables -t nat -X CLASH_DNS
echo 'iptables 已清理'
```

容器入口脚本：

```sh
# scripts/entrypoint.sh
#!/bin/sh
set -e

CONFIG="/root/.config/clash"

mkdir -p "$CONFIG"

# 如果文件不存在，就把镜像内置的文件移动过去
mvFile() {
    if [ ! -f "$CONFIG/$1" ]; then
        mv "/$1" "$CONFIG/$1"
    fi
}
mvFile iptables.sh
mvFile iptables-down.sh

sh "$CONFIG/iptables.sh" # 将入口TCP请求重定向到 Clash

stopClash() {
    # 给 Clash 进程发 SIGTERM
    ps -ef|grep /clash|head -1|awk '{print $1}'|xargs kill 2>/dev/null
}

# 容器退出时的清理工作
clear() {
    sh "$CONFIG/iptables-down.sh"
    kill -9 -1 2>/dev/null || exit 0
}

# 捕获SIG信号，回调清理
trap clear SIGTERM SIGINT SIGQUIT SIGHUP ERR

startClash() {
    trap clear ERR # clash启动错误时退出容器
    /clash -ext-ui /ui
}

startClash &

sleep 5 # 等待配置文件被clash创建

echo '配置文件已建立监听'

# 监听配置文件修改，重启clash
while inotifywait -q -e close_write "$CONFIG/config.yaml";
do
echo "检测到配置文件变更，Clash重启中。。。"
stopClash
startClash &
done
```

**docker-compose.yml**:

```yaml
version: '3.3'

services:
  clash:
    build: .
    container_name: clash
    volumes:
      - ./config:/root/.config/clash
    network_mode: host # 容器直接使用宿主机网络，避免虚拟网卡性能损耗
    cap_add:
      - NET_ADMIN # 容器拥有网络管理权限，可修改宿主机iptables
    restart: unless-stopped
```

经过测试，容器工作得很好，宿主机配置一变更，容器就会重启 **Clash**，如果配置有错，容器会清理 `iptables` 并退出。

::: tip
理论上网络也可以不用 host，改用 macvlan：

```zsh
$ sudo ip link set enp3s0 promisc on # 开启网卡混杂模式，这样网卡收到的所有目标ip的包都会接入处理
$ docker network create -d macvlan --subnet=192.168.1.0/24 --gateway=192.168.1.1 -o parent=enp3s0 macnet
$ docker run --restart=unless-stopped -d --net macnet --ip 192.168.1.35 clash
```

这样屋里设备需要把网关配置为容器 ip：192.168.1.35，这种没测过

:::
