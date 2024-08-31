const fs = require('fs');
const path = require('path');
const constant = require('./const');

function getBuildInfoDirPath() {
  return path.resolve(__dirname, constant.infoFilePath);
}

function getBuildInfoFilePath() {
  return path.resolve(getBuildInfoDirPath(), constant.infoFileName);
}

/**
 *
 * @param {string} platform
 * @returns {string}
 */
function getYMLFileNameByPlatform(platform) {
  return constant.platformToYMLFileName[platform];
}

/**
 *
 * @param {*} buildInfo
 */
function getYMLDirPathByBuildInfo(buildInfo) {
  const { platform, arch, version } = buildInfo;
  const YMLDirPath = path.resolve(__dirname, constant.YMLFileBasePath, `${platform}-${arch}-${version}`);
  return YMLDirPath;
}

/**
 *
 * @param {*} buildInfo
 */
function getYMLFilePathByBuildInfo(buildInfo) {
  const { platform } = buildInfo;
  const YMLDirPath = getYMLDirPathByBuildInfo(buildInfo);
  const YMLFileName = getYMLFileNameByPlatform(platform);
  return path.resolve(YMLDirPath, YMLFileName);
}

/**
 *
 * @param {string} dirPath
 */
function ensureDirExist(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 *
 */
function getAllBuildInfoDirPath() {
  let allBuildInfoFilePath = path.resolve(__dirname, constant.AllBuildInfoDir);
  return allBuildInfoFilePath;
}

function getAllBuildInfoFilePath() {
  return path.resolve(getAllBuildInfoDirPath(), constant.ALLBuildInfoFileName);
}

module.exports = {
  getBuildInfoFilePath,
  getBuildInfoDirPath,
  getYMLFileNameByPlatform,
  getYMLFilePathByBuildInfo,
  getYMLDirPathByBuildInfo,
  ensureDirExist,
  getAllBuildInfoDirPath,
  getAllBuildInfoFilePath,
};
