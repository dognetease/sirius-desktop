const colors = require('colors');
const nodePath = require('path');
const pinyin = require('tiny-pinyin');
const fs = require('fs');
const ts = require('typescript');
const { collectText, collectTranslated } = require('./transform-util');
// const OriginZh = require('./zh.json');

// const originJson = require('./result.json');
const printer = ts.createPrinter({ newLine: ts.NewLineKind.CarriageReturnLineFeed });

// 匹配中文正则
const pattern = new RegExp('[\u4E00-\u9FA5]+');
// 表情
const pattern1 = /\[([\u4E00-\u9FA5]{1,4})\]/;
// 注释
const patternComment = /(\*\*)|(\/\/)/;

const { SyntaxKind, factory } = ts;

const filenames = [];
/**
 * todo:
 * 1. 中文做key的处理
 * 2. web-im/src/common/timeline.tsx、packages/web-mail/src/util.tsx 两个文件的替换
 */

// exports.set = set;

function getNodeInfo(node) {
  // 获取行列
  const { line, character: col } = node.getSourceFile().getLineAndCharacterOfPosition(node.pos);
  // 获取路径
  const path = 'packages' + node.getSourceFile().fileName.split('packages')[1];

  return {
    line,
    col,
    path,
  };
}

function translate(text) {
  const result = text.trim().replaceAll(',', '，');
  const key = pinyin.convertToPinyin(result.slice(0, 5));
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

function unResolveCollect(key) {
  collectTranslated({
    key,
    zh: '',
    en: '',
    noresult: true,
  });
}

exports.transformer = function transformer(context) {
  const visitor = function (node) {
    const fileName = node.getSourceFile().fileName;
    if (
      nodePath.extname(fileName).includes('ts') && // 解析ts
      !fileName.includes('packages/api') // api 中的中文先不做处理
      // || nodePath.extname(fileName).includes('tsx')
      // && !fileName.includes('packages/web-mail/src/util.tsx')
      // && !fileName.includes('web-im/src/common/timeline.tsx')
    ) {
      // const baseExpression = (text) => {
      //   const key = translate(text);

      //   return factory.createConditionalExpression(
      //     factory.createBinaryExpression(
      //       factory.createTypeOfExpression(factory.createIdentifier('window')),
      //       factory.createToken(ts.SyntaxKind.ExclamationEqualsEqualsToken),
      //       factory.createStringLiteral('undefined')
      //     ),
      //     factory.createToken(ts.SyntaxKind.QuestionToken),
      //     factory.createCallExpression(
      //       factory.createPropertyAccessExpression(
      //         factory.createIdentifier('window'),
      //         factory.createIdentifier('getLocalLabel')
      //       ),
      //       undefined,
      //       [factory.createStringLiteral(key)]
      //     ),
      //     factory.createToken(ts.SyntaxKind.ColonToken),
      //     factory.createStringLiteral('')
      //   )
      // };

      // // 带括号，(window && window.getLocalLabel({path: 'test', init: 'test'}))
      // const expressionWithBrackets = (text) => (
      //   factory.createParenthesizedExpression(baseExpression(text))
      // );

      // // jsx text 部分
      // if (ts.isJsxText(node)) {
      //   const text = node.getFullText();
      //   if (text && text.length > 0 && pattern.test(text) && !pattern1.test(text)) {
      //     filenames.push(node.getSourceFile().fileName);
      //     // console.log(colors.bgBlue(text));
      //     /**
      //      * 路径：node.getSourceFile().fileName
      //      * 文案：node.getFullText()
      //      */
      //     const { line, col, path } = getNodeInfo(node);
      //     // collectText({
      //     //   line,
      //     //   col,
      //     //   path,
      //     //   text: text.replaceAll(',', '，'),
      //     // });
      //     // console.log(colors.bgYellow(fileName, '----test'));
      //     // 替换全局方法
      //     return factory.createJsxExpression(
      //       undefined,
      //       baseExpression(text),
      //     );
      //   }
      // // } else if (ts.isJsxAttribute(node) && node.initializer && node.initializer.kind === SyntaxKind.StringLiteral) {
      // //   // attr 属性部分，例如：title="测试"
      // //   const text = node.initializer.text;
      // //   if (text && text.length > 0 && pattern.test(text) && !pattern1.test(text)) {
      // //     // 文案：node.initializer.text
      // //     const { line, col, path } = getNodeInfo(node);
      // //     // collectText({
      // //     //   line,
      // //     //   col,
      // //     //   path,
      // //     //   text: text.trim().replaceAll(',', '，'),
      // //     // });
      // //     // console.log(colors.bgRed('111'), line, col, path, '---', node.initializer.text);
      // //   }
      // } else if (
      //   ts.isStringLiteral(node)
      //   // && fileName.includes('SharePage/sharePage.tsx')
      //   && !ts.isLiteralTypeNode(node.parent) // 不能是类型节点
      // ) {
      //   // 表达式部分的中文
      //   const text = node.text || node.getFullText();
      //   if (text && text.length > 0 && pattern.test(text) && !pattern1.test(text) && !patternComment.test(text)) {
      //     const { line, col, path } = getNodeInfo(node);
      //     filenames.push(node.getSourceFile().fileName);
      //     if (ts.isJsxAttribute(node.parent)) {
      //       return factory.createJsxExpression(
      //         undefined,
      //         baseExpression(text),
      //       );
      //     }
      //     /**
      //      * 例子： const conf = { test: '测试' }
      //      */
      //     if (
      //       ts.isPropertyAssignment(node.parent) // 不能是key
      //     ) {
      //       if (node.parent.getChildren()[0] !== node) { // 不能是中文 key
      //         // console.log(colors.bgRed(text, key));
      //         return baseExpression(text);
      //       }
      //       return node;
      //     }

      //     if (ts.isConditionalExpression(node.parent)) {
      //       // console.log(colors.bgRed(text), line, col, path);
      //       return expressionWithBrackets(text);
      //     }

      //     // 数组元素
      //     if (ts.isArrayLiteralExpression(node.parent)) {
      //       return baseExpression(text);
      //     }

      //     // return '测试'
      //     if (ts.isReturnStatement(node.parent)) {
      //       return baseExpression(text);
      //     }

      //     // 如果是函数调用
      //     if (ts.isCallExpression(node.parent)) {
      //       const parentSource = node.parent.getFullText();
      //       if (!parentSource.includes('console')) { // console 中的中文不处理
      //         return baseExpression(text);
      //       }
      //       return node;
      //     }

      //     // 如果是字符串相加
      //     if (ts.isBinaryExpression(node.parent)) {
      //       return expressionWithBrackets(text);
      //     }

      //     return baseExpression(text);
      //   }
      // }

      // 找出哪些没有被赋值
      if (ts.isStringLiteral(node)) {
        if (ts.isCallExpression(node.parent)) {
          // if (node.parent.getFullText().includes('window.getLocalLabel')) {
          //   console.log(colors.bgRed('开始'), node.parent.getChildren()[0].getFullText());
          //   const parentSource = node.parent.getChildren()[0];
          //   if (parentSource) {
          //     console.log(colors.bgRed(parentSource.text));
          //   }
          // }
          // if (parentSource)

          const parentSource = node.parent.getChildren()[0].getFullText();
          if (parentSource && parentSource.includes('window.getLocalLabel') && OriginZh[node.text] == null) {
            console.log(colors.bgRed(node.text), OriginZh[node.text]);
            // console.log(colors.bgRed(node.text));
            unResolveCollect(node.text);
          }
        }
      }
    }

    return ts.visitEachChild(node, visitor, context);
  };
  return function (node) {
    const sourceFile = ts.visitNode(node, visitor);
    const filename = sourceFile.fileName;

    // 替换完成之后覆盖文件
    // if (
    //   filename
    //   && filenames.includes(filename)
    //   && !filename.includes('web-im/src/common/timeline.tsx')
    //   && !filename.includes('packages/web-mail/src/util.tsx')
    // ) {
    //   const result2 = printer.printFile(sourceFile);
    //   // console.log(colors.bgRed(result2));
    //   fs.writeFileSync(filename, result2, 'utf-8');
    // }
    return sourceFile;
  };
};
