#!/bin/bash
stage='test'
if [ -n "$1" ]; then
  stage=$1;
  echo "change stage $1-$stage"
fi
remark='wm'
# remark=$(git rev-parse --abbrev-ref HEAD)
if [ -n "$3" ]; then
  remark="$remark-$3";
  echo "change remark $3-$remark"
fi
operation="build-upload"
if [ -n "$2" ]; then
  operation=$2;
  echo "change remark $2-$operation"
fi
commitSha=$(git rev-parse --verify HEAD)
curDate=$(date "+%Y-%m-%d")
version=$(grep -Eo "\"version\"\s*:\s*\".*\"" ./packages/electron/package.json | grep -Eo "[0-9.]+")
mkdir -p "../originDist/$curDate-$remark"
echo "--------------------stage prepare:--------------------"
yarn install
echo "--------------------stage build:--------------------"
if [[ "$operation" =~ ^.*build.*$ ]]; then
  yarn clean
  yarn workspace env_def build "$stage" web
  yarn workspace api build
  export NODE_OPTIONS=--max-old-space-size=8192
  yarn workspace web-entry-ff build
  mkdir -p packages/web-entry-ff/public/nginx-conf
  cp -r server-conf/nginx-"$stage"-conf/* packages/web-entry-ff/public/nginx-conf
  cd packages/web-entry-ff/public/ || exit
  echo "will package all resource $stage $version"
  tar -cvf sirius-desktop-web.tar ./*
  # cp sirius-desktop-web.tar "../../../../originDist/$curDate-$remark/"
fi
echo "finished web build success! $stage"

if [[ "$operation" =~ ^.*upload.*$ ]]; then
  url="http://artifact.lx.netease.com/api/pub/artifact/upload?appCode=sirius-desktop-web&commitSha=$commitSha&commitUser=shisheng@office.163.com&env=$stage-web&fileName=sirius-desktop-web.tar&version=$version&commitMessage=$remark"
  echo "upload with url : $url"
  curl -XPOST --fail -F "file=@sirius-desktop-web.tar" "$url"
fi
echo "upload finish $version-$remark"
