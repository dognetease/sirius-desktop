#!/bin/bash

# startTimeS=`date +%s`
# yarn workspace env_def build local web
# endTimeS=`date +%s`
# totalTimeS=$[ endTimeS - startTimeS ];
# echo "build local web: $totalTimeS"

# startTimeS=`date +%s`
# yarn workspace api build
# endTimeS=`date +%s`
# totalTimeS=$[ endTimeS - startTimeS ];
# echo "api build: $totalTimeS"

# startTimeS=`date +%s`
# yarn workspace web makeInstall
# endTimeS=`date +%s`
# totalTimeS=$[ endTimeS - startTimeS ];
# echo "makeInstall: $totalTimeS"

startTimeS=`date +%s`
echo "startTimeS is $startTimeS" > one.txt
yarn workspace web dev
endTimeS=`date +%s`
totalTimeS=$[ endTimeS - startTimeS ];
echo "web dev: $totalTimeS"