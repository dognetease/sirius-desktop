import { getIn18Text, api, apis, DataTrackerApi, NetStorageApi, MailFileAttachModel, MailConfApi, AccountApi, FileType } from 'api';
import message from '@web-common/components/UI/Message/SiriusMessage';
import SiriusModal from '@web-common/components/UI/Modal/SiriusModal';
import { ATTACHMENT_KEYS } from '@web-mail/common/components/vlistCards/MailCard/DefaultAttachment';
import cloneDeep from 'lodash/cloneDeep';
import { IMG_TYPES } from '@web-mail/common/constant';
import { getFileExt } from '@web-common/utils/file';
import { DataType } from '@web-common/components/UI/ImagePreview/type';
import ImgPreview from '@web-common/components/UI/ImagePreview';

const trackApi = api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;
const diskApi = api.requireLogicalApi(apis.netStorageImpl) as NetStorageApi;
const accountApi = api.requireLogicalApi(apis.accountApiImpl) as AccountApi;
const mailConfApi = api.requireLogicalApi(apis.mailConfApiImpl) as MailConfApi;
const httpApi = api.getDataTransApi();
const systemApi = api.getSystemApi();

interface ImagePreviewType extends DataType {
  previewUrl: string;
  downloadUrl: string;
}

export const normalizeShareUrl = (url: string) => (url.indexOf('http') === 0 ? url : `https://${url}`);

export const isImage = (fileName: string, _fileType?: FileType | string) => {
  const fileType = _fileType || getFileExt(fileName);
  return IMG_TYPES.includes(fileType);
};

export const openImgAttachment = (item: ImagePreviewType) => {
  const onList: DataType[] = [];
  onList.push({
    ...item,
    nonOriginal: item.nonOriginal === undefined ? true : item.nonOriginal,
  });
  ImgPreview.preview({ data: onList, startIndex: 0 });
};

export const openDiskFile = (item: { expireTime: number; identity: string; downloadUrl?: string; fileName: string; fileSize: number }) => {
  trackApi.track('pcMail_view_mailAttachmentsSpace', { spaceTab: getIn18Text('YOUJIANYUNFUJIAN') });
  const { fileName } = item;
  // 已过期文件提示
  if (DeleteFileToast(item.expireTime)) return;
  diskApi
    .previewCloudAtt({ identity: item.identity })
    .then(data => {
      if (data) {
        const shareUrl = normalizeShareUrl(data);
        if (systemApi.isElectron()) {
          const ts = Date.now();
          const downloadUrl = item.downloadUrl;
          systemApi.createWindowWithInitData('resources', {
            eventName: 'initPage',
            eventData: {
              hash: `${location.href}/resources/#identity=${item.identity}&type=attachment`,
              type: 'attachment',
              downloadContentId: ts,
              downloadId: 0,
              fileName: item.fileName,
              attachments: [
                {
                  from: 'cloudAttCont',
                  filePreviewUrl: shareUrl,
                  fileUrl: downloadUrl,
                  id: item.identity,
                  name: fileName,
                  fileName,
                  fileSize: item.fileSize,
                  fileSourceType: 3,
                  type: 'url',
                  cloudAttachment: true,
                  fileSourceKey: item.identity,
                  downloadContentId: ts,
                  downloadId: 0,
                },
              ],
            },
          });
        } else {
          systemApi.openNewWindow(shareUrl);
        }
      }
    })
    .catch(error => {
      message.error({ content: error?.data?.message || getIn18Text('HUOQUYULANDE') });
    });
};

export const openShareUrl = (shareUrl: string) => {
  if (systemApi.isElectron()) {
    systemApi.handleJumpUrl(-1, shareUrl);
  } else {
    systemApi.openNewWindow(shareUrl);
  }
};

const DeleteFileToast = (expireTime: number): boolean => {
  // 已过期文件提示
  if (expireTime != null && expireTime !== 0 && expireTime < Date.now()) {
    // 过期提示
    SiriusModal.error({
      title: getIn18Text('WENJIANBUCUNZAI'),
      content: null,
    });
    return true;
  }
  return false;
};

export const openWebPreview = (_downloadInfo: MailFileAttachModel, _composeId?: string, _account?: string) => {
  const downloadInfo = cloneDeep(_downloadInfo);
  if (_account) {
    downloadInfo._account = _account;
    updateFileAttachment(downloadInfo, _account);
  }
  const searchStrArr: string[] = [];
  const composeId = _composeId || _downloadInfo.contentId;
  if (composeId) {
    downloadInfo.downloadContentId = composeId;
    searchStrArr.push('attType=1');
  }
  (ATTACHMENT_KEYS as Array<keyof MailFileAttachModel>).forEach(k => {
    const value = ((downloadInfo && downloadInfo[k]) || '') as string;
    if (value) {
      searchStrArr.push(`${k}=${encodeURIComponent(value)}`);
    }
  });
  let searchStr = searchStrArr.join('&');
  window.open(`${systemApi.getContextPath()}/attachment/?outDownloadContentId=${encodeURIComponent(downloadInfo?.downloadContentId as string)}&${searchStr}`);
};

export const openWebAttach = (downloadContentId: string, filePreviewUrl: string, fileName: string) => {
  window.open(
    `${systemApi.getContextPath()}/attachment/?downloadContentId=${encodeURIComponent(downloadContentId)}&filePreviewUrl=${encodeURIComponent(
      filePreviewUrl
    )}&fileName=${encodeURIComponent(fileName)}`
  );
};

const getNewUrlWithNewToken = (account: string, url: string) => {
  try {
    if (account && url) {
      let resUrl = url;
      const hasToken = url.indexOf('_token') > -1;
      if (hasToken) {
        const newToken = mailConfApi.getTokenBySubAccount(account);
        resUrl = newToken ? url.replace(/(\?|&|%3F|%26)_token(=|%3D)[0-9a-zA-Z*\-_.]+/gi, '$1_token$2' + newToken) : url;
      }
      const hasSid = url.indexOf('sid') > -1;
      if (hasSid) {
        const accountUser = systemApi.getCurrentUser(account);
        if (accountUser) {
          const newSid = accountUser.sessionId ? accountUser.sessionId : '';
          if (newSid) {
            resUrl = url.replace(/(\?|&|%3F|%26)sid(=|%3D)[0-9a-zA-Z*\-_.]+/gi, '$1sid$2' + newSid);
          }
        }
      }
      return resUrl;
    }
    return url;
  } catch (ex) {
    console.error(`getNewUrlWithNewToken error`, ex);
    return url;
  }
};

const updateFileAttachment = (fileAttach: MailFileAttachModel, account: string) => {
  if (fileAttach) {
    if (fileAttach.filePreviewUrl) {
      fileAttach.filePreviewUrl = getNewUrlWithNewToken(account, fileAttach.filePreviewUrl || '');
    }
    if (fileAttach.fileUrl) {
      fileAttach.fileUrl = getNewUrlWithNewToken(account, fileAttach.fileUrl || '');
    }
  }
};

export const buildPreviewUrl = (item: MailFileAttachModel, _account?: string) => {
  const user = systemApi.getCurrentUser(_account);
  if (!user) {
    console.error('buildPreviewUrl error 必须登录');
    return '';
  }
  const subAccount = accountApi.getEmailIdByEmail(_account || user.id);
  const isCorpMail = systemApi.getIsCorpMailMode();
  const host = isCorpMail ? user.domain : mailConfApi.getWebMailHost(true, subAccount).replace(/^.*?:\/\//, '');
  const req = {
    product: 'MAIL',
    fullFileName: item.fileName,
    sid: user.sessionId,
    uid: user.id,
    mid: item.contentId || item.downloadContentId,
    attType: item.contentId ? '1' : '0',
    part: item.id + '',
    host,
    _session: '',
  };
  return httpApi.buildUrl(systemApi.getUrl('filePreview'), req);
};
