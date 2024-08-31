const { exec } = require('node:child_process');
const colors = require('colors');
const yargs = require('yargs');

const runImagemin = require('./imagemin');

// console.log(exec('ls -a -l'));
// console.log(exec('git rev-parse HEAD'));
// exec('git rev-parse HEAD', (err, stdout, stderr) => {
//   console.log(stdout.trim());
// })

const getGitResult = command =>
  new Promise((res, rej) => {
    // eslint-disable-next-line consistent-return
    exec(command, (err, stdout) => {
      if (err) {
        return rej(err);
      }
      res(stdout.trim());
    });
  });

const getGitDiff = async () => {
  // 参数
  const argv = yargs.alias('h', 'head').alias('o', 'order').argv;
  let preHead;
  if (argv.head) {
    // 如果是指定head
    preHead = argv.head;
  } else if (argv.order) {
    preHead = await getGitResult(`git rev-parse HEAD~${argv.order}`);
  } else {
    // 默认最新一次
    preHead = await getGitResult('git rev-parse HEAD~1');
  }

  const curHead = await getGitResult('git rev-parse HEAD');
  const diffFiles = await getGitResult(`git diff --name-only ${curHead} ${preHead}`);
  const files = diffFiles.split(/\n/);
  // console.log(
  //   colors.bgGreen(`'未处理文件：
  //   ${diffFiles}`)
  //   // Array.isArray(files)
  // );
  const status = await getGitResult('git status');
  if (status.includes('nothing to commit, working tree clean')) {
    // 已经提交本地的代码
    // 当前目录
    let curDir = await getGitResult('git rev-parse --git-dir');
    curDir = curDir.replace('.git', '');
    const unresolved = files.filter(file => /\.(png|jpg|gif|jpeg|svg)$/.test(file)).map(file => curDir + file);
    // console.log(unresolved, '----unresolved');
    if (unresolved.length === 0) {
      console.log(colors.bgGreen('未发现需要压缩的文件'));
      return;
    }
    // console.log(unresolved, '----unresolved');
    runImagemin(unresolved);
  } else {
    console.log(colors.red('尚有代码未提交，请提交后操作!'));
  }
};
// console.log(process.argv, '---argv');
getGitDiff();
