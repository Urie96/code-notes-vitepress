---
title: k8s-beginner-5
date: 2022-08-10 12:14:52 GMT+0800
sort: 5
status: WIP
categories: [前端]
tags: []
---

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

::: tip
由于 sudo 的环境变量存在 KUBECONFIG 导致的报错

```zsh
$ sudo kubectl get po
W0810 13:24:11.296386    6586 loader.go:221] Config not found: /etc/kubernetes/admin.conf
The connection to the server localhost:8080 was refused - did you specify the right host or port?
$ sudo env|grep KUBECONFIG
KUBECONFIG=/etc/kubernetes/admin.conf
```

:::

## Lens 添加集群

```zsh{6}
sudo kubectl config view --minify --raw
apiVersion: v1
clusters:
- cluster:
    certificate-authority-data: xxx
    server: https://127.0.0.1:6443
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
