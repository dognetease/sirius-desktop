/* eslint-disable jsx-a11y/mouse-events-have-key-events */
import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Spin } from 'antd';
import message from '@web-common/components/UI/Message/SiriusMessage';
import lodashGet from 'lodash/get';
import {
  apiHolder as api,
  apis,
  MailApi,
  SystemApi,
  MailFileAttachModel,
  AccountApi,
  FileType,
  LoaderResult,
  DataTrackerApi,
  DeleteAttachmentRes,
  getIn18Text,
  FsSaveRes,
} from 'api';
import IconCard from '@web-common/components/UI/IconCard';
import { formatFileSize } from '@web-common/utils/file';
import { decodeAttFileName, getFileExt } from '@web-common/components/util/file';
import './index.scss';
import SiriusMessage from '@web-common/components/UI/Message/SiriusMessage';
import useCreateCallbackForEvent from '@web-common/hooks/useCreateCallbackForEvent';
import { AttachmentView } from '@web-common/state/state';
import { useAppDispatch, useAppSelector } from '@web-common/state/createStore';
import { actions as mailActions } from '@web-common/state/reducer/mailReducer';
import { actions as attachmentActions } from '@web-common/state/reducer/attachmentReducer';
import { useNetStatus } from '@web-common/components/UI/NetWatcher';
import { ReactComponent as WifiIcon } from '@/images/icons/wifi_closed.svg';
import ImgPreview from '@web-common/components/UI/ImagePreview';
import Alert from '@web-common/components/UI/Alert/Alert';
import { FormatExpiredDate } from '../../common/components/FormatExpireDate';
import { DownloadQueueItem } from '@web-mail-write/components/Attachment';
import { useNiceModal } from '@web-common/components/UI/NiceModal/NiceModal';
import { isMainAccount } from '@web-mail/util';
import { IMG_TYPES } from '@web-mail/common/constant';
import { setCurrentAccount } from '@web-mail/util';
import { openDiskFile, openWebPreview, buildPreviewUrl, openWebAttach, openShareUrl, isImage, openImgAttachment } from '@web-mail/utils/mailAttach';
import { DataType } from '@web-common/components/UI/ImagePreview/type';

const accountApi = api.api.requireLogicalApi(apis.accountApiImpl) as AccountApi;
const trackerApi = api.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;
const mailApi = api.api.requireLogicalApi(apis.mailApiImpl) as unknown as MailApi;
const fileApi = api.api.getFileApi();
const systemApi = api.api.getSystemApi() as SystemApi;
const inElectron = systemApi.isElectron();

interface Props {
  optType: 'upload' | 'download';
  index: number;
  file?: AttachmentView;
  className?: string;
  cancel?: () => void;
  delete?: () => void;
  downloadInfoStatus?: string;
  id?: string;
  downloadInfo?: AttachmentView;
  downloadInfoProcess?: number;
  noneMoreOperate?: boolean;
  isFromChat?: boolean;
  writeLetterProp?: string;
  expired?: number;
  debounceSaveDraft?: (mailId: number | string | undefined) => void;
  seqDownload: (item: DownloadQueueItem) => void;
  uploadSucAutoSend: (sendMailId: string) => void;
}

type AttachPreviewType = 'web_attach' | 'web_cloud' | 'local_attach';
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

// 写信用附件卡片
const AttachmentCard: React.FC<Props> = props => {
  const attachments = useAppSelector(state => state.attachmentReducer.attachments);
  const {
    optType,
    file,
    downloadInfo,
    cancel,
    delete: deleteUpload,
    className,
    id: fileId,
    downloadInfoStatus,
    downloadInfoProcess,
    writeLetterProp,
    expired,
    debounceSaveDraft,
    seqDownload,
    uploadSucAutoSend,
    index,
  } = props;

  const [fileType, setFileType] = useState(''); // 附件类型
  const [abort, setAbort] = useState<Function>();
  const [operateVisible, setOperateVisible] = useState(false); // 操作按钮是否可见
  const [processVisible, setProcessVisible] = useState(false); // 进度条是否可见
  const [progress, setProcess] = useState('0%'); // 进度条百分比
  const [attStatus, setAttStatus] = useState('before'); // uploading error success before
  const dispatch = useAppDispatch();
  const currentMail = useAppSelector(state => state.mailReducer.currentMail);
  const waittingMailIds = useAppSelector(state => state.mailReducer.waittingMailIds);
  const currentMailId = currentMail?.cid || 0;
  const senderEmail = useMemo(() => currentMail?.initSenderStr || '', [currentMailId, currentMail?.initSenderStr]);
  const isMain = useMemo(() => {
    if (senderEmail === '') return true;
    return isMainAccount(senderEmail);
  }, [senderEmail]);
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState(0);
  const refCurrentMail = useRef(currentMail);
  const notShowCancelRef = useRef<boolean>();
  notShowCancelRef.current = false;
  const [uploadedData, setUploadedData] = useState<MailFileAttachModel | null>(null);
  const isOnline = useNetStatus();
  const paidGuideModal = useNiceModal('paidGuide');
  const queueShow = useMemo(() => {
    return optType === 'upload' && attStatus === 'uploading' && !processVisible;
  }, [optType, attStatus, processVisible]);
  const optsShow = useMemo(() => {
    return operateVisible && attStatus !== 'deleting';
  }, [attStatus, operateVisible]);

  // UI层附件类型整理
  const attachmentType = useMemo(() => {
    if (optType === 'upload') {
      if (file?.cloudAttachment) {
        return 'netfolder';
      }
      if (file?.flag?.usingCloud) {
        return 'netfolder';
      }
      return optType || '';
    } else {
      return downloadInfo?.type || '';
    }
  }, [optType, file, downloadInfo]);

  useEffect(() => {
    refCurrentMail.current = currentMail;
  }, [currentMail]);

  const uploadingStatus = () => {
    // 进入下载 上传后需要更改的状态
    setAttStatus('uploading');
  };

  const downloadSuccess = () => {
    setProcessVisible(false);
    setAttStatus('success');
  };
  const downloadFail = () => {
    setAttStatus('error');
  };

  // 上传成功后更新附件
  const uploadSuccess = (id: string, realId: number, expired: number) => {
    setProcessVisible(false);
    setAttStatus('success');
    // 上传成功后用请求返回的id替换ui层的id
    dispatch(
      attachmentActions.doChangeAttachment({
        downloadId: fileId,
        status: 'success',
        realId,
        id,
        expired,
      })
    );
  };

  const uploadFail = err => {
    // 特例：免费版超限
    if (typeof err === 'string' && ['free_version_total_size_overflow', 'free_version_attachment_size_overflow'].includes(err)) {
      paidGuideModal.show({ errType: '41', origin: '写信' });
    } else {
      const msg = err && err.code === 'user.cancel' ? '' : err.title || getIn18Text('FUJIANSHANGCHUANSHI');
      // 字符串 则使用 否则解析对象
      const errMsg = typeof err === 'string' ? err : msg;
      if (errMsg || !isOnline) {
        if (errMsg === '用户取消' && notShowCancelRef.current) return;
        // @ts-ignore
        message.fail({
          content: isOnline ? (
            errMsg
          ) : (
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <WifiIcon />
              <span style={{ marginLeft: 4 }}>{getIn18Text('CAOZUOSHIBAI\uFF0C')}</span>
            </div>
          ),
        });
      }
    }
    setAttStatus && setAttStatus('error');
    dispatch && dispatch(attachmentActions.doChangeAttachment({ id: fileId, status: 'fail', expired }));
  };

  // 上传文件
  const uploadFn = async (batch?: boolean) => {
    uploadingStatus();
    if (!batch) {
      // 更新状态
      dispatch(
        attachmentActions.doChangeAttachment({
          id: fileId,
          status: 'uploading',
          expired,
        })
      );
    }
    const res = await uploadFnServer(file);
    // 缓存附件用于发信失败重传
    const type = res?.type && res.type === 'netfolder' ? 'localCloudFile' : 'localFile';
    const value = file;
    dispatch(mailActions.doChangeCacheAttachment({ id: currentMailId, type, value, operationType: 'add' }));
    return res;
  };

  const uploadFnServer = async (file: any) => {
    const { file: originFile, realId } = file;
    const accounts = await accountApi.getMainAndSubAccounts();
    const mainAccount = accounts[0].mainAccount;
    const sendMailId = currentMailId;
    const flag = { ...file.flag };
    if (mainAccount !== senderEmail) {
      flag._account = senderEmail;
    }
    // 附件操作都在主窗口
    // setCurrentAccount();
    return mailApi
      .doUploadAttachment({
        cid: currentMailId,
        attach: originFile,
        _account: flag._account || '',
        realId,
        uploader: {
          progressIndicator: n => {
            setProcessVisible(true);
            setProcess(`${n * 100}%`);
          },
          operatorSet: handler => setAbort(() => handler),
        },
        flag,
      })
      .then(res => {
        const { id, realId, expired } = res;
        onUploaded(res);
        uploadSuccess(id, realId, expired);
        // 上传成功后自动发信
        sendMailId && uploadSucAutoSend(sendMailId);
        return res;
      })
      .catch(err => {
        uploadFail(err);
      })
      .finally(() => {
        debounceSaveDraft && debounceSaveDraft(file?.mailId);
      });
  };
  const onUploaded = useCreateCallbackForEvent((res: MailFileAttachModel) => {
    if (attachPreviewType === 'web_attach') {
      res.filePreviewUrl = buildPreviewUrl(res);
      res.downloadContentId = res.contentId;
    }
    setUploadedData(res);
  });

  const actionStart = (batch?: true) => {
    if (optType === 'upload') {
      if (!file?.fileUrl) {
        uploadFn(batch);
      } else {
        setAttStatus('success');
        dispatch(attachmentActions.doChangeAttachment({ id: file.id, status: 'success', realId: file.id, expired }));
      }
    }
  };

  const remWaittingMailId = useCreateCallbackForEvent((cond?: string) => {
    if (currentMail?.cid && waittingMailIds.includes(currentMail?.cid)) {
      if (cond === 'abort') {
        notShowCancelRef.current = true;
      }
      dispatch(mailActions.doRemWaittingMailId(currentMail?.cid));
      message.error({ content: getIn18Text('ZIDONGFASONGZHONGD，QBJWCHCXFS') });
    }
  });

  const actionAbort = async (fileId?: string | number) => {
    remWaittingMailId('abort');
    const progressNum = progress.split('%')[0];
    if (progressNum) {
      const num = Number(progressNum);
      if (num > 95 && attStatus !== 'error') {
        SiriusMessage.error('取消失败');
        return;
      }
    }
    if (optType === 'upload') {
      // 已开始上传
      if (abort) {
        // 删除缓存用于发信失败重传的附件
        setTimeout(() => {
          file && dispatch(mailActions.doChangeCacheAttachment({ id: currentMailId, value: file, operationType: 'delete' }));
        }, 500);
        // 中断directData http请求
        // 但这里可能存在特例 即此时已存储完毕，中断无用
        try {
          abort('abort');
        } catch (error) {
          console.log('abort error', error);
        }
        // const res: DeleteAttachmentRes = await mailApi.doDeleteAttachment(currentMailId, file?.realId || file?.id, senderEmail);
        // const { success } = res;
        // // 删除成功
        // if (success) {
        //   // redux里去除
        cancel && cancel();
        // } else {
        //   SiriusMessage.error('取消失败');
        //   console.error('取消失败', res);
        // }
        return;
      }

      // 未开始上传 或 【未成功开启上传（error 这种情况下ui层会自动销毁锁）】
      const abortRes = mailApi.doAbortAttachment(file.realId + '');
      const { success } = abortRes;
      if (success) {
        setProcessVisible(false);
        cancel && cancel();
      } else {
        // 就算失败也移除，以免影响其他附件的操作
        cancel && cancel();
      }
    } else {
      setProcessVisible(false);
      setProcess('0%');
      setAttStatus('before');
      cancel && cancel();
      if (abort) {
        abort('abort');
      }
      // 删除缓存用于发信失败重传的附件
      setTimeout(() => {
        downloadInfo && dispatch(mailActions.doChangeCacheAttachment({ id: currentMailId, value: downloadInfo, operationType: 'delete' }));
      }, 500);
      dispatch(attachmentActions.doChangeAttachment({ id: fileId as string, status: 'before', expired }));
    }
  };

  const getSuffix = (downloadInfo: MailFileAttachModel): FileType => {
    const type = downloadInfo?.fileType;
    if (type && type !== 'other') return type;
    const arr = downloadInfo?.fileName?.split('.');
    if (arr.length == 1) return 'other';
    return arr[arr.length - 1] as FileType;
  };

  const initInfo = () => {
    remWaittingMailId();
    if (optType === 'upload') {
      const { name, fileName, size, fileSize } = file;
      const theName = name || fileName || 'unknown';
      const nameSplit = theName.split('.');
      const fileType = nameSplit[nameSplit.length - 1];
      setFileType(fileType);
      setFileName(theName);
      setFileSize(size || fileSize);
    } else {
      setFileType(getSuffix(downloadInfo));
      setFileName(downloadInfo?.fileName || getIn18Text('WEIZHI'));
      setFileSize(downloadInfo?.fileSize || 0);
    }
  };

  // 转发 再次编辑 时把原本的附件删除
  const deleteFromForward = () => {
    // senderEmail && accountApi.setCurrentAccount(senderEmail);
    mailApi.doDeleteAttachment({ cid: currentMailId as string, attachId: downloadInfo!.id, _account: senderEmail }).then(() => {
      // 删除缓存用于发信失败重传的附件
      downloadInfo && dispatch(mailActions.doChangeCacheAttachment({ id: currentMailId, value: downloadInfo, operationType: 'delete' }));
      // 修改附件状态
      dispatch(
        attachmentActions.doChangeAttachmentAttr({
          downloadId: fileId,
          key: 'forwardWithout',
          val: true,
          expired,
        })
      );
      debounceSaveDraft && debounceSaveDraft(downloadInfo?.mailId);
    });
  };

  const actionDelete = async () => {
    remWaittingMailId();
    if (optType !== 'upload') deleteFromForward();
    if (optType === 'upload') {
      const oldStatus = attStatus;
      try {
        // 删除中态
        setAttStatus('deleting');
        dispatch(attachmentActions.doChangeAttachment({ id: fileId, status: 'deleting', expired }));
        // senderEmail && accountApi.setCurrentAccount(senderEmail);
        const res: DeleteAttachmentRes = await mailApi.doDeleteAttachment({ cid: currentMailId as string, attachId: file?.realId || file?.id, _account: senderEmail });
        const { success } = res;
        // 删除成功
        if (success) {
          dispatch(attachmentActions.doDelAttachment({ id: fileId }));
          // 删除缓存用于发信失败重传的附件
          file && dispatch(mailActions.doChangeCacheAttachment({ id: currentMailId, value: file, operationType: 'delete' }));
          debounceSaveDraft && debounceSaveDraft(file?.mailId);
        } else {
          console.error('删除失败', res);
          setAttStatus(oldStatus);
          dispatch(attachmentActions.doChangeAttachment({ id: fileId, status: oldStatus, expired }));
        }
      } catch (error) {
        setAttStatus(oldStatus);
        dispatch(attachmentActions.doChangeAttachment({ id: fileId, status: oldStatus, expired }));
        console.error('删除失败', error);
      }
    }
  };

  useEffect(() => {
    setProcess(`${downloadInfoProcess}%`);
  }, [downloadInfoProcess]);

  useEffect(() => {
    switch (downloadInfoStatus) {
      case 'downloading':
        uploadingStatus();
        break;
      case 'success':
        downloadSuccess();
        break;
      case 'fail':
        downloadFail();
        break;
      case 'before':
        actionAbort();
        break;
    }
  }, [downloadInfoStatus]);

  // 初始进入
  useEffect(() => {
    initInfo();
    file?.status && setAttStatus(file.status);
    // 需要上传且未成功
    if (optType === 'upload' && file?.status !== 'success' && fileId) {
      seqDownload({ index, fun: actionStart, id: fileId });
    }
  }, [fileId]);

  // 组件销毁
  useEffect(() => {
    return () => {
      // 上传队列中
      if (attStatus === 'uploading') {
        // 正在上传
        if (abort) {
          abort('abort');
          // 等待中
        } else {
          mailApi.doAbortAttachment(file.realId + '');
        }
      }
    };
  }, [attStatus, abort]);

  const openFile = async () => {
    if (optType === 'download' || !inElectron) return;
    // 是否过期，过期不可操作。肯定在 download 之后
    if (DeleteFileAlert(expired)) return;
    if (downloadInfo || file) {
      const info = optType === 'upload' ? file : downloadInfo;
      if (optType === 'upload') {
        // 写信页从云文档或往来附件添加的附件本地是没有源文件的，需要先下载，复用上传的进度条，写一个假的下载进度
        const fromCloudOrWith = ['fromInternalMail', 'trs', 'netUrl'].includes(info?.type);
        let cloudOrWithInfoPath = '';
        if (fromCloudOrWith) {
          // 如果已经下载过了，就可以直接打开
          const cloudOrWithInfo = await fileApi.getFileInfo({ ...info, _account: senderEmail });
          cloudOrWithInfoPath = lodashGet(cloudOrWithInfo, '[0].filePath', '');
          if (!cloudOrWithInfoPath) {
            setProcessVisible(true);
            let count = 1;
            const $t = setInterval(() => {
              setProcess(count * 25 + '%');
              count += 1;
              if (count > 3) {
                clearInterval($t);
              }
            }, 500);
            const downloadRes = await fileApi
              .download({ ...info }, { _account: senderEmail })
              .then(res => {
                if (!(res as LoaderResult)?.succ && !(res as unknown as FsSaveRes)?.success) {
                  trackerApi.track('pc_mail_attachment_download_failed', { type: 'res_failed', data: { req: info, res } });
                }
                return res;
              })
              .catch(e => {
                trackerApi.track('pc_mail_attachment_download_failed', { type: 'throw_error', data: { req: info, error: e } });
              });
            cloudOrWithInfoPath = lodashGet(downloadRes, 'fileModel.filePath', '');
            setProcess('100%');
            clearInterval($t);
            setProcessVisible(false);
          }
        }
        fileApi
          .openFile({ ...info, filePath: cloudOrWithInfoPath || info?.file?.electronFullPath || info?.file?.filePath || info?.file?.path, _account: senderEmail })
          .then(bool => {
            console.log('openFileInfo', info);
            if (!bool) {
              SiriusMessage.warn({ content: getIn18Text('WUFADAKAIWEN') });
            }
          })
          .catch(err => {
            SiriusMessage.warn({ content: getIn18Text('WUFADAKAIWEN') });
          });
        return;
      }
      fileApi
        .getFileInfo({ ...info, _account: senderEmail })
        .then(result => {
          if (result && result.length > 0) {
            fileApi.openFile({ ...result[0], _account: senderEmail }).then(bool => {
              if (!bool) {
                if (['trs', 'netUrl'].includes(info?.type)) {
                  SiriusMessage.warn({ content: getIn18Text('WUFADAKAIWEN12') });
                } else {
                  SiriusMessage.warn({ content: getIn18Text('WUFADAKAIWEN') });
                }
              }
            });
          } else {
            SiriusMessage.warn({ content: getIn18Text('WEIZHAODAOWENJIAN') });
          }
        })
        .catch(err => {
          console.error(getIn18Text('DAKAIWENJIANSHI'), err);
        });
    } else {
      SiriusMessage.warn({ content: getIn18Text('GONGNENGCANSHUYOU') });
    }
  };

  // 老的附件预览
  const cloudPreview = () => {
    if (optType === 'upload' || !downloadInfo) {
      return;
    }
    if (isImage(downloadInfo.fileName, downloadInfo?.fileType)) {
      openImgAttachment({
        ...downloadInfo,
        nonOriginal: true,
        downloadUrl: downloadInfo.fileUrl!,
        previewUrl: downloadInfo.filePreviewUrl!,
        name: downloadInfo.fileName,
        size: downloadInfo.fileSize,
      });
      return;
    }
    if (systemApi.isElectron() && window.electronLib) {
      console.log('sourceId', downloadInfo);
      const fileName = downloadInfo?.fileName || getIn18Text('WEIZHI');
      // todo 判断网页版
      systemApi.createWindowWithInitData('resources', {
        eventName: 'initPage',
        eventData: {
          downloadContentId: downloadInfo?.downloadContentId,
          downloadId: downloadInfo?.downloadId,
          attachments: [downloadInfo],
          fileName,
          type: 'attachment',
          _account: senderEmail,
          hash: `https://resources/#type=attachment&mid=${downloadInfo?.contentId}&fileName=${fileName}&size=${downloadInfo?.fileSize}&downloadId=${downloadInfo?.downloadId}&downloadContentId=${downloadInfo?.downloadContentId}`,
        },
      });
    } else {
      openWebPreview(downloadInfo, downloadInfo.downloadContentId, senderEmail);
    }
  };

  const attachPreviewType: AttachPreviewType = useMemo(() => {
    if (process.env.BUILD_ISELECTRON && file?.file) {
      return 'local_attach';
    }
    if (downloadInfo?.cloudAttachment || file?.flag?.usingCloud || file?.cloudAttachment) {
      return 'web_cloud';
    }
    return 'web_attach';
  }, [file?.cloudAttachment, downloadInfo?.cloudAttachment, file?.flag?.usingCloud, file?.file]);

  // 云文档添加的附件
  const visibleNetUrl = file?.type === 'netUrl';
  // 往来邮件添加的附件
  const visibleRelateMail = file?.type === 'fromInternalMail';
  // 是否是云附件
  const isCloud = attachPreviewType === 'web_cloud';
  // 转发，读信,重新编辑带过来的附件
  const visibleDownloaded = optType === 'download' && !isCloud;
  // electron上传 (对应打开文案)
  const visibleElectronPreview = process.env.BUILD_ISELECTRON && attStatus === 'success' && optType === 'upload';
  // web 本地上传(不带云附件 + 往来附件 + 云文档附件)
  const visibleWebPreview =
    !process.env.BUILD_ISELECTRON && attStatus === 'success' && optType === 'upload' && !visibleNetUrl && !visibleRelateMail && !isCloud && isMain;
  // 预览文案 暂时只支持，本地上传的附件 + 转发，读信,重新编辑带过来的附件（electron
  const visiblePreviewText = visibleWebPreview || visibleDownloaded;

  const preview = () => {
    //  electron转发，读信,重新编辑带过来的附件
    if (visibleDownloaded) {
      cloudPreview();
      return;
    }
    // electron 本地上传
    if (visibleElectronPreview) {
      openFile();
      return;
    }
    // web本地上传
    if (visibleWebPreview && uploadedData !== null) {
      if (isImage(uploadedData.fileName, uploadedData.fileType)) {
        openImgAttachment({
          ...uploadedData,
          nonOriginal: true,
          downloadUrl: uploadedData.fileUrl!,
          previewUrl: uploadedData.fileUrl!,
          name: uploadedData.fileName,
          size: uploadedData.fileSize,
        });
        return;
      }
      openWebPreview(uploadedData, currentMail._id, senderEmail);
      return;
    }
    // if(!visibleLocalUpload) {
    //    // if (file && file.fileUrl && fileId && file.type === 'fromInternalMail') {
    //   //   const _downloadContentId = fileId.split('__')[0];
    //   //   const url = file.fileUrl.split('?')[1];
    //   //   openWebAttach(_downloadContentId, url, file.fileName);
    //   // } else if(file && file.type === 'netUrl' && file.fileUrl) {
    //   //   openShareUrl(file.fileUrl);
    //   // }
    //   return;
    // }

    // if (attachPreviewType === 'web_cloud') {
    //   openDiskFile({
    //     fileName: uploadedData.fileName,
    //     expireTime: expired || 0,
    //     identity: uploadedData.cloudIdentity!,
    //     fileSize: uploadedData.fileSize,
    //     downloadUrl: uploadedData.downloadId,
    //   });
    //   return;
    // }
  };
  return (
    <div
      className={`attachment-card ${attStatus === 'error' ? 'error' : ''} ${className}`}
      onClick={() => {
        if (visiblePreviewText || visibleElectronPreview) {
          preview();
        }
      }}
      onMouseLeave={() => setOperateVisible(false)}
      onMouseEnter={() => setOperateVisible(true)}
      onMouseOver={() => setOperateVisible(true)}
    >
      <div className="content">
        <div className="info-icon">
          <IconCard type={fileType as any} />
        </div>
        <div className="info-right">
          {/* 半透明 */}
          {/* 错误 上传中 等待中 */}
          <div className={`info ${['error', 'uploading', 'before'].includes(attStatus) ? 'info-opacity' : ''}`}>
            <div className="name" title={decodeAttFileName(fileName)} dangerouslySetInnerHTML={{ __html: decodeAttFileName(fileName) }} />
          </div>
          <div className="operate">
            <div className="operate-item">
              <div className="size">
                {fileSize > 0 ? formatFileSize(fileSize, 1024) : getIn18Text('WEIZHIDAXIAO')}
                {/* 过期时间 */}
                {(attachmentType === 'netfolder' || downloadInfo?.cloudAttachment) && attStatus === 'success' ? (
                  <>
                    {' | '}
                    <FormatExpiredDate date={expired} />
                  </>
                ) : (
                  ''
                )}
              </div>
              {/* 云附件icon */}
              {attachmentType === 'netfolder' || downloadInfo?.cloudAttachment ? <div className="netfolder-tag">{getIn18Text('YUNFUJIAN')}</div> : ''}
              {queueShow && <div className="queue-tag">正在排队</div>}
              {/* 删除中 */}
              {attStatus === 'deleting' && (
                <span className="att-deleting">
                  {getIn18Text('SHANCHUZHONG')}
                  <Spin />
                </span>
              )}
              {/* 操作区 */}
              <div hidden={!optsShow} className="item-box">
                {/* 预览 */}
                {visiblePreviewText && (
                  <span
                    className="item-ope"
                    onClick={e => {
                      e.stopPropagation();
                      preview();
                    }}
                  >
                    {getIn18Text('YULAN')}
                  </span>
                )}
                {/* <span
                  className="item-ope"
                  onClick={cloudPreview}
                  hidden={
                    attStatus === 'error' ||
                    optType !== 'download' ||
                    attachmentType === 'netfolder' ||
                    downloadInfo?.cloudAttachment ||
                    writeLetterProp === 'forwardAsAttach' ||
                    !inElectron
                  }
                >
                  {getIn18Text('YULAN')}
                </span> */}
                {/* 删除 */}
                {/* 上传成功 转发/回复而来 */}
                {(attStatus === 'success' || optType === 'download') && (
                  <span
                    className="item-ope"
                    onClick={e => {
                      e.stopPropagation();
                      actionDelete();
                    }}
                  >
                    {getIn18Text('SHANCHU')}
                  </span>
                )}
                {/* 重试 */}
                {/* 错误 */}
                {attStatus === 'error' && (
                  <span
                    className="item-ope"
                    onClick={e => {
                      e.stopPropagation();
                      actionStart();
                    }}
                  >
                    {getIn18Text('ZHONGSHI')}
                  </span>
                )}
                {/* 取消 */}
                {/* 上传中 错误 */}
                {(attStatus === 'uploading' || attStatus === 'error') && (
                  <span
                    className="item-ope"
                    onClick={e => {
                      e.stopPropagation();
                      actionAbort();
                    }}
                  >
                    {getIn18Text('QUXIAO')}
                  </span>
                )}
                {/* 打开 */}
                {/* 成功且上传成功且应用端 */}
                {visibleElectronPreview && (
                  <span
                    className="item-ope"
                    onClick={e => {
                      e.stopPropagation();
                      preview();
                    }}
                  >
                    {getIn18Text('DAKAI')}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className={`process-box ${processVisible ? '' : 'hide'}`}>
        <div className="process" style={{ width: progress }} />
      </div>
    </div>
  );
};
export default AttachmentCard;
