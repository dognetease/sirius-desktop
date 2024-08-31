const path = require('path');
const fs = require('fs');
const { getCmdLineOptions, getAbsolutePath, log, getV8ContextFileName, getSnapshotFileName, getPlatformAndArch, getLocalMacElectronArch } = require('./utils');

function getPlatform() {
  return process.platform;
}

const config = {
  inputDirKey: 'input-dir'
}

function copyV8SnapshotToElectron(inputDir, platformParam, archParam) {
  const platFormAndArch = getPlatformAndArch(platformParam, archParam);
  const snapshotFileName = getSnapshotFileName();
  const blobFilePath = path.resolve(inputDir, platFormAndArch, snapshotFileName);
  const v8ContextFileName = getV8ContextFileName(platformParam, archParam);
  const v8ContextFilePath = path.resolve(inputDir, platFormAndArch, v8ContextFileName);
  const platform = getPlatform();

  const electronRootPath = path.resolve(__dirname, './../../../node_modules/electron');

  let electronPath;
  switch (platform) {
    case 'darwin':
      electronPath = path.resolve(electronRootPath, 'dist/Electron.app/Contents/Frameworks/Electron Framework.framework/Versions/A/Resources');
      break;
    case 'win32':
    case 'linux':
      electronPath = path.resolve(electronRootPath, 'dist')
      break;
  }

  log(`Copying V8 snapshots from ${blobFilePath} to ${electronPath}`);
  fs.copyFileSync(blobFilePath, path.join(electronPath, snapshotFileName));
  log(`Copying V8 context snapshots from ${v8ContextFilePath} to ${electronPath}`);
  fs.copyFileSync(v8ContextFilePath, path.join(electronPath, v8ContextFileName));
}

function main() {
  const options = getCmdLineOptions();
  if (!options[config.inputDirKey]) {
    throw new Error(`${config.inputDirKey} is null or empty!`)
  }

  const inputDir = getAbsolutePath(options[config.inputDirKey]);
  if (!fs.existsSync(inputDir)) {
    throw new Error(`${inputDir} not exist!`)
  }

  let arch = null;
  try {
    arch = options.arch ? options.arch 
                          : process.platform === 'darwin' ? getLocalMacElectronArch() 
                          : process.arch;
  } catch(ex) {
    console.error(ex);
  }

  log(`Local electron arch is ${arch}`);
  if(!arch) {
    return;
  }

  copyV8SnapshotToElectron(inputDir, null, arch);
}

main();