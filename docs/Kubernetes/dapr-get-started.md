---
title: Dapr的简单使用
date: 2022-08-23 14:18:00 GMT+0800
categories: [Kubernetes]
tags: [Kubernetes, Microservice]
---

::: abstract
[Distributed Application Runtime](https://github.com/dapr/dapr)给每个 Pod 注入一个 side-car，提供了开发分布式应用时需要的服务发现、服务调用、状态管理、消息发布订阅、一致性事务等能力，使开发者不必太了解底层实现，并且可以方便地用不同的编程语言来构建分布式应用。
:::

<!-- more -->

## 安装 Dapr

[官方文档](https://docs.dapr.io/operations/hosting/kubernetes/kubernetes-deploy/)

```terminal
$ wget -q https://raw.githubusercontent.com/dapr/cli/master/install/install.sh -O - | /bin/bash
Getting the latest Dapr CLI...
Your system is linux_amd64
Installing Dapr CLI...

Installing v1.8.1 Dapr CLI...
Downloading https://github.com/dapr/cli/releases/download/v1.8.1/dapr_linux_amd64.tar.gz ...
dapr installed into /usr/local/bin successfully.
CLI version: 1.8.1
Runtime version: n/a

To get started with Dapr, please visit https://docs.dapr.io/getting-started/
$ dapr init -k # 安装到k8s
⌛  Making the jump to hyperspace...
ℹ️  Note: To install Dapr using Helm, see here: https://docs.dapr.io/getting-started/install-dapr-kubernetes/#install-with-helm-advanced

ℹ️  Container images will be pulled from Docker Hub
✅  Deploying the Dapr control plane to your cluster...
✅  Success! Dapr has been installed to namespace dapr-system. To verify, run `dapr status -k' in your terminal. To get started, go here: https://aka.ms/dapr-getting-started
$ dapr status -k
  NAME                   NAMESPACE    HEALTHY  STATUS   REPLICAS  VERSION  AGE  CREATED
  dapr-dashboard         dapr-system  True     Running  1         0.10.0   54m  2022-08-23 13:41.21
  dapr-sentry            dapr-system  True     Running  1         1.8.4    54m  2022-08-23 13:41.21
  dapr-operator          dapr-system  True     Running  1         1.8.4    54m  2022-08-23 13:41.21
  dapr-placement-server  dapr-system  True     Running  1         1.8.4    54m  2022-08-23 13:41.21
  dapr-sidecar-injector  dapr-system  True     Running  1         1.8.4    54m  2022-08-23 13:41.21
```

## 服务调用

### HTTP 调用

部署一个简单的纯 http 服务，它会返回请求体的数据：

```yaml
# deployment.yml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: whoami-app
  namespace: default
  labels:
    app: whoami-app
spec:
  replicas: 1
  selector:
    matchLabels:
      app: whoami-app
  template:
    metadata:
      labels:
        app: whoami-app
      annotations:
        dapr.io/enabled: 'true' # 注入 dapr sidecar
        dapr.io/app-id: 'whoami' # 这个服务的唯一id，客户端根据这个id来调用此服务
        dapr.io/app-port: '80' # 业务app暴露的端口
    spec:
      containers:
        - name: whoami-app
          image: traefik/whoami
```

```terminal
$ k apply -f deployment.yml
deployment.apps/whoami-app configured
$ k get po -o wide
NAME                                    READY   STATUS      RESTARTS      AGE     IP            NODE            NOMINATED NODE   READINESS GATES
whoami-app-59569df485-lq54l             2/2     Running     0             7m39s   10.42.0.222   lubui.com       <none>           <none>
$ # 可以看到Pod内两个容器已经都Ready了
$ curl http://10.42.0.222 # 直接请求业务端口
Hostname: whoami-app-59569df485-lq54l
IP: 127.0.0.1
IP: ::1
IP: 10.42.0.222
IP: fe80::309c:36ff:fec0:aded
RemoteAddr: 10.42.0.1:44136
GET / HTTP/1.1
Host: 10.42.0.222
User-Agent: curl/7.68.0
Accept: */*
Connection: close
$ k exec -it whoami-app-59569df485-lq54l -- sh # 进入Pod shell
$ env|grep DAPR
DAPR_GRPC_PORT=50001
DAPR_HTTP_PORT=3500
$ curl http://localhost:3500/ -H "dapr-app-id: whoami" # 请求side car端口，请求被转发到appid=whoami的服务
Hostname: whoami-app-59569df485-lq54l
IP: 127.0.0.1
IP: ::1
IP: 10.42.0.222
IP: fe80::309c:36ff:fec0:aded
RemoteAddr: 127.0.0.1:41512
GET / HTTP/1.1
Host: 127.0.0.1:80
User-Agent: curl/7.83.1
Accept: */*
Content-Type: application/json
Dapr-App-Id: whoami
Forwarded: for=10.42.0.221;by=10.42.0.221;host=golang-app-68477594f7-d9c9r
Traceparent: 00-442e8839eadab482b6e6923c323a746e-74e26acdf5fabb44-00
X-Forwarded-For: 10.42.0.221
X-Forwarded-Host: golang-app-68477594f7-d9c9r

```

### 使用[Go SDK](https://github.com/dapr/go-sdk)

Go SDK 就是对 sidecar 请求的封装。不只有 Golang 的，许多主流语言都提供了。

> todo

### GRPC 调用

> todo

## 状态存储与事务

> todo

## 消息发布订阅

> todo