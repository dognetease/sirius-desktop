const path = require('path');
const glob = require('glob');
const envDef = require('env_def');
const profile = envDef.config('profile');
const stage = envDef.config('stage');
const forElectron = envDef.config('build_for') === 'electron';
const fs = require('fs');

function getPublishPath() {
  return path.join(__dirname, './../public');
}

function getTemplatePath() {
  return path.join(__dirname, './../src/service-worker');
}

function readFileContent(filePath) {
  return fs.readFileSync(filePath, { encoding: 'utf-8' }).toString();
}

function writeFileContent(filePath, fileContent) {
  fs.writeFileSync(filePath, fileContent, { encoding: 'utf-8' });
}

function getSwFileTemplateContent() {
  const templatePath = path.resolve(getTemplatePath(), './worker.js');
  return readFileContent(templatePath);
}

function getSWMainTemplateContent() {
  const mainTemplatePath = path.resolve(getTemplatePath(), './main.js');
  return readFileContent(mainTemplatePath);
}

function writeNewSWToContent(fileContent, fileName) {
  const newSwFilePath = path.resolve(getPublishPath(), `./${fileName}`);
  writeFileContent(newSwFilePath, fileContent);
}

function getFileSizeInKb(filePath) {
  const fileInfo = fs.statSync(filePath);
  const fileSize = (fileInfo.size / 1024).toFixed(2);
  return fileSize;
}

function logGroupContent(content) {
  console.log('-'.repeat(30));
  console.log(content);
  console.log('-'.repeat(30));
}

function getVersionCacheUrls() {
  const cacheJSPattern = getPublishPath() + '/*.js';
  const cacheCssPattern = getPublishPath() + '/*.css';
  const JSFilePaths = glob.sync(cacheJSPattern);
  const CSSFilePaths = glob.sync(cacheCssPattern);

  const blackList = [
    'nps_init.js',
    'snapshot-umd.js',
    'NIM_Web_NIM_v8.7.2.js',
    'NIM_Web_NIM_v8.9.0.js',
    'NIM_Web_SDK_v8.11.3.js',
    'DATracker_Init.js',
    'dev-script.js',
    'axios-sentry-nimSdk-2022-11-24.js',
    'antd-reactdatepicker-overscrollbar-2022-11-24.css',
    'kf_init.js',
    'NIM_Web_Chatroom_v8.9.0.js',
    'DATracker.globals',
    'polyfill-4491506b37064ccb0a64.js',
    'sw-main',
    'sw-worker',
  ];

  const pageWihiteList = ['component---src-pages-index-tsx', 'component---src-pages-login-tsx', 'component---src-pages-jump-tsx'];

  const resourceFilePaths = [...JSFilePaths, ...CSSFilePaths];
  let sumSize = 0;
  resourceFilePaths.forEach(filePath => {
    sumSize += Number.parseInt(getFileSizeInKb(filePath));
  });
  logGroupContent(`Total Size is ${(sumSize / 1024).toFixed(2).toString()}Mb`);

  const result = resourceFilePaths
    .filter(path => {
      const inBlackList = blackList.some(blackUrl => {
        if (path.includes(blackUrl)) {
          return true;
        }
        return false;
      });
      if (inBlackList) {
        return false;
      }
      if (path.includes('component---src-pages')) {
        const inWhiteList = pageWihiteList.some(pageUrl => {
          if (path.includes(pageUrl)) {
            return true;
          }
          return false;
        });
        if (inWhiteList) {
          return true;
        }
        return false;
      }
      return true;
    })
    .map(cacheUrl => {
      const fileInfo = fs.statSync(cacheUrl);
      const fileSize = (fileInfo.size / 1024).toFixed(2);
      const baseName = path.basename(cacheUrl);
      console.log(`${baseName}: ${fileSize}Kb`);
      return './' + baseName;
    });
  return result;
}

function main() {
  if (forElectron) {
    return;
  }
  if (profile && profile.includes('emd')) {
    return;
  }
  if (stage !== 'prod' && stage !== 'test') {
    return;
  }
  logGroupContent('Start generate service worker....');

  const swName = `sw-worker-${new Date().getTime()}.js`;

  const versionCacheUrls = getVersionCacheUrls();
  const versionCacheStr = `var versionCachesUrls = ${JSON.stringify(versionCacheUrls)};`;
  const swTemplateContent = getSwFileTemplateContent();
  const newSwFileContent = swTemplateContent.replace('//$versionCacheUrls', versionCacheStr);
  writeNewSWToContent(newSwFileContent, swName);

  const mainTemplateContent = getSWMainTemplateContent();
  const swNameJSCodeStr = `var swNameWithVersion = '${swName}'`;
  const newMainSWContent = mainTemplateContent.replace('//$swFileNameTemplate', swNameJSCodeStr);
  writeFileContent(path.resolve(getPublishPath(), './sw-main.js'), newMainSWContent);

  logGroupContent('Generate service worker successfully');
}

main();
