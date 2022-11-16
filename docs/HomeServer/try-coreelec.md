---
title: try-coreelec
date: 2022-11-12 10:25:00 GMT+0800
categories: [家庭服务]
tags: [CoreELEC]
status: WIP
---

```zsh
$ installentware
Connecting to 192.168.1.7:10809 (192.168.1.7:10809)
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

Would you like to reboot now to finish installation (recommended) [y/N]? y
CoreELEC:~ # Connection to 192.168.1.2 closed by remote host.
Connection to 192.168.1.2 closed.
```
