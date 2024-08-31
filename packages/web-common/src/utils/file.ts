import { Attachment } from '@web-common/state/state';

/**
 * 格式化小数，保留指定小数位，末尾的0不展示
 * @example toFixed(1.001, 2) => 1
 * @param num 需格式化的数字
 * @param figure 需要保留的小数位
 * @returns {number}
 */
export const toFixed = (num: number, figure: number = 0): number => {
  const base = Math.pow(10, figure);
  return Math.round(num * base) / base;
};

/**
 * 格式化文件大小
 * @param size
 * @param base
 * @returns {string}
 */
export const formatFileSize = (size: number, base: number = 1000): string => {
  if (typeof size !== 'number') {
    return '';
  }
  let baseSize = Math.pow(base, 3);
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
  //  const base = Math.pow(1000, index);
  const base = 1000 ** index;
  return toFixed(size / base, figure);
};

/**
 * 获取文件后缀名
 * @param filename
 * @returns {string}
 */
export const getFileExt = (filename: string): string => (!filename || !filename.length ? '' : filename.replace(/.+\.(?=\w+$)/, '').toLowerCase());

export const isDuplicateFile = (file1: Attachment, file2: Attachment) =>
  file1.size === file2.size && file1.name === file2.name && file1.type === file2.type && file1.mailId === file2.mailId;
