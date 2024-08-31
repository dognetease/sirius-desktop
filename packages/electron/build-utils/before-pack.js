/**
 * 主要是生成.temp/build-info.json文件
 * 供下面的步骤使用
 */
const fs = require('fs');
const constant = require('./const');
const path = require('path');
const utils = require('./utils');

function writeBuildInfo(context) {
  const packager = context.packager;

  let platformName = packager.platform.buildConfigurationKey;
  let arch = constant.archNumToString[context.arch];
  let version = packager.appInfo.version;
  const outDir = context.outDir;

  const fileDirPath = utils.getBuildInfoDirPath();
  if (!fs.existsSync(fileDirPath)) {
    fs.mkdirSync(fileDirPath, { recursive: true });
  }

  const filePath = utils.getBuildInfoFilePath();
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }

  const buildInfo = {
    arch,
    platform: platformName,
    version,
    outDir,
  };
  console.log(`Current buildInfo:`, buildInfo);

  fs.writeFileSync(filePath, JSON.stringify(buildInfo));
  console.log(`Write buildInfo to ${filePath}`);
}

function changeUpdateAppLogic(context) {
  try {
    const packager = context.packager;
    let platformName = packager.platform.buildConfigurationKey;
    if (platformName === 'win') {
      const toBasePath = path.resolve(__dirname, './../../../node_modules/app-builder-lib/templates/nsis');
      const srcBasePath = path.resolve(__dirname);
      const fileArray = [
        {
          src: './unistaller.nsh',
          to: './uninstaller.nsh',
        },
        {
          src: './installer.nsi',
          to: './installer.nsi',
        },
        {
          src: './common.nsh',
          to: './common.nsh',
        },
        {
          src: './includes/installer.nsh',
          to: './include/installer.nsh',
        },
        {
          src: './installSection.nsh',
          to: './installSection.nsh',
        },
      ];
      fileArray.forEach(configItem => {
        let toPath = path.resolve(toBasePath, configItem.to);
        let srcPath = path.resolve(srcBasePath, configItem.src);

        if (!fs.existsSync(toPath)) {
          console.warn('uninstall script not found!');
        }
        fs.unlinkSync(toPath);
        fs.copyFileSync(srcPath, toPath);
      });
      console.log('copy uninstaller script to build folder!');
    }
  } catch (ex) {
    console.error('changeUpdateAppLogic error', ex);
  }
}

function changeElectronBuilderCode(context) {
  const packager = context.packager;
  let platformName = packager.platform.buildConfigurationKey;
  if (platformName === 'win') {
    let basePath = path.resolve(__dirname, './../../../node_modules/app-builder-lib/out/targets');
    let fileNames = ['nsis/NsisTarget.js', 'MsiTarget.js'];
    const changeConfigMap = {
      'nsis/NsisTarget.js': {
        originStr: 'Open with ${packager.appInfo.productName}',
        newStr: '通过${packager.appInfo.productName}打开',
      },
      'MsiTarget.js': {
        originStr: 'Open with ${this.packager.appInfo.productName}',
        newStr: '通过${this.packager.appInfo.productName}打开',
      },
    };
    fileNames.forEach(fileName => {
      let currFileName = path.resolve(basePath, fileName);
      if (fs.existsSync(currFileName)) {
        let changeConfig = changeConfigMap[fileName];
        if (!changeConfig) {
          console.warn(`"${fileName}" not support.`);
          return;
        }
        let content = fs.readFileSync(currFileName, { encoding: 'utf-8' }).toString();
        const originStr = changeConfig.originStr;
        if (content.indexOf(originStr) === -1) {
          console.log(`${originStr} not exist in  "${fileName}"`);
          return;
        }
        const newStr = changeConfig.newStr;
        content = content.replace(originStr, newStr);
        fs.writeFileSync(currFileName, content, { encoding: 'utf-8' });
      } else {
        throw new Error(`File "currFileName" do not exist!`);
      }
    });
  }
}

module.exports = function (context) {
  console.log(`-`.repeat(40));
  console.log(`before-pack satrt....`);
  try {
    writeBuildInfo(context);
    changeElectronBuilderCode(context);
    changeUpdateAppLogic(context);
  } catch (ex) {
    console.error(ex);
  }
  console.log(`before-pack end....`);
  console.log(`-`.repeat(40));
};
