const path = require('path');
const fs = require('fs');

function getCmdLineOptions(defaultOptions = {}) {
  let optionArgv = process.argv.slice(2);
  //default options
  let optionObj = defaultOptions;

  optionArgv.forEach(optionStr => {
    let optionVal;
    let optionKey;
    if (optionStr.includes('=')) {
      let parts = optionStr.split('=');
      optionKey = parts[0];
      optionVal = parts[1];
    } else {
      optionKey = optionStr;
      optionVal = true;
    }

    if (/^--/.test(optionKey)) {
      optionKey = optionKey.replace(/^--/, '');
    }

    if (optionKey && optionKey.length) {
      optionObj[optionKey] = optionVal;
    }
  });

  return optionObj;
}

function getAbsolutePath(relativePath, basePath = process.cwd()) {
  return path.resolve(basePath, relativePath);
}


function log(str) {
  try {
    console.log(str);
  } catch (ex) {
    console.error(ex);
  }
}

function getLocalMacElectronArch() {
  const electronBasePath = path.resolve(__dirname, './../../../node_modules/electron/dist/Electron.app');
  if (!fs.existsSync(electronBasePath)) {
    throw new Error(`Electron do not exist, please install electron first!`);
  }
  const arm64SnapshotFilePath = path.resolve(electronBasePath, 'Contents/Frameworks/Electron Framework.framework/Versions/A/Resources/v8_context_snapshot.arm64.bin');
  if (fs.existsSync(arm64SnapshotFilePath)) {
    return 'arm64';
  }

  return process.arch;
}


function getPlatformAndArch(platformParam, archParam) {
  const platform = platformParam || process.platform;
  let arch = archParam || process.arch;
  return `${platform}_${arch}`;
}


function getV8ContextFileName(platformParam, archParams) {
  const platform = platformParam || process.platform;
  let fileArchName;
  switch (platform) {
    case 'darwin':
      const arch = archParams || process.arch;
      fileArchName = `${ arch.startsWith('arm') ? '.arm64' : '.x86_64' }`;
      break;
    default:
      fileArchName = '';
      break;
  }

  return `v8_context_snapshot${fileArchName}.bin`;
}


function getSnapshotFileName() {
  return 'snapshot_blob.bin';
}


module.exports = {
  getCmdLineOptions,
  getAbsolutePath,
  log,
  getPlatformAndArch,
  getV8ContextFileName,
  getSnapshotFileName,
  getLocalMacElectronArch,
}
