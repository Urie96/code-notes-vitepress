---
title: 区块链入门(二)：搭建以太坊私链并部署多节点
sort: 2
date: 2022-07-22 14:04:59 GMT+0800
categories: [区块链]
tags: [BlockChain, Ethereum]
---

::: abstract
本节通过 k8s 搭建多节点的以太坊私链，并测试 http 接口等功能
:::

<!-- more -->

## 下载镜像

由于[官方镜像](https://hub.docker.com/r/ethereum/client-go)只包含了 `geth` 二进制，但[Github Releases](https://github.com/ethereum/go-ethereum/releases)刚好有所有包的 Dockerfile，所以可以自己打包镜像：

> `geth`是以太坊的 Golang 实现，可用于开启一个节点

```zsh
$ wget https://github.com/ethereum/go-ethereum/archive/refs/tags/v1.10.20.tar.gz
$ tar xf v1.10.20.tar.gz
$ rm v1.10.20.tar.gz
$ cd go-ethereum-1.10.20/
$ docker build -t hub.lubui.com/geth -f Dockerfile.alltools . # 也可以改一下，只编译geth和bootnode，能节约不少时间和空间
$ docker push hub.lubui.com/geth
```

## 部署 BootNode

一个刚起的 geth 节点，没有任何认识的节点，它需要一个“中介机构”（即 bootnode），bootnode 保存了所有连接的节点信息，当有新节点加入时，可以向其推荐 P2P 网络里的其他成员。

```yaml
# bootnode.yml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ether-bootnode
  labels:
    app: ether-bootnode
spec:
  replicas: 1
  selector:
    matchLabels:
      app: ether-bootnode
  template:
    metadata:
      labels:
        app: ether-bootnode
    spec:
      containers:
        - name: ether-bootnode
          image: hub.lubui.com/geth:latest
          imagePullPolicy: IfNotPresent
          command:
            - '/bin/sh'
            - '-c'
            - 'bootnode --genkey=boot.key && bootnode --nodekey=boot.key -verbosity=5 -addr=`hostname -i`:30302'
```

部署：

```zsh
$ kubectl apply -f bootnode.yml
deployment.apps/ether-bootnode configured
$ k logs ether-bootnode-65c99bbd48-zfb8z
enode://1129a910058f3749001a13933b8dc0e1f9e2e3386ad0e18ed68ff34d6d0034f92c8afad4e92495f98dbe1686b59263eb2fc6e09a12f9c38506d0de581ef63e91@10.244.0.150:0?discport=30302
Note: you're using cmd/bootnode, a developer tool.
We recommend using a regular node as bootstrap node for production deployments.
INFO [07-22|07:19:51.215] New local node record                    seq=1,658,474,391,214 id=b72e70fa51d8a2b2 ip=<nil> udp=0 tcp=0
```

部署成功以后，bootnode 会打印出一个以`enode://`开头的 url，以太坊的每个 bootnode 节点和 geth 节点都会有这样一个 enode，节点可以通过这个链接访问和认证其他节点。

后面启动的以太坊节点需要指定 bootnode 为此节点，否则会使用内置的以太坊主链的 bootnodes。

## 生成一个账户

生成账户只是执行了本地的一个加密算法，不需要与任何节点进行交互。

这里使用 geth 来生成一个新账户：

```zsh
$ geth account new
INFO [07-22|15:33:13.456] Maximum peer count                       ETH=50 LES=0 total=50
INFO [07-22|15:33:13.456] Smartcard socket not found, disabling    err="stat /run/pcscd/pcscd.comm: no such file or directory"
Your new account is locked with a password. Please give a password. Do not forget this password.
Password:
Repeat password:

Your new key was generated

Public address of the key:   0x811A4593311b7dE8d24554b06DD8778120DA8d19
Path of the secret key file: /home/ubuntu/.ethereum/keystore/UTC--2022-07-22T07-33-22.567042175Z--811a4593311b7de8d24554b06dd8778120da8d19

- You can share your public address with anyone. Others need it to interact with you.
- You must NEVER share the secret key with anyone! The key controls access to your funds!
- You must BACKUP your key file! Without the key, it's impossible to access account funds!
- You must REMEMBER your password! Without the password, it's impossible to decrypt the key!
$ cat /home/ubuntu/.ethereum/keystore/UTC--2022-07-22T07-33-22.567042175Z--811a4593311b7de8d24554b06dd8778120da8d19 |jq
{
  "address": "811a4593311b7de8d24554b06dd8778120da8d19",
  "crypto": {
    "cipher": "aes-128-ctr",
    "ciphertext": "8b5ff7854d31576c93a1c09d01c40d38ed23617dd45a9f8ac8d75b614af0196d",
    "cipherparams": {
      "iv": "e6d76d3d8f833d949fa9e324f4941e65"
    },
    "kdf": "scrypt",
    "kdfparams": {
      "dklen": 32,
      "n": 262144,
      "p": 1,
      "r": 8,
      "salt": "e672b1a1b633f6a3f88ef380f2f383dbe1da0c860223e950a37834c0c08071f1"
    },
    "mac": "2bd23468933997ead361d24d3d8edbe91902d7ceae52457160cbf70d9db2bd84"
  },
  "id": "5bbf0bfc-2d0e-4ad6-8cd6-b9ffcc5ab67c",
  "version": 3
}
```

::: tip

- 钱包地址可以公开
- key file 与密码一起可以生成私钥，这些非常重要，不可公开
- 私钥可以对交易加密，全网节点可以用钱包地址解密，如果解密失败，说明钱包地址与私钥不匹配，交易无效

:::

## 生成私链的配置信息

以太坊官方提供了一个命令行交互工具`puppeth`，可用于生成一个 json 配置信息：

```zsh
$ puppeth
+-----------------------------------------------------------+
| Welcome to puppeth, your Ethereum private network manager |
|                                                           |
| This tool lets you create a new Ethereum network down to  |
| the genesis block, bootnodes, miners and ethstats servers |
| without the hassle that it would normally entail.         |
|                                                           |
| Puppeth uses SSH to dial in to remote servers, and builds |
| its network components out of Docker containers using the |
| docker-compose toolset.                                   |
+-----------------------------------------------------------+

Please specify a network name to administer (no spaces, hyphens or capital letters please)
> genesis

Sweet, you can set this via --network=genesis next time!

INFO [07-26|12:34:58.193] Administering Ethereum network           name=genesis
INFO [07-26|12:34:58.193] No remote machines to gather stats from

What would you like to do? (default = stats)
 1. Show network stats
 2. Configure new genesis
 3. Track new remote server
 4. Deploy network components
> 2

What would you like to do? (default = create)
 1. Create new genesis from scratch
 2. Import already existing genesis
> 1

Which consensus engine to use? (default = clique) # 选择共识算法，Ethash需要占用大量资源，Clique不用
 1. Ethash - proof-of-work
 2. Clique - proof-of-authority
> 2

How many seconds should blocks take? (default = 15) # 出块事件间隔
> 15

Which accounts are allowed to seal? (mandatory at least one) # 由于上面选择了clique共识，这里需要指定可以打包区块的钱包地址
> 0x811a4593311b7de8d24554b06dd8778120da8d19
> 0x

Which accounts should be pre-funded? (advisable at least one) # 由于clique不会有区块打包奖励，所以需要给账户分配一些以太币
> 0x811a4593311b7de8d24554b06dd8778120da8d19
> 0x

Should the precompile-addresses (0x1 .. 0xff) be pre-funded with 1 wei? (advisable yes)
> no

Specify your chain/network ID if you want an explicit one (default = random) # 在公网，可以用这个识别不同的以太坊网络
> 17828
INFO [07-26|12:35:49.285] Configured new genesis block

What would you like to do? (default = stats)
 1. Show network stats
 2. Manage existing genesis
 3. Track new remote server
 4. Deploy network components
> 2

 1. Modify existing configurations
 2. Export genesis configurations
 3. Remove genesis configuration
> 2

Which folder to save the genesis specs into? (default = current)
  Will create genesis.json, genesis-aleth.json, genesis-harmony.json, genesis-parity.json
>
INFO [07-26|12:36:03.172] Saved native genesis chain spec          path=genesis.json
ERROR[07-26|12:36:03.173] Failed to create Aleth chain spec        err="unsupported consensus engine"
ERROR[07-26|12:36:03.173] Failed to create Parity chain spec       err="unsupported consensus engine"
INFO [07-26|12:36:03.173] Saved genesis chain spec                 client=harmony path=genesis-harmony.json
```

生成的 genesis.json 如下：

```json
{
  "config": {
    "chainId": 17828,
    "homesteadBlock": 0,
    "eip150Block": 0,
    "eip150Hash": "0x0000000000000000000000000000000000000000000000000000000000000000",
    "eip155Block": 0,
    "eip158Block": 0,
    "byzantiumBlock": 0,
    "constantinopleBlock": 0,
    "petersburgBlock": 0,
    "istanbulBlock": 0,
    "clique": {
      "period": 15,
      "epoch": 30000
    }
  },
  "nonce": "0x0",
  "timestamp": "0x62df6ef6",
  "extraData": "0x0000000000000000000000000000000000000000000000000000000000000000811a4593311b7de8d24554b06dd8778120da8d190000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "gasLimit": "0x47b760",
  "difficulty": "0x1",
  "mixHash": "0x0000000000000000000000000000000000000000000000000000000000000000",
  "coinbase": "0x0000000000000000000000000000000000000000",
  "alloc": {
    "811a4593311b7de8d24554b06dd8778120da8d19": {
      "balance": "0x200000000000000000000000000000000000000000000000000000000000000"
    }
  },
  "number": "0x0",
  "gasUsed": "0x0",
  "parentHash": "0x0000000000000000000000000000000000000000000000000000000000000000",
  "baseFeePerGas": null
}
```

::: tip
genesis.json 定义了以太坊链的初始配置，每个节点都需要指定一份相同的配置。如果不指定配置，则节点会使用内置的以太坊主链的配置。
:::

## 部署以太坊节点

```yaml
# node.yml
apiVersion: v1
kind: ConfigMap
metadata:
  name: genesis
data:
  genesis.json: |-
    {
      "config": {
        "chainId": 17828,
        "homesteadBlock": 0,
        "eip150Block": 0,
        "eip150Hash": "0x0000000000000000000000000000000000000000000000000000000000000000",
        "eip155Block": 0,
        "eip158Block": 0,
        "byzantiumBlock": 0,
        "constantinopleBlock": 0,
        "petersburgBlock": 0,
        "istanbulBlock": 0,
        "clique": {
          "period": 15,
          "epoch": 30000
        }
      },
      "nonce": "0x0",
      "timestamp": "0x62df6ef6",
      "extraData": "0x0000000000000000000000000000000000000000000000000000000000000000811a4593311b7de8d24554b06dd8778120da8d190000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
      "gasLimit": "0x47b760",
      "difficulty": "0x1",
      "mixHash": "0x0000000000000000000000000000000000000000000000000000000000000000",
      "coinbase": "0x0000000000000000000000000000000000000000",
      "alloc": {},
      "number": "0x0",
      "gasUsed": "0x0",
      "parentHash": "0x0000000000000000000000000000000000000000000000000000000000000000",
      "baseFeePerGas": null
    }
  dev_account_key: |-
    {"address":"811a4593311b7de8d24554b06dd8778120da8d19","crypto":{"cipher":"aes-128-ctr","ciphertext":"8b5ff7854d31576c93a1c09d01c40d38ed23617dd45a9f8ac8d75b614af0196d","cipherparams":{"iv":"e6d76d3d8f833d949fa9e324f4941e65"},"kdf":"scrypt","kdfparams":{"dklen":32,"n":262144,"p":1,"r":8,"salt":"e672b1a1b633f6a3f88ef380f2f383dbe1da0c860223e950a37834c0c08071f1"},"mac":"2bd23468933997ead361d24d3d8edbe91902d7ceae52457160cbf70d9db2bd84"},"id":"5bbf0bfc-2d0e-4ad6-8cd6-b9ffcc5ab67c","version":3}

---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ether-node
  labels:
    app: ether-node
spec:
  replicas: 2
  selector:
    matchLabels:
      app: ether-node
  template:
    metadata:
      labels:
        app: ether-node
    spec:
      containers:
        - name: ether-node
          image: hub.lubui.com/geth:latest
          ports:
            - containerPort: 8545
          imagePullPolicy: IfNotPresent
          command:
            - '/bin/sh'
            - '-c'
            - 'echo $DEV_ACCOUNT_PASSWORD>/root/password.txt && geth init /genesis.json && geth --networkid 17828 --ipcdisable --bootnodes="$BOOTNODE" --http --http.addr `hostname -i` --http.corsdomain="*" --http.vhosts="*" --http.api web3,eth,debug,personal,net,miner --miner.threads=1 --miner.etherbase="$DEV_ACCOUNT_ADDRESS" --unlock="$DEV_ACCOUNT_ADDRESS" --password=/root/password.txt --allow-insecure-unlock'
          # --bootnodes="$BOOTNODE" 指定了bootnode的地址，用于让节点之间能相互发现
          # --http开启了http功能，这样外网就能通过json rpc与节点进行交互
          # --http.corsdomain 设置跨域访问；--http.vhosts 允许所有域名访问
          # --http.api web3,eth,debug,personal,net,miner 允许外部访问的api
          # --password=/root/password.txt 用于解锁账户，因为我们指定了该账户才能打包区块，节点需要拥有该账户的私钥才能证明自己是该账户的拥有者
          env:
            - name: BOOTNODE
              value: enode://1129a910058f3749001a13933b8dc0e1f9e2e3386ad0e18ed68ff34d6d0034f92c8afad4e92495f98dbe1686b59263eb2fc6e09a12f9c38506d0de581ef63e91@10.244.0.150:0?discport=30302
            - name: DEV_ACCOUNT_ADDRESS
              value: '0x811a4593311b7de8d24554b06dd8778120da8d19'
            - name: DEV_ACCOUNT_PASSWORD
              value: '123'
          volumeMounts:
            - name: config-volume
              mountPath: '/genesis.json'
              subPath: genesis.json
            - name: config-volume
              mountPath: '/root/.ethereum/keystore/UTC--2022-07-22T07-33-22.567042175Z--811a4593311b7de8d24554b06dd8778120da8d19'
              subPath: dev_account_key
      volumes:
        - name: config-volume
          configMap:
            name: genesis
---
apiVersion: v1
kind: Service
metadata:
  name: ether-node
spec:
  ports:
    - port: 80
      protocol: TCP
      targetPort: 8545
  selector:
    app: ether-node
  type: ClusterIP
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: ether
spec:
  ingressClassName: nginx
  tls:
    - hosts:
        - eth.lubui.com
      secretName: tls-lubui.com
  rules:
    - host: eth.lubui.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: ether-node
                port:
                  number: 80
```

部署成功后，可以看到两个以太坊节点与 bootnode 节点均已相互连接上。

```zsh
$ kubectl apply -f node.yml
$ kubectl get pods -o wide
NAME                               READY   STATUS    RESTARTS          AGE     IP             NODE        NOMINATED NODE   READINESS GATES
ether-bootnode-65c99bbd48-zfb8z    1/1     Running   0                 4d19h   10.244.0.150   lubui.com   <none>           <none>
ether-node-767565648f-6z4zm        1/1     Running   0                 6s      10.244.0.158   lubui.com   <none>           <none>
ether-node-767565648f-s285t        1/1     Running   0                 6s      10.244.0.157   lubui.com   <none>           <none>
$ kubectl logs --tail=10  ether-bootnode-65c99bbd48-zfb8z # bootnode节点日志打印了两个以太坊节点的访问
TRACE[07-27|03:19:08.544] << FINDNODE/v4                           id=571802a14d88102c addr=10.244.0.157:30303 err=nil
TRACE[07-27|03:19:08.544] >> NEIGHBORS/v4                          id=571802a14d88102c addr=10.244.0.157:30303 err=nil
TRACE[07-27|03:19:08.996] << FINDNODE/v4                           id=09effd0989b90b84 addr=10.244.0.158:30303 err=nil
TRACE[07-27|03:19:08.996] >> NEIGHBORS/v4                          id=09effd0989b90b84 addr=10.244.0.158:30303 err=nil
TRACE[07-27|03:19:09.045] << FINDNODE/v4                           id=571802a14d88102c addr=10.244.0.157:30303 err=nil
TRACE[07-27|03:19:09.045] >> NEIGHBORS/v4                          id=571802a14d88102c addr=10.244.0.157:30303 err=nil
TRACE[07-27|03:19:09.496] << FINDNODE/v4                           id=09effd0989b90b84 addr=10.244.0.158:30303 err=nil
TRACE[07-27|03:19:09.496] >> NEIGHBORS/v4                          id=09effd0989b90b84 addr=10.244.0.158:30303 err=nil
TRACE[07-27|03:19:09.546] << FINDNODE/v4                           id=571802a14d88102c addr=10.244.0.157:30303 err=nil
TRACE[07-27|03:19:09.546] >> NEIGHBORS/v4                          id=571802a14d88102c addr=10.244.0.157:30303 err=nil
$ k logs --tail=2 ether-node-767565648f-6z4zm # 以太坊节点打印了peercount=1，表示已连接了1个对等节点
INFO [07-27|03:25:54.715] Looking for peers                        peercount=1 tried=0 static=0
INFO [07-27|03:26:04.731] Looking for peers                        peercount=1 tried=0 static=0
```

## 通过 HTTP 请求节点

```zsh
$ # 查区块高度
$ curl --request POST \
  --url http://10.244.0.157:8545/ \
  --header 'content-type: application/json' \
  --data '{"id":1,"jsonrpc":"2.0","method":"eth_blockNumber","params":[]}'
{"jsonrpc":"2.0","id":1,"result":"0x0"} # 现在挖矿还没开启，所以返回 0
$ # 查某账户地址的以太币余额，单位为wei
$ curl --request POST \
  --url http://10.244.0.157:8545/ \
  --header 'content-type: application/json' \
  --data '{"jsonrpc":"2.0","method":"eth_getBalance","params":["0x811a4593311b7de8d24554b06dd8778120da8d19", "latest"],"id":1}'
{"jsonrpc":"2.0","id":1,"result":"0x200000000000000000000000000000000000000000000000000000000000000"} # genesis.json中给该账户预分配了以太币
$ # 开始挖矿
$ curl --request POST \
  --url http://10.244.0.157:8545/ \
  --header 'content-type: application/json' \
  --data '{"jsonrpc":"2.0","method":"miner_start","params":[],"id":1}'
{"jsonrpc":"2.0","id":1,"result":null}
$ # 停止挖矿
$ curl --request POST \
  --url http://10.244.0.157:8545/ \
  --header 'content-type: application/json' \
  --data '{"jsonrpc":"2.0","method":"miner_stop","params":[],"id":1}'
{"jsonrpc":"2.0","id":1,"result":null}
$ # 查区块高度
$ curl --request POST \
  --url http://10.244.0.157:8545/ \
  --header 'content-type: application/json' \
  --data '{"id":1,"jsonrpc":"2.0","method":"eth_blockNumber","params":[]}'
{"jsonrpc":"2.0","id":1,"result":"0x2"} # 已经有了2个区块
$ # 请求另一个节点的区块高度，结果相同
$ curl --request POST \
  --url http://10.244.0.158:8545/ \
  --header 'content-type: application/json' \
  --data '{"id":1,"jsonrpc":"2.0","method":"eth_blockNumber","params":[]}'
{"jsonrpc":"2.0","id":1,"result":"0x2"}
```

## 发送交易

```zsh
$ # 给另一个账户发送以太币，eth_sendTransaction需要该节点已解锁付款方的账户
$ curl --request POST \
  --url http://10.244.0.157:8545/ \
  --header 'content-type: application/json' \
  --data '{"jsonrpc": "2.0","method": "eth_sendTransaction","params": [{"from": "0x811a4593311b7de8d24554b06dd8778120da8d19","to": "0xB565a3B4a3553474205aAc1Fa1794D8A3A5A03e4","value": "0x100"}],"id": 1}'
{"jsonrpc":"2.0","id":1,"result":"0x846e5e7d8f2f3c8c16e8cf096dfe58488890ed2cf4c05f9dd91d4f9e43ba1eb9"}
$ # 查询收款方的余额
$ curl --request POST \
  --url http://10.244.0.157:8545/ \
  --header 'content-type: application/json' \
  --data '{"jsonrpc":"2.0","method":"eth_getBalance","params":["0xB565a3B4a3553474205aAc1Fa1794D8A3A5A03e4", "latest"],"id":1}' # latest表示最新的区块
{"jsonrpc":"2.0","id":1,"result":"0x0"} # 因为现在没有启动挖矿，所以余额为0
$ # 查询收款方的余额
$ curl --request POST \
  --url http://10.244.0.158:8545/ \
  # 请求任意节点均可 \
  --header 'content-type: application/json' \
  --data '{"jsonrpc":"2.0","method":"eth_getBalance","params":["0xB565a3B4a3553474205aAc1Fa1794D8A3A5A03e4", "pending"],"id":1}' # 状态pending，表示待打包状态
{"jsonrpc":"2.0","id":1,"result":"0x100"} # 每次交易都会立即广播到全网等待打包
$ # 开始挖矿
$ curl --request POST \
  --url http://10.244.0.157:8545/ \
  --header 'content-type: application/json' \
  --data '{"jsonrpc":"2.0","method":"miner_start","params":[],"id":1}'
{"jsonrpc":"2.0","id":1,"result":null}
$ # 查询收款方的余额
$ curl --request POST \
  --url http://10.244.0.158:8545/ \
  # 请求任意节点均可 \
  --header 'content-type: application/json' \
  --data '{"jsonrpc":"2.0","method":"eth_getBalance","params":["0xB565a3B4a3553474205aAc1Fa1794D8A3A5A03e4", "latest"],"id":1}'
{"jsonrpc":"2.0","id":1,"result":"0x100"} # 交易已被打包，余额为0x100
```

::: tip
如果是使用的是第三方服务提供的节点，一定不能将自己账户的私钥或者密码等信息发送给节点。正确的方式是本地生成交易后用自己的私钥加密，然后再将加密后的信息发给节点。
:::
