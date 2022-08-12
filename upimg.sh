#!/bin/bash

# https://github.com/jcsalterego/pngpaste
# brew install pngpaste
set -e
cd /Users/bytedance/workplace/images/
git pull
name=$1$(date +"%Y%m%d%H%M%S").jpg
pngpaste - >>/dev/null # 判断是否有图片
pngpaste - >$name

git add $name
git commit -m "upload $name"
git push

url=https://cdn.jsdelivr.net/gh/Urie96/images/$name
echo ""
echo $url
echo $url | pbcopy