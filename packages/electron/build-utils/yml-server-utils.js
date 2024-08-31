const httpApi = require('axios').create();
const envConfig = require('env_def').config;
const utils = require('./utils');
const profile = envConfig('profile');
const packInfo = require('./../package.json');
const fs = require('fs');
const isEdm = profile.includes('edm');
const appName = isEdm ? 'lingxibanggong-waimao' : 'lingxibangong';

const currentVersion = isEdm ? packInfo.edmVersion : packInfo.version;

const hostMap = {
  prev: 'https://sirius-test1.qiye.163.com/app-upgrade',
  prod: 'https://lingxi.office.163.com/app-upgrade',
  edm_prod: 'https://lingxi.office.163.com/app-upgrade',
};

function getHost() {
  return hostMap[profile];
}

function getYmlServerUrl({ appName, platform, arch, version }) {
  const map = {
    prod: 'https://lingxi.office.163.com',
    edm_prod: 'https://lingxi.office.163.com',
    prev: 'https://sirius-desktop-web-pre.lx.netease.com',
  };
  const host = map[profile];
  if (host) {
    return `${host}/app-upgrade/api/pub/client/update-app/${appName}/${platform}/${arch}/${version}`;
  }

  return ``;
}

function addCommonConfig() {
  httpApi.defaults.headers.common['app-key'] = 'sirius-app-update';
  httpApi.defaults.headers.common['app-secret'] = '006a2b7d98979511f8944682e0496dd0';
  httpApi.defaults.baseURL = getHost();
}

addCommonConfig();

function getIsExistInServer({ appName, platform, arch, version }) {
  if (!appName || !platform || !arch || !version) {
    return Promise.reject(new Error('arguments is null or empty'));
  }

  const defaultRes = {
    success: true,
    exist: false,
  };

  return httpApi
    .get(`/api/internal/version/update/yml/get`, {
      appName,
      platform,
      arch,
      version,
    })
    .then(res => {
      const versionData = res.data.data;
      if (versionData) {
        return {
          success: true,
          exist: true,
        };
      }
      return defaultRes;
    })
    .catch(err => {
      console.error('getIsExistInServer error', err);
      return Object.assign(defaultRes, {
        success: false,
        error: (err && err.message) || 'catch-error',
      });
    });
}

function _saveNewVersionToServer({ appName, platform, arch, version, force, ymlUrl }) {
  if (!appName || !platform || !arch || !version || !ymlUrl) {
    return Promise.reject(new Error('arguments is null or empty'));
  }

  const defaultRes = {
    success: false,
  };

  return httpApi
    .post('/api/internal/version/update/yml/save', {
      appName,
      platform,
      arch,
      version,
      force: !!force,
      ymlUrl,
    })
    .then(res => {
      const data = res.data.data;
      if (data) {
        return {
          success: true,
        };
      } else {
        return Object.assign(defaultRes, {
          exist: true,
        });
      }
    })
    .catch(err => {
      console.error(`_saveNewVersionToServer error`, err);
      return Object.assign(defaultRes, {
        success: false,
        error: (err && err.message) || 'catch-error',
      });
    });
}

function saveNewVersionToServer(info) {
  return _saveNewVersionToServer(info);
}

function saveNewVersionToServerForce(info) {
  return _saveNewVersionToServer(Object.assign(info, { force: true }));
}

function deleteVersionInServer({ appName, platform, arch, version }) {
  if (!appName || !platform || !arch || !version) {
    return Promise.reject(new Error('arguments is null or empty'));
  }

  const defaultRes = {
    success: false,
  };

  return httpApi
    .post('/api/internal/version/update/yml/del', {
      appName,
      platform,
      arch,
      version,
    })
    .then(res => {
      const data = res.data.data;
      if (data) {
        return {
          success: true,
        };
      }
      return defaultRes;
    })
    .catch(err => {
      console.error('deleteVersionInServer error', err);
      return Object.assign(defaultRes, {
        error: (err && err.message) || 'catch-error',
      });
    });
}

function isVersionMismatch(buildInfo) {
  if (buildInfo.version !== currentVersion) {
    return `Version mismatch. build version is ${buildInfo.version}, code version is ${currentVersion}`;
  }
  return '';
}

function getYmlInfoByBuildInfo(buildInfo) {
  const isWin32 = buildInfo.platform === 'win' && buildInfo.arch === 'ia32';
  return {
    appName,
    platform: isWin32 ? 'win32' : buildInfo.platform,
    arch: buildInfo.arch,
    version: buildInfo.version,
  };
}

function uploadYmlToServerByAllBuildInfoAsync(allBuildInfo, force) {
  if (!allBuildInfo) {
    return Promise.reject('allBuildInfo is null or empty!');
  }

  var uploadPromises = Object.keys(allBuildInfo).map(key => {
    const buildInfo = allBuildInfo[key];
    const misMatchErrorStr = isVersionMismatch(buildInfo);
    const ymlInfo = getYmlInfoByBuildInfo(buildInfo);
    if (misMatchErrorStr) {
      return Promise.resolve(
        Object.assign(ymlInfo, {
          success: false,
          ignore: true,
          ignoreReason: misMatchErrorStr,
        })
      );
    }
    ymlInfo.ymlUrl = buildInfo.YMLCDNUrl;
    if (!ymlInfo.ymlUrl) {
      return Promise.resolve(
        Object.assign(ymlInfo, {
          success: false,
          error: 'YMLCDNUrl is null or empty',
        })
      );
    }
    if (force) {
      return saveNewVersionToServerForce(ymlInfo).then(res => {
        return Object.assign(ymlInfo, res);
      });
    } else {
      return saveNewVersionToServer(ymlInfo).then(res => {
        return Object.assign(ymlInfo, res);
      });
    }
  });

  return Promise.all(uploadPromises);
}

function getAllBuilInfo() {
  const allBuildFilePath = utils.getAllBuildInfoFilePath();
  if (!fs.existsSync(allBuildFilePath)) {
    throw new Error(`allBuildFilePath '${allBuildFilePath}' not exist`);
  }

  let allBuildInfo = JSON.parse(fs.readFileSync(allBuildFilePath).toString());
  return allBuildInfo;
}

function showUploadResultInfos(uploadResArr, isForce) {
  const successArr = [];
  var failedArr = [];
  uploadResArr.forEach(uploadItem => {
    if (uploadItem) {
      if (uploadItem.success) {
        successArr.push(uploadItem);
      } else {
        failedArr.push(uploadItem);
      }
    }
  });
  if (failedArr && failedArr.length) {
    console.error(' '.repeat(20));
    console.error('Upload Yml to updater server Errors ' + '-'.repeat(20));
    console.error('Upload Yml to updater server Errors ' + '-'.repeat(20));
    console.error('Upload Yml to updater server Errors ' + '-'.repeat(20));
    failedArr.forEach(item => {
      console.error(
        `${item.appName}, ${item.platform}, ${item.arch}, ${item.version} failed. Failed reason is "${
          item.error || (item.exist ? 'current version already exist' : 'unknown reason')
        }"`
      );
    });
    if (!isForce) {
      console.error('if you wan to force update, please run: ');
      console.error('node ./packages/electron/build-utils/force-upload-yml.js');
      console.error(' '.repeat(20));
    }
  }

  if (successArr && successArr.length) {
    console.log('Upload yml success start yml urls :' + '*'.repeat(20));
    successArr.forEach(item => {
      console.log(getYmlServerUrl(item));
    });
    console.log('Upload yml success end ' + '*'.repeat(20));
  }
}

function getShouldUploadYml() {
  const uploadProfiles = ['prod', 'edm_prod'];
  return uploadProfiles.includes(profile);
}

module.exports = {
  getHost,
  getIsExistInServer,
  saveNewVersionToServer,
  saveNewVersionToServerForce,
  deleteVersionInServer,
  uploadYmlToServerByAllBuildInfoAsync,
  getYmlInfoByBuildInfo,
  isVersionMismatch,
  getAllBuilInfo,
  showUploadResultInfos,
  getShouldUploadYml,
};
