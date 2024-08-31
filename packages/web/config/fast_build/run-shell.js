const shell = require('shelljs');

// 同步
console.log(process.argv);
if (process.argv.includes('-y')) {
  shell.exec('');
}
