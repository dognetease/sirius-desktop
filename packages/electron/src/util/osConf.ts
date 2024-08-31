declare type OS_TYPES = 'win' | 'win32' | 'mac';

const _innerGetOs: () => OS_TYPES = () => {
  if (process) {
    if (process.platform === 'darwin') {
      return 'mac';
    } else if (process.platform === 'win32') {
      const archMap: { [key: string]: OS_TYPES } = {
        ia32: 'win32',
        x64: 'win',
      };
      const osRes = archMap[process.arch] || 'win';
      return osRes;
    }
  }
  return 'mac';
};

let _cacheRes: OS_TYPES | undefined = undefined;

export const getOs: () => OS_TYPES = () => {
  if (typeof _cacheRes !== 'undefined') {
    return _cacheRes;
  }

  _cacheRes = _innerGetOs();
  return _cacheRes;
};
