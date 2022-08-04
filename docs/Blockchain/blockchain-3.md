---
title: 区块链入门(三)：智能合约的部署与交互
date: 2022-07-27 17:19:27 GMT+0800
categories: [区块链]
tags: [BlockChain, Ethereum]
---

::: abstract
以太坊的特色之一是可以部署智能合约，从而构建去中心化应用。
:::

<!-- more -->

## 通过 keystore 文件与密码解析得到私钥

上一节通过`geth account new`生成的账户并没有私钥，但是可以通过一些第三方库计算出私钥

```js
var keythereum = require('keythereum');

const password = '123';
const accountAddress = '0x811a4593311b7de8d24554b06dd8778120da8d19';

const keyObject = keythereum.importFromFile(accountAddress); // 没传第二个参数datadir，使用默认路径z~/.ethereum
const privateKey = keythereum.recover(password, keyObject);
console.log(privateKey.toString('hex')); // 3656b14103bb3e92a5fcfcdb6a3049435459a0750b3f87cec34c2bc5ba1fec90
```

## 项目初始化

```zsh
$ mkdir helloworld && cd helloworld && npm init -y && npm i -S hardhat
added 305 packages, and audited 306 packages in 1m

58 packages are looking for funding
  run `npm fund` for details

found 0 vulnerabilities
```

编辑安全帽的配置文件，配置为使用本地网络：

```js
// hardhat.config.js
require('@nomiclabs/hardhat-ethers');

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: '0.8.9',
  defaultNetwork: 'localhost',
  networks: {
    localhost: {
      url: 'https://eth.lubui.com',
      accounts: [
        '0x3656b14103bb3e92a5fcfcdb6a3049435459a0750b3f87cec34c2bc5ba1fec90', // 因为我们部署智能合约需要支付一定的以太币，所以需要账户私钥
      ],
    },
  },
};
```

## 部署一个简单的智能合约

### 编写 contract

```solidity
// contracts/1_HelloWorld.sol
pragma solidity >=0.8.9;

contract HelloWorld {
    event UpdatedMessages(string oldStr, string newStr);

    string public message; // 各节点都会将此变量持久化到硬盘里

    constructor(string memory initMessage) {
        message = initMessage;
    }

    function update(string memory newMessage) public {
        string memory oldMsg = message;
        message = newMessage;
        emit UpdatedMessages(oldMsg, newMessage);
    }
}
```

### 编译 contract

```zsh
$ npx hardhat compile
Warning: SPDX license identifier not provided in source file. Before publishing, consider adding a comment containing "SPDX-License-Identifier: <SPDX-License>" to each source file. Use "SPDX-License-Identifier: UNLICENSED" for non-open-source code. Please see https://spdx.org for more information.
--> contracts/1_HelloWorld.sol


Compiled 1 Solidity file successfully
```

编译之后会在项目根目录生成编译好的 json 产物，包括 abi 和字节码，如下：

```json
// artifacts/contracts/1_HelloWorld.sol/HelloWorld.json
{
  "_format": "hh-sol-artifact-1",
  "contractName": "HelloWorld",
  "sourceName": "contracts/1_HelloWorld.sol",
  "abi": [
    {
      "inputs": [
        {
          "internalType": "string",
          "name": "initMessage",
          "type": "string"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "constructor"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "internalType": "string",
          "name": "oldStr",
          "type": "string"
        },
        {
          "indexed": false,
          "internalType": "string",
          "name": "newStr",
          "type": "string"
        }
      ],
      "name": "UpdatedMessages",
      "type": "event"
    },
    {
      "inputs": [],
      "name": "message",
      "outputs": [
        {
          "internalType": "string",
          "name": "",
          "type": "string"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "string",
          "name": "newMessage",
          "type": "string"
        }
      ],
      "name": "update",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    }
  ],
  "bytecode": "0x608060......",
  "deployedBytecode": "0x608060......",
  "linkReferences": {},
  "deployedLinkReferences": {}
}
```

::: tip
abi 包含了智能合约的“接口”，比如构造函数、合约的事件、合约的函数等等，客户端与节点的智能合约交互时需要 abi。
:::

## 部署 contract

```js
// deploy.js
async function main() {
  const contract = await ethers.getContractFactory('HelloWorld');
  const resp = await contract.deploy('hello world!'); // 传入'hello world!'作为合约的构造函数的参数
  console.log('Contract deployed to address:', resp.address); // 输出合约部署到的地址，可以理解为实例化了一个对象
}

main();
```

通过安全帽执行上面的代码，合约被部署到节点上，并且节点的日志也打印了相关信息：

```zsh
$ npx hardhat run deploy.js
(node:21671) ExperimentalWarning: stream/web is an experimental feature. This feature could change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
Contract deployed to address: 0x9b0A14b8ab2F6B1D80d94e3a21AEb7f2C816c3A9 # 合约的账户地址
$ k logs --tail=100 ether-node-767565648f-6z4zm
INFO [07-29|07:24:53.488] Submitted contract creation              hash=0xc204f342cc4716863e6fcffe15f9a07ed30839031ec02d8f830e54caf73e3516 from=0x811A4593311b7dE8d24554b06DD8778120DA8d19 nonce=0 contract=0x9b0A14b8ab2F6B1D80d94e3a21AEb7f2C816c3A9 value=0
$ curl --request POST \ # 获取合约的字节码
  --url http://10.244.0.190:8545/ \
  --header 'content-type: application/json' \
  --data '{"jsonrpc": "2.0","method": "eth_getCode","params": ["0x9b0a14b8ab2f6b1d80d94e3a21aeb7f2c816c3a9","latest"],"id": 1}'
{"jsonrpc":"2.0","id": 1,"result": "0x"} # 合约还未打包到区块
$ curl --request POST \
  --url http://10.244.0.190:8545/ \
  --header 'content-type: application/json' \
  --data '{"jsonrpc": "2.0","method": "eth_getCode","params": ["0x9b0a14b8ab2f6b1d80d94e3a21aeb7f2c816c3a9","pending"],"id": 1}' # 查询状态为pending的
{"jsonrpc":"2.0","id": 1,"result": "0x60806040523..."}
$ curl --request POST \ # 开始挖矿
  --url http://10.244.0.190:8545/ \
  --header 'content-type: application/json' \
  --data '{"jsonrpc":"2.0","method":"miner_start","params":[],"id":1}'
{"jsonrpc":"2.0","id":1,"result":null}
$ curl --request POST \ # 获取合约的字节码
  --url http://10.244.0.190:8545/ \
  --header 'content-type: application/json' \
  --data '{"jsonrpc": "2.0","method": "eth_getCode","params": ["0x9b0a14b8ab2f6b1d80d94e3a21aeb7f2c816c3a9","latest"],"id": 1}'
{"jsonrpc":"2.0","id": 1,"result": "0x60806040523..."} # 合约已经打包到区块，可以进行交互了
```

## 与合约交互

可以选择`ethers`或者`web3.js`来和合约交互，这里选择`ethers`。

```js
// interact.js
const { abi } = require('artifacts/contracts/1_HelloWorld.sol/HelloWorld.json');
const ethers = require('ethers');
const env = {
  host: 'https://eth.lubui.com',
  accountAddress: '0x811a4593311b7de8d24554b06dd8778120da8d19',
  accountPrivateKey:
    '0x3656b14103bb3e92a5fcfcdb6a3049435459a0750b3f87cec34c2bc5ba1fec90',
  contract: '0x9b0A14b8ab2F6B1D80d94e3a21AEb7f2C816c3A9',
};

const provider = new ethers.providers.JsonRpcProvider('https://eth.lubui.com'); // 这里使用JsonRpcProvider直接与节点进行http交互

const signer = new ethers.Wallet(env.accountPrivateKey, provider); // 私钥用于签名交易，因为用户可以向合约账户转账

const contract = new ethers.Contract(env.contract, abi, signer); // 传入abi

async function main() {
  contract.on('UpdatedMessages', (oldStr, newStr) => {
    console.log(`oldStr: ${oldStr}, newStr: ${newStr}`); // 定时轮询getLog接口
  });
  let message = await contract.message();
  console.log('The message is: ' + message);

  console.log('Updating the message...');
  const tx = await contract.update('hello4!');
  console.log('waiting for tx to be mined...');
  await tx.wait(); // 定时轮询eth_blockNumber和eth_chainId接口

  message = await contract.message();
  console.log('The message is: ' + message);
}

main();
```

```zsh
$ node interact.js
The message is: hello world!
Updating the message...
waiting for tx to be mined...
oldStr: hello world!, newStr: hello4!
The message is: hello4!
```

::: tip
合约的部署以及合约的变量变更都需要等待区块打包。
查看合约的变量值不需要等待打包。
:::
