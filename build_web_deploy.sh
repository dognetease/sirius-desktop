#!/bin/bash
start=$(date +%s)
stage='test'
if [ -n "$1" ]; then
  stage=$1;
  echo "change stage $1-$stage"
fi
remark=$(git rev-parse --abbrev-ref HEAD)
if [ -n "$3" ]; then
  remark="$remark-$3";
  echo "change remark $3-$remark"
fi
operation="build-upload"
if [ -n "$2" ]; then
  operation=$2;
  echo "change remark $2-$operation"
fi

function exitWithError {
  exit 1
}

commitSha=$(git rev-parse --verify HEAD)
curDate=$(date "+%Y-%m-%d")
version=$(grep -Eo "\"version\"\s*:\s*\".*\"" ./packages/electron/package.json | grep -Eo "[0-9.]+")
mkdir -p "../originDist/$curDate-$remark"
echo "--------------------stage prepare:--------------------"
startInstall=$(date +%s)
yarn install
endInstall=$(date +%s)
installTotalTake=$(( endInstall - startInstall))
echo "--------------------stage build:--------------------"
if [[ "$operation" =~ ^.*build.*$ ]]; then
  startBuild=$(date +%s)
  yarn clean || exitWithError
  yarn workspace env_def build "$stage" web || exitWithError
  export NODE_OPTIONS=--max-old-space-size=8192
  yarn build:web || exitWithError
  mkdir -p packages/web/public/nginx-conf
  cp -r server-conf/nginx-"$stage"-conf/* packages/web/public/nginx-conf
  cd packages/web/public/
  echo "will package all resource $stage $version"
  tar -cvf sirius-desktop-web.tar ./* || exitWithError
  cp sirius-desktop-web.tar "../../../originDist/$curDate-$remark/"
  endBuild=$(date +%s)
  buildTotalTake=$(( endBuild - startBuild))
fi
echo "finished web build success! $stage"

if [[ "$operation" =~ ^.*upload.*$ ]]; then
  startUpload=$(date +%s)
  url="http://artifact.lx.netease.com/api/pub/artifact/upload?appCode=sirius-desktop-web&commitSha=$commitSha&commitUser=shisheng@office.163.com&env=$stage-web&fileName=sirius-desktop-web.tar&version=$version&commitMessage=$remark"
  echo "upload with url : $url"
  curl -XPOST --fail -F "file=@sirius-desktop-web.tar" "$url"
  endUpload=$(date +%s)
  uploadTotalTake=$(( endUpload - startUpload))
fi
echo "upload finish $version-$remark"

end=$(date +%s)
totalTake=$(( end - start))

echo "安装依赖：$installTotalTake 秒"
echo "Build-Web：$buildTotalTake 秒"
echo "Uplaod-Web：$uploadTotalTake 秒"
echo "总用时： $totalTake 秒"