#!/bin/bash
folder_path='packages'
if [ -n "$1" ]; then
  folder_path=$1;
  echo "change stage "$folder_path
fi
##yarn build:"$stage":web
#echo "finished build success! "$1"-"$stage
#mkdir -p packages/web/public/nginx-conf
#mkdir -p ../originDist
#cp -r nginx-test-conf/* packages/web/public/nginx-conf
#cd packages/web/public/ || exit
#curDate=$(date "+%Y-%m-%d")
#commitSha=$(git rev-parse --verify HEAD)
#echo "will package all resource"
#tar -cvf sirius-desktop-web.tar ./*
#cp -rf sirius-desktop-web.tar ../../../originDist/sirius-desktop-web-$curDate.tar
#curl -XPOST --fail -F "file=@sirius-desktop-web.tar" "http://artifact.lx.netease.com/api/pub/artifact/upload?appCode=sirius-desktop-web&commitSha=$commitSha&commitUser=shisheng@office.163.com"

if [ ! -d "$folder_path" ] || [ ! "$(ls -A $folder_path)" ]; then
    echo "文件夹存在且内部不为空"
else
    echo "文件夹不存在或内部为空"
fi
