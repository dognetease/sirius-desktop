const inquirer = require('inquirer');
const fs = require('fs');
const path = require('path');
const colors = require('colors');

const jsonPath = path.resolve(__dirname, './origin-modules');
const { ignoreComps, pages } = require(jsonPath);

if (process.argv.includes('-y')) {
  console.log(colors.bgRed('执行默认编译，请注意ignore-module.json文件内容'));
  return;
}

// 启动 inquirer
inquirer
  // 交互内容
  .prompt([
    {
      type: 'checkbox',
      message: '请选择你要编译的模块（默认预置了邮箱和智能营销，不需要可以去掉）',
      name: 'ignoreCompsValue',
      default: ['MailBox', 'IntelliMarketing'],
      choices: ignoreComps.map(item => ({
        name: item.name,
        value: item.compName,
      })),
    },
    {
      type: 'checkbox',
      message: '请选择你要编译的页面',
      name: 'pagesValue',
      default: [''],
      choices: pages.map(item => ({
        name: item,
        value: item,
      })),
    },
  ])
  // 收集用户答案后的回调，会以键值对的方式存储在这里。需要通过之前的问题校验
  .then(answers => {
    const { ignoreCompsValue = [], pagesValue = [] } = answers;
    const data = {
      ignoreComps: ignoreComps.filter(comp => ignoreCompsValue.includes(comp.compName)),
      pages: pages.filter(page => pagesValue.includes(page)),
    };
    console.log(answers, '--answers');
    fs.writeFileSync(path.resolve(__dirname, 'ignore-module.json'), JSON.stringify(data), 'utf-8');
  })
  // 捕获错误的回调
  .catch(error => {
    console.log('交互命令行出错：', error);
  });
