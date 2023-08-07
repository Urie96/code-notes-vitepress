---
title: 通过Nginx实现业务不感知的单点登录
date: 2023-07-21 12:38:05 GMT+0800
categories: [运维]
tags: [Nginx]
---

::: abstract
业务前后端均不需要感知，仅在 Nginx 代理处实现，并且鉴权时不会让 Web 页面因为重定向导致两次加载。
:::

<!-- more -->

## 业务 Nginx 配置

```nginx
location / {
  # 配置局域网不鉴权，可选
  satisfy any;
  allow 127.0.0.0/8;
  allow 192.168.0.0/16;
  allow 172.16.0.0/12;
  allow 10.0.0.0/8;
  deny  all;

  auth_request /auth; # 请求代理到另一个鉴权path
  error_page 401 = @error401; # 如果鉴权path返回401就路由到@error401

  proxy_pass http://code.home.lubui.com; # 鉴权成功就代理到业务
}

location /auth {
  internal; # 仅内部可调用
  proxy_pass_request_body off;
  proxy_set_header Content-Length "";
  proxy_pass http://127.0.0.1:3100/auth; # 鉴权服务器路径
}

location @error401 { # 鉴权不通过，准备重定向到单点登录页面
  # 在cookie中带上当前请求的url，登录成功后方便重定向回来
  add_header Set-Cookie "redirect=$scheme://$http_host$request_uri;Domain=.home.lubui.com;Path=/;Max-Age=3000";
  return 302 https://sso.home.lubui.com:8443/login;
}
```

## 鉴权与登录服务器

```go
package main

import (
  "crypto/sha256"
  "crypto/subtle"
  "encoding/hex"
  "errors"
  "fmt"
  "log"
  "net/http"
  "os"
  "strconv"
  "strings"
  "time"
)

func basicAuth(next http.HandlerFunc) http.HandlerFunc {
  expectedUsernameHash := sha256.Sum256([]byte(os.Getenv("LOGIN_USERNAME")))
  expectedPasswordHash := sha256.Sum256([]byte(os.Getenv("LOGIN_PASSWORD")))

  return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
    username, password, ok := r.BasicAuth()
    // 不直接使用字符串比较是为了避免“时序攻击”
    if ok {
      usernameHash := sha256.Sum256([]byte(username))
      passwordHash := sha256.Sum256([]byte(password))

      usernameMatch := subtle.ConstantTimeCompare(usernameHash[:], expectedUsernameHash[:]) == 1
      passwordMatch := subtle.ConstantTimeCompare(passwordHash[:], expectedPasswordHash[:]) == 1
      if usernameMatch && passwordMatch {
        next.ServeHTTP(w, r)
        return
      }
    }

    w.Header().Set("WWW-Authenticate", `Basic realm="restricted", charset="UTF-8"`) // 告诉浏览器进行http basic鉴权
    http.Error(w, "Unauthorized", http.StatusUnauthorized)
  })
}

var salt = []byte(os.Getenv("SSO_TOKEN_SALT"))

// 将密码和salt放一块做hash，攻击者没有salt就没法构造token
func hashAndSalt(s string) string {
  hash := sha256.Sum256(append(salt, []byte(s)...))
  return hex.EncodeToString(hash[:])
}

func cookieAuth(next http.HandlerFunc) http.HandlerFunc {
  return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
    err := func() error {
      ssoTokenCookie, err := r.Cookie("SSO_TOKEN")
      if err != nil {
        return err
      }
      spl := strings.SplitN(ssoTokenCookie.Value, ".", 2)
      if len(spl) != 2 {
        return errors.New("token format error")
      }
      if hashAndSalt(spl[1]) != spl[0] {
        return errors.New("token invalid error")
      }
      expireUnix, err := strconv.Atoi(spl[1])
      if err != nil {
        return err
      }
      if time.Now().Unix() > int64(expireUnix) {
        return errors.New("token expire error")
      }
      return nil
    }()
    if err != nil {
      log.Println(err)
      w.WriteHeader(http.StatusUnauthorized)
      w.Write([]byte("Unauthorized"))
    } else {
      next(w, r)
    }
  })
}

func setAuthCookie(w http.ResponseWriter) {
  expire := time.Now().Add(time.Hour * 24 * 50)
  s := strconv.Itoa(int(expire.Unix()))
  token := fmt.Sprintf("%s.%s", hashAndSalt(s), s) // 简单地模仿JWT
  http.SetCookie(w, &http.Cookie{
    Name:     "SSO_TOKEN",
    Value:    token,
    Path:     "/",
    Domain:   os.Getenv("SSO_COOKIE_DOMAIN"), // cookie的域得能覆盖业务的域
    Expires:  expire,
    HttpOnly: true,
  })
}

func main() {
  // 校验业务请求带过来的cookie是否有效
  http.HandleFunc("/auth", cookieAuth(func(w http.ResponseWriter, r *http.Request) {
    w.WriteHeader(http.StatusOK) // 鉴权通过，返回200
  }))

  // 为了简单化，这里采用http basic登录，也可以做个web界面登录
  http.HandleFunc("/login", basicAuth(func(w http.ResponseWriter, r *http.Request) {
    setAuthCookie(w) // 给业务域种cookie，后续nginx会把cookie带到auth handler里进行校验
    getRedirectURL := func() string {
      redirectCookie, err := r.Cookie("redirect")
      if err != nil {
        return ""
      }
      return redirectCookie.Value
    }
    http.Redirect(w, r, getRedirectURL(), http.StatusFound) // 登录成功就重定向到之前的业务页面
  }))
  addr := os.Getenv("LISTEN_ADDR")
  if addr == "" {
    addr = "127.0.0.1:3100"
  }
  http.ListenAndServe(addr, nil)
}
```

::: tip
SetCookie 的域只能是当前域或者父一级的域，比如 sso 的域是`sso.home.lubui.com`，那么 SetCookie 的域只能配置为`sso.home.lubui.com`或者`.home.lubui.com`。比如配置为`.home.lubui.com`，那业务的域只能是`*.home.lubui.com`，不然无法带上 cookie。
:::

鉴权服务器 Dockerfile：

```docker
FROM golang:alpine AS build-stage
WORKDIR /app
COPY main.go ./
RUN CGO_ENABLED=0 GOOS=linux go build -o /go-bin main.go

FROM alpine:latest AS build-release-stage
WORKDIR /
COPY --from=build-stage /go-bin /go-bin
ENTRYPOINT ["/go-bin"]
```