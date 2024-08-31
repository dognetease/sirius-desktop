const envDef = require('env_def');
const isEdm = (envDef.config('profile') && envDef.config('profile').includes('edm')) || false;

function generateFullLangJson(langJson, fullJson) {
  let res = {};
  let fullKeys = Object.keys(fullJson);
  for (let i = 0; i < fullKeys.length; ++i) {
    let currentKey = fullKeys[i];
    if (langJson[currentKey]) {
      res[currentKey] = langJson[currentKey];
    } else {
      if (typeof langJson[currentKey] === 'undefined') {
        res[currentKey] = fullJson[currentKey];
      }
    }
  }

  return res;
}

const fs = require('fs');
const path = require('path');

function getFullZhJson() {
  const zhJson = require('./global_label/zh.json');
  const apiZh = require('./global_label/lingxi-api/zh.json');
  if (isEdm) {
    const waimaoZh = require('./global_label/waimao/zh.json');
    const previewZh = require('./global_label/lingxi-preview-img/zh.json');
    const yingxiaoZh = require('./global_label/yingxiao/zh.json');
    return { ...zhJson, ...waimaoZh, ...apiZh, ...previewZh, ...yingxiaoZh };
  }
  return { ...zhJson, ...apiZh };
}

function getFullEnJson() {
  const enJson = require('./global_label/en.json');
  const apienJson = require('./global_label/lingxi-api/en.json');
  if (isEdm) {
    const waimaoEn = require('./global_label/waimao/en.json');
    const previewEn = require('./global_label/lingxi-preview-img/en.json');
    const yingxiaoEn = require('./global_label/yingxiao/en.json');
    return { ...enJson, ...waimaoEn, ...previewEn, ...yingxiaoEn, ...apienJson };
  }
  return { ...enJson, ...apienJson };
}

function getFullZhTradJson() {
  const zhTradJson = require('./global_label/zh-trad.json');
  const apiZhTradJson = require('./global_label/lingxi-api/zh-trad.json');
  if (isEdm) {
    const waimaoTrad = require('./global_label/waimao/zh-trad.json');
    const previewTrad = require('./global_label/lingxi-preview-img/zh-trad.json');
    const yingxiaoTrad = require('./global_label/yingxiao/zh-trad.json');
    return { ...zhTradJson, ...waimaoTrad, ...previewTrad, ...yingxiaoTrad, ...apiZhTradJson };
  }
  return { ...zhTradJson, ...apiZhTradJson };
}

function getTargetDir() {
  return path.resolve(__dirname, './../../langdist');
}

function makeTargetDir() {
  const targetPath = getTargetDir();
  if (!fs.existsSync(targetPath)) {
    fs.mkdirSync(targetPath);
  }
}

function getTargetPathByLang(langStr) {
  return path.resolve(getTargetDir(), `./${langStr}.js`);
}

makeTargetDir();

const fullZhJson = getFullZhJson();
const enFullJson = generateFullLangJson(getFullEnJson(), fullZhJson);
const zhTradFullJson = generateFullLangJson(getFullZhTradJson(), fullZhJson);

function getGenerateScriptData(jsonObj) {
  return `(function(){window.langJson = ${JSON.stringify(
    jsonObj
  )};window.addLangInfo=function(info){if(info&&typeof info==='object'){if(!window.langJson){window.langJson={};}var keys = Object.keys(info);keys.forEach(function(currKey){var currVal=info[currKey];if(currVal){window.langJson[currKey]=currVal;}});}};})()`;
}

fs.writeFileSync(getTargetPathByLang('zh'), getGenerateScriptData(fullZhJson));
fs.writeFileSync(getTargetPathByLang('en'), getGenerateScriptData(enFullJson));
fs.writeFileSync(getTargetPathByLang('zh-trad'), getGenerateScriptData(zhTradFullJson));
