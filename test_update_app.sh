      fname = 'snapshot-umd.js'
      url="http://storage.lx.netease.com/api/pub/file/upload?bizCode=lxbg-df1788e"
      echo "upload $fname with url :"
      echo "$url"
      ret=$(curl -XPOST --fail -F "file=${fname}" "$url" | grep -Eo "\"https:[^\\\"]+\"" )
      echo "finish release ${fname} for url:"
      echo "$url"

#   stage='update';
#   os='win';
#   # stage='prod'
#   version=$(grep -Eo "\"version\"\s*:\s*\".*\"" ./packages/electron/package.json | grep -Eo "[0-9.]+")
#   declare -a name=("sirius-desktop-win-ia32-$version.exe")
#   # declare -a name=("sirius-desktop-win-x64-$version.exe")
#   # declare -a name=("sirius-desktop-mac-arm64-$version.dmg"  "sirius-desktop-mac-arm64-$version.zip")
#   # declare -a name=("sirius-desktop-mac-x64-$version.dmg"  "sirius-desktop-mac-x64-$version.zip")
#   # declare -a name=("sirius-desktop-mac-x64-$version.dmg"  "sirius-desktop-mac-x64-$version.zip" "sirius-desktop-mac-arm64-$version.dmg"  "sirius-desktop-mac-arm64-$version.zip")


#   for fname in "${name[@]}"; do
#     if [[ -f "releases-${stage}/${fname}" ]]; then
#       platform=$(echo "$fname" | grep -Eo "(exe)|(dmg)")
#       url="http://storage.lx.netease.com/api/pub/file/upload?bizCode=lxbg-df1788e"
#       echo "upload $fname with url :"
#       echo "$url"
#       ret=$(curl -XPOST --fail -F "file=@releases-${stage}/${fname}" "$url" | grep -Eo "\"https:[^\\\"]+\"" )
#       echo "finish release releases-${stage}/${fname} for url:"
#       if [[ $os = 'mac' || $stage = 'update' ]]; then
#          node ./packages/electron/build-utils/update-yaml-file.js "${fname}" "$ret"
#       fi
#       echo "$ret"
#     fi
#   done

# if [[ $os = 'mac' || $stage = 'update' ]]; then
#   node ./packages/electron/build-utils/nginx-generate.js
# fi