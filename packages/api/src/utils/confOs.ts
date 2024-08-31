/**
 *  程序在window中运行，
 *  由于systemApi等api函数也需要使用此判定，估无法使用systemApi支持
 */
declare type OSTYPES = 'mac' | 'win' | 'win32';
let _cacheOs: OSTYPES | undefined = undefined;

export const getOs: () => OSTYPES = () => {
  if (typeof _cacheOs !== 'undefined') {
    return _cacheOs;
  }
  const DEFAULT_OS = 'mac';
  let res: 'mac' | 'win' | 'win32' = DEFAULT_OS;

  if (typeof window === 'undefined') {
    res = DEFAULT_OS;
    return res;
  }

  if (window && window.electronLib) {
    const uaStr = navigator.userAgent;
    if (/windows\s*(?:nt)?\s*[._\d]*/i.test(uaStr)) {
      const DEFAULE_WIN_OS = 'win';
      if (window && window.process) {
        if (window.process.arch === 'ia32') {
          res = 'win32';
        } else if (window.process.arch === 'x64') {
          res = 'win';
        } else {
          res = DEFAULE_WIN_OS;
        }
      } else {
        res = DEFAULE_WIN_OS;
      }
    } else if (/mac os x/i.test(uaStr)) {
      res = 'mac';
    }
  }
  _cacheOs = res;
  return res;
};
