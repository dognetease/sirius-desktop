const { run: jscodeshift } = require('jscodeshift/src/Runner');
const path = require('path');
const colors = require('colors');
const fs = require('fs');
const { outputJson, paths, outputThreadsJson } = require('./transform-util');

const options = {
  // dry: true, // 测试运行，不对源码进行修改
  print: false,
  verbose: 1,
  // cpus: 1,
  // ...
};
const transformPath = path.resolve(__dirname, './ts-transformer.v2.js');

const runParse = async filepath => {
  const filepaths = filepath || paths;
  if (filepaths.length === 0) {
    return;
  }
  try {
    const res = await jscodeshift(transformPath, filepaths, options);
    console.log(colors.bgRed('transform success！'));
    //   outputJson();
    // setTimeout(() => {
    //   outputThreadsJson();
    //   fs.rmdirSync('./temp', {
    //     recursive: true,
    //   });
    // }, 10000);
  } catch (err) {
    console.log(colors.bgYellow(err), '---err');
  }
};

process.on('exit', () => {
  console.log(colors.bgRed('程序退出！！'));
  outputThreadsJson();
  fs.rmdirSync('./temp', {
    recursive: true,
  });
});

module.exports = {
  runParse,
};
