yarn build:test:web
echo "finished build success! "
mkdir packages/web/public/nginx-conf
cp -r nginx-test-conf/* packages/web/public/nginx-conf
cd packages/web/public/ || exit
curDate=$(date "+%Y-%m-%d")
commitSha=$(git rev-parse --verify HEAD)
echo "will package all resource"
tar -cvf sirius-desktop-web.tar ./*
cp sirius-desktop-web.tar ../../../originDist/sirius-desktop-web-$curDate.tar
curl -XPOST --fail -F "file=@sirius-desktop-web.tar" "http://artifact.lx.netease.com/api/pub/artifact/upload?appCode=sirius-desktop-web&commitSha=$commitSha&commitUser=shisheng@office.163.com"