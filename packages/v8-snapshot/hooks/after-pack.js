const path = require('path');
const fs = require('fs');
const { getV8ContextFileName, getSnapshotFileName, getPlatformAndArch, log } = require('./../tools/utils');
/**
 * 
 */
function getElectronSnapshotPath(platform, productName) {
  if (platform === 'darwin') {
    return `${productName}.app/Contents/Frameworks/Electron\ Framework.framework/Versions/A/Resources/`
  } else if (platform === 'win32') {
    return '';
  } else {
    throw new Error(`Platform "${platform}" unsupported!`);
  }
}

/**
 * 
 */
function getSnapshotSourceFilesPaths(platformParam, archParam) {
  const platformAndArch = getPlatformAndArch(platformParam, archParam);
  const basePath = path.resolve(__dirname, './../snapshots', platformAndArch);
  const snapshotFilePath = path.resolve(basePath, getSnapshotFileName());
  const v8ContextFilePath = path.resolve(basePath, getV8ContextFileName(platformParam, archParam));
  return [snapshotFilePath, v8ContextFilePath];
}

/**
 * 
 * @param {*} sourceFiles 
 * @param {*} destPath 
 * @returns 
 */
function copyFilesToDest(sourceFiles, destPath) {
  if (!sourceFiles || !sourceFiles.length) return;

  sourceFiles.forEach(filePath => {
    try {
      const fileName = path.basename(filePath);
      fs.copyFileSync(filePath, path.resolve(destPath, fileName));
    } catch (ex) {
      console.error(ex);
    }
  })
}

const archNumToString = {
  0: 'ia32',
  1: 'x64',
  3: 'arm64',
};



exports.default = async(context) => {
  log(`AfterPack hook start`);
  const appOutDir = context.appOutDir;
  const platform = context.electronPlatformName;
  const arch = context.arch;
  const productName = context.packager.appInfo.productName;

  log(`AppOutDir: ${appOutDir}, Platform: ${platform}, Arch: ${arch}, productName: ${productName}.`)
  const archStr = archNumToString[arch];
  if (!archStr) {
    throw new Error('Arch not support!');
  }

  const snapshotPath = getElectronSnapshotPath(platform, productName);
  const snapshotDestAbsolutePath = snapshotPath ? path.resolve(appOutDir, snapshotPath) : appOutDir;
  log(`snapshotDestAbsolutePath: ${snapshotDestAbsolutePath}`);

  const snapshotFileArr = getSnapshotSourceFilesPaths(platform, archStr);

  copyFilesToDest(snapshotFileArr, snapshotDestAbsolutePath);
}