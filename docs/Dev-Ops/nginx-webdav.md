---
title: 支持 WebDAV 的 Nginx Docker Image
date: 2023-08-07 13:24:40 GMT+0800
categories: [运维]
tags: [Nginx]
---

::: abstract
通过 Docker 多阶段构建，在官方 Nginx 镜像上额外添加动态模块，使 WebDAV 兼容 Mac OS，支持文件读写。
:::

<!-- more -->

## 制作 Docker Image

官方 Nginx 镜像上只有基础 dav 模块，无法支持 Mac WebDAV 客户端，需要额外编译 [nginx-dav-ext-module](https://github.com/arut/nginx-dav-ext-module) 动态模块。
此外，还添加了 [headers-more-nginx-module](https://github.com/openresty/headers-more-nginx-module) 动态模块以支持 more_set_input_headers 指令，是为了兼容 Mac WebDAV。

```docker
ARG NGINX_VERSION # nginx版本作为参数传入

FROM nginx:${NGINX_VERSION} as build # 在官方镜像的基础上build
WORKDIR /usr/src/nginx-${NGINX_VERSION}

# 下载编译需要的依赖
RUN export NGINX_ARGS=$(nginx -V 2>&1 | sed -n -e 's/^.*arguments: //p') \
  && apt-get update && \
  apt-get install -y \
  git \
  wget \
  libxml2 \
  libxslt1-dev \
  libpcre3 \
  libpcre3-dev \
  zlib1g \
  zlib1g-dev \
  openssl \
  libssl-dev \
  libtool \
  automake \
  gcc \
  make \
  && rm -rf /var/cache/apt \
  && wget -q "http://nginx.org/download/nginx-${NGINX_VERSION}.tar.gz" \
  && tar -C /usr/src -xzvf "nginx-${NGINX_VERSION}.tar.gz"
# 没有将两个层合并，单独缓存编译依赖，方便调试与后期添加新模块

# 下面是编译动态模块的so文件
# --with-compat 表示仅编译动态模块，不编译nginx本身
# 使用bash -c是为了将NGINX_ARGS展开为多个参数
RUN git clone https://github.com/arut/nginx-dav-ext-module.git /srv/nginx-dav-ext-module \
  && git clone https://github.com/openresty/headers-more-nginx-module.git /srv/headers-more-nginx-module \
  && bash -c "./configure --with-compat --add-dynamic-module=/srv/nginx-dav-ext-module \
    --add-dynamic-module=/srv/headers-more-nginx-module ${NGINX_ARGS}" && \
  make modules

FROM nginx:${NGINX_VERSION}

# nginx配置需要添加load_module指令来加载动态模块
COPY nginx.conf /etc/nginx/nginx.conf

# 唯一需要添加的就是这两个so文件
COPY --from=build /usr/src/nginx-${NGINX_VERSION}/objs/*.so /usr/lib/nginx/modules/

# 如果没有这个，nginx默认是uid=101来运行worker进程，101用户不具有webdav目录的写权限，所以webdav就无法修改文件了
# nginx用户是默认启动worker进程的用户，需要用webdav文件允许读写的id，这里写死了id=1000
RUN usermod -u 1000 -o nginx && groupmod -g 1000 -o nginx
```

```nginx
user nginx;
worker_processes auto;

error_log /var/log/nginx/error.log notice;
pid /var/run/nginx.pid;

# 加载动态模块 // [!code focus]
load_module /usr/lib/nginx/modules/ngx_http_dav_ext_module.so; // [!code focus]
load_module /usr/lib/nginx/modules/ngx_http_headers_more_filter_module.so; // [!code focus]

events {
  worker_connections 1024;
}

http {
  # 此处省略
}
```

到此就可以 build image 了，这里我直接用 [docker-compose](#start-container) 来直接 build 并启动容器。

## Nginx WebDAV 配置文件

> SSL 是可选的，并不是 WebDAV 要求

```nginx
# conf.d/webdav.conf
dav_ext_lock_zone zone=webdav:10m;

server {
  server_name xxx.home.lubui.com;
  # http2 on;
  access_log /var/log/nginx/access.log vhost;
  listen 8443 ssl ;
  ssl_ecdh_curve secp384r1;
  ssl_session_timeout 5m;
  ssl_session_cache shared:SSL:50m;
  ssl_session_tickets off;
  ssl_certificate /etc/nginx/certs/home.lubui.com.crt;
  ssl_certificate_key /etc/nginx/certs/home.lubui.com.key;

  auth_basic "Authenticated Users";
  auth_basic_user_file /etc/nginx/htpasswd/htpasswd; # 配置http basic校验文件

  # 所有路径都路由到webdav
  location / {
    root /srv/;
    dav_access user:rw group:rw all:r;
    create_full_put_path on; # 启用完整的创建目录支持，默认情况下，Put 方法只能在已存在的目录里创建文件

    charset utf-8;
    autoindex on;
    autoindex_localtime on;
    autoindex_exact_size off;

    client_max_body_size 0;

    # 为各种方法的URI后加上斜杠，解决各平台webdav客户端的兼容性问题
    set $dest $http_destination;
    if (-d $request_filename) {
      rewrite ^(.*[^/])$ $1/;
      set $dest $dest/;
    }

    if ($request_method ~ (MOVE|COPY)) {
      more_set_input_headers 'Destination: $dest';
    }

    if ($request_method ~ MKCOL) {
      rewrite ^(.*[^/])$ $1/ break;
    }

    # 支持所有方法
    dav_methods PUT DELETE MKCOL COPY MOVE;
    dav_ext_methods PROPFIND OPTIONS LOCK UNLOCK;
    dav_ext_lock zone=webdav;
  }

}
```

## 生成 htpasswd

WebDAV 使用 http basic 认证，nginx 需要 htpasswd 文件来校验客户端传来的用户名密码。
这里通过 docker alpine 现安装工具来生成：

```zsh
$ docker run --rm -it alpine sh -c 'apk add apache2-utils && htpasswd -nbm admin password'
fetch https://dl-cdn.alpinelinux.org/alpine/v3.18/main/x86_64/APKINDEX.tar.gz                                         │
fetch https://dl-cdn.alpinelinux.org/alpine/v3.18/community/x86_64/APKINDEX.tar.gz                                    │
(1/5) Installing libuuid (2.38.1-r8)                                                                                  │
(2/5) Installing apr (1.7.4-r0)                                                                                       │
(3/5) Installing libexpat (2.5.0-r1)                                                                                  │
(4/5) Installing apr-util (1.6.3-r1)                                                                                  │
(5/5) Installing apache2-utils (2.4.57-r3)                                                                            │
Executing busybox-1.36.0-r9.trigger                                                                                   │
OK: 8 MiB in 20 packages                                                                                              │
admin:$apr1$aFBC5juN$Fp6dGHrXEtWsVI//l5Zej0 # 需要的就这一行 // [!code hl]
$ echo 'admin:$apr1$aFBC5juN$Fp6dGHrXEtWsVI//l5Zej0' >htpasswd/htpasswd
# 写入htpasswd文件
```

## 启动 nginx 容器 {#start-container}

通过 docker-compose 启动，挂载相应目录

```yaml
services:
  nginx:
    # image: nginx:latest # 有了build就不需要image
    build:
      context: ./nginx-image/
      args: # 传入build需要的参数
        NGINX_VERSION: 1.25.1
    container_name: nginx
    environment:
      TZ: Asia/Shanghai
    network_mode: host
    restart: always
    volumes:
      - ./conf.d:/etc/nginx/conf.d # 映射webdav配置文件
      - ~/.lego/certificates/:/etc/nginx/certs # 映射证书目录
      - ./htpasswd/:/etc/nginx/htpasswd # 映射http basic校验文件
      - ~:/srv/ # 映射webdav需要serve的目录，我这里直接挂载home目录
    logging:
      driver: json-file
      options:
        max-size: 1m
```

## Mac 挂载 WebDAV

方法一：通过“访达”图形界面挂载：打开“访达” -> memu 点“前往” -> “连接服务器” -> 输入`https://my.webdav.server:ports` -> 输入账户名密码

方法二：通过 `mount_webdav` 命令实现：

```zsh
$ sudo mkdir -p /Volumes/webdav/
$ sudo mount_webdav -s -i https://my.webdav.server:port/ /Volumes/webdav/
Username: admin
Password:
```