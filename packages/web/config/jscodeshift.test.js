const { run: jscodeshift } = require('jscodeshift/src/Runner');
const path = require('path');
const colors = require('colors');

const options = {
  // dry: true, // 测试运行，不对源码进行修改
  print: false,
  verbose: 1,
  // ...
};
const transformPath = path.resolve('./ts-transformer.v2.js');

const filepath = path.resolve('../../web-im/src/subcontent/imTeamChatHead.tsx');

const runParse = async () => {
  try {
    const res = await jscodeshift(transformPath, [filepath], options);
    console.log(colors.bgRed('transform success！'), filepath);
  } catch (err) {
    console.log(colors.bgYellow(err), '---err');
  }
};

runParse();
