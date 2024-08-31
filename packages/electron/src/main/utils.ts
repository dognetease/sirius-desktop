// import { Session } from 'electron';
// import { downloadManage } from './downloadManage';

function execShellByCmd(command: string): Promise<{ success: boolean; result: Array<string>; rawOut: string }> {
  return new Promise((resolve, reject) => {
    try {
      const childProcess = require('child_process');
      childProcess.exec(command, (err: Error, stdout: string, stderr: string) => {
        if (err) {
          reject(err);
          return;
        }
        // 去掉\r\n
        let stdOutArr = stdout.toString().split('\r\n') || [];
        stdOutArr = stdOutArr.filter(lineVal => {
          // 过滤空字符
          if (!lineVal) {
            return false;
          }
          return true;
        });
        resolve({
          success: true,
          result: stdOutArr,
          rawOut: stdout,
        });
      });
    } catch (err: any) {
      reject(err);
    }
  });
}

/**
 * 执行shell的cmd命令
 * @param cmd
 */
export function execShellCmd(cmd: string, cwd: string | null = process.cwd(), shell?: string | null): Promise<string> {
  return new Promise((resolve, reject) => {
    const childProcess = require('child_process');
    if (process.platform !== 'win32') {
      shell = null;
    }
    const options: { cwd?: string | null; shell?: null | string } = { cwd: null, shell: null };
    if (cwd) {
      options.cwd = cwd;
    } else {
      delete options.cwd;
    }
    if (shell) {
      options.shell = shell;
    } else {
      delete options.shell;
    }
    childProcess.exec(cmd, options, (err: Error, stdout: string, stderr: string) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(stdout);
    });
  });
}

function getNumInGB(bytesNum: number, fixedCount: number = 1): number {
  if (!bytesNum) return 0;
  let res = bytesNum / 1024 / 1024 / 1024;
  return Number.parseFloat(res.toFixed(fixedCount));
}

// function initDownloadListener(session: Session) {
//   if (session && downloadManage) {
//     session.on('will-download', downloadManage.listenerDownload);
//   }
// }

const profileToAppIdMap = {
  test1: 'com.netease.sirius-desktop-test1',
  test: 'com.netease.sirius-desktop-test',
  test2: 'com.netease.sirius-desktop-test2',
  edm_test: 'com.netease.sirius-desktop-waimao-test',
  edm_test1: 'com.netease.sirius-desktop-waimao-test1',
  prev: 'com.netease.sirius-desktop-beta',
  prod: 'com.netease.sirius-desktop',
  edm_prod: 'com.netease.sirius-desktop-waimao',
  edm_test_prod: 'com.netease.sirius-desktop-waimao',
  test_prod: 'com.netease.sirius-desktop',
};

export default {
  execShellByCmd,
  execShellCmd,
  getNumInGB,
  profileToAppIdMap,
  // initDownloadListener,
};
