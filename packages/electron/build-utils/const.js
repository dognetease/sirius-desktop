const archNumToString = {
  0: 'ia32',
  1: 'x64',
  3: 'arm64',
};

const platformToYMLFileName = {
  mac: 'latest-mac.yml',
  win: 'latest.yml',
};

const infoFileName = 'build-info.json';
const infoFilePath = '.temp';
const YMLFileBasePath = '.temp/versions';
const AllBuildInfoDir = '.temp';
const ALLBuildInfoFileName = 'all-build-info.json';
const nginxConfigDir = '.temp';
const nginxConfigFileName = 'nginx-version.conf';
const serverBaseUrl = 'https://sirius-desktop-web-pre.lx.netease.com/';
const CDNBaseUrl = 'https://cowork-storage-public-cdn.lx.netease.com/lxbg/';

module.exports = {
  archNumToString,
  infoFileName,
  infoFilePath,
  YMLFileBasePath,
  AllBuildInfoDir,
  ALLBuildInfoFileName,
  nginxConfigDir,
  nginxConfigFileName,
  platformToYMLFileName,
  serverBaseUrl,
  CDNBaseUrl,
};
