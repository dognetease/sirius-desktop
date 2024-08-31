const ymlServerUtils = require('./yml-server-utils');

function main() {
  console.log(`-`.repeat(40));
  console.log(`force upload yml to server start...`);
  const shouldUploadYml = ymlServerUtils.getShouldUploadYml();
  if (!shouldUploadYml) return;
  const allBuildInfo = ymlServerUtils.getAllBuilInfo();
  ymlServerUtils.uploadYmlToServerByAllBuildInfoAsync(allBuildInfo, true).then(resArr => {
    const uploadResArr = resArr || [];
    ymlServerUtils.showUploadResultInfos(uploadResArr, true);
  });
  console.log(`force upload yml to server end...`);
  console.log(`-`.repeat(40));
}

main();
