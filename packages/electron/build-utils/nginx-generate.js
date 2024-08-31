/**
 * 主要是上传yaml文件，然后生成nginx配置
 */
const fs = require('fs');
const path = require('path');
const constant = require('./const');
const jsYAML = require('js-yaml');
const utils = require('./utils');
const packInfo = require('./../package.json');

const currentVersion = packInfo.version;

/**
 * 获取AllBuilInfo信息
 * @returns
 */
function getAllBuilInfo() {
  const allBuildFilePath = utils.getAllBuildInfoFilePath();
  if (!fs.existsSync(allBuildFilePath)) {
    throw new Error(`allBuildFilePath '${allBuildFilePath}' not exist`);
  }

  let allBuildInfo = JSON.parse(fs.readFileSync(allBuildFilePath).toString());
  return allBuildInfo;
}

/**
 *
 * @param {string} YMLFilePath
 * @returns {string}
 */
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

/**
 *
 * @param {object} allBuildInfo
 */
function getNginxConfigByAllBuildInfo(allBuildInfo) {
  if (!allBuildInfo) {
    throw new Error(`allBuildInfo is null or empty!`);
  }
  let nginxContent = ``;

  Object.keys(allBuildInfo).forEach(key => {
    let buildInfo = allBuildInfo[key];
    let buildInfoVersion = buildInfo.version;
    if (buildInfoVersion !== currentVersion) {
      console.warn(`buildInfoVersion:${buildInfoVersion} not equal to ${currentVersion}. Ignore.`);
      return;
    }
    const ymlFileName = utils.getYMLFileNameByPlatform(buildInfo.platform);

    nginxContent += `
      location = /update-app/${buildInfo.platform}-${buildInfo.arch}-${buildInfo.version}/${ymlFileName} {
        rewrite ^ ${buildInfo.YMLCDNUrl} redirect;
      }
    `;
  });

  return nginxContent;
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
  console.log(`nginx-generate start...`);

  const allBuildInfo = getAllBuilInfo();

  uploadYMLFilesByAllBuildInfo(allBuildInfo);

  const nginxConfigFileContent = getNginxConfigByAllBuildInfo(allBuildInfo);
  const nginxDestDir = path.resolve(__dirname, constant.nginxConfigDir);
  utils.ensureDirExist(nginxDestDir);
  const nginxFilePath = path.resolve(nginxDestDir, constant.nginxConfigFileName);

  fs.writeFileSync(nginxFilePath, nginxConfigFileContent);

  console.log(`Nginx config file: ${nginxFilePath}`);
  console.log(`Please open it and copy it to server nginx config`);

  console.log(`-`.repeat(40));
}

main();
