const fs = require('fs');
const path = require('path');
const colors = require('colors');

const jsonPath1 = path.resolve(__dirname, './origin-modules.js');
const originIgnore = require(jsonPath1);

const jsonPath2 = path.resolve(__dirname, './ignore-module.json');
try {
  fs.accessSync(jsonPath2);
} catch (err) {
  console.log(colors.bgRed('ignore-module.json 文件不存在或者出错'));
  process.exit(1);
}
const needIgnore = require(jsonPath2);

const ignoreComps = originIgnore.ignoreComps.filter(origin => needIgnore.ignoreComps.find(comp => comp.compName === origin.compName) == null);

const outputFilePath = path.resolve(__dirname, '../../src/pages-yingxiao/index.tsx');

module.exports = function transformer(file, api, options) {
  const j = api.jscodeshift;
  const ast = j(file.source);
  ast.find(j.ImportDeclaration).forEach(path => {
    let needChange = false;
    let name = '';
    j(path)
      .find(j.Identifier)
      .forEach(path1 => {
        if (ignoreComps.find(ignore => ignore.compName === path1.value.name) != null) {
          needChange = true;
          name = path1.value.name;
          // j(path).remove(); // remove可能报错
        }
      });
    if (needChange) {
      // 必须使用这种麻烦的方式，否则会报错！
      j(path).replaceWith();
      j(path).insertBefore(`const ${name} = () => null;`);
    }
  });
  ast.find(j.VariableDeclarator).forEach(path => {
    if (ignoreComps.find(ignore => 'render' + ignore.compName === path.node.id.name) != null) {
      j(path)
        .find(j.Identifier)
        .forEach(path1 => {
          // path1.value.name
          if (ignoreComps.find(ignore => 'render' + ignore.compName === path1.value.name) != null) {
            j(path)
              .find(j.ArrowFunctionExpression)
              .forEach(path3 => {
                j(path3).replaceWith(j.identifier('() => null'));
              });
          }
        });
    }
  });

  // console.log('source----', rootSource.toSource());
  fs.writeFileSync(outputFilePath, ast.toSource(), 'utf-8');
  return ast.toSource();
};
// use the flow parser
module.exports.parser = 'tsx';
