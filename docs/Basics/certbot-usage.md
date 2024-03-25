---
title: 使用`certbot`免费获取通配符域名证书并自动续签
date: 2021-11-15 17:05:01 GMT+0800
categories: [基础]
tags: [Linux]
---

::: abstract
国内云服务商提供的免费证书只能用于单域名，并且有效期为一年，如果子域名较多，那么每年证书到期前后都会有大量的短信通知，需要重新申请证书，非常繁琐。
下面将通过`certbot`命令获取 Let's Encrypt 的免费通配符域名证书。
:::

<!-- more -->

## 安装

Debian：

```terminal
$ sudo apt install certbot
$ certbot --version
certbot 0.31.0
```

Mac OS:

```terminal
$ brew install certbot
$ certbot --version
certbot 1.21.0
```

## 脚本更新阿里云 DNS

::: tip

1. 获取域名证书需要证明是域名的持有者，普通的单域名与多域名证书可以通过在服务器上配置 web 服务以返回给定的内容进行验证，但通配符域名必须要通过 DNS 验证（\_acme-challenge 子域名需要能被 DNS 解析为给定的 TXT 记录）
2. certbot 提供了各种插件，比如 nginx 插件可以使 certbot 能根据 nginx 配置来指定域名，DNS 插件可以通过国外云服务商的 api 修改 DNS 以实现自动化，而对于国内的云服务商则没有提供对应的 DNS 插件，但 certbot 提供了 hook 可以手动进行实现。

:::

通过阿里云提供的 SDK 编写代码：

```go
package main

import (
  "fmt"
  "os"
  "time"

  "github.com/aliyun/alibaba-cloud-sdk-go/services/alidns"
)

func main() {
  txt := os.Getenv("CERTBOT_VALIDATION") // 通过环境变量获取需要配置成的TXT记录值
  if txt == "" {
    panic("should run in certbot")
  }
  fmt.Println("txt: ", txt)
  err := updateDNS(txt)
  if err != nil {
    panic(err)
  }
  fmt.Println("update dns ok, sleeping 5s...")
  time.Sleep(time.Second * 5) // 睡眠，使DNS完全生效
}

func updateDNS(txt string) error {
  client, err := alidns.NewClientWithAccessKey("REGION_ID", "accessKeyID", "accessKeySecret") // keyid和keysecret通过阿里云控制台获取
  if err != nil {
    return err
  }
  req := alidns.CreateUpdateDomainRecordRequest()
  req.RecordId = "729528101959931904" // recordID，需要先去控制台新建一个
  req.RR = "_acme-challenge" // 子域名
  req.Type = "TXT"
  req.Value = txt

  _, err = client.UpdateDomainRecord(req)
  return err
}
```

## 生成证书

```terminal
$ sudo certbot certonly \
  -d \*.sweetlove.top \
  # 通配符域名 \
  -d sweetlove.top \
  --manual \
  --preferred-challenges dns \
  # 使用DNS验证域名 \
  --manual-auth-hook "/home/pi/workplace/go/alidns/alidns" \
   # 修改DNS的hook \
  --deploy-hook "echo Done" # 证书更新完成的hook
# 第一次使用会询问邮箱之类的信息，此处省略
Waiting for verification...
Cleaning up challenges
Running deploy-hook command: echo Done
Output from echo:
Done


IMPORTANT NOTES:
 - Congratulations! Your certificate and chain have been saved at:
   /etc/letsencrypt/live/sweetlove.top/fullchain.pem
   Your key file has been saved at:
   /etc/letsencrypt/live/sweetlove.top/privkey.pem
   Your cert will expire on 2022-02-13. To obtain a new or tweaked
   version of this certificate in the future, simply run certbot
   again. To non-interactively renew *all* of your certificates, run
   "certbot renew"
$ sudo certbot certificates
Saving debug log to /var/log/letsencrypt/letsencrypt.log

- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
Found the following certs:
  Certificate Name: sweetlove.top
    Domains: *.sweetlove.top sweetlove.top
    Expiry Date: 2022-02-13 08:39:49+00:00 (VALID: 89 days)
    Certificate Path: /etc/letsencrypt/live/sweetlove.top/fullchain.pem
    Private Key Path: /etc/letsencrypt/live/sweetlove.top/privkey.pem
```

::: tip
这里使用了低版本的 certbot，输出的信息和高版本不一样，少了 `--manual-auth-hook` 的输出以及自动更新的说明。
:::

## 更新证书

```terminal
$ sudo certbot renew --force-renewal
Saving debug log to /var/log/letsencrypt/letsencrypt.log

- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
Processing /etc/letsencrypt/renewal/sweetlove.top.conf
- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
Renewing an existing certificate for *.sweetlove.top and sweetlove.top
Hook 'deploy-hook' ran with output:
 Done!

- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
Congratulations, all renewals succeeded:
  /etc/letsencrypt/live/sweetlove.top/fullchain.pem (success)
- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
```

::: tip

1. `certbot renew`会更新即将过期的证书，`--force-renewal`参数强制更新所有证书。
1. `certbot renew` 似乎不需要验证域名持有权，所以上面 `--manual-auth-hook` 也可以换成手动去控制台更新 DNS 而不是使用 api 更新。
1. 使用 crontab 添加任务即可实现自动续签。

:::

## 验证证书

![chrome-cert-preview.png](https://cdn.jsdelivr.net/gh/Urie96/images/20220804144201.jpg)