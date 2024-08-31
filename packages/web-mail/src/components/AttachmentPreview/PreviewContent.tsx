/* eslint-disable no-await-in-loop */
/* eslint-disable no-plusplus */
/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable max-len */
/* eslint-disable react/no-array-index-key */
import React, { useCallback, useEffect, useState, useMemo } from 'react';
import {
  apiHolder as api,
  apis,
  ConvertApi,
  ConvertTaskResponse,
  ConvertTaskStatus,
  DataTrackerApi,
  SystemApi,
  inWindow,
  EventApi,
  LoaderResult,
  FileAttachModel,
  AccountApi,
  MailApi,
} from 'api';
import classnames from 'classnames';
import { message, Tooltip, Progress as CircleProgress } from 'antd';
import useMsgRenderCallback from '@web-common/hooks/useMsgRenderCallback';
import { Attachment } from '@web-common/state/state';
import style from './index.module.scss';
import IconCard from '@web-common/components/UI/IconCard';
import { AttachmentActions, useAppDispatch, useAppSelector } from '@web-common/state/createStore';
import { actions, doDownloadAttchmentAsync } from '@web-common/state/reducer/attachmentReducer';
import SiriusMessage from '@web-common/components/UI/Message/SiriusMessage';
import { ProgressButton } from './download-button';
import TransferButton from '@web-common/components/UI/DownloadCard/TranferButton';
import { getTrail } from '@web-disk/utils';
import { getIn18Text } from 'api';
const ALLOW_CONVERT_FILE_TYPE_SET = new Set(['xls', 'xlsx', 'docx']);
const LOADING_MESSAGE_KEY = 'convert_loading';
const CONVERT_TIMEOUT = 12e4; // 后端转换未做超时限制，120s 后仍不成功直接报超时失败
const ProgressContext = React.createContext({ percent: 0 });
const ALLOW_FILE_TYPE = [
  'doc',
  'docx',
  'dot',
  'dotm',
  'dotx',
  'docm',
  'wps',
  'wpt',
  'ppt',
  'pptx',
  'pot',
  'potm',
  'potx',
  'pps',
  'ppsx',
  'pptm',
  'dps',
  'dpt',
  'xls',
  'xlsx',
  'xlsm',
  'xlt',
  'xltx',
  'xltm',
  'et',
  'ett',
  'rtf',
  'zip',
  'rar',
  'jar',
  'war',
  'ear',
  'crx',
  'sext',
  'ar',
  'cpio',
  '7z',
  'tar',
  'tgz',
  'taz',
  'tbz',
  'tbz2',
  'cpgz',
  'z',
  'bz',
  'bz2',
  'gz',
  '-gz',
  '-z',
  '_z',
  'htm',
  'html',
  'shtml',
  'xhtml',
  'xml',
  'txt',
  'ini',
  'inf',
  'java',
  'jsp',
  'js',
  'c',
  'cpp',
  'py',
  'h',
  'hpp',
  'cs',
  'sh',
  'css',
  'asp',
  'aspx',
  'mp3',
  'mp4',
  'wma',
  'flv',
  'eml',
  'jpg',
  'jpeg',
  'gif',
  'png',
  'pdf',
  'word',
  'xlsb',
  'xlst',
  'xps',
  'csv',
  'emf',
  'ppa',
];
function sleep(time: number) {
  return new Promise(resolve => {
    setTimeout(resolve, time);
  });
}
function Progress({ percent }: { percent: number }) {
  return (
    <div className={style.loading}>
      <div className={style.grey}>{getIn18Text('ZHUANCUNZHONG')}</div>
      <div className={style.progress}>
        <div className={style.progressBar} style={{ width: percent }} />
      </div>
      <div className={style.white}>{percent}%</div>
    </div>
  );
}
function getFileSuffix(filename: string): string {
  const lastIndex = filename.lastIndexOf('.');
  if (lastIndex > -1) {
    return filename.slice(lastIndex + 1);
  }
  return '';
}
// 转换打点相关
const trackerApi = api.api.requireLogicalApi('dataTrackerApiImp') as DataTrackerApi;
const CONVERT_EVENT_ID = 'pcMail_previewAttachment_convert';
enum ConvertOperaType {
  ButtonShow = 'buttonshow',
  Convert = 'convert',
  ConvertSuccess = 'convertsuccess',
}
function getConvertFileType(fileType: string): 'doc' | 'sheet' | '' {
  if (fileType === 'docx') {
    return 'doc';
  }
  if (['xls', 'xlsx', 'csv'].includes(fileType)) {
    return 'sheet';
  }
  return '';
}
interface IPreviewContent {
  operateClose?: boolean;
  hash: string;
  type: string;
  from?: string;
  attachmentsInfo?: any;
  onFetchDetail?: (hash: any, detail: any, previewUrl?: string) => void;
}
const mailApi = api.api.requireLogicalApi(apis.mailApiImpl) as MailApi;
const systemApi = api.api.getSystemApi() as SystemApi;
const eventApi = api.api.getEventApi() as EventApi;
const inElectron = systemApi.isElectron();
const accountApi = api.api.requireLogicalApi(apis.accountApiImpl) as AccountApi;
const fileApi = api.api.getFileApi();
const convertApi = api.api.requireLogicalApi('convertApiImpl') as ConvertApi;
const PreviewContent: React.FC<IPreviewContent> = props => {
  const { hash, onFetchDetail = () => {}, operateClose = true } = props;
  // const {
  //   downloadProgress: downloadProgressE = 0, downloadContentId: downloadContentIdE = '', downloadId: downloadIdE = '', attachments: attachmentsE = [], fileName = ''
  // } = attachmentsInfo || {};
  const { downloadProgress: downloadProgressRedux } = useAppSelector(state => state.attachmentReducer);
  const {
    downloadContentId: downloadContentIdRedux,
    downloadId: downloadIdRedux,
    attachments: attachmentsRedux = [],
  } = useAppSelector(state => state.attachmentReducer.attachmentsPreview);
  const [messageApi, contextHolder] = message.useMessage();
  const [index, setIndex] = useState(0);
  const [operateDisabled, setOperateDisabled] = useState(['']);
  const [iframeUrl, setIframeUrl] = useState<string>('');
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [list, setList] = useState<Attachment[]>(attachmentsRedux);
  const [attachments, setAttachments] = useState<Attachment[]>(attachmentsRedux);
  const [currentAccount, setCurrentAccount] = useState<string>('');
  // const attachments = systemApi.isElectron() ? attachmentsE : attachmentsRedux;
  const downloadProgress = downloadProgressRedux;
  const [downloadContentId, setDownloadContentId] = useState(downloadContentIdRedux);
  const [downloadId, setDownloadId] = useState('');
  const [fileName, setFileName] = useState('');
  // console.log('hashChange render', hash, attachments);
  useEffect(() => {
    // console.log('hashChange', { hash, attachments });
    if (systemApi.isElectron()) {
      onFetchDetail(hash, { fileType: getTrail(fileName).toUpperCase(), name: fileName }, previewUrl);
    }
  }, [hash, attachments]);
  useMsgRenderCallback('attachmentPreviewInitData', (ev: any) => {
    if (ev && ev.eventData) {
      const url = new URL(ev.eventData.hash);
      if (hash !== url.hash && hash !== url.search) {
        return;
      }

      const _downloadContentId = systemApi.isElectron() ? ev.eventData.downloadContentId : downloadContentIdRedux;
      const _downloadId = systemApi.isElectron() ? ev.eventData.downloadId : downloadIdRedux;
      setDownloadContentId(_downloadContentId);
      setDownloadId(_downloadId);
      setFileName(ev.eventData.fileName);
      if (ev.eventData._account) {
        const emailId = accountApi.getEmailIdByEmail(ev.eventData._account);
        setCurrentAccount(emailId);
      } else {
        setCurrentAccount('');
      }
      setPreviewUrl(ev.eventData.attachments[0]?.filePreviewUrl);
      setAttachments(systemApi.isElectron() ? ev.eventData.attachments : attachmentsRedux);
    }
  });
  const dispatch = useAppDispatch();
  const clearProgress = () => dispatch(AttachmentActions.doUpdateDownloadProgress(0));
  // 转存的 loading 状态，loading 期间顶部操作不可用
  const [loading, setLoading] = useState(false);
  // 转存进度
  const [percent, setPercent] = useState(0);
  const currentAttachment = list[index];
  const isTpMail = useMemo(() => {
    return currentAttachment?.filePreviewUrl?.indexOf('mail-plus/api/biz/email/attach') !== -1;
  }, [currentAttachment]);
  // const currentAttachment = attachments[0];
  // 是否可以解析云文档
  const canConvert = ALLOW_CONVERT_FILE_TYPE_SET.has(getFileSuffix(currentAttachment?.fileName || ''));
  // 是否是上传附件
  const isUploadAttachment = currentAttachment?.attType == '1';
  // 设置操作按钮显隐
  const changeFileStatus = async downloadInfo => {
    let onOperateDisabled = ['open'];
    if (inElectron) {
      const fileInfo = await fileApi.getFileInfo({ ...downloadInfo, _account: currentAccount });
      const curFile = fileInfo && fileInfo.length > 0 ? fileInfo[0] : null;
      if (curFile) {
        const curFileStatus = curFile?.fileStatus;
        if (curFileStatus === 'downloaded') {
          const isExits = await fileApi.testLocalFile({ ...curFile, _account: currentAccount });
          if (isExits) {
            onOperateDisabled = ['doDownload'];
          } else {
            fileApi.delFileInfo({ ...curFile, _account: currentAccount });
          }
        }
      }
    }
    if (index === 0) {
      onOperateDisabled.push('previous');
    }
    if (index === list.length - 1) {
      onOperateDisabled.push('next');
    }
    setOperateDisabled(onOperateDisabled);
  };
  // 来源于resource页面调用逻辑
  useEffect(() => {
    // console.log('ttttt', { downloadContentId, attachments });
    const onList = downloadContentId ? attachments.filter(i => i.downloadContentId === downloadContentId) : [];
    const start = downloadId ? onList.findIndex(i => i.downloadId === downloadId) : 0;
    if (onList.length === 0) {
      return;
    }
    setList(onList);
    setIndex(start);
  }, [attachments, downloadId, downloadContentId]);

  // const setUrl = async (src: string) => {
  //   if (!src) setIframeUrl('');
  //   try {
  //     if (currentAccount) {
  //       accountApi.setCurrentAccount({ email: currentAccount });
  //     }
  //     const cookies = await systemApi.doGetCookies(true);
  //     const { QIYE_SESS, Coremail } = cookies;
  //     let urlObj = new URL(src);
  //     urlObj.searchParams.append('qiyeSess', QIYE_SESS || '');
  //     urlObj.searchParams.append('coreMail', Coremail || '');
  //     setIframeUrl(urlObj.href);
  //   } catch (error) {
  //     console.log('拼接iframe链接失败', error);
  //     setIframeUrl(src);
  //   }
  // };

  useEffect(() => {
    const currentAttac = list[index];
    // const currentAttac = currentAttachment;
    // console.log('currentAttaccurrentAttac', { currentAttachment, currentAttac });
    if (currentAttac) {
      // 前进后退切换预览文件，需要同步doAttachmentPreview
      dispatch(actions.doAttachmentPreview({ visible: true, downloadContentId: currentAttac.downloadContentId, downloadId: currentAttac.downloadId }));
      // 这几种类型使用fileUrl替换filePreviewUrl
      // if(['pdf', 'mp3', 'mp4', 'mov'].includes(currentAttac?.fileType || '')) {
      //   const iframeUrl = (currentAttac?.fileUrl || '').replace('mode=download', 'mode=preview');
      //   setIframeUrl(iframeUrl);
      //   return;
      // } else {
      if (currentAttac?.filePreviewUrl?.indexOf('/api/pub/preview') === -1 && currentAttac?.filePreviewUrl?.indexOf('/api/biz/email/attach/preview') === -1) {
        setIframeUrl(currentAttac?.filePreviewUrl || '');
      } else if (currentAttac?.filePreviewUrl) {
        if (currentAccount) {
          // accountApi.setCurrentAccount({ email: currentAccount });
        }

        mailApi
          .getFilePreviewUrl({ url: currentAttac?.filePreviewUrl, mid: currentAttachment.downloadContentId!, _account: currentAccount || currentAttac?._account || '' })
          .then(res => {
            if (!res.success || !res.data) {
              // SiriusMessage.warn({ content: '预览服务报错，请稍后' })
              console.warn(getIn18Text('YULANFUWUBAO'));
            }
            const src = res.data;
            setIframeUrl(src);
          });
      }
      // }
      // 设置操作按钮显隐
      changeFileStatus(currentAttac);
    }
  }, [index, list, hash, attachments]);
  useEffect(() => {
    // 监听下载状态，附件切换获取最新邮件下载状态
    const eventId = eventApi.registerSysEventObserver('fsDownloadNotify', {
      name: 'downloadCard_' + list[index]?.fileUrl + Math.random().toFixed(6),
      func: ev => {
        if (list[index] && ev.eventStrData === list[index].fileUrl) {
          changeFileStatus(list[index]);
        }
      },
    });
    return () => {
      eventApi.unregisterSysEventObserver('fsDownloadNotify', eventId);
    };
  }, []);
  useEffect(() => {
    // 设置窗口title
    const currentAttac = attachments[index];
    if (inWindow() && currentAttac && currentAttac.fileName) {
      window.document.title = `预览-${currentAttac.fileName}`;
    }
  }, [index, list]);
  const convertToOnlineDoc = useCallback(() => {
    if (!(currentAttachment.downloadContentId && currentAttachment.id)) {
      return;
    }
    setLoading(true);
    const params = {
      mid: currentAttachment.downloadContentId,
      part: currentAttachment.id,
    };
    const hide = messageApi.open({
      key: LOADING_MESSAGE_KEY,
      className: style.message,
      type: 'loading',
      content: <ProgressContext.Consumer>{value => <Progress {...value} />}</ProgressContext.Consumer>,
      duration: 0,
    });
    // 进度条更新逻辑，最多更新到 99 ，通过 flag 控制退出逻辑
    let flag = true;
    async function startProgress() {
      let p = 0;
      while (flag && p < 99) {
        p++;
        setPercent(p);
        const time = p < 10 ? 100 : 500;
        await sleep(time);
      }
    }
    startProgress();
    // 触发转换并轮询状态
    async function startConvert() {
      try {
        let task = { status: ConvertTaskStatus.Waiting } as ConvertTaskResponse;
        let taskId: string = '';
        try {
          taskId = await convertApi.convertMailAttachment2Doc(params);
        } catch (err: any) {
          task.status = ConvertTaskStatus.Failed;
          task.failureReason = getIn18Text('ZHUANCUNSHIBAI');
          if (err.message === 'timeout') {
            task.failureReason = getIn18Text('QINGQIUCHAOSHI');
          } else if (err.data && !err.data.success && err.data.message) {
            task.failureReason = err.data.message;
          }
        }
        const startTime = Date.now();
        while (task.status === ConvertTaskStatus.Waiting) {
          if (Date.now() - startTime > CONVERT_TIMEOUT) {
            task.failureReason = getIn18Text('ZHUANHUANCHAOSHI');
            break;
          }
          await sleep(5000);
          try {
            task = await convertApi.getMailAttachmentDocCovertStatus(taskId);
          } catch (err) {
            console.log(err);
          }
        }
        flag = false;
        if (task.status === ConvertTaskStatus.Completed) {
          messageApi.open({
            type: 'success',
            key: LOADING_MESSAGE_KEY,
            content: getIn18Text('ZHUANHUANCHENGGONG'),
            duration: 1000,
          });
          // 跳转
          const url = convertApi.getFileURL(task);
          if (systemApi.isElectron()) {
            systemApi.handleJumpUrl(-1, url);
          } else {
            systemApi.openNewWindow(url);
          }
          // 打点
          trackerApi.track(CONVERT_EVENT_ID, {
            operatype: ConvertOperaType.ConvertSuccess,
            type: getConvertFileType(currentAttachment.fileType!),
          });
        } else {
          messageApi.open({
            type: 'error',
            key: LOADING_MESSAGE_KEY,
            content: task.failureReason || getIn18Text('ZHUANCUNSHIBAI'),
            duration: 1000,
          });
        }
      } catch (err) {
        console.error(err);
        flag = false;
        messageApi.open({
          type: 'error',
          key: LOADING_MESSAGE_KEY,
          content: getIn18Text('WEIZHICUOWU'),
          duration: 1000,
        });
      }
      setTimeout(() => hide(), 1000);
      setLoading(false);
      setPercent(0);
    }
    startConvert();
  }, [messageApi, currentAttachment]);
  // 打点用，按钮可见时打点
  useEffect(() => {
    if (canConvert) {
      trackerApi.track(CONVERT_EVENT_ID, {
        operatype: ConvertOperaType.ButtonShow,
        type: getConvertFileType(currentAttachment.fileType!),
      });
    }
  }, [canConvert, currentAttachment]);
  // 打开文件目录
  const openDir = downloadInfo => {
    if (downloadInfo) {
      fileApi.getFileInfo({ ...downloadInfo, _account: currentAccount }).then(result => {
        if (result && result.length > 0) {
          fileApi.testLocalFile({ ...result[0], _account: currentAccount }).then(bool => {
            if (!bool) {
              SiriusMessage.warn({ content: getIn18Text('WEIZHAODAOWENJIAN11') }).then(() => {
                clearProgress();
              });
            }
          });
          fileApi.show({ ...result[0], _account: currentAccount });
        } else {
          SiriusMessage.warn({ content: getIn18Text('WEIZHAODAOWENJIAN12') }).then(() => {
            clearProgress();
          });
        }
      });
    }
  };
  const doDownload = async (item: FileAttachModel) => {
    if (inElectron) {
      const downloadFile = () => {
        clearProgress();
        fileApi
          .saveDownload(item, {
            throttleTime: 100,
            progressIndicator: (_: number, receivedBytes?: number) => {
              // updateProgress(receivedBytes)
              dispatch(AttachmentActions.doUpdateDownloadProgress(((receivedBytes || 1) / item?.fileSize) * 100));
              setOperateDisabled(['doDownload']);
            },
            _account: currentAccount,
          })
          .then((res: unknown) => {
            const resData = res as unknown as LoaderResult;
            if (resData.succ) {
              dispatch(AttachmentActions.doUpdateDownloadProgress(100));
              setOperateDisabled(['open']);
            }
          });
      };
      try {
        const fileInfo = await fileApi.getFileInfo({ ...item, _account: currentAccount });
        const isFileExist = fileInfo && fileInfo.length > 0 ? await fileApi.testLocalFile({ ...fileInfo[0], _account: currentAccount }) : false;
        if (!isFileExist) {
          downloadFile();
        } else {
          openDir(item);
        }
      } catch (error) {
        downloadFile();
      }
      return;
    }
    dispatch(doDownloadAttchmentAsync({ fileName: item?.fileName, fileSize: item?.fileSize, fileUrl: item?.fileUrl, _account: currentAccount }));
  };
  // 关闭弹窗
  const closeModal = () => {
    if (systemApi.isElectron() && window.electronLib) {
      systemApi.closeWindow();
    } else {
      dispatch(actions.doAttachmentPreview({ visible: false, downloadContentId, downloadId } as any));
    }
  };
  const operateClick = type => {
    if (loading) {
      return;
    }
    if (operateDisabled.includes(type)) {
      return;
    }
    switch (type) {
      case 'previous':
        onFetchDetail && onFetchDetail(hash, { name: attachments[index - 1]?.fileName });
        setIndex(i => i - 1);
        break;
      case 'next':
        onFetchDetail && onFetchDetail(hash, { name: attachments[index + 1]?.fileName });
        setIndex(i => i + 1);
        break;
      case 'doDownload':
        doDownload(list[index]);
        break;
      case 'open':
        openDir(list[index]);
        break;
      case 'close':
        closeModal();
        break;
      default:
        break;
    }
  };
  const [modalHeight, serModalHeight] = useState(640);
  const onResizeListener = () => {
    const clientH = document.body.clientHeight;
    serModalHeight(clientH - 80);
  };
  // 根据窗口大小，调整iframe宽高
  useEffect(() => {
    onResizeListener();
    inWindow() && window.addEventListener('resize', onResizeListener);
    return () => {
      inWindow() && window.removeEventListener('resize', onResizeListener);
    };
  }, []);
  const operate = () => {
    let types = ['', 'doDownload', 'open'];
    if (!inElectron) {
      // web端下，接受props控制是否展示关闭，默认展示
      if (operateClose) {
        types = ['', 'doDownload', 'close'];
      } else {
        types = ['', 'doDownload'];
      }
    }
    return types.map((type, i) => {
      let res = <div className={`${style.line}`} />;
      if (type) {
        res = <IconCard type={type as any} style={{ opacity: loading || operateDisabled.includes(type) ? '0.5' : '' }} />;
        if (type === 'doDownload' && ![0, 100].includes(downloadProgress)) {
          res = <CircleProgress width={16} type="circle" percent={downloadProgress} format={() => ''} />;
        }
      }
      return (
        <div
          key={type + i}
          className={`${style.operateItem}`}
          onClick={() => {
            operateClick(type);
          }}
        >
          {res}
        </div>
      );
    });
  };
  const renderButtonText = () => {
    if (downloadProgress === 100) {
      return systemApi.isElectron() ? getIn18Text('DAKAI') : getIn18Text('WANCHENG');
    }
    return downloadProgress === 0 ? getIn18Text('XIAZAI') : getIn18Text('XIAZAIZHONG');
  };
  const renderContent = () => {
    if (!list.length) return null;
    const content = list[index] || {};
    const fileType = content?.fileName?.split('.')?.pop()?.toLowerCase() || '';
    if (ALLOW_FILE_TYPE.includes(fileType)) {
      /* eslint-disable-next-line jsx-a11y/iframe-has-title */
      return <iframe src={iframeUrl} width="100%" height="100%" />;
    }
    return (
      <div className={style.unsupportPage}>
        <div className="sirius-empty sirius-empty-search" />
        <span
          style={{
            color: 'rgba(38, 42, 51, 0.5)',
            fontSize: 14,
            marginTop: 30,
            marginBottom: 18,
          }}
        >
          {getIn18Text('BUZHICHIGAIGE')}
        </span>
        <ProgressButton onClick={() => doDownload(content)} progress={downloadProgress}>
          {renderButtonText()}
        </ProgressButton>
      </div>
    );
  };

  const isSubAccount = currentAccount && currentAccount.length ? true : false;
  const visibleSaveToDisk = !isUploadAttachment && !isSubAccount && !isTpMail && currentAttachment?.from !== 'cloudAttCont';
  const visibleTransSiriusDoc =
    process.env.BUILD_ISELECTRON && !isUploadAttachment && !isSubAccount && canConvert && !isTpMail && currentAttachment?.from !== 'cloudAttCont';
  return (
    <div
      className={`${style.previewAttachment}`}
      style={{
        height: `${modalHeight}px`,
      }}
    >
      <div className={`${style.header}`}>
        <div className={`${style.title}`}>{list[index?.fileName]}</div>
        <div className={`${style.operate}`}>
          {visibleSaveToDisk && (
            <div className={classnames(style.button, { [style.grey]: true })}>
              <TransferButton downloadInfo={list[index]}>{getIn18Text('CUNDAOGERENKONG')}</TransferButton>
            </div>
          )}
          {visibleTransSiriusDoc && (
            <Tooltip overlay={getIn18Text('LINGCUNWEIZAIXIAN')}>
              <div
                className={classnames(style.button, { [style.disabled]: loading })}
                onClick={() => {
                  if (loading) {
                    return;
                  }
                  convertToOnlineDoc();
                  trackerApi.track(CONVERT_EVENT_ID, {
                    operatype: ConvertOperaType.Convert,
                    type: getConvertFileType(currentAttachment.fileType!),
                  });
                }}
              >
                {getIn18Text('ZHUANWEIXIETONGWEN')}
                <ProgressContext.Provider value={{ percent }}>{contextHolder}</ProgressContext.Provider>
              </div>
            </Tooltip>
          )}
          {operate()}
        </div>
      </div>
      <div className={`${style.contentWrap}`} style={{ height: '100%' }}>
        {renderContent()}
      </div>
    </div>
  );
};
export default PreviewContent;
