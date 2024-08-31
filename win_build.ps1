echo 'clean cache';
rm -r -fo packages/*/dist; 
rm -r -fo node_modules/.cache; 
rm -r -fo packages/*/node_modules/.cache; 
rm -r -fo packages/electron*/releases-*/*;
yarn workspace web clean; 
yarn workspace sirius-desktop clean;

echo 'build env_def';
yarn workspace env_def build prod win;
echo 'winBuild:web';
yarn winBuild:web;
echo 'sirius-desktop:compile';
yarn workspace sirius-desktop compile;
echo 'sirius-desktop:buildMsi';
yarn workspace sirius-desktop electron:buildMsiOnly;
