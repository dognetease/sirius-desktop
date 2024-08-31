import { apiHolder, NIMApi } from 'api';
import { THUMBNAIL_SIZE as _THUMBNAIL_SIZE } from './const';

const nimApi = apiHolder.api.requireLogicalApi('NIM') as unknown as NIMApi;

interface thumbnailConfig {
  height: number;
  width: number;
}

// 获取图片缩略图
export const getThumbnailImg = async (url: string, thumbnailConfig: thumbnailConfig) => {
  // 如果是本地图片
  if (url.indexOf('blob') !== -1) {
    return url;
  }
  const params = {
    url,
    strip: true,
    interlace: true, // 渐变清晰
    thumbnail: { ...thumbnailConfig, mode: 'contain' },
  };
  const newImgUrl = await nimApi.excuteSync('viewImageSync', params);
  return newImgUrl;
};

// 不支持播放的视频
export const notSupportVideo = (type: string, codeFormat: string) =>
  type === 'video' && (!codeFormat || codeFormat.indexOf('hevc') > -1 || codeFormat.indexOf('mpeg4') > -1);

// THUMBNAIL_SIZE以上使用缩略图
export const THUMBNAIL_SIZE = _THUMBNAIL_SIZE;
// size-文件大小，height/width-图片宽高，norm-基准标准, limit单位B，表示在什么图片大于limit条件下使用缩略图，默认3M = 1024K * 1024B * 3
export const getThumbnailBenchmark = (size: number, height: number = 0, width: number = 0, norm: number = 300, limit: number = THUMBNAIL_SIZE) => {
  let benchmark = 0;
  if (size > limit) {
    // 默认意外获取不到宽高，取最大值
    benchmark = Math.max(height, width);
    // 正常情况取和norm对比的最小值，以宽高中较大值为基础
    if (height && width) {
      benchmark = Math.min(norm, height / width > 1 ? height : width);
    }
  }
  return benchmark;
};

// 图片是否是gif或blob或ico格式，用于判断是否可压缩
export const isGifOrBlobOrIco = (imgInfo: File) => ['gif', 'ico'].includes(imgInfo?.ext?.toLocaleLowerCase()) || (imgInfo?.url as string)?.indexOf('blob') !== -1;
