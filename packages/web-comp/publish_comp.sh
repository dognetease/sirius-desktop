#!/bin/bash

set -e

cd ./publish/comp

npm version patch

npm version patch

cd ../../

rm -rf comp-dist

yarn build-comp

cp ./publish/comp/package.json ./comp-dist

cp ./publish/comp/README.md ./comp-dist

cd ./comp-dist

mv index-comp.d.ts index.d.ts

# alias nenpm='cnpm --registry=http://rnpm.hz.netease.com/ --registryweb=http://npm.hz.netease.com/ --cache=$HOME/.nenpm/.cache --userconfig=$HOME/.nenpmrc'

# nenpm publish
