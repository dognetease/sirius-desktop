const exec = require('child_process').exec;
const colors = require('colors');
const GITDIFF = 'git diff';
// 执行 git 的命令
exec(GITDIFF, (error, stdout) => {
  if (error) {
    console.error(`exec error: ${error}`);
  }

  console.log(colors.bgRed(stdout), '---000');
  // 对返回结果进行处理，拿到要检查的文件列表
  // const diffFileArray = stdout.split('\n').filter((diffFile) => (
  //     /(\.js|\.jsx)(\n|$)/gi.test(diffFile)
  // ));
  // console.log('待检查的文件：', diffFileArray);
});
