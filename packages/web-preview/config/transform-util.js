/**
 * todo: 需要生产出两个文件
 * 1. 编号，文件名，路径，中文
 * 2. 中文，编号
 */
const fs = require('fs');

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

// 收集已翻译的中英文
const translatedZh = {};
const translatedEn = {};
const untranslated = [];
function collectTranslated(info) {
  const { key, zh = '', en = '', noresult = false } = info;
  translatedZh[key] = zh;
  translatedEn[key] = en;
  if (noresult) {
    untranslated.push(zh);
  }
}
// 生产json
function outputJson() {
  fs.writeFileSync('./zh.json', JSON.stringify(translatedZh), 'utf-8');
  fs.writeFileSync('./en.json', JSON.stringify(translatedEn), 'utf-8');
  fs.writeFileSync('./un-resolve.csv', untranslated.join('\n'), 'utf-8');
}

module.exports = {
  collectText,
  outputFile,
  collectTranslated,
  outputJson,
};
