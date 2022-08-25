---
title: Kubernetes(五)：换用轻量级的k3s集群
date: 2022-08-10 12:14:52 GMT+0800
sort: 5
# status: WIP
categories: [Kubernetes]
tags: [Kubernetes]
---

::: abstract
[k3s](https://github.com/k3s-io/k3s)兼容了 k8s 的 api，去除了 k8s 中与云服务商的集成组件，使得整个二进制包不到 100MB，并且内存占用也更少。
:::

<!-- more -->

## 安装 K3S

```zsh
$ which kubectl && rm `which kubectl`
$ which crictl && rm `which crictl`
$ which ctr && rm `which ctr` # 先删除原有的这些命令，安装k3s的时候会生成这些命令的链接
$ curl -sfL https://get.k3s.io | sh -
[INFO]  Finding release for channel stable
[INFO]  Using v1.24.3+k3s1 as release
[INFO]  Downloading hash https://github.com/k3s-io/k3s/releases/download/v1.24.3+k3s1/sha256sum-amd64.txt
[INFO]  Downloading binary https://github.com/k3s-io/k3s/releases/download/v1.24.3+k3s1/k3s
[INFO]  Verifying binary download
[INFO]  Installing k3s to /usr/local/bin/k3s
[INFO]  Skipping installation of SELinux RPM
[INFO]  Creating /usr/local/bin/kubectl symlink to k3s
[INFO]  Creating /usr/local/bin/crictl symlink to k3s
[INFO]  Creating /usr/local/bin/ctr symlink to k3s
[INFO]  Creating killall script /usr/local/bin/k3s-killall.sh
[INFO]  Creating uninstall script /usr/local/bin/k3s-uninstall.sh
[INFO]  env: Creating environment file /etc/systemd/system/k3s.service.env
[INFO]  systemd: Creating service file /etc/systemd/system/k3s.service
[INFO]  systemd: Enabling k3s unit
Created symlink /etc/systemd/system/multi-user.target.wants/k3s.service → /etc/systemd/system/k3s.service.
[INFO]  systemd: Starting k3s
$ sudo kubectl get no
NAME        STATUS   ROLES                  AGE   VERSION
lubui.com   Ready    control-plane,master   17s   v1.24.3+k3s1
```

::: warning 遇到的一些问题

1. 由于 sudo 的环境变量存在 KUBECONFIG 导致的报错

```zsh
$ sudo kubectl get po
W0810 13:24:11.296386    6586 loader.go:221] Config not found: /etc/kubernetes/admin.conf
The connection to the server localhost:8080 was refused - did you specify the right host or port?
$ sudo env|grep KUBECONFIG
KUBECONFIG=/etc/kubernetes/admin.conf
```

2. 有些命令需要读取用户目录下 k8s 的配置文件，k3s 默认情况下没有这个文件，需要在启动 k3s 的地方添加最后两行参数：

```zsh
$ cat /etc/systemd/system/k3s.service
[Unit]
Description=Lightweight Kubernetes
Documentation=https://k3s.io
Wants=network-online.target
After=network-online.target

[Install]
WantedBy=multi-user.target

[Service]
Type=notify
EnvironmentFile=-/etc/default/%N
EnvironmentFile=-/etc/sysconfig/%N
EnvironmentFile=-/etc/systemd/system/k3s.service.env
KillMode=process
Delegate=yes
# Having non-zero Limit*s causes performance problems due to accounting overhead
# in the kernel. We recommend using cgroups to do container-local accounting.
LimitNOFILE=1048576
LimitNPROC=infinity
LimitCORE=infinity
TasksMax=infinity
TimeoutStartSec=0
Restart=always
RestartSec=5s
ExecStartPre=/bin/sh -xc '! /usr/bin/systemctl is-enabled --quiet nm-cloud-setup.service'
ExecStartPre=-/sbin/modprobe br_netfilter
ExecStartPre=-/sbin/modprobe overlay
ExecStart=/usr/local/bin/k3s \
    server \
    --write-kubeconfig=/home/ubuntu/.kube/config \ # 添加这行
    --write-kubeconfig-mode=644 \                  # 添加这行
$ sudo systemctl daemon-reload && sudo systemctl restart k3s
$ ls -alp ~/.kube/config
-rw-r--r-- 1 root root 2961 Aug 23 13:40 /home/ubuntu/.kube/config
```

:::

## Lens 添加集群

[Lens](https://github.com/lensapp/lens)是一个桌面应用，通过与 k8s api 交互，可以查看 k8s 集群的详细信息。

```zsh{6}
$ sudo kubectl config view --minify --raw
apiVersion: v1
clusters:
- cluster:
    certificate-authority-data: xxx
    server: https://127.0.0.1:6443 # 修改这里
  name: default
contexts:
- context:
    cluster: default
    user: default
  name: default
current-context: default
kind: Config
preferences: {}
users:
- name: default
  user:
    client-certificate-data: xxx
    client-key-data: xxx
```

将上面命令输出的内容复制到 Lens 中，并修改集群地址。

## 修改 k3s 默认部署的 traefik 配置

[traefik](https://github.com/traefik/traefik)是一个用 Golang 写的反向代理与负载均衡器（可替代[ingress-nginx](https://github.com/kubernetes/ingress-nginx)）。

由于 traefik 是 k3s 默认部署的（当然也可以在 init k3s 集群时传参数来禁用它），如果想修改 traefik 启动命令的参数，可以直接创建一个文件：

```zsh
$ sudo ls /var/lib/rancher/k3s/server/manifests # 这里放了k3s默认部署的组件
ccm.yaml  coredns.yaml  local-storage.yaml  metrics-server  rolebindings.yaml  traefik.yaml
$ sudo cat /var/lib/rancher/k3s/server/manifests/traefik.yaml # traefik的部署配置，改这里没用，每次启动会被覆盖
---
apiVersion: helm.cattle.io/v1
kind: HelmChart
metadata:
  name: traefik-crd
  namespace: kube-system
spec:
  chart: https://%{KUBERNETES_API}%/static/charts/traefik-crd-10.19.300.tgz
---
apiVersion: helm.cattle.io/v1
kind: HelmChart
metadata:
  name: traefik
  namespace: kube-system
spec:
  chart: https://%{KUBERNETES_API}%/static/charts/traefik-10.19.300.tgz
  set:
    global.systemDefaultRegistry: ""
  valuesContent: |-
    rbac:
      enabled: true
    ports:
      websecure:
        tls:
          enabled: true
    podAnnotations:
      prometheus.io/port: "8082"
      prometheus.io/scrape: "true"
    providers:
      kubernetesIngress:
        publishedService:
          enabled: true
    priorityClassName: "system-cluster-critical"
    image:
      name: "rancher/mirrored-library-traefik"
      tag: "2.6.2"
    tolerations:
    - key: "CriticalAddonsOnly"
      operator: "Exists"
    - key: "node-role.kubernetes.io/control-plane"
      operator: "Exists"
      effect: "NoSchedule"
    - key: "node-role.kubernetes.io/master"
      operator: "Exists"
      effect: "NoSchedule"
    service:
      ipFamilyPolicy: "PreferDualStack"
$ # 但可以在同级目录下新增一个 HelmChartConfig 对象，可用配置参考 https://github.com/traefik/traefik-helm-chart/blob/master/traefik/values.yaml
$ cat <<EOF | sudo tee /var/lib/rancher/k3s/server/manifests/traefik-config.yaml
apiVersion: helm.cattle.io/v1
kind: HelmChartConfig
metadata:
  name: traefik
  namespace: kube-system
spec:
  valuesContent: |-
    additionalArguments:
    - "--entrypoints.web.http.redirections.entryPoint.to=:443"
    - "--entrypoints.web.http.redirections.entryPoint.scheme=https"
EOF
$ # 添加文件后，会有个k3s job对象来重新部署traefik
```
