#!/bin/bash
start=$(date +%s)
stage='webedm_test'

hazel_tag="waimao-test1"
if [ -n "$1" ]; then
  hazel_tag=$1;
  echo "change hazel_tag $1-$hazel_tag"
fi

# if [ -n "$1" ]; then
#   stage=$1;
#   echo "change stage $1-$stage"
# fi
remark='wm'
# remark=$(git rev-parse --abbrev-ref HEAD)
# if [ -n "$3" ]; then
#   remark="$remark-$3";
#   echo "change remark $3-$remark"
# fi
operation="build-upload"
# if [ -n "$2" ]; then
#   operation=$2;
#   echo "change remark $2-$operation"
# fi

function exitWithError {
  exit 1
}

commitSha=$(git rev-parse --verify HEAD)
curDate=$(date "+%Y-%m-%d")
version=$(grep -Eo "\"version\"\s*:\s*\".*\"" ./packages/electron/package.json | grep -Eo "[0-9.]+")
mkdir -p "../originDist/$curDate-$remark"
echo "--------------------stage prepare:--------------------"
yarn install   --registry http://rnpm.hz.netease.com || exitWithError
echo "--------------------stage build:--------------------"
if [[ "$operation" =~ ^.*build.*$ ]]; then
  yarn clean || exitWithError
  yarn workspace env_def build "$stage" web || exitWithError
  yarn workspace api build || exitWithError
  yarn workspace web-entry-wm build || exitWithError
  mkdir -p packages/web-entry-wm/public/nginx-conf
  cp -r server-conf/nginx-"$stage"-conf/* packages/web-entry-wm/public/nginx-conf || exitWithError
  cd packages/web-entry-wm/public/ || exitWithError
  echo "will package all resource $stage $version"
  tar -cvf sirius-desktop-web.tar ./* || exitWithError
  # cp sirius-desktop-web.tar "../../../../originDist/$curDate-$remark/"
fi
echo "finished web build success! $stage"
buildEnd=$(date +%s)
if [[ "$operation" =~ ^.*upload.*$ ]]; then
  cd ../../../
  rm -rf dist || exitWithError
  mv ./packages/web-entry-wm/public/ ./dist/ || exitWithError
  npx hazel-cli upload sirius-desktop-web -t dist --upload-url="https://artifact.lx.netease.com/api/pub/artifact/upload" --projectId=58918 --tag $hazel_tag
fi
echo "upload finish $version-$remark"

end=$(date +%s)
buildTake=$(( buildEnd - start ))
uploadTake=$(( end - buildEnd ))
totalTake=$(( end - start))
echo "打包用时： $buildTake 秒"
echo "上传用时： $uploadTake 秒"
echo "总用时： $totalTake 秒"
