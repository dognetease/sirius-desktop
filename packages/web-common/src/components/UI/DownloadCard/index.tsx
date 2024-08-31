/* eslint-disable jsx-a11y/mouse-events-have-key-events */
import React, { useState, useEffect, useRef, useMemo, DragEvent } from 'react';
import { Dropdown, Menu, Modal } from 'antd';
import classnames from 'classnames';
import {
  apiHolder as api,
  SystemApi,
  MailFileAttachModel,
  FileApi,
  EventApi,
  FileAttachModel,
  LoaderResult,
  StringMap,
  DataTransApi,
  FileType,
  apis,
  MailApi,
  FileLoaderActionConf,
  AccountApi,
  FsSaveRes,
  PerformanceApi,
  DataTrackerApi,
  MailConfApi,
  DownloadReminderInfo,
  WriteMailInitModelParams,
} from 'api';
import IconCard, { IconMapKey } from '../IconCard';
import { decodeAttFileName, formatFileSize, getSuffix } from '@web-common/components/util/file';
import SiriusMessage from '../Message/SiriusMessage';
import { AttachmentActions, useActions } from '@web-common/state/createStore';
import ImgPreview from '../ImagePreview';
import useSingleAndDoubleClick from '@web-common/hooks/useDoubleClick';
import TransferButton from './TranferButton';
import { DataType } from '../ImagePreview/type';
import styles from './index.module.scss';
import Alert from '@web-common/components/UI/Alert/Alert';
import { FormatExpiredDate } from '@web-mail/common/components/FormatExpireDate';
import { ATTACHMENT_KEYS } from '@web-mail/common/components/vlistCards/MailCard/DefaultAttachment';
import { AttachCardConfig } from '@web-mail/types';
import { getIn18Text } from 'api';
import { isMainAccount } from '@web-mail/util';

type DownloadFrom = 'mail' | 'chat';
type FileStatus = 'downloadFailed' | 'downloaded' | 'downloadStart' | 'downloading' | 'initial';
// 是否过期
const isExpired = (expireTime?: number): boolean => {
  return expireTime != null && expireTime !== 0 && expireTime < Date.now();
};
// 过期提示
const DeleteFileAlert = (expireTime?: number): boolean => {
  // 已过期文件提示
  if (isExpired(expireTime)) {
    // 过期提示
    Alert.error({
      title: getIn18Text('WENJIANBUCUNZAI'),
      content: null,
    });
    return true;
  }
  return false;
};

// 转发附件
const forwardAtt = (downloadInfo: MailFileAttachModel) => {
  console.log('forwardAttforwardAtt', downloadInfo);
  const { cloudAttachment } = downloadInfo;
  // 云附件
  if (cloudAttachment) {
    const { fileName, fileSize, fileUrl: downloadUrl, cloudIdentity, expireTime } = downloadInfo as any;
    if (expireTime != null && expireTime !== 0 && expireTime < Date.now()) {
      // 过期提示
      return Alert.error({ title: getIn18Text('WENJIANBUCUNZAI'), content: null });
    }
    if (!cloudIdentity || !downloadUrl || !fileSize || !fileName) {
      return Alert.error({ title: '转发失败', content: null });
    }
    const payloadObj: MailFileAttachModel = {
      isCloud: true,
      expired: expireTime,
      downloadContentId: downloadUrl,
      downloadId: downloadUrl,
      fileName,
      fileSize,
      id: cloudIdentity,
      type: 'netUrl',
      fileUrl: downloadUrl,
    };
    const params: WriteMailInitModelParams = {
      mailType: 'common',
      writeType: 'common',
      extraOperate: `addCloudAtt payload:${JSON.stringify(payloadObj)}`,
    };
    mailApi.callWriteLetterFunc(params);
  } else {
    // 往来附件
    const { fileName, fileSize, mailId, id: partId, fileUrl } = downloadInfo as any;
    if (!mailId || !fileUrl || !fileSize || !fileName || !(partId || partId === 0)) {
      return Alert.error({ title: '转发失败', content: null });
    }
    const payloadObj: MailFileAttachModel = {
      isCloud: false,
      expired: 0,
      fileName,
      fileSize,
      fileUrl,
      type: 'fromInternalMail',
      midOfSourceMail: mailId,
      partOfSourceMail: partId,
    };
    const params: WriteMailInitModelParams = {
      mailType: 'common',
      writeType: 'common',
      extraOperate: `addNormalAtt payload:${JSON.stringify(payloadObj)}`,
    };
    mailApi.callWriteLetterFunc(params);
  }
};

interface Props {
  from: DownloadFrom;
  downloadInfo: MailFileAttachModel;
  className?: string;
  cancel?: () => void;
  id?: string;
  noneMoreOperate?: boolean; // 无更多操作按钮
  irrevocable?: boolean; // 附件下载过程中是否是不可取消的 false: 可以取消  true: 不可取消
  attachments?: MailFileAttachModel[];
  mid?: string;
  fid?: number;
  // 是否显示附件预览按钮
  showCloudPreview?: boolean;
  // 是否显示保存到个人网盘
  showSaveForward?: boolean;
  syncRequestFileInfo?: () => Promise<MailFileAttachModel>;
  attactCardConfig?: AttachCardConfig;
  // 不具备任何操作交互，仅用于展示
  // noAnyOperate?: boolean;
  //分账号
  _account?: string;
  source?: string;
  isTpMail?: boolean; // 是否是第三方邮件（外贸通下属），第三方邮件不展示转发功能
}
enum OperateStatus {
  download,
  pause,
  abort,
  continue,
  reDownload,
  delete,
}
interface DownloadConfig {
  choosePath?: boolean;
  afterSucOpenFile?: boolean;
  afterSucOpenDir?: boolean;
  defaultPath?: string;
  // 对于已下载文件的再次下载，不展示进度条，不再改变已下载状态，不进入数据库
  repeatDownload?: boolean;
  opt?: string;
}
const systemApi = api.api.getSystemApi() as SystemApi;
const inElectron = systemApi.isElectron();
const fileApi = api.api.getFileApi() as FileApi;
const eventApi = api.api.getEventApi() as EventApi;
const httpApi = api.api.getDataTransApi() as DataTransApi;
const mailApi = api.api.requireLogicalApi(apis.mailApiImpl) as MailApi;
const accountApi = api.api.requireLogicalApi(apis.accountApiImpl) as AccountApi;
const performanceApi = api.api.requireLogicalApi(apis.performanceImpl) as unknown as PerformanceApi;
const dataTrackApi = api.api.requireLogicalApi(apis.dataTrackerApiImp) as unknown as DataTrackerApi;
const mailConfApi = api.api.requireLogicalApi(apis.mailConfApiImpl) as MailConfApi;
const operateMap: StringMap = {
  [OperateStatus.download]: getIn18Text('XIAZAI'),
  [OperateStatus.pause]: getIn18Text('ZANTING'),
  [OperateStatus.abort]: getIn18Text('QUXIAO'),
  [OperateStatus.continue]: getIn18Text('JIXU'),
  [OperateStatus.reDownload]: getIn18Text('ZHONGSHI'),
  [OperateStatus.delete]: getIn18Text('SHANCHU'),
};
// const canOpenFileExt = ['doc', 'docx', 'xls', 'xlsx', 'pdf', 'ppt', 'pptx', 'txt', 'json', 'mp4', 'mp3', 'avi', 'wav', 'mov', 'md'];
const DownloadCard = (props: Props) => {
  const {
    downloadInfo,
    cancel,
    noneMoreOperate,
    className,
    id: fileId,
    from,
    irrevocable = false,
    attachments: files = [],
    mid = '',
    fid = 1,
    showSaveForward = true,
    showCloudPreview = true,
    attactCardConfig = {},
    _account = systemApi.getCurrentUser()?.id || '',
    source,
    isTpMail = false,
  } = props;
  const accountId = accountApi.getEmailIdByEmail(_account);
  // const attachmentActions = useActions(AttachmentActions);
  const isFromChat = from === 'chat';
  const isFromMail = from === 'mail';
  const [fileType, setFileType] = useState<IconMapKey>('other'); // 附件类型
  // const [leftIconType, setLeftIconType] = useState<IconMapKey>('other'); // 左侧状态icon
  // const [fileUrl, setFileUrl] = useState(''); // 下载地址
  // const [dropdownStatus, setDropdownStatus] = useState(false); // 更多操作是否展开
  const [operateVisible, setOperateVisible] = useState(true); // 操作按钮是否可见
  const [processVisible, setProcessVisible] = useState(false); // 进度条是否可见
  const [process, setProcess] = useState('0%'); // 进度条百分比
  const [fileStatus, setFileStatus] = useState<FileStatus>('initial'); // being error success before
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState(0);
  const [lockVisible, setLockModalVisible] = useState(false);
  const [operateStatus, setOperateStatus] = useState(4);
  const [cardActive, setCardActive] = useState(false);
  const abortRef = useRef(false);
  const ifMainAccount = useMemo(() => {
    const accountId = accountApi.getEmailIdByEmail(_account);
    return isMainAccount(accountId);
  }, [_account]);
  const hideCloudPreview =
    attactCardConfig.hideCloudPreview ||
    !isFromMail ||
    !operateVisible ||
    fileStatus === 'downloading' ||
    fileStatus === 'downloadFailed' ||
    downloadInfo.type === 'netfolder' ||
    downloadInfo.cloudAttachment;
  const hideChatOpenFile = attactCardConfig.hideChatOpenFile || !inElectron || !isFromChat || (fileStatus !== 'downloaded' && fileStatus !== 'initial');
  const hideChatOpenDir = attactCardConfig.hideChatOpenDir || !inElectron || !isFromChat || fileStatus !== 'downloaded';
  const hideActionOperate =
    attactCardConfig.hideActionOperate ||
    (isFromMail && fileStatus === 'initial') ||
    fileStatus === 'downloaded' ||
    (irrevocable && operateStatus === OperateStatus.abort);
  const visibleMoreOperate =
    !attactCardConfig.hideMoreOperate && !noneMoreOperate && !isFromChat && operateVisible && (fileStatus === 'downloaded' || fileStatus === 'initial');
  const realFileSize = fileSize > 0 ? formatFileSize(fileSize, 1024) : getIn18Text('WEIZHIDAXIAO');
  if (!downloadInfo) {
    return null;
  }
  const isExpired = (expireTime?: number): boolean => {
    return expireTime != null && expireTime !== 0 && expireTime < Date.now();
  };
  const downloadInitial = () => {
    setOperateStatus(OperateStatus.download);
    setProcessVisible(false);
    setProcess('0%');
    setFileStatus('initial');
  };
  const actionContinue = () => {};
  const actionAbort = () => {
    console.warn('click actionAbort');
    // accountApi.setCurrentAccount({ email: _account });
    fileApi.abortFsDownload(downloadInfo.fileUrl!);
    abortRef.current = true;
    downloadInitial();
    cancel && cancel();
  };

  // 打开下载文件
  const openFile = async () => {
    // accountApi.setCurrentAccount({ email: _account });
    const result = await fileApi.getFileInfo({ ...downloadInfo, _account });
    if (result && result.length > 0) {
      // accountApi.setCurrentAccount({ email: _account });
      fileApi.openFile({ ...result[0], _account }).then(bool => {
        if (!bool) {
          SiriusMessage.warn({ content: getIn18Text('WUFADAKAIWEN11') }).then(() => {
            downloadInitial();
          });
        }
      });
    } else {
      SiriusMessage.warn({ content: getIn18Text('WEIZHAODAOWENJIAN13') }).then(() => {
        downloadInitial();
      });
      actionAbort();
    }
  };

  // 唤起下载完成弹窗
  const revolveDownloadReminder = (reminders: DownloadReminderInfo[]) => {
    const manageReminders = reminders.map(item => {
      if (item.filePath) {
        const realFileName = window.electronLib.fsManage.getBaseName(item.filePath);
        if (realFileName) {
          return { ...item, realFileName };
        }
      }
      return item;
    });
    systemApi.createWindowWithInitData('downloadReminder', {
      eventName: 'customNotification',
      eventData: {
        eventType: 'downloadReminder',
        reminders: manageReminders,
      },
    });
  };

  // electron 下载
  const downloadFile = async (params: DownloadConfig = {}, record = false) => {
    const saveConf: FileLoaderActionConf = {
      noStoreData: params.repeatDownload,
      recordPerf: record && isFromMail,
      recordFileType: downloadInfo.type === 'netfolder' || downloadInfo.cloudAttachment ? 'cloud' : 'common',
      _account,
    };
    // choosePath是否需要去选择路径
    const { choosePath = true, afterSucOpenFile, defaultPath = '', afterSucOpenDir, opt } = params;
    let res;
    performanceApi.time({
      statKey: `mail_attachment_download_time`,
      statSubKey: systemApi.md5(downloadInfo?.fileUrl || downloadInfo?.fileOriginUrl || ''),
      ...downloadInfo,
    });
    if (choosePath) {
      // accountApi.setCurrentAccount({ email: _account });
      res = (await fileApi.saveDownload(downloadInfo, saveConf)) as LoaderResult | FsSaveRes;
    } else {
      // TODO 判断是否重名， 有重名改文件名
      let fileInfo: MailFileAttachModel;
      if (typeof props.syncRequestFileInfo === 'function') {
        // accountApi.setCurrentAccount({ email: _account });
        fileInfo = await props.syncRequestFileInfo();
      } else {
        fileInfo = downloadInfo;
      }
      const fileTarget = defaultPath ? { ...fileInfo, filePath: defaultPath } : fileInfo;
      // accountApi.setCurrentAccount({ email: _account });
      res = (await fileApi.download(fileTarget, saveConf)) as LoaderResult;
    }
    performanceApi.timeEnd({
      statKey: `mail_attachment_download_time`,
      statSubKey: systemApi.md5(downloadInfo?.fileUrl || downloadInfo?.fileOriginUrl || ''),
      ...downloadInfo,
    });
    if (!(res as LoaderResult)?.succ && !(res as FsSaveRes)?.success) {
      // 没有 path 说明直接在选择保存路径时点击了取消，就不用提示了
      if (res.path) {
        const errMsg = (res as LoaderResult)?.errMsg === 'download-net-error: cancelled' ? getIn18Text('YIQUXIAO') : getIn18Text('WENJIANBUCUNZAI');
        SiriusMessage.warn({ content: errMsg }).then();
        try {
          dataTrackApi.track('pc_mail_attachment_download_failed', {
            type: 'res_failed',
            data: { req: downloadInfo, res },
          });
        } catch (error) {
          console.log(error);
        }
      }
      return;
    }
    // 1.8.0版本去掉打开文件格式校验
    // let canOpen = false;
    // if (downloadInfo.fileName) {
    //   const fileExt = getFileExt(downloadInfo.fileName);
    //   canOpen = canOpenFileExt.includes(fileExt);
    // }
    // afterSucOpenFile && canOpen && openFile();

    // afterSucOpenFile && openFile();
    // afterSucOpenDir && openDir();
    if (res) {
      const { succ, fileModel } = res as LoaderResult;
      if (succ && fileModel) {
        if (opt && ['imOpen', 'doubleClick'].includes(opt)) {
          openFile();
        }
        const { fileName, filePath, fileType, fileSize } = fileModel;
        fileModel?.filePath &&
          revolveDownloadReminder([
            {
              fileName,
              fileType,
              fileSize,
              filePath: filePath as string,
            },
          ]);
      }
    }
  };

  const actionReDownload = () => {
    downloadFile({}, true);
  };
  const actionPause = () => {};
  const actionDelete = () => {
    return new Promise<void>(res => {
      // accountApi.setCurrentAccount({ email: _account });
      fileApi.getFileInfo({ ...downloadInfo, _account }).then(result => {
        if (result && result.length > 0) {
          // accountApi.setCurrentAccount({ email: _account });
          fileApi.delFileInfo({ ...result[0], _account });
        }
        res();
      });
    });
  };
  const downloadThrowErrorHandler = (params = {}, err: unknown) => {
    dataTrackApi.track('pc_mail_attachment_download_failed', {
      type: 'throw_error',
      data: { req: params, error: err },
    });
    performanceApi.timeEnd({
      statKey: `mail_attachment_download_time`,
      statSubKey: systemApi.md5(downloadInfo?.fileUrl || downloadInfo?.fileOriginUrl || ''),
      ...params,
    });
  };
  const actionDownload = async (params?: DownloadConfig) => {
    // 是否过期
    if (DeleteFileAlert(downloadInfo?.expired)) return;
    if (!downloadInfo || !downloadInfo.fileUrl) return;
    if (inElectron) {
      // const attachmentType = downloadInfo.type === 'netfolder' || downloadInfo.cloudAttachment ? 'netfolder' : 'download';
      if (params?.repeatDownload) {
        // 修复 SIRIUS-1312 附件下载选择了其他盘下载完成后还是默认打开系统缓存的路径
        try {
          await actionDelete();
          params.repeatDownload = false;
        } catch (error) {
          console.warn('failed remove repeat download file', error);
        }
      }
      downloadFile(params, true).catch(e => {
        downloadThrowErrorHandler(params, e);
      });
    } else if (isFromChat) {
      window.open(httpApi.buildUrl(downloadInfo.fileUrl, { download: downloadInfo.fileName }));
    } else {
      if (accountId) {
        updateFileAttachemt(downloadInfo, accountId);
      }
      console.log('downloadInfo', downloadInfo);
      window.open(downloadInfo.fileUrl);
      // systemApi.webDownloadLink(downloadInfo.fileUrl, downloadInfo.fileName);
    }
  };

  const operateAction = () => {
    switch (operateStatus) {
      case OperateStatus.download:
        actionDownload();
        break;
      case OperateStatus.pause:
        actionPause();
        break;
      case OperateStatus.abort:
        actionAbort();
        break;
      case OperateStatus.continue:
        actionContinue();
        break;
      case OperateStatus.reDownload:
        actionReDownload();
        break;
      case OperateStatus.delete:
        actionDelete();
        break;
      default:
        break;
    }
  };

  const openDir = () => {
    // accountApi.setCurrentAccount({ email: _account });
    fileApi.getFileInfo({ ...downloadInfo, _account }).then(result => {
      if (result && result.length > 0) {
        // accountApi.setCurrentAccount({ email: _account });
        fileApi.testLocalFile({ ...result[0], _account }).then(bool => {
          if (!bool) {
            // actionAbort();
            SiriusMessage.warn({ content: getIn18Text('WEIZHAODAOWENJIAN11') }).then(() => {
              downloadInitial();
            });
          }
        });
        // accountApi.setCurrentAccount({ email: _account });
        fileApi.show({ ...result[0], _account });
      } else {
        // actionAbort();
        SiriusMessage.warn({ content: getIn18Text('WEIZHAODAOWENJIAN12') }).then(() => {
          downloadInitial();
        });
        actionAbort();
      }
    });
  };
  // const saveAs = () => {
  //   if (isFromMail && inElectron && downloadInfo) {
  //     fileApi.getFileInfo(downloadInfo).then(fileInfo => {
  //       if (Array.isArray(fileInfo) && fileInfo.length > 0) {
  //         fileApi.saveAs(fileInfo[0]).catch(e => {
  //           SiriusMessage.warn({ content: '保存失败' }).then();
  //           console.error('[download] save as fail ', e);
  //         });
  //       }
  //     });
  //   }
  // };

  // im 打开文件
  const openChatFile = async () => {
    // if (noAnyOperate) {
    //   return;
    // }
    if (fileStatus === 'initial') {
      await downloadFile({ choosePath: false, afterSucOpenFile: true, opt: 'imOpen' });
    } else {
      openFile();
    }
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

  const updateFileAttachemt = (fileAttach: MailFileAttachModel, account: string) => {
    if (fileAttach) {
      if (fileAttach.filePreviewUrl) {
        fileAttach.filePreviewUrl = getNewUrlWithNewToken(account, downloadInfo.filePreviewUrl || '');
      }
      if (fileAttach.fileUrl) {
        fileAttach.fileUrl = getNewUrlWithNewToken(account, downloadInfo.fileUrl || '');
      }
    }
  };

  const imgTypes = ['jpg', 'JPG', 'jpeg', 'JPEG', 'png', 'PNG', 'svg', 'SVG', 'gif', 'GIF'];
  const openImgAttachment = () => {
    // if (noAnyOperate) {
    //   return;
    // }
    const onList = files
      .filter(i => i.downloadContentId === downloadInfo?.downloadContentId && i.fileType && imgTypes.includes(i.fileType))
      .map(i => ({
        ...i,
        nonOriginal: true,
        downloadUrl: i.fileUrl,
        previewUrl: i.filePreviewUrl,
        name: i.fileName,
        size: i.fileSize,
      })) as DataType[];
    const start = onList.findIndex(i => i.downloadId === downloadInfo.downloadId);
    if (!systemApi.isElectron() && accountId) {
      onList.forEach(item => {
        if (item.previewUrl) {
          item.previewUrl = getNewUrlWithNewToken(accountId, item.previewUrl);
        }
        if (item.downloadUrl) {
          item.downloadUrl = getNewUrlWithNewToken(accountId, item.downloadUrl);
        }
      });
    }
    ImgPreview.preview({ data: onList, startIndex: start });
  };
  const cloudPreview = () => {
    // if (noAnyOperate) {
    //   return;
    // }
    const type = downloadInfo.fileType;
    if (type && imgTypes.includes(type)) {
      openImgAttachment();
      return;
    }
    if (systemApi.isElectron() && window.electronLib) {
      if (isFromMail) {
        // todo 判断网页版
        systemApi.createWindowWithInitData('resources', {
          eventName: 'initPage',
          eventData: {
            downloadContentId: downloadInfo?.downloadContentId,
            downloadId: downloadInfo?.downloadId,
            filePreviewUrl: downloadInfo?.filePreviewUrl,
            attachments: [downloadInfo],
            _account,
            fileName,
            type: 'attachment',
            // eslint-disable-next-line max-len
            hash: `https://resources#type=attachment&mid=${downloadInfo?.contentId}&fileName=${fileName}&size=${downloadInfo?.fileSize}&downloadId=${downloadInfo?.downloadId}&downloadContentId=${downloadInfo?.downloadContentId}`,
          },
        });
      }
    } else {
      // attachmentActions.doAttachmentPreview({
      //   visible: true,
      //   downloadContentId: downloadInfo?.downloadContentId,
      //   downloadId: downloadInfo?.downloadId
      // });
      // attachmentActions.doAttachmentPreview({
      //     visible: true,
      //     downloadContentId: downloadInfo?.downloadContentId,
      //     attachments: [{ ...(downloadInfo as any) }]
      // });
      // TODO 削减参数
      if (accountId) {
        downloadInfo._account = accountId;
        updateFileAttachemt(downloadInfo, accountId);
      }
      const searchStrArr = ATTACHMENT_KEYS.map(k => `${k}=${encodeURIComponent((downloadInfo && downloadInfo[k]) || '')}`);
      let searchStr = searchStrArr.join('&');
      window.open(`${systemApi.getContextPath()}/attachment/?outDownloadContentId=${encodeURIComponent(downloadInfo?.downloadContentId as string)}&${searchStr}`);
    }
  };
  // 附件卡片单击
  const handleSingleClick = () => {
    // if (noAnyOperate) {
    //   return;
    // }
    if (!inElectron) {
      if (isFromChat && fileStatus === 'initial') {
        actionDownload({ choosePath: false, afterSucOpenFile: true });
      } else if (!hideCloudPreview && showCloudPreview) {
        cloudPreview();
      }
    }
  };
  // 附件卡片双击
  const handleDoubleClick = async () => {
    // if (noAnyOperate) {
    //   return;
    // }
    if (inElectron) {
      // 过期不可进行下列操作
      if (DeleteFileAlert(downloadInfo.expired)) {
        return;
      }
      // accountApi.setCurrentAccount({ email: _account });
      const fileInfo = await fileApi.getFileInfo({ ...downloadInfo, _account });
      // accountApi.setCurrentAccount({ email: _account });
      const isFileExist = fileInfo.length > 0 ? await fileApi.testLocalFile({ ...fileInfo[0], _account }) : false;
      if (!isFileExist) {
        // 静默下载（直接下载，不需要用户选择下载目录）+ 打开文件
        let defaultPath = '';
        if (isFromMail && window.electronLib) {
          const sep = window.electronLib.env.isMac ? '/' : '\\';
          // accountApi.setCurrentAccount({ email: _account });
          try {
            const dirPath = await mailApi.mkDownloadDir('regular', { mid, fid, _account }, window.electronLib.env.isMac ? false : true);
            defaultPath = `${dirPath}${sep}${downloadInfo.fileName}`;
          } catch (ex: any) {
            console.error(`mkDownloadDir-catch`, ex);
            SiriusMessage.warn({ content: getIn18Text('DOWNLOAD_ATTACHMENT_ERROR') });
          }
        }
        if (!defaultPath) {
          return;
        }
        // 双击下载文件并自动打开
        downloadFile({ choosePath: false, afterSucOpenFile: true, defaultPath, opt: 'doubleClick' }, true).catch(e => {
          console.error('[mail attachment] double click download', e);
          downloadThrowErrorHandler({ choosePath: false, afterSucOpenFile: true, defaultPath }, e);
        });
      } else {
        // 打开文件
        openFile();
      }
    } else {
      handleSingleClick();
    }
  };

  const clickCardAction = useSingleAndDoubleClick(handleSingleClick, handleDoubleClick, 500, false);

  const clickCard = () => {
    if (source === 'eml') return;
    clickCardAction();
  };

  const downloadStart = () => {
    // 进入下载 上传后需要更改的状态
    setFileStatus('downloading');
    // setLeftIconType('download');
    setProcessVisible(true);
    setOperateStatus(OperateStatus.abort);
  };
  const downloadSuccess = (data: FileAttachModel) => {
    setProcessVisible(false);
    setFileStatus('downloaded');
    // setLeftIconType('other');
    setFileSize(data.fileSize);
  };
  const downloadFail = () => {
    setProcessVisible(false);
    setFileStatus('downloadFailed');
    setOperateStatus(OperateStatus.reDownload);
    // setLeftIconType('downloadFail');
  };
  const handleFileStatus = (data?: FileAttachModel) => {
    if (data) {
      if (data.fileStatus === 'downloading' && !abortRef.current) {
        downloadStart();
        setProcess(data.fileDownloadProgress! * 100 + '%');
      } else if (data.fileStatus === 'downloaded') {
        downloadSuccess(data!);
      } else if (data.fileStatus === 'downloadFailed') {
        if (abortRef.current) {
          abortRef.current = false;
        } else {
          downloadFail();
        }
      } else if (data.fileStatus === 'downloadStart') {
        downloadStart();
      }
    } else {
      downloadInitial();
    }
  };
  const initInfo = async () => {
    const curFileType = getSuffix(downloadInfo);
    console.log('curFileTypecurFileType', curFileType, downloadInfo);
    setFileType(curFileType as IconMapKey);
    setFileName(downloadInfo.fileName || getIn18Text('WEIZHI'));
    setFileSize(downloadInfo.fileSize || 0);
    // setFileUrl(downloadInfo.fileUrl || '');
    if (inElectron) {
      // accountApi.setCurrentAccount({ email: _account });
      const fileInfo = await fileApi.getFileInfo({ ...downloadInfo, _account });
      console.log('[downloadCard] fileInfo', downloadInfo.fileName, fileInfo);
      const curFile = fileInfo[0];
      const curFileStatus = curFile?.fileStatus;
      if (curFileStatus === 'downloaded') {
        // accountApi.setCurrentAccount({ email: _account });
        const isExits = await fileApi.testLocalFile({ ...curFile, _account });
        if (isExits) {
          downloadSuccess(curFile);
        } else {
          // accountApi.setCurrentAccount({ email: _account });
          fileApi.delFileInfo({ ...curFile, _account });
          // accountApi.setCurrentAccount({ email: _account });
          handleFileStatus(fileApi.getFsDownloadStatus(downloadInfo.fileUrl!));
        }
      } else {
        // accountApi.setCurrentAccount({ email: _account });
        handleFileStatus(fileApi.getFsDownloadStatus(downloadInfo.fileUrl!));
      }
    } else {
      downloadInitial();
    }
  };
  useEffect(() => {
    initInfo();
    // if (noAnyOperate) {
    //   return;
    // }
    const eventId = eventApi.registerSysEventObserver('fsDownloadNotify', {
      name: 'downloadCard_' + downloadInfo.fileUrl + Math.random().toFixed(7),
      func: ev => {
        if (ev.eventStrData === downloadInfo.fileUrl) {
          const data = ev.eventData as FileAttachModel;
          handleFileStatus(data);
        }
      },
    });
    return () => {
      // console.warn('downloadCard close');
      eventApi.unregisterSysEventObserver('fsDownloadNotify', eventId);
    };
  }, [fileId]);
  const draggable = useMemo(() => {
    // return !noAnyOperate && inElectron && isFromMail;
    return inElectron && isFromMail && fileStatus === 'downloaded';
  }, [inElectron, isFromMail, fileStatus]);
  const noDragAlert = () => {
    Alert.error({
      title: getIn18Text('FUJIANXUYAOXIAZAI'),
      content: null,
      okCancel: !0,
      cancelText: getIn18Text('QUXIAO'),
      okText: getIn18Text('XIAZAIFUJIAN'),
      onOk: () => {
        actionDownload();
      },
    });
  };
  const onDragStart = async (event: DragEvent<HTMLDivElement>) => {
    if (draggable && fileStatus !== 'downloaded') {
      noDragAlert();
      return;
    }
    console.log('[start drag]', event, downloadInfo);
    // accountApi.setCurrentAccount({ email: _account });
    const fileInfo = await fileApi.getFileInfo({ ...downloadInfo, _account });
    // accountApi.setCurrentAccount({ email: _account });
    const isFileExist = fileInfo.length > 0 ? await fileApi.testLocalFile({ ...fileInfo[0], _account }) : false;
    if (!isFileExist) {
      setFileStatus('initial');
      return;
    }
    window.electronLib.fsManage.dragFile(fileInfo[0].filePath);
  };

  const menu = () => (
    <Menu className={styles.operateMenu}>
      {/* 云附件预览 */}
      {!hideCloudPreview && showCloudPreview && (
        <Menu.Item
          key="0"
          className={styles.item}
          onClick={e => {
            e.domEvent?.stopPropagation();
            showSaveForward;
            cloudPreview();
          }}
        >
          {getIn18Text('YULAN')}
        </Menu.Item>
      )}
      {/* 下载完成 */}
      {fileStatus === 'downloaded' && inElectron && (
        <>
          {/* 打开本地文件 */}
          <Menu.Item
            key="1"
            className={styles.item}
            onClick={e => {
              e.domEvent?.stopPropagation();
              openFile();
            }}
          >
            {getIn18Text('DAKAIBENDIWENJIAN')}
          </Menu.Item>
          {/* 打开本地目录 */}
          <Menu.Item
            key="2"
            className={styles.item}
            onClick={e => {
              e.domEvent?.stopPropagation();
              openDir();
            }}
          >
            {getIn18Text('DAKAIBENDIMULU')}
          </Menu.Item>
          {/* 下载 */}
          {isFromMail && (
            <Menu.Item
              key="2-1"
              className={styles.item}
              onClick={e => {
                e.domEvent?.stopPropagation();
                actionDownload({ repeatDownload: true, afterSucOpenDir: true });
              }}
            >
              {getIn18Text('XIAZAI')}
            </Menu.Item>
          )}
        </>
      )}
      {/* 初始状态 */}
      {fileStatus === 'initial' && (
        <Menu.Item
          key="3"
          className={styles.item}
          onClick={e => {
            e.domEvent?.stopPropagation();
            actionDownload({ afterSucOpenDir: true });
          }}
        >
          {getIn18Text('XIAZAI')}
        </Menu.Item>
      )}
      {/* 保存至个人网盘 */}
      {showSaveForward && !attactCardConfig.hideSaveForward && (
        <Menu.Item
          key="4"
          className={styles.item}
          onClick={e => {
            e.domEvent?.stopPropagation();
            // 是否过期
            DeleteFileAlert(downloadInfo?.expired);
          }}
        >
          <TransferButton cancelSave={isExpired(downloadInfo.expired)} downloadInfo={downloadInfo} onChange={(value: boolean) => setLockModalVisible(value)} />
        </Menu.Item>
      )}
      {!!ifMainAccount && !isTpMail && (
        <Menu.Item
          key="5"
          className={styles.item}
          onClick={e => {
            e.domEvent?.stopPropagation();
            forwardAtt(downloadInfo);
          }}
        >
          {getIn18Text('ZHUANFA')}
        </Menu.Item>
      )}
    </Menu>
  );

  // eml菜单
  const emlMenu = () => (
    <Menu className={styles.operateMenu}>
      {/* 下载完成 */}
      {fileStatus === 'downloaded' && inElectron && (
        <Menu.Item
          key="2-1"
          className={styles.item}
          onClick={e => {
            e.domEvent?.stopPropagation();
            actionDownload({ repeatDownload: true });
          }}
        >
          {getIn18Text('XIAZAI')}
        </Menu.Item>
      )}
      {/* 初始状态 */}
      {fileStatus === 'initial' && (
        <Menu.Item
          key="3"
          className={styles.item}
          onClick={e => {
            e.domEvent?.stopPropagation();
            actionDownload();
          }}
        >
          {getIn18Text('XIAZAI')}
        </Menu.Item>
      )}
    </Menu>
  );

  const onCardMouseLeave = () => {
    // if (!noAnyOperate) {
    setCardActive(false);
    // setOperateVisible(false);
    // }
  };
  const onCardMouseEnter = () => {
    // if (!noAnyOperate) {
    // setOperateVisible(true);
    // }
  };

  return (
    <Dropdown overlay={!visibleMoreOperate ? <></> : source === 'eml' ? emlMenu : menu} trigger={['contextMenu']}>
      <Dropdown overlay={!visibleMoreOperate || inElectron ? <></> : source === 'eml' ? emlMenu : menu} trigger={['hover']}>
        <div
          className={classnames(styles.attachmentCard, className, {
            [styles.error]: fileStatus === 'downloadFailed',
            [styles.isChat]: isFromChat,
            [styles.isFromMail]: isFromMail,
            [styles.isActive]: isFromMail && cardActive,
            // [styles.noAnyOperate]: noAnyOperate,
          })}
          onMouseLeave={onCardMouseLeave}
          onMouseEnter={onCardMouseEnter}
          draggable={draggable}
          onDragStart={onDragStart}
        >
          <div className={styles.content} onClick={clickCard}>
            <div className={styles.infoIcon}>
              <IconCard type={fileType} />
            </div>
            <div className={styles.infoRight}>
              <div className={styles.info}>
                <div
                  className={styles.name}
                  title={decodeAttFileName(fileName)}
                  dangerouslySetInnerHTML={{
                    __html: decodeAttFileName(downloadInfo.fileHandledName || fileName),
                  }}
                ></div>
              </div>
              <div className={styles.operate}>
                <div className={styles.operateItem}>
                  <div className={styles.size}>
                    {realFileSize}
                    {downloadInfo.type === 'netfolder' || downloadInfo.cloudAttachment ? <> | {<FormatExpiredDate date={downloadInfo?.expired} />}</> : ''}
                  </div>
                  {downloadInfo.type === 'netfolder' || downloadInfo.cloudAttachment ? <div className={styles.netFolderTag}>{getIn18Text('YUNFUJIAN')}</div> : ''}
                  <div
                    className={classnames(styles.itemBox, {
                      [styles.mail]: isFromMail,
                    })}
                  >
                    {/* 聊天卡片 打开 */}
                    <span
                      className={styles.itemOpe}
                      hidden={hideChatOpenFile}
                      onClick={e => {
                        e.stopPropagation();
                        openChatFile();
                      }}
                    >
                      {getIn18Text('DAKAI')}
                    </span>
                    <span
                      className={styles.itemOpe}
                      hidden={hideChatOpenDir}
                      onClick={e => {
                        e.stopPropagation();
                        openDir();
                      }}
                    >
                      {getIn18Text('DAKAIWENJIANJIA')}
                    </span>
                    <span
                      className={styles.itemOpe}
                      hidden={hideActionOperate}
                      onClick={e => {
                        e.stopPropagation();
                        operateAction();
                      }}
                    >
                      {operateMap[operateStatus]}
                    </span>
                    {visibleMoreOperate && inElectron && (
                      <div className={styles.itemOpe}>
                        <Dropdown
                          overlay={source === 'eml' ? emlMenu : menu}
                          placement="bottomCenter"
                          trigger={['click']}
                          onVisibleChange={visible => {
                            setCardActive(visible);
                          }}
                          getPopupContainer={() => document.body}
                        >
                          <div onClick={e => e.stopPropagation()}>
                            <IconCard type="more" className={styles.moreBtn} />
                          </div>
                        </Dropdown>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className={styles.processBox} hidden={!processVisible}>
            <div className={styles.process} style={{ width: process }} />
          </div>
          <Modal
            visible={lockVisible}
            okText={getIn18Text('QIANWANGJIESUO')}
            cancelText={getIn18Text('ZHIDAOLE')}
            onCancel={() => setLockModalVisible(false)}
            closable={false}
            onOk={() => systemApi.openNewWindow('https://qiye.163.com', false)}
          >
            <h2>{getIn18Text('GERENKONGJIANYI')}</h2>
            <div>{getIn18Text('KEQIANWANGWANGYI')}</div>
          </Modal>
        </div>
      </Dropdown>
    </Dropdown>
  );
};
export default DownloadCard;
