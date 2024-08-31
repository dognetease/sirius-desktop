// 下载、解密、转存媒体文件

import decryptMedia from './decryptMedia';
import { NosUploader, ResponseNSUploadInfo } from './nosUploader';

const DEFAULT_MEDIA_HOST = 'https://media-hkg4-2.cdn.whatsapp.net';

export interface MediaInfo {
  mediaKey: string;
  mediaType: string;
  mimeType: string;
  hash: string;

  filename?: string;
  directPath: string;
  encFileHash: string;
}

function download(url: string) {
  return fetch(url).then(res => res.arrayBuffer());
}

function decrypt(buffer: ArrayBuffer, mediaInfo: MediaInfo) {
  return decryptMedia(buffer, mediaInfo.mediaKey, mediaInfo.mediaType);
}

function upload(file: File, mediaInfo: MediaInfo): Promise<ResponseNSUploadInfo> {
  const uploader = new NosUploader(file, mediaInfo.hash);
  return new Promise((resolve, reject) => {
    uploader.on('complete', resolve);
    uploader.on('error', reject);
    uploader.startUpload();
  });
}

export const mediaHandler = async (mediaInfo: MediaInfo) => {
  const url = `${DEFAULT_MEDIA_HOST}${mediaInfo.directPath}&hash=${mediaInfo.encFileHash}`;

  return download(url)
    .then(buff => decrypt(buff, mediaInfo))
    .then(buffer => {
      const blob = new Blob([buffer], { type: mediaInfo.mimeType });
      const file = new File([blob], mediaInfo.filename ? mediaInfo.filename : mediaInfo.hash, {
        type: mediaInfo.mimeType,
      });

      // todo 上传到nos
      return upload(file, mediaInfo).then(
        res => {
          console.log('uploaded', res);
          return { bucketName: res.bucketName, nosKey: res.nosKey };
        },
        e => {
          console.error(e);
          throw e;
        }
      );
    });
};

export default mediaHandler;
