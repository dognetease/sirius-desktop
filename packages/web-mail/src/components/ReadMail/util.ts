import { apiHolder as api, SystemApi, conf as config } from 'api';
import sampleSize from 'lodash/sampleSize';
// import { config } from 'env_def';
import lodashGet from 'lodash/get';
import { isSupportPaste } from '@web-common/components/UI/ContextMenu/util';
import { safeDecodeURIComponent } from '@web-common/utils/utils';

const systemApi = api.api.getSystemApi() as SystemApi;
const inElectron = systemApi.isElectron();
const fileApi = api.api.getFileApi();
const httpApi = api.api.getDataTransApi();
// 已废弃，直接拼接body
// export const CONTENT_ID = '_sirius_content_id_';
const contextPath = config('contextPath') as string;

/**
 * 邮件正文body修改为position:absolute;让其高度只根据内部内容变化，不受外部窗体高度的变化。防止出现递归增高的问题。
 *
 */
const headers = `
<head>
<base target="_blank" />
<style type="text/css">
img{cursor:zoom-in;}
</style>
<style id="imgMaxWidth" type="text/css">
</style>
<style id="cloudAttachStyle" type="text/css">
</style>
<style type="text/css">
body{font-size:14px;font-family:arial,verdana,sans-serif;line-height:1.666;padding:0;margin:0;overflow:auto;white-space:normal;word-wrap:break-word;min-height:100px;position:absolute;width:100%;}
td, input, button, select, body{font-family:Helvetica, 'Microsoft Yahei', verdana}
pre {white-space:pre-wrap;white-space:-moz-pre-wrap;white-space:-pre-wrap;white-space:-o-pre-wrap;word-wrap:break-word;width:95%}
th,td{font-family:arial,verdana,sans-serif;line-height:1.666}
img{ border:0}
header,footer,section,aside,article,nav,hgroup,figure,figcaption{display:block}
blockquote{margin-right:0px}
a > img {cursor:pointer !important}
</style>
<style id="ntes_link_color" type="text/css">a,td a{color:#386EE7}</style>
<style id="blockquoteStyle" type="text/css">blockquote{}</style>
<link rel="stylesheet" type="text/css" href="${contextPath}/read_mail.css">
</head>
`;

const mailTemplatePreviewHeaders = `
<head>
<base target="_blank" />
<style type="text/css">
img{cursor:zoom-in;}
</style>
<style id="imgMaxWidth" type="text/css">
</style>
<style id="cloudAttachStyle" type="text/css">
</style>
<style type="text/css">
body{font-size:14px;font-family:arial,verdana,sans-serif;line-height:1.666;padding:0;margin:0;overflow:auto;white-space:normal;word-wrap:break-word;min-height:100px;position:absolute;width:100%;}
td, input, button, select, body{font-family:Helvetica, 'Microsoft Yahei', verdana}
pre {white-space:pre-wrap;white-space:-moz-pre-wrap;white-space:-pre-wrap;white-space:-o-pre-wrap;word-wrap:break-word;width:95%}
th,td{font-family:arial,verdana,sans-serif;line-height:1.666}
img{ border:0}
header,footer,section,aside,article,nav,hgroup,figure,figcaption{display:block}
blockquote{margin-right:0px}
a > img {cursor:pointer !important}
body::-webkit-scrollbar {display: none;}
</style>
<style id="ntes_link_color" type="text/css">a,td a{color:#386EE7}</style>
<style id="blockquoteStyle" type="text/css">blockquote{}</style>
<link rel="stylesheet" type="text/css" href="${contextPath}/read_mail.css">
</head>
`;

const mailContentWrapper = (content: string) => `
${content}
<script  type="text/javascript" src="${contextPath}/read_mail1.js"></script>
<script  type="text/javascript" src="${contextPath}/read_mail_find.js"></script>
`;

/**
 *  <!DOCTYPE html> 标记一定要存在，防止文档流进入 怪异模式，导致一些奇奇怪怪的问题
 */
const readWrapper = (mailContent?: string) => `<!DOCTYPE html><html>${headers}${mailContentWrapper(mailContent || '')}</html>`;

// 新建个人模板预览
export const mailTemplatePreviewWrapper = (mailContent?: string) => `<!DOCTYPE html><html>${mailTemplatePreviewHeaders}${mailContentWrapper(mailContent || '')}</html>`;

// 外贸0415临时，等上面的 readWrapper 在办公1.20验证没问题后，就可以替换为上面的 by zhouhao
export const readWrapperNoAdjustImage = (mailContent: string) => `${headers}${mailContentWrapper(mailContent)}`;

const writeImagePng = (base64Url: string) => {
  const image = new Image();
  image.onload = async () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = image.width;
    canvas.height = image.height;
    if (ctx !== null && ClipboardItem && (await isSupportPaste())) {
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      ctx.drawImage(image, 0, 0);
      canvas.toBlob(async blob => {
        navigator.clipboard.write([
          new ClipboardItem({
            [blob.type]: blob,
          }),
        ]);
      });
    }
    image.remove();
    canvas.remove();
  };
  image.src = base64Url;
};

export const getImageFormatFromUrl = (url: string, fileName: string, formatType: string = 'base64'): Promise<any> =>
  new Promise((resolve, reject) => {
    // 获取blob图片
    const noContentTypeInit = url && url.includes('cowork-storage.nos-jd.163yun.com') ? true : false;
    httpApi
      .get(
        url,
        {},
        {
          responseType: 'blob',
          ...(noContentTypeInit ? { contentType: '' } : {}),
        }
      )
      .then(data => {
        const blob = data.rawData;
        if (!blob) {
          reject();
        }
        if (formatType === 'blob') {
          resolve(blob);
        }
        // blob转成base64
        const file = new File([blob], fileName, { type: fileName });
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = e => {
          const base64Url = lodashGet(e, 'target.result', '') as string;
          // 写入一份png图片，用于非IM的图片粘贴
          writeImagePng(base64Url);
          // 返回去写入一份图片真实格式图片，用于IM的图片粘贴
          resolve(base64Url);
        };
      });
  }).catch(() => Promise.reject());

export const handleCopyImg = async (imgNode?: HTMLImageElement, src: string = '', ext: string = 'png') => {
  const imgDataURL = await getImageFormatFromUrl(src, `image/${ext}`);
  imgDataURL && fileApi.clipboardWriteImage(imgDataURL);
};

export const randomName = () => `Lingxi_IMG_${sampleSize('0123456789'.split(''), 5).join('')}.png`;

export function downloadImg(url?: string, name?: string, fid?: number, fileOriginUrl?: string) {
  if (!url) {
    return;
  }
  const fileName = name || randomName();
  if (!inElectron) {
    const a = document.createElement('a');
    const event = new MouseEvent('click');
    a.download = fileName;
    a.target = '_blank';
    a.href = url;
    a.dispatchEvent(event);
  } else {
    const params = {
      fileName,
      fileUrl: url,
      fileSourceType: 3,
      fid,
      fileOriginUrl,
    };
    fileApi.saveDownload(params);
  }
}

/**
 * 解析 url 中的参数
 * @param url
 */
export function parseUrlParams(url: string) {
  const params: any = {};
  try {
    url = safeDecodeURIComponent(url);
    if (!url || url === '' || typeof url !== 'string') {
      return params;
    }
    const path = url.split('?')[0];
    params.path = path;
    const paramsStr = url.split('?')[1];
    if (!paramsStr) {
      return params;
    }
    const paramsArr = paramsStr.split('&');
    for (let i = 0; i < paramsArr.length; i++) {
      const key = paramsArr[i].split('=')[0];
      const value = paramsArr[i].split('=')[1];
      params[key] = value === 'true' ? true : value === 'false' ? false : value;
    }
  } catch (error) {
    console.error('Error parsing URL params:', error);
  }
  return params;
}

export default readWrapper;
