const fs = require('fs');
const jsYAML = require('js-yaml');
const envConfig = require('env_def').config;

const ymlServerUtils = require('./yml-server-utils');
const utils = require('./utils');
const packInfo = require('../package.json');
const isEdm = envConfig('profile').includes('edm');
const constant = require('./const');

const currentVersion = isEdm ? packInfo.edmVersion : packInfo.version;

function uploadYMLFile(YMLFilePath) {
  console.log(`upload ${YMLFilePath}`);
  const childProcess = require('child_process');

  const cmd = `curl -XPOST --silent -F "file=@${YMLFilePath}" http://storage.lx.netease.com/api/pub/file/upload?bizCode=lxbg-df1788e`;
  const uploadResultStr = childProcess.execSync(cmd).toString();
  const uploadInfo = JSON.parse(uploadResultStr);

  console.log(`upload result: `, uploadInfo);
  if (!uploadInfo.success) {
    throw new Error(`upload YMLFileError`);
  }
  return uploadInfo.data;
}

function checkYMLFile(filePath) {
  if (!filePath || !fs.existsSync(filePath)) {
    throw new Error(`ymlFilePath is null or empty or not exist`);
  }
  const yamlInfo = jsYAML.load(fs.readFileSync(filePath, { encoding: 'utf-8' }).toString());

  let files = yamlInfo.files;
  let localFileUrl = files.find(file => {
    return !file.url.includes(constant.CDNBaseUrl);
  });

  if (localFileUrl) {
    console.warn(`Local url '${localFileUrl.url}' existed please repalce it with cdn url!`);
    return false;
  }
  return true;
}

function uploadYMLFilesByAllBuildInfo(allBuildInfo) {
  if (!allBuildInfo) {
    throw new Error(`AllBuildInfo is null or empty`);
  }

  Object.keys(allBuildInfo).forEach(buileKey => {
    const currentBuildInfo = allBuildInfo[buileKey];
    let buildInfoVersion = currentBuildInfo.version;
    if (buildInfoVersion !== currentVersion) {
      console.warn(`buildInfoVersion:${buildInfoVersion} not equal to ${currentVersion}. Ignore.`);
      return;
    }

    if (checkYMLFile(currentBuildInfo.YMLFilePath)) {
      const YMLCDNUrl = uploadYMLFile(currentBuildInfo.YMLFilePath);
      //更新YMLCDNFile地址
      currentBuildInfo.YMLCDNUrl = YMLCDNUrl;
    }
  });

  let allBuildInfoFilePath = utils.getAllBuildInfoFilePath();
  fs.writeFileSync(allBuildInfoFilePath, JSON.stringify(allBuildInfo));
  console.log(`update allBuildInfo to '${allBuildInfoFilePath}'`);
}

function main() {
  console.log(`-`.repeat(40));
  console.log(`upload yml to server start...`);
  const shouldUploadYml = ymlServerUtils.getShouldUploadYml();
  if (!shouldUploadYml) return;

  const allBuildInfo = ymlServerUtils.getAllBuilInfo();
  uploadYMLFilesByAllBuildInfo(allBuildInfo);

  ymlServerUtils.uploadYmlToServerByAllBuildInfoAsync(allBuildInfo, false).then(resArr => {
    const uploadResArr = resArr || [];
    ymlServerUtils.showUploadResultInfos(uploadResArr, false);
  });

  console.log(`Upload yml to server successfully`);
  console.log(`-`.repeat(40));
}

main();
