/**
 * todo: 需要生产出两个文件
 * 1. 编号，文件名，路径，中文
 * 2. 中文，编号
 */
const fs = require('fs');
const colors = require('colors');
const process = require('process');
const nodePath = require('path');

const { translatedZh, translatedEn, untranslated } = require('./store');

const textCollector = [];
const textIndexCollector = new Map();

function collectText(nodeInfo) {
  const { line, col, path, text } = nodeInfo;
  textCollector.push({
    line,
    col,
    path,
    text,
  });
  // 收集编号
  if (textIndexCollector.has(text)) {
    textIndexCollector.set(text, textIndexCollector.get(text) + ' ' + (textCollector.length - 1));
  } else {
    textIndexCollector.set(text, textCollector.length - 1);
  }
}

// 收集中文
function outputFile() {
  let result = '文案,路径,行,列\n';
  textCollector.forEach(nodeInfo => {
    const { line, col, path, text } = nodeInfo;
    result += `${text},${path},${line},${col}\n`;
  });
  fs.writeFileSync('textInfo1.csv', result, 'utf-8');

  let result1 = '文案,对应索引\n';
  [...textIndexCollector.entries()].forEach(textIndex => {
    const [text, index] = textIndex;
    result1 += `${text},${index}\n`;
  });
  fs.writeFileSync('textIndex1.csv', result1, 'utf-8');
}

// process.env = {
//   translatedZh: process.env.translatedZh,
//   translatedEn: process.env.translatedEn,
//   untranslated: process.env.untranslated,
//   ...process.env };
// 收集已翻译的中英文
function collectTranslated(info) {
  // console.log(colors.bgRed(info));
  const { key, zh = '', en = '', noresult = false } = info;
  translatedZh[key] = zh;
  translatedEn[key] = en;
  if (noresult) {
    untranslated.push(zh);
  }
}
// 生产json
function outputJson(sign = '') {
  // console.log(colors.bgBlue(Object.keys(translatedZh).length));
  const translatedZhFile = `./temp/${sign}zh.json`;
  const translatedEnFile = `./temp/${sign}en.json`;
  const untranslatedFile = `./temp/${sign}un-resolve.csv`;
  // let curuntranslated = [];
  // try {
  //   curtranslatedZh = fs.readFileSync(translatedZhFile);
  // } catch (err) {}
  // try {
  //   curtranslatedEn = fs.readFileSync(translatedEnFile);
  // } catch (err) {}
  // try {
  //   curuntranslated = fs.readFileSync(untranslatedFile);
  // } catch (err) {}
  try {
    fs.mkdirSync('./temp');
  } catch (err) {}
  fs.writeFileSync(translatedZhFile, JSON.stringify(translatedZh), 'utf-8');
  fs.writeFileSync(translatedEnFile, JSON.stringify(translatedEn), 'utf-8');
  fs.appendFileSync(untranslatedFile, untranslated.join('\n'), 'utf-8');
}

function outputThreadsJson() {
  const list = fs.readdirSync('./temp');
  let translatedZhJson = {};
  let translatedEnJson = {};
  let untranslatedTxt = '';
  let untranslatedCsv = 'key,zh,en\n';
  list.forEach(item => {
    if (item.includes('zh.json')) {
      const temp = require('./temp/' + item);
      translatedZhJson = { ...translatedZhJson, ...temp };
    } else if (item.includes('en.json')) {
      const temp = require('./temp/' + item);
      translatedEnJson = { ...translatedEnJson, ...temp };
    } else {
      const temp = fs.readFileSync('./temp/' + item);
      untranslatedTxt += temp;
    }
  });

  fs.writeFileSync('./en.json', JSON.stringify(translatedZhJson), 'utf-8');
  fs.writeFileSync('./zh.json', JSON.stringify(translatedEnJson), 'utf-8');
  console.log(colors.bgRed(`生成的文件为在如下目录：${__dirname}，请注意拷贝到目标目录！！！`));
  // fs.appendFileSync('./un-resolve.csv', untranslatedTxt, 'utf-8');
  // 写csv文件
  Object.keys(translatedZhJson).forEach(key => {
    const newVal = translatedZhJson[key].replaceAll(',', '，');
    untranslatedCsv += `${key},${newVal},${''}\n`;
  });
  fs.writeFileSync('./result.csv', untranslatedCsv, 'utf-8');
}

const paths = [];
function collectPath(path) {
  paths.push(path);
}
function outputPaths() {
  let currentJson = [];
  try {
    currentJson = require('./paths.json');
  } catch (err) {
    console.log(err);
  }
  fs.writeFileSync('./paths.json', JSON.stringify([...paths, ...currentJson]), 'utf-8');
}

process.on('exit', () => {
  outputJson(Date.now() + '');
  // console.log(6666666666666);
});

function getAllPaths(dirPath, blackList = []) {
  const allPaths = [];
  function getFiles(dir) {
    const stat = fs.statSync(dir);
    if (stat.isDirectory()) {
      // 判断是不是目录
      const dirs = fs.readdirSync(dir);
      dirs.forEach(value => {
        // console.log('路径',path.resolve(dir,value));
        getFiles(nodePath.join(dir, value));
      });
    } else if (stat.isFile() && ['.ts', '.tsx'].some(temp => dir.includes(temp))) {
      // 判断是不是文件
      // console.log('文件名称', dir);
      if (!blackList.some(item => allPaths.includes(item))) {
        allPaths.push(dir);
      }
      // console.log(allPaths, '----allPaths')
    }
  }

  getFiles(dirPath);
  return allPaths;
}

module.exports = {
  collectText,
  outputFile,
  collectTranslated,
  outputJson,
  collectPath,
  paths,
  outputPaths,
  outputThreadsJson,
  getAllPaths,
};
