import path from 'path';
import fse from 'fs-extra';

export const util = {
  setDownloadFileName(downloadPath: string, fileName?: string, extName?: string, fileMaxCount = 2000) {
    // eslint-disable-next-line prefer-const
    let { name: frontName = '', ext = '' } = fileName ? path.parse(fileName) : {};
    ext = extName || ext;
    // const ext = extName || (fileName ? path.extname(fileName) : '.');
    // const frontName = fileName ? path.(fileName) : '';
    console.log('[saveDialog getFileName] frontName', frontName, ext);
    const filesName = fse.readdirSync(downloadPath);
    let bool = true;
    let i = 0;
    let realName = '';
    while (bool && i < fileMaxCount) {
      realName = frontName + (i ? ' (' + i + ')' : '') + ext;
      console.log('[saveDialog getFileName] realName', realName);
      if (!filesName.includes(realName)) {
        bool = false;
      } else {
        i++;
      }
    }
    return realName;
  },
};
/**
 * 获取 base64 图片字节
 * @param base64 - base64 字符串
 */
export const getBase64Bytes = (base64: string): number => {
  if (!/^data:.*;base64/.test(base64)) return 0;

  const data = base64.split(',')[1].split('=')[0];
  const { length } = data;

  return Math.floor(length - (length / 8) * 2);
};
