---
title: 电视盒子 X96 Max+ 折腾 CoreELEC
date: 2022-11-12 10:25:00 GMT+0800
categories: [家庭服务]
tags: [CoreELEC]
disable: false
---

::: abstract
[CoreELEC](https://github.com/CoreELEC/CoreELEC) 是从 [LibreELEC](https://github.com/LibreELEC/LibreELEC.tv) fork 出来的，对 Amlogic 等 CPU 有更好的支持。它基于 Debian，主界面是 Kodi，精简了很多东西，但可以安装 docker。
:::

<!-- more -->

## 刷 CoreELEC 固件

固件写入 U 盘，插到盒子上，重启捅后面 AV 插口里的按钮，这样可以从 U 盘启动，然后将 CoreELEC 安装到 emmc，完成 CoreELEC 和安卓双系统共存。

默认是启动 CoreELEC，启动后可以在 Kodi 界面选择重启到安卓。

```terminal
$ uname -a
Linux CoreELEC 4.9.269 #1 SMP PREEMPT Wed Jul 27 09:00:53 CEST 2022 aarch64 GNU/Linux
```

## 安装包管理器

```terminal
$ apt-get # debian包管理器用不了

 There is no working 'apt-get'.

 'apt-get' is a command to install, update and remove software which
 is stored in a non local repo. 'apt-get' does nothing then connecting to such
 repo, downloads the software, unpacks the software, updates a big
 local database with all filepaths and other informations about the
 installed software or removes or updates installed Software.

 With LibreELEC it is not possible to change the system for security and
 stability reasons so even 'apt-get' would not be able to do this.
 We also dont have and want to maintain such a repo for various other
 great reasons.

 Also Ubuntu or Debian packages are often outdated and not compatible
 with LibreELEC

 TIP: use Kodi's addon browser to enhance your LibreELEC system
$ installentware # 可以用这个命令装opkg
writing to stdout
Info: Checking for prerequisites and creating folders...
Warning: Folder /opt exists!
-                    100% |***************************************************************************************************************************************************************************************************************************|  2774  0:00:00 ETA
written to stdout
Info: Opkg package manager deployment...
Connecting to 192.168.1.7:10809 (192.168.1.7:10809)
saving to '/opt/bin/opkg'
opkg                 100% |***************************************************************************************************************************************************************************************************************************|  839k  0:00:00 ETA
'/opt/bin/opkg' saved
Connecting to 192.168.1.7:10809 (192.168.1.7:10809)
saving to '/opt/etc/opkg.conf'
opkg.conf            100% |***************************************************************************************************************************************************************************************************************************|   175  0:00:00 ETA
'/opt/etc/opkg.conf' saved
Info: Basic packages installation...
Downloading http://bin.entware.net/aarch64-k3.10/Packages.gz
Updated list of available packages in /opt/var/opkg-lists/entware
Installing entware-opt (227000-3) to root...
Downloading http://bin.entware.net/aarch64-k3.10/entware-opt_227000-3_all.ipk
Installing libgcc (8.4.0-11) to root...
Downloading http://bin.entware.net/aarch64-k3.10/libgcc_8.4.0-11_aarch64-3.10.ipk
Installing libc (2.27-11) to root...
Downloading http://bin.entware.net/aarch64-k3.10/libc_2.27-11_aarch64-3.10.ipk
Installing libssp (8.4.0-11) to root...
Downloading http://bin.entware.net/aarch64-k3.10/libssp_8.4.0-11_aarch64-3.10.ipk
Installing libpthread (2.27-11) to root...
Downloading http://bin.entware.net/aarch64-k3.10/libpthread_2.27-11_aarch64-3.10.ipk
Installing librt (2.27-11) to root...
Downloading http://bin.entware.net/aarch64-k3.10/librt_2.27-11_aarch64-3.10.ipk
Installing libstdcpp (8.4.0-11) to root...
Downloading http://bin.entware.net/aarch64-k3.10/libstdcpp_8.4.0-11_aarch64-3.10.ipk
Installing entware-release (1.0-2) to root...
Downloading http://bin.entware.net/aarch64-k3.10/entware-release_1.0-2_all.ipk
Installing zoneinfo-asia (2022a-1) to root...
Downloading http://bin.entware.net/aarch64-k3.10/zoneinfo-asia_2022a-1_aarch64-3.10.ipk
Installing zoneinfo-europe (2022a-1) to root...
Downloading http://bin.entware.net/aarch64-k3.10/zoneinfo-europe_2022a-1_aarch64-3.10.ipk
Installing findutils (4.9.0-1) to root...
Downloading http://bin.entware.net/aarch64-k3.10/findutils_4.9.0-1_aarch64-3.10.ipk
Installing terminfo (6.3-1a) to root...
Downloading http://bin.entware.net/aarch64-k3.10/terminfo_6.3-1a_aarch64-3.10.ipk
Installing libpcre (8.45-3) to root...
Downloading http://bin.entware.net/aarch64-k3.10/libpcre_8.45-3_aarch64-3.10.ipk
Installing grep (3.7-2) to root...
Downloading http://bin.entware.net/aarch64-k3.10/grep_3.7-2_aarch64-3.10.ipk
Installing locales (2.27-9) to root...
Downloading http://bin.entware.net/aarch64-k3.10/locales_2.27-9_aarch64-3.10.ipk
Installing opkg (2022-02-24-d038e5b6-1) to root...
Downloading http://bin.entware.net/aarch64-k3.10/opkg_2022-02-24-d038e5b6-1_aarch64-3.10.ipk
Installing entware-upgrade (1.0-1) to root...
Downloading http://bin.entware.net/aarch64-k3.10/entware-upgrade_1.0-1_all.ipk
Configuring libgcc.
Configuring libc.
Configuring libssp.
Configuring libpthread.
Configuring librt.
Configuring terminfo.
Configuring libpcre.
Configuring grep.
Configuring locales.
Entware uses separate locale-archive file independent from main system
Creating locale archive /opt/usr/lib/locale/locale-archive
Adding en_EN.UTF-8
Adding ru_RU.UTF-8
You can download locale sources from http://bin.entware.net/other/i18n_glib227.tar.gz
You can add new locales to Entware using /opt/bin/localedef.new
Configuring entware-upgrade.
Upgrade operations are not required.
Configuring opkg.
Configuring zoneinfo-europe.
Configuring zoneinfo-asia.
Configuring libstdcpp.
Configuring entware-release.
Configuring findutils.
Configuring entware-opt.
Info: Congratulations!
Info: If there are no errors above then Entware was successfully initialized.
Info: Add /opt/bin & /opt/sbin to $PATH variable
Info: Add "/opt/etc/init.d/rc.unslung start" to startup script for Entware services to start
Info: Found a Bug? Please report at https://github.com/Entware/Entware/issues
$ opkg list # 可以用这个命令替代apt了，不过也是有很多软件没有
```

## 安装 docker

docker 需要用 Kodi 的插件里面的 CoreELEC 库里的插件来装。

```terminal
$ docker version # 还挺新的
Client:
 Version:           19.03.15
 API version:       1.40
 Go version:        go1.19.2
 Git commit:        99e3ed89195c4e551e87aad1e7453b65456b03ad
 Built:             Thu Nov  3 01:45:35 UTC 2022
 OS/Arch:           linux/arm
 Experimental:      false

Server:
 Engine:
  Version:          19.03.15
  API version:      1.40 (minimum version 1.12)
  Go version:       go1.19.2
  Git commit:       99e3ed89195c4e551e87aad1e7453b65456b03ad
  Built:            Thu Nov  3 01:45:35 UTC 2022
  OS/Arch:          linux/arm
  Experimental:     false
 containerd:
  Version:          1.6.6
  GitCommit:        10c12954828e7c7c9b6e0ea9b0c02b01407d3ae1
 runc:
  Version:          1.1.3
  GitCommit:        6724737f999df9ee0d8ca5c6d7b81f97adc34374
 docker-init:
  Version:          0.19.0
  GitCommit:
```

## Shell 中文

```terminal
$ cat /storage/.inputrc # ssh上来输入不了中文，需要添加一下这个
set meta-flag on
set convert-meta off
set input-meta on
set output-meta on
$ # 输入的中文需要按两次删除才能删一个字，有时候还乱码，需要在Kodi插件上安装CoreELEC库的locale插件，然后在插件设置里选择zh.CN
$ # 然后需要添加这个文件，修改shell的环境变量
$ cat /storage/.profile # /etc/profile被系统配置为只读了
export LANG="zh_CN.UTF-8"
export LC_ALL="zh_CN.UTF-8"
$ bash # 但是ssh默认选的是sh
$ locale
LANG=zh_CN.UTF-8
LC_CTYPE="zh_CN.UTF-8"
LC_NUMERIC="zh_CN.UTF-8"
LC_TIME="zh_CN.UTF-8"
LC_COLLATE="zh_CN.UTF-8"
LC_MONETARY="zh_CN.UTF-8"
LC_MESSAGES="zh_CN.UTF-8"
LC_PAPER="zh_CN.UTF-8"
LC_NAME="zh_CN.UTF-8"
LC_ADDRESS="zh_CN.UTF-8"
LC_TELEPHONE="zh_CN.UTF-8"
LC_MEASUREMENT="zh_CN.UTF-8"
LC_IDENTIFICATION="zh_CN.UTF-8"
LC_ALL=zh_CN.UTF-8
$
$ #
$ # 有个国人大佬fork
```

## 安装 EmuELEC 游戏插件

[EmuELEC](https://github.com/EmuELEC/EmuELEC) 是基于 CoreELEC，删除了 Kodi，集成了 [RetroArch](https://github.com/libretro/RetroArch) 和 [EmulationStation](https://github.com/batocera-linux/batocera-emulationstation)，可以玩很多游戏模拟器。

也可以在 CoreELEC 基础上安装 EmuELEC，这样既可以玩游戏，又可以看电视。

[EmuELEC 插件](https://github.com/EmuELEC/EmuELEC-Addon)官方不维护了，最新的 3.6 版本在目前的 CoreELEC 上不能用，因为需要 python2，但 Kodi19 是用的 python3。

有个国人大佬 fork 了这个插件库并继续在维护（[地址](https://github.com/maskedeken/EmuELEC-Addon)），在目前最新的 CoreELEC 上可以用。

安装好插件后，删除软链接`~/roms`，重新建为空目录，`~/roms`里面创建`gba/`等 rom 文件夹。

### EmuELEC 游戏列表改中文字体

如果游戏是中文，那 EmuELEC 里的游戏列表就会出现乱码，需要下载中文字体，放到指定位置：

```terminal
$ cd ~/.emulationstation/themes/simple-dark # 系统自带的仅有一个simple-dark主题
$ cat simple-dark.xml
...
<textlist name="gamelist">
  <selectorColor>151515</selectorColor>
  <selectedColor>0098a6</selectedColor>
  <primaryColor>ebebeb</primaryColor>
  <secondaryColor>ebebeb</secondaryColor>
  <fontPath>./art/Roboto-Regular.ttf</fontPath> # 这里可以看到用的哪里的字体，用中文字体替换它
  <fontSize>0.03</fontSize>
        <scrollSound>./art/scroll.wav</scrollSound>
  <forceUppercase>1</forceUppercase>
</textlist>
...
```

## 使用 IPTV 插件

Kodi 安装**IPTV Simple Client**插件后，进插件点设置，使用大佬通过抓包维护的仓库（[地址](https://github.com/qwerttvv/Beijing-IPTV)）里的组播地址，然后就可以在 Kodi 主页看电视了。

> 可以用电脑上的 **VLC** 测试光猫哪个口可以看 IPTV

### 组播改单播

主路由通过 docker 安装`udpxy`代理：

```yaml
version: '3'
services:
  udpxy:
    container_name: udpxy
    image: agrrh/udpxy:latest
    network_mode: host
    restart: always
    command: -T -a enp4s0 -p 4022 -m enp3s0 # enp4s0 是lan口，enp3s0 是wan口
```

然后用上面大佬提供的单播地址，将内容里的`192.xxx`替换为主路由的`udpxy`代理地址。然后配置到 Kodi IPTV 插件里即可。