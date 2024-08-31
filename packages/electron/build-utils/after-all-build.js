/**
 * 将当前构建的yml文件转存到.temp/versions/${platform}-${arch}-${version}/latest.yml
 * 将当前构建的信息添加到.temp/all-build-info.json文件中
 */
const path = require('path');
const fs = require('fs');
const conf = require('env_def');
const constant = require('./const');
const utils = require('./utils');

/**
 *
 * @param {string[]} artifactPaths
 * @returns {{ platform: string, arch: string, version: string }}
 */
function getBuildInfo() {
  const buildInfoFile = utils.getBuildInfoFilePath();
  if (!fs.existsSync) {
    throw new Error(`BuildInfoFile "${buildInfoFile}" not exist!`);
  }
  const fileContentStr = fs.readFileSync(buildInfoFile).toString();
  const buildInfo = JSON.parse(fileContentStr);
  return buildInfo;
}

/**
 *
 * @param {string} platform
 * @param {string} arch
 */
function copyYMLFile(outDir, buildInfo) {
  const { platform } = buildInfo;
  const ymlFileName = constant.platformToYMLFileName[platform];
  const YMLSourceFilePath = path.resolve(outDir, ymlFileName);
  if (!fs.existsSync(YMLSourceFilePath)) {
    console.warn(`ymlFile(${YMLSourceFilePath}) not found`);
    return;
    throw new Error(`ymlFile(${YMLSourceFilePath}) not found`);
  }

  const destPath = utils.getYMLDirPathByBuildInfo(buildInfo);
  utils.ensureDirExist(destPath);

  const destYMLFilePath = path.resolve(destPath, ymlFileName);
  console.log(`copy ${YMLSourceFilePath} to ${destYMLFilePath}`);
  fs.copyFileSync(YMLSourceFilePath, destYMLFilePath);
  return destYMLFilePath;
}

/**
 *
 * @param {object} buildInfo
 * @param {string} YMLCDNUrl
 */
function addInfoToAllBuildInfoFile(buildInfo, YMLFilePath) {
  let allBuildInfo = {};

  const allBuildInfoDirPath = utils.getAllBuildInfoDirPath();
  utils.ensureDirExist(allBuildInfoDirPath);

  const allBuildInfoFilePath = utils.getAllBuildInfoFilePath();
  if (fs.existsSync(allBuildInfoFilePath)) {
    allBuildInfo = JSON.parse(fs.readFileSync(allBuildInfoFilePath).toString());
  }

  const { platform, arch, version } = buildInfo;
  const buildInfoKey = `${platform}-${arch}-${version}`;
  allBuildInfo[buildInfoKey] = {
    platform,
    arch,
    version,
    YMLFilePath,
  };

  fs.writeFileSync(allBuildInfoFilePath, JSON.stringify(allBuildInfo));
  console.log(`Write allBuildInfo to ${allBuildInfoFilePath}.`);
}

function main() {
  console.log('-'.repeat(40));
  console.log('after-all-build start....');

  const buildInfo = getBuildInfo();
  console.log('BuildInfo:', buildInfo);

  const { outDir } = buildInfo;
  const destYMLFilePath = copyYMLFile(outDir, buildInfo);

  addInfoToAllBuildInfoFile(buildInfo, destYMLFilePath);

  console.log('after-all-build end....');
  console.log('-'.repeat(40));
}

if (conf.config('stage') === 'prod') {
  main();
}
