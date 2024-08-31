const { run: jscodeshift } = require('jscodeshift/src/Runner');
const path = require('path');
const colors = require('colors');

const options = {
  dry: true, // 测试运行，不对源码进行修改
  print: false,
  verbose: 1,
  cpus: 1,
  // ...
};
const transformPath = path.resolve(__dirname, './transformer.js');
const filepaths = [path.resolve(__dirname, '../../src/pages-yingxiao/origin.tsx')];

const runParse = async () => {
  if (filepaths.length === 0) {
    return;
  }
  try {
    const res = await jscodeshift(transformPath, filepaths, options);
    console.log(colors.bgRed('transform success！', res));
  } catch (err) {
    console.log(colors.bgYellow(err), '---err');
  }
};

runParse();
