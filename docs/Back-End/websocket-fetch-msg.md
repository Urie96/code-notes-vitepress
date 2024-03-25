---
title: 使用mitmproxy抓包wss
date: 2021-08-24 16:39:01 GMT+0800
categories: [后端]
tags: [websocket]
---

::: abstract
记录如何使用 mitmproxy 抓包 ssl 的 websocket
:::

<!-- more -->

## 创建 Websocket

**目录结构：**

```terminal
$ tree
.
├── 1.key
├── 1.pem
├── index.html
├── index.js
├── package-lock.json
└── package.json

0 directories, 6 files
```

::: tip
为了避免设置 CA 证书信任，这里直接使用阿里云颁发的证书：`1.key`、`1.pem`。并修改本地`/etc/hosts`将证书绑定的域名`sweetlove.top`暂时指向`127.0.0.1`
:::

**客户端 HTML：**

```html
<script>
  var ws = new WebSocket('wss://sweetlove.top:3000');
  ws.onopen = function () {
    let i = 0;
    setInterval(() => {
      ws.send(i++);
    }, 1000);
  };
</script>
```

**Node.js 服务端：**

```js
const WebSocketServer = require('ws').Server;
const https = require('https');
const fs = require('fs');
const options = {
  key: fs.readFileSync('1.key'),
  cert: fs.readFileSync('1.pem'),
};

const server = https
  .createServer(options, (req, res) => {
    res.writeHead(200);
    res.end(fs.readFileSync('index.html'));
  })
  .listen(3000);

const wss = new WebSocketServer({ server: server });

wss.on('connection', (conn) => {
  console.log('connected');
  conn.on('message', (d) => console.log(d));
});
```

**启动服务端并使用浏览器访问`https://sweetlove.top:3000`：**

```terminal
$ npm i ws && node index.js
connected
0
1
2
3
4
5
6
...
```

## 开启代理并抓包：

**安装并启动：**

```terminal
$ pip install mitmproxy
$ mitmproxy
```

首先设置 Mac 的网页安全代理（https）为`localhost:8080`，然后浏览器重新访问`https://sweetlove.top:3000`

![3个请求](https://cdn.jsdelivr.net/gh/Urie96/images/mitmproxy20210824170024.jpg)

::: tip
可以发现是 SSL 加密的 websocket 连接
:::

![抓到的message](https://cdn.jsdelivr.net/gh/Urie96/images/mitmproxyws20210824170312.jpg)

::: tip
mitmproxy 捕获了所有 message，如果内容是中文则需要按<kbd>m</kbd>+<kbd>6</kbd>更换为`xml/html`编码
:::