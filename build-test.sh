# startWinT=$(date +%s)
# echo "build win32 app"
# yarn workspace web-entry-wm buildOnly
# endWinT=$(date +%s)
# win32TotalTake=$(( endWinT - startWinT))
# echo "Build-Win32: $win32TotalTake 秒"
stage=${1:-"test"}


if [ -z "$2" ]; then
  env=$stage
else
  env="edm_$stage"
fi
yarn workspace web clean
echo "执行命令：yarn workspace env_def build $env mac && yarn build:web"
startWeb=$(date +%s)
yarn workspace env_def build "$env" mac && yarn build:web
endWeb=$(date +%s)
webTotalTake=$(( endWeb - startWeb))
echo "Build-Web: $webTotalTake 秒"
