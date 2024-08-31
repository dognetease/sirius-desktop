import { api, apis, HtmlApi, getOs, MailFileAttachModel } from 'api';

const htmlApi = api.requireLogicalApi(apis.htmlApi) as HtmlApi;
const isMac = getOs() === 'mac';

/**
 * 格式化小数，保留指定小数位，末尾的0不展示
 * @example toFixed(1.001, 2) => 1
 * @param num 需格式化的数字
 * @param figure 需要保留的小数位
 * @returns {number}
 */
export const toFixed = (num: number, figure: number = 0): number => {
  const base = window.Math.pow(10, figure);
  return window.Math.round(num * base) / base;
};

/**
 * 格式化文件大小
 * @param size
 * @param base
 * @returns {string}
 */
export const formatFileSize = (size: number, base?: number): string => {
  base = base || isMac ? 1024 : 1000;
  let baseSize = window.Math.pow(base, 3);
  if (size >= baseSize) {
    return toFixed(size / baseSize, 1) + 'G';
  }
  baseSize /= base;
  if (size >= baseSize) {
    return toFixed(size / baseSize, 1) + 'M';
  }
  baseSize /= base;
  if (size >= baseSize) {
    return toFixed(size / baseSize, 1) + 'K';
  }
  return toFixed(size, 1) + 'B';
};

/**
 * 按照指定单位转换文件大小
 * @param size 文件字节数
 * @param unit 指定单位：B/K/M/G/T
 * @param figure 保留小数位
 * @returns {number}
 */
export const sizeTransform = (size: number, unit: string = 'M', figure: number = 1): number => {
  const units = ['B', 'K', 'M', 'G', 'T'];
  const index = units.indexOf(unit);
  if (index === -1) {
    return size;
  }
  const base = window.Math.pow(1000, index);
  return toFixed(size / base, figure);
};

/**
 * 获取文件后缀名
 * @param filename
 * @returns {string}
 */
export const getFileExt = (filename: string): string => filename.replace(/.+\.(?=\w+$)/, '').toLowerCase();

/**
 * 下载文件
 * @param data
 * @param name
 */
export const downloadFile = (data: Blob, name: string) => {
  const blob = new Blob([data]);
  const downloadElement = document.createElement('a');
  const href = window.URL.createObjectURL(blob);
  downloadElement.href = href;
  downloadElement.download = name;
  document.body.appendChild(downloadElement);
  downloadElement.click();
  document.body.removeChild(downloadElement);
  window.URL.revokeObjectURL(href);
};

// 邮件附件名称转义
export const decodeAttFileName = (fileName: string) => {
  let res = '';
  try {
    res = decodeURIComponent(fileName);
  } catch {
    res = fileName;
  }
  return htmlApi.decodeHtml(htmlApi.encodeHtml(res));
};

export const getSuffix = (downloadInfo: MailFileAttachModel): string => {
  const { fileType: type, unDecrypted } = downloadInfo;
  if (type && type !== 'other' && !unDecrypted) return type;
  const arr = downloadInfo?.fileName?.split('.');
  if (arr.length == 1) return 'other';
  return arr[arr.length - 1] as string;
};
