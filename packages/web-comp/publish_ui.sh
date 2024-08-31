#!/bin/bash

set -e

cd ./publish/ui

npm version patch

npm version patch

cd ../../

rm -rf ui-dist

yarn build-ui

cp ./publish/ui/package.json ./ui-dist

cp ./publish/ui/README.md ./ui-dist

cd ./ui-dist

mv SiriusDrawer-ui SiriusDrawer

mv SiriusModal-ui SiriusModal

mv index-ui.d.ts index.d.ts

# alias nenpm='cnpm --registry=http://rnpm.hz.netease.com/ --registryweb=http://npm.hz.netease.com/ --cache=$HOME/.nenpm/.cache --userconfig=$HOME/.nenpmrc'

# nenpm publish
