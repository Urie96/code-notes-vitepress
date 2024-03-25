---
title: Kubernetes(四)：在多台腾讯云服务器中搭建K8s集群
date: 2021-12-10 14:40:00 GMT+0800
sort: 4
categories: [Kubernetes]
tags: [Kubernetes, Linux]
---

::: abstract
记录在腾讯云 VPS 中搭建 K8s 主节点，并将另一账号下的轻量应用服务器作为工作节点加入集群，所遇到的一些报错。
:::

<!-- more -->

1. 主节点运行`sudo kubeadm init`在拉取镜像时会报错，因为 docker 没有配置代理，无法拉取 k8s 相关的镜像。给 docker 添加代理：

```terminal
$ sudo mkdir -p /etc/systemd/system/docker.service.d
$ sudo /etc/systemd/system/docker.service.d/http-proxy.conf
$ cat <<EOF | sudo tee /etc/systemd/system/docker.service.d/http-proxy.conf
[Service]
Environment="HTTP_PROXY=http://<proxy>" "HTTPS_PROXY=http://<proxy>" "NO_PROXY=localhost,127.0.0.1"
EOF
$ sudo systemctl restart docker
$ docker info | grep Proxy
HTTP Proxy: <proxy>
HTTPS Proxy: <proxy>
No Proxy: localhost,127.0.0.1
```

2. 主节点运行`sudo kubeadm init`报错，运行`journalctl -xeu kubelet`查看日志发现是因为 docker 的 Cgroup 驱动是 cgroupfs，而 k8s 官方推荐使用 systemd。修改 docker Cgroup 驱动：

```terminal
$ cat <<EOF | sudo tee /etc/docker/daemon.json
{
  "exec-opts": ["native.cgroupdriver=systemd"]
}
EOF
$ systemctl restart docker
$ docker info | grep Cgroup
Cgroup Driver: systemd
Cgroup Version: 1
```

3. 主节点运行`sudo kubeadm init`成功，但`kubectl get po --all-namespaces`显示 coredns 一直是 pending，官网文档说这是因为需要没有安装容器网络，安装一个简单的网络插件 Flannel：

```terminal
$ sudo kubeadm reset # 清理之前安装的集群
$ sudo kubeadm init --pod-network-cidr=10.244.0.0/16
$ kubectl apply -f https://raw.githubusercontent.com/coreos/flannel/master/Documentation/kube-flannel.yml
```

4. 工作节点无法 join 到集群，主节点是想工作节点通过内网 ip 来 join 的，所以 token 是根据内网 ip 生成的，并且工作节点应能够直接访问到主节点的 api-server，总之公网的集群很麻烦。最后发现轻量应用服务器可以内网通信云服务器，即使是在不同账号下：
   - 轻量应用服务器关联云联网
   - 云服务器的私有网络关联其他账号下的云联网

::: tip
同为北京地域，公网通信延迟为 3ms，带宽为 5M，内网通信延迟为 0.4ms，带宽为 1 ～ 2G。
:::

5. 工作节点 join 失败，修改 docker Cgroup 驱动为 systemd。
6. 工作节点 join 成功，`kubectl get node`显示工作节点 not ready，配置 docker proxy。
7. 集群内节点无法直接请求其他节点 Pod 的 IP，可以通过`kubectl port-forward`命令在主节点设置端口转发：

```terminal
$ kubectl get no # 当前在lubui.com主节点
NAME            STATUS   ROLES                  AGE     VERSION
lubui.com       Ready    control-plane,master   2d23h   v1.23.0
sweetlove.top   Ready    <none>                 2d22h   v1.23.0
$ kubectl get po -o wide # pod在工作节点上
NAME            READY   STATUS    RESTARTS   AGE   IP                NODE            NOMINATED NODE   READINESS GATES
simple-server   1/1     Running   0          57m   192.168.243.129   sweetlove.top   <none>           <none>
$ ssh sweetlove.top curl 192.168.243.129:8080 # Pod所在的节点可以直接访问Pod IP
hit simple-server
$ curl 192.168.243.129:8080 # 主节点无法直接访问Pod IP
curl: (28) Failed to connect to 192.168.243.129 port 8080: Connection timed out
$ kubectrl port-forward --address=0.0.0.0 simple-server 8888:8080
# 在主节点开启端口转发，这时可以通过<主节点ip>:8888来访问此Pod的IP
Forwarding from 0.0.0.0:8888 -> 8080
```

8. Pod 不在 master 节点部署。因为 master 节点默认添加了 taint，此标记使 pod 不在该节点调度。删除 taint：

```terminal
$ kubectl describe node lubui.com |grep Taints
Taints:             node-role.kubernetes.io/master:NoSchedule
$ kubectl taint nodes --all node-role.kubernetes.io/master-
node/lubui.com untainted # master节点的taint已删除
error: taint "node-role.kubernetes.io/master" not found # 其他节点没有此taint
$ kubectl describe node lubui.com |grep Taints
Taints:             <none>
```

9. 节点无法访问其他节点的 Pod，不同节点的 Pod 之间也无法访问，同节点的 Pod 能互相访问，`kubectl exec`能 ssh 到其他节点的 Pod。<Badge text="2021.12.16+" />

> 我吐了，这个问题卡了我 4 天，一度怀疑人生！

不管是百度还是谷歌，翻了几页都是这两个答案：

- flannel 使用了第一个网卡做为默认网卡，导致网络不通，需要修改 rs 指定使用 eth0 网卡。
- iptables 丢弃了其他节点发来的包

查看 flannel 日志发现没有报错，并且使用的就是 eth0 网卡，我还是很认真的照着修改，改完依然不行。

于是删除集群重建，新集群依然不行。

照着网上执行`sudo iptables -P FORWARD ACCEPT`，不行。

查看 iptables 发现有许多 cali 插件的配置，对这块儿不熟，就照着网上重置了 iptables，不行。

又重装了 n 次集群，还是不行。

想起会不会是设置了 docker proxy 的原因，于是删除了 proxy，重装集群，依然不行。

然后想起会不会是上面第 4 个问题中，搭建内网互联时填的子网不对，于是重新建立内网互联，把子网号调整一样的之类的操作，还是不行，重启、重装集群还是不行。

又学习容器网络的知识，容器内 eth0 网卡与宿主机 vethxxx 是一根网线，docker0 是一个网桥，cni0 网卡是 k8s 用于替代 docker0，flannel.1 网卡用于实现跨节点的容器通信。

容器内对其他节点的容器发起的请求会依次进入：容器内 eth0 -> vethxxx -> docker0 -> flannel.1 -> eth0 -> 局域网 -> eth0 -> flannel.1 -> docker0 -> vethxxx -> 目标容器 eth0。

学习 flannel 的知识，了解到我的 flannel 是用的 vxlan 模式，将接收到的二层 mac 帧加上 vxlan 标识，做为 udp 的负载，传到目标主机，由目标主机的 flannel 解出真实的 mac 帧继续处理。

学习 tcpdump 的知识，在当前节点执行`sudo tcpdump -i flannel.1`之后，请求其他节点的 Pod 可以看到发送了 4 个包，但是目标节点的 flannel.1 网卡没有任何包。

当前节点执行`sudo tcpdump -i eth0 -nn src xxx and dst xxx and not port 6443 and udp`，请求其他节点的 Pod 可以看到发送了 4 个包，但是目标节点的 eth0 没收到任何包。

目标节点执行`nc -ulkp 8081`监听 udp 8081 端口，当前节点执行`nc -u xxx 8081`发送 udp 包，目标节点没有收到包。

问题已定位，前往腾讯云控制台放开了目标节点的 UDP 拦截，问题完全解决。