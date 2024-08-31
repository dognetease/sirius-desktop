// 新版翻译脚本，最大程度保留原文件格式，减少代码合并冲突
const jscodeshift = require('jscodeshift');
const colors = require('colors');
const nodePath = require('path');
const pinyin = require('tiny-pinyin');
const fs = require('fs');
const { collectText, collectTranslated, outputJson } = require('./transform-util');

// 现有文件
const OriginZh = require('../../api/src/utils/global_label/zh.json');
const OriginZhWaimao = require('../../api/src/utils/global_label/waimao/zh.json');
const OriginZhYx = require('../../api/src/utils/global_label/yingxiao/zh.json');
// const OriginZhLxApi = require('../../api/src/utils/global_label/lingxi-api/zh.json');
// const OriginZhLxPre = require('../../api/src/utils/global_label/lingxi-preview-img/zh.json');

const currentJson = { ...OriginZhWaimao, ...OriginZh, ...OriginZhYx };

// 匹配中文正则
const pattern = new RegExp('[\u4E00-\u9FA5]+');
// 表情
const pattern1 = /\[([\u4E00-\u9FA5]{1,4})\]/;
// 注释
const patternComment = /(\*\*)|(\/\/)/;

const originJson = {};
let options = null;
function translate(text) {
  const result = String(text).trim().replace(/,/gi, '，');
  const entry = Object.entries(currentJson).find(entry => entry[1] === result);
  if (entry) {
    return entry[0];
  }
  let key = pinyin.convertToPinyin(result.replace(/\r|\n/gi, '').substring(0, 7));
  if (currentJson[key]) {
    key += '1010';
  }
  if (originJson[result] != null) {
    collectTranslated({
      key,
      zh: result,
      en: originJson[result],
    });
  } else {
    collectTranslated({
      key,
      zh: result,
      en: result,
      noresult: true,
    });
  }
  return key;
}

let needChange = false;
const replaceCode = text => {
  needChange = true;
  const key = translate(text);
  // return `typeof window !== 'undefined' ? window.getLocalLabel('${key}') : ''`;
  return `getIn18Text('${key}')`; // 最新版本要求使用同一的方法
};
const importText = "import { getIn18Text } from 'api';";

const getBaseExpression = text => jscodeshift(replaceCode(text)).getAST()[0].node;
const expressionWithBrackets = text => jscodeshift(`(${replaceCode(text)})`).getAST()[0].node; // 小括号
const expressionWithBigBrackets = text => jscodeshift(`{${replaceCode(text)}}`).getAST()[0].node; // 大括号

const transform = (fileInfo, api, optionsConf) => {
  options = optionsConf;
  needChange = false;
  const fileName = fileInfo.path;
  const ast = api.jscodeshift(fileInfo.source);
  let hasTranslateText = false; // 是否存在需要翻译的中文
  let hasImport = false; // 是否引入了统一的方法

  ast.find(jscodeshift.JSXText).forEach(path => {
    const text = path.node.value;
    if (text && text.length > 0 && pattern.test(text) && !pattern1.test(text)) {
      // 存在中文
      hasTranslateText = true;
      // 简单的替换
      const pureText = text.replace(/\r|\n/gi, '');
      // const newStr = path.node.value.replace(pureText, `{${replaceCode(pureText)}}`); // 保留原格式
      // path.node.value = newStr;
      jscodeshift(path).replaceWith(
        // jscodeshift.jsxExpressionContainer(expressionWithBigBrackets(pureText)),
        jscodeshift.identifier(`{${replaceCode(pureText)}}`)
      );
      // path.replace(expressionWithBigBrackets(text))
    }
  });

  ast.find(jscodeshift.StringLiteral).forEach(path => {
    const parentType = path.parent.node.type;
    // console.log('999', parentType)
    const text = path.node.value;
    if (text && text.length > 0 && pattern.test(text) && !pattern1.test(text) && !patternComment.test(text) && path.parent) {
      // 存在中文
      hasTranslateText = true;
      if (parentType === 'VariableDeclarator') {
        path.replace(getBaseExpression(text));
      } else if (parentType === 'ObjectProperty') {
        if (path.parent.node.value === path.node) {
          // console.log(path.node.value)
          // path.node = getBaseExpression(text)
          path.replace(getBaseExpression(text));
        }
      } else if (parentType === 'JSXAttribute') {
        path.replace(expressionWithBigBrackets(text));
      } else if (parentType === 'ConditionalExpression') {
        // path.replace(expressionWithBrackets(text));
        path.replace(getBaseExpression(text));
      } else if (parentType === 'TemplateLiteral') {
        path.replace(getBaseExpression(text));
      } else if (parentType === 'ArrayExpression') {
        path.replace(getBaseExpression(text));
        // const newStr = path.node.value.replace('哈哈', `{${replaceCode(text)}}`)
        // path.node.value = newStr
      } else if (parentType === 'ReturnStatement') {
        path.replace(getBaseExpression(text));
      } else if (parentType === 'CallExpression') {
        const fnName = path.parent.node.callee.name || '';
        // console.log(fnName, '--000--', fnName.includes && fnName.includes('fn'))
        // if (!(fnName.include('console') || fnName.include('getLocalLabel'))) {
        if (path.parent.node.callee.type === 'Identifier') {
          path.replace(getBaseExpression(text));
        } else if (path.parent.node.callee.type === 'MemberExpression' && path.parent.node.callee.object.name !== 'console') {
          path.replace(getBaseExpression(text));
        }
      } else if (parentType === 'BinaryExpression') {
        path.replace(getBaseExpression(text));
      }
    }
    // 兜底方案
    // path.replace(getBaseExpression(text))
  });

  ast.find(jscodeshift.Identifier).forEach(path => {
    const parentType = path.parent.node.type;
    const fullText = path.node.name;
    if (fullText.includes('getIn18Text') && parentType === jscodeshift.ImportSpecifier.name) {
      // 如果存在声明
      hasImport = true;
    }
  });

  // 没有引入方法并且存在未翻译的文案
  if (!hasImport && hasTranslateText) {
    jscodeshift(ast.find(jscodeshift.Declaration).at(0).get()).insertBefore(importText);
  }

  // console.log(colors.bgRed(needChange));
  if (needChange) {
    return ast.toSource();
  }
  return fileInfo.source;
};

module.exports = transform;
module.exports.parser = 'tsx';
