#!/bin/bash

rm -f .build-result.txt

start=$(date +%s)

stage='test'
if [ -n "$1" ]; then
  stage=$1
  echo "change stage $1-$stage"
fi
os="win mac"
if [ -n "$2" ]; then
  os=$2
  echo "change os list $2-$os"
fi
operation="build-upload"
if [ -n "$3" ]; then
  operation=$3
  echo "change remark $3-$operation"
fi
remark=$(git rev-parse --abbrev-ref HEAD)
if [ -n "$4" ]; then
  remark="$remark-$4"
  echo "change remark $4-$remark"
fi
commitSha=$(git rev-parse --verify HEAD)
curDate=$(date "+%Y-%m-%d")

version=$(grep -Eo "\"version\"\s*:\s*\".*\"" ./packages/electron/package.json | grep -Eo "[0-9.]+")
edmVersion=$(grep -Eo "\"edmVersion\"\s*:\s*\".*\"" ./packages/electron/package.json | grep -Eo "[0-9.]+")
if  [[ "$1" =~ ^edm.* ]];
then
   version=$edmVersion
fi
echo "got version :$version"

function exitWithError {
  exit 1
}

mkdir -p "../originDist/$curDate-$remark"
mkdir -p "./releases-${stage}"
declare -a oses=($os)
# auto-update on mac need zip file
declare -a namesuffix=("?download=lingxi_mac_x64_$version.dmg" "" "?download=lingxi_mac_arm64_$version.dmg" "" "?download=lingxi_win_x64_$version.exe" "?download=lingxi_win_ia32_$version.exe" )
if  [[ "$1" =~ ^edm.* ]];
then
   namesuffix=("?download=waimaotong_mac_x64_$version.dmg" "" "?download=waimaotong_mac_arm64_$version.dmg" "" "?download=waimaotong_win_x64_$version.exe" "?download=waimaotong_win_ia32_$version.exe" )
fi
declare -a name=("sirius-desktop-mac-x64-$version.dmg" "sirius-desktop-mac-x64-$version.zip" "sirius-desktop-mac-arm64-$version.dmg" "sirius-desktop-mac-arm64-$version.zip" "sirius-desktop-win-x64-$version.exe" "sirius-desktop-win-ia32-$version.exe")
declare -a updatenames=("sirius-desktop-win-x64-$version.exe" "sirius-desktop-win-ia32-$version.exe")
declare -a uploadnames=("sirius-desktop-mac-x64-$version.dmg" "sirius-desktop-mac-arm64-$version.dmg" "sirius-desktop-win-x64-$version.exe" "sirius-desktop-win-ia32-$version.exe")
arrLen=${#oses[@]}
echo "--------------------stage clean:--------------------"
if [[ "$operation" =~ ^.*clean.*$ ]]; then
  for fname in "${name[@]}"; do
    echo "upload name:releases-${stage}/${fname}"
    if [[ -f "releases-${stage}/${fname}" ]]; then
      cp -f "releases-$stage/$fname" "../originDist/$curDate-$remark/"
    fi
  done
  rm -rf "releases-${stage}/"
  rm -rf "releases-update"
  echo "finish clean ${stage} folder"
fi
echo "--------------------stage prepare:--------------------"
startinstall=$(date +%s)
yarn install  || exitWithError
endinstall=$(date +%s)
installTotalTake=$(( endinstall - startinstall))
echo "------------------delete electron build-utils/.temp folder---------"
yarn workspace sirius-desktop delete:temp
echo "--------------------stage build:--------------------"
if [[ "$operation" =~ ^.*build.*$ ]]; then
   startWeb=$(date +%s)
   echo "-prepare for build web"
   yarn clean || exitWithError
   yarn workspace env_def build "$stage" win || exitWithError
   yarn build:web || exit
  endWeb=$(date +%s)
   webTotalTake=$(( endWeb - startWeb))
   yarn workspace sirius-desktop compile || exitWithError

  for ((i = 0; i < arrLen; i++)); do
    platform="${oses[$i]}"
    if [ "$platform" = "win" ]; then
      echo "build win app"
      startWin=$(date +%s)
      yarn workspace sirius-desktop electron:buildWin || exitWithError
      endWin=$(date +%s)
      winTotalTake=$(( endWin - startWin))
    fi
    if [ "$platform" = "win32" ]; then
      startWinT=$(date +%s)
      echo "build win32 app"
      yarn workspace sirius-desktop electron:buildWin32 || exitWithError
      endWinT=$(date +%s)
      win32TotalTake=$(( endWinT - startWinT))
    fi
    if [ "$platform" = "mac" ]; then
      startMac=$(date +%s)
      echo "build mac app"
      yarn workspace sirius-desktop electron:buildMac || exitWithError
      endMac=$(date +%s)
      macTotalTake=$(( endMac - startMac))
    fi
    echo "finished build ${stage}-$platform success! "
  done
fi
echo "--------------------stage upload:--------------------"
if [[ "$operation" =~ ^.*upload.*$ ]]; then
  startUpload=$(date +%s)
  for fname in "${uploadnames[@]}"; do
    if [[ -f "releases-${stage}/${fname}" ]]; then
      platform=$(echo "$fname" | grep -Eo "(exe)|(dmg)")
      url="http://artifact.lx.netease.com/api/pub/artifact/upload?appCode=sirius-desktop-web&commitSha=$commitSha&commitUser=shisheng@office.163.com&env=$stage-$platform&fileName=$fname&version=$version&commitMessage=$remark"
      echo "upload $fname with url :"
      echo "$url"
      curl -XPOST --fail -F "file=@releases-${stage}/${fname}" "$url"
      echo "finish upload releases-${stage}/${fname}"
    fi
  done
  endUpload=$(date +%s)
  uploadTotalTake=$(( endUpload - startUpload))
fi
echo "--------------------stage release:--------------------"
if [[ "$operation" =~ ^.*release.*$ ]]; then
  startRelease=$(date +%s)
  for ((i=0; i<=${#name[@]}; i++)) do
    fname=${name[i]}
    suffix=${namesuffix[i]}
    if [[ -f "releases-${stage}/${fname}" ]]; then
      platform=$(echo "$fname" | grep -Eo "(exe)|(dmg)")
      url="http://storage.lx.netease.com/api/pub/file/upload?bizCode=lxbg-df1788e"
      echo "upload $fname with url :"
      echo "$url"
      ret=$(curl -XPOST --fail -F "file=@releases-${stage}/${fname}" "$url" | grep -Eo "\"https:[^\\\"]+\"" | grep -Eo "https:[^\\\"]+")
      downloadurl=$ret$suffix
      echo "finish release releases-${stage}/${fname} for url:"
      echo "$downloadurl"
      echo "$downloadurl" >> .build-result.txt
      if [[ "$platform" != "exe" ]]; then
        node ./packages/electron/build-utils/update-yaml-file.js "${fname}" "$ret"
      fi
    fi
  done
  endRelease=$(date +%s)
  releaseTotalTake=$(( endRelease - startRelease))
fi
echo "-------------------stage relasese window update package:-------------"
if [[ "$operation" =~ ^.*release.*$ ]]; then
  startReleaseUpdate=$(date +%s)
  for fname in "${updatenames[@]}"; do
    if [[ -f "releases-update/${fname}" ]]; then
      platform=$(echo "$fname" | grep -Eo "(exe)|(dmg)")
      url="http://storage.lx.netease.com/api/pub/file/upload?bizCode=lxbg-df1788e"
      echo "upload update package $fname with url :"
      echo "$url"
      ret=$(curl -XPOST --fail -F "file=@releases-update/${fname}" "$url" | grep -Eo "\"https:[^\\\"]+\"" )
      echo "$ret"
      echo "finish release releases-update/${fname} for url:"
      node ./packages/electron/build-utils/update-yaml-file.js "${fname}" "$ret"
    fi
  done
  endReleaseUpdate=$(date +%s)
  releaseUpdateTotalTake=$(( endReleaseUpdate - startReleaseUpdate))
fi

echo "---------------------nginx conf generate:--------------"
if [[ "$operation" =~ ^.*release.*$ ]]; then
  #  node ./packages/electron/build-utils/nginx-generate.js
   node ./packages/electron/build-utils/upload-yml-to-server.js
fi

if [[ "$operation" =~ ^.*release.*$ ]]; then
   cat .build-result.txt
fi

echo "------------------"

end=$(date +%s)
totalTake=$(( end - start))
echo "安装依赖：$installTotalTake 秒"
echo "Build页面：$webTotalTake 秒"
echo "Build-Win: $winTotalTake 秒"
echo "Build-Win32: $win32TotalTake 秒"
echo "Build-Mac: $macTotalTake 秒"
echo "Upload: $uploadTotalTake 秒"
echo "Release: $releaseTotalTake 秒"
echo "Release-Update: $releaseUpdateTotalTake 秒"
echo "总用时： $totalTake 秒"


