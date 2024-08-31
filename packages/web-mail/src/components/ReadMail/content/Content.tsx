import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import {
  apiHolder as api,
  apis,
  DataTrackerApi,
  FileApi,
  MailConfApi,
  MailEntryModel,
  MailFileAttachModel,
  SystemApi,
  inWindow,
  DownloadReminderInfo,
  FileAttachModel,
} from 'api';
import moment from 'moment';
import MailContent from './MailContent';
import { Attachment, Attachment as AttachmentType } from '@web-common/state/state';
import DownloadCard from '@web-common/components/UI/DownloadCard';
import SiriusMessage from '@web-common/components/UI/Message/SiriusMessage';
import ReadListIcons from '@web-common/components/UI/Icons/svgs/ReadListSvgs';
import { formatFileSize } from '@web-common/utils/file';
import { useAppSelector } from '@web-common/state/createStore';
import { MailStatus, isMainAccount, systemIsWindow } from '../../../util';
import { mailIdChangeRecord } from '../../../types';
import { AttachmentDownloadAction } from './AttachmentTotalDownloadEntry';
const systemApi = api.api.getSystemApi() as SystemApi;
const inElectron = systemApi.isElectron();
const fileApi = api.api.getFileApi() as FileApi;
const mailConfApi = api.api.requireLogicalApi(apis.mailConfApiImpl) as MailConfApi;
const trackApi: DataTrackerApi = api.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;
import { FeatureConfig } from '../../../types';
import { useDebounceEffect } from 'ahooks';
import { getIn18Text } from 'api';
import useCreateCallbackForEvent from '@web-common/hooks/useCreateCallbackForEvent';
import useStateRef from '@web-mail/hooks/useStateRef';

interface Props {
  // 邮件数据
  content: MailEntryModel;
  // 正文是否正在拖动中
  mailListResizeProcessing?: boolean;
  // 是否是聚合邮件
  merge?: boolean;
  // 是否对内容进行包装以方便滑动
  showWrap?: boolean;
  // 是否撤回了
  isrcl?: boolean;
  // dispatch: Dispatch;
  mailIdChangeRecord?: {
    current: mailIdChangeRecord | null;
  };
  // 是否只读
  readOnly?: boolean;
  onIframeWidthChange: (width: number) => void;
  onIframeInitMinWidth: (width: number) => void;
  // 功能细节开关
  featureConfig?: FeatureConfig;
  // 强制刷新
  forceUpdate?: number;
}
interface IcsProps {
  senderEmail: string;
  mid: string;
  setIcsSuccess: React.Dispatch<React.SetStateAction<boolean>>;
  attachmentsIds: number[];
}
export interface ContentRef {
  getAttachRef(): React.RefObject<HTMLDivElement>;
  getIframeRef(): React.RefObject<HTMLIFrameElement>;
  key?: string;
}
// 是否过期
const notExpired = (expireTime?: number): boolean => {
  return expireTime == null || expireTime === 0 || expireTime > Date.now();
};

const defaultHorizontalScrollWrapComponent = props => <div {...props}>{props.children}</div>;

const Content: React.ForwardRefRenderFunction<ContentRef, Props> = (props, ref) => {
  // console.log("attachmentsattachments",attachments)
  // const dispatch = useAppDispatch();
  // const attachments = useAppSelector(state => state.attachmentReducer.attachments); // attachment放到redux内完全没意义
  // performanceImpl.time({ statKey: 'test', statSubKey: 'subtest' });
  const {
    content,
    merge,
    showWrap,
    isrcl,
    mailIdChangeRecord,
    readOnly = false,
    onIframeWidthChange,
    onIframeInitMinWidth,
    featureConfig,
    forceUpdate,
    HorizontalScrollWrapComponent = defaultHorizontalScrollWrapComponent,
  } = props;
  // 是否是ics邮件
  const [icsMail, setIcsMail] = useState(false);
  const [curAttachments, setCurAttachments] = useState<AttachmentType[]>([]);
  const [icsSuccess, setIcsSuccess] = useState(true);
  const [attachmentsZipPath, setAttachmentsZipPath] = useState(''); // 附件“全部保存”后的压缩包系统目录
  const [downLoadIrrevocable, setDownLoadIrrevocable] = useState(false); // 附件下载过程中是否是不可取消的 false: 可以取消  true: 不可取消
  const scrollToAttachments = useAppSelector(state => state.readMailReducer.scrollToAttachments);
  const replyRef = useRef<any>(null);
  // const ifreameWrap = useRef();
  const [icsProps, setIcsProps] = useState<IcsProps>({
    mid: '0',
    attachmentsIds: [],
    senderEmail: '',
    setIcsSuccess,
  });
  const attacthRef = useRef<HTMLDivElement>(null);
  const [totalSize, setTotalSize] = useState('');
  const setAttachmentsZipPathRef = useRef<string>('');
  setAttachmentsZipPathRef.current = attachmentsZipPath;
  const fromLocalEml = useMemo(() => !!content?.localFilePath, [content]);
  const isTpMail = useMemo(() => !!content?.isTpMail, [content]);
  const isDecrypted = useMemo(() => !!content?.isDecrypted, [content]);
  const isEncryptedMail = useMemo(() => !!content?.isEncryptedMail, [content]);
  const contentRef = useStateRef(content);

  // 邮件是否属于主账号
  const isMainAcc = useMemo(() => {
    return isMainAccount(content?._account);
  }, [content]);

  // 邮件卡片的特殊配置
  const attactCardConfig = useMemo(() => {
    return featureConfig?.attachCard;
  }, [featureConfig]);

  // useWhyDidYouUpdate('Content-mail', { ...props,icsMail, curAttachments, icsSuccess, attachmentsZipPath, downLoadIrrevocable, icsProps, totalSize, fromLocalEml, attactCardConfig});

  // 附件inlinedkey
  const attachmentInlinedKey = useMemo(() => {
    if (content && content?.entry?.attachment) {
      let key = '';
      content?.entry?.attachment.forEach(item => {
        key += item?.inlined + ',';
      });
      return key;
    }
    return '';
  }, [content]);

  useEffect(() => {
    if (scrollToAttachments?.mailId && scrollToAttachments?.mailId === contentRef.current?.id) {
      attacthRef.current?.scrollIntoView();
    }
  }, [scrollToAttachments]);

  useDebounceEffect(
    () => {
      // 获取附件“全部保存”后的压缩包系统目录
      // attachmentsZipPath 存在则“全部下载”按钮改为“打开文件夹”
      if (!content?.id) {
        return;
      }
      fileApi.getAttachmentZipPath(content?.id).then(result => {
        if (result) {
          setAttachmentsZipPath(result);
        } else {
          setAttachmentsZipPath('');
        }
      });
    },
    [content?.id],
    { wait: 500 }
  );

  useEffect(() => {
    // const list: any = attachments.filter(
    //   item => item && item.type === 'download' && item.downloadContentId && item.downloadContentId === content?.id
    // ).map(item => {
    //   if (!content.entry.attachment) {
    //     return item;
    //   }
    //   const target = content.entry.attachment.find(v => v.id === item.id);
    //   if (!target) {
    //     return item;
    //   }
    //   return {
    //     ...item,
    //     size: target.fileSize,
    //     type: target.type
    //   };
    // });
    if (!content) {
      return;
    }
    const list = content.entry.attachment;
    if (list && list.length) {
      const filterList: Attachment[] = list
        .filter(item => !item.inlined)
        .map(item => ({
          ...item,
          type: 'download',
          cloudAttachment: item.type === 'netfolder',
          downloadId: item.id + ';' + content.id,
          downloadContentId: content.id,
          size: item.fileSize,
          mailId: content.id,
          unDecrypted: content.isEncryptedMail && !content.isDecrypted,
        }));
      // 解密下id相同，延迟覆盖
      if (content.isDecrypted) {
        setCurAttachments([]);
        setTimeout(() => {
          setCurAttachments(() => {
            if (icsSuccess) {
              return filterList.filter(item => item.fileType !== 'ics');
            }
            return filterList;
          });
        }, 200);
      } else {
        setCurAttachments(() => {
          if (icsSuccess) {
            return filterList.filter(item => item.fileType !== 'ics');
          }
          return filterList;
        });
      }

      // 计算全部尺寸
      const listSize = filterList
        .filter(item => item.fileType !== 'ics')
        .reduce((total, current) => {
          total += current.size;
          return total;
        }, 0);
      setTotalSize(listSize > 0 ? formatFileSize(listSize, 1024) : '');
    } else {
      setTotalSize('');
      setCurAttachments(data => {
        if (data && data.length == 0) {
          return data;
        }
        return [];
      });
    }
  }, [icsSuccess, attachmentInlinedKey, content?.id, content?.entry?.attachment, content?.isDecrypted]);

  const dealAttachments = (list: MailFileAttachModel[], downloadContentId: string, senderEmail: string) => {
    const icsList = list.filter(attachment => attachment.fileType === 'ics');
    const normalAttachCount = list.filter(e => e.fileType !== 'ics');
    let category: string;
    if (icsList.length) {
      setIcsProps({
        senderEmail,
        mid: downloadContentId,
        setIcsSuccess,
        attachmentsIds: icsList.map(item => item.id),
      });
      setIcsMail(true);
      setIcsSuccess(true); // TODO: 待补充逻辑，如果ics parse 失败，需要把ics的附件加回来
      category = getIn18Text('DAIicsFU');
    } else {
      setIcsMail(false);
      category = normalAttachCount && normalAttachCount.length > 0 ? getIn18Text('DAIFEIics') : getIn18Text('BUDAIPUTONGFU');
    }
    trackApi.track('pcMail_view_mailDetailPage', { category });
    // const hasIcs = content.entry.attachment?.findIndex(e => e.fileType === 'ics');
    // if (hasIcs !== undefined && hasIcs > -1) {
    // Mail reader只有一个实例 这里要把状态重置到初始状态;
    // }
    // 信件没有打开过，也没有被转发过，需要将添加到附件列表 ---- 没转发什么事了，前面那条评论有年头了，不用在意了，读信的附件就是读信的附件了，不会和其他地方关联了
    // if (!attachments.some(item => item.downloadContentId === downloadContentId)) {
    //   filterList
    //     .map(item => ({
    //       ...item,
    //       type: 'download',
    //       cloudAttachment: item.type === 'netfolder',
    //       downloadId: item.fileUrl + downloadContentId,
    //       downloadContentId,
    //     }))
    //     .forEach(i => dispatch(attachmentDownloadAction(i)));
    // }
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

  const handleReply = useCallback(() => {
    replyRef.current?.update();
  }, []);

  // 做个防抖
  useEffect(() => {
    if (content && content?.id && content?.entry) {
      // 有附件
      if (content?.entry?.attachment?.length) {
        dealAttachments(content?.entry?.attachment, content?.id, content?.sender?.contactItem?.contactItemVal);
      } else {
        setIcsMail(false);
        trackApi.track('pcMail_view_mailDetailPage', { category: getIn18Text('BUDAIPUTONGFU') || '' });
      }
    }
  }, [content?.id, content?.entry?.attachment?.length, forceUpdate]);

  const isCorpMail = useAppSelector(state => state.loginReducer.loginInfo.isCorpMailMode);

  // 打包下载
  const saveAttachmentZip = useCallback(async () => {
    // 过滤掉过期的附件
    const attachments = curAttachments.filter(attachment => notExpired(attachment.expired));
    if (attachments.length === 0) {
      return;
    }
    const currDayStr = moment().format('YYYYMMDD');
    // const mailName = content.entry.title?.replace(/[:*\^\|'"`~]/gi, '_') || '-';
    let mailName = '-';
    try {
      const title = content?.entry?.title;
      if (title) {
        mailName = title.replace(/[:*\^\|'"`~]/gi, '_');
      }
    } catch (e) {
      console.error('[Error reg]', e);
    }

    // 生成包名
    const zipFileName = isCorpMail
      ? // corpMail暂不支持中文，中文会乱码
        `Attachments-${currDayStr}`
      : `${mailName}的全部附件${currDayStr}`;
    if (inElectron) {
      if (downLoadIrrevocable) return;
      setDownLoadIrrevocable(true);
      try {
        // if (content?._account) {
        //   setCurrentAccount(content?._account);
        // }
        const zipRes = await fileApi.saveZip(attachments, zipFileName, content?.id, { removeOrginalFile: true, _account: content?._account });
        console.log('saveAttachmentZip 打包下载', zipRes);
        const { success, path } = zipRes;
        if (success && path) {
          setAttachmentsZipPath(path);
          // openDir();
          try {
            const zipData = await window.electronLib.fsManage.stat(path);
            if (zipData) {
              revolveDownloadReminder([
                {
                  fileName: `${zipFileName}.zip`,
                  fileSize: zipData.size,
                  fileType: 'zip',
                  filePath: path,
                },
              ]);
            }
          } catch (err) {
            console.log('打包下载完成提醒失败', err);
          }
        }
      } catch (e) {
        console.error(e);
        SiriusMessage.warn({ content: getIn18Text('DABAOXIAZAISHI') });
      } finally {
        setDownLoadIrrevocable(false);
      }
    } else {
      const url = mailConfApi.getReadMailPackUrl(content, attachments, zipFileName);
      if (url) {
        window.open(url);
      }
    }
  }, [isCorpMail, downLoadIrrevocable, content, curAttachments]);

  // 分别下载
  const saveAllAttachment = useCallback(
    async (_account?: string) => {
      // 过滤掉过期的附件
      const attachments = curAttachments.filter(attachment => notExpired(attachment.expired));
      if (attachments.length === 0) {
        return;
      }
      if (downLoadIrrevocable) {
        return;
      }
      setDownLoadIrrevocable(true);
      try {
        // if (content?._account) {
        //   setCurrentAccount(content?._account);
        // }
        const downloadRes = await fileApi.saveAll(attachments, _account);
        console.log('saveAllAttachment 分别下载', downloadRes);
        const { success, loadResArr } = downloadRes;
        if (success && loadResArr) {
          // const firSucOne = loadResArr.find(item => !!item.succ);
          // firSucOne && fileApi.show(firSucOne.fileModel);

          // 下载成功唤起弹窗
          let sucFileModel: DownloadReminderInfo[] = [];
          loadResArr.forEach(item => {
            const { succ, fileModel } = item;
            if (succ && fileModel?.filePath) {
              sucFileModel.push(fileModel);
            }
          });
          sucFileModel?.length && revolveDownloadReminder(sucFileModel);
        }
      } catch (e) {
        console.error(e);
        SiriusMessage.warn({ content: getIn18Text('FENBIEXIAZAISHI') });
      } finally {
        setDownLoadIrrevocable(false);
      }
    },
    [isCorpMail, downLoadIrrevocable, content, curAttachments]
  );

  const openDir = useCallback(() => {
    const isSuccess = fileApi.openDir(setAttachmentsZipPathRef.current);
    if (!isSuccess) {
      SiriusMessage.warn({ content: getIn18Text('WEIZHAODAOWENJIAN11') }).then(() => {
        setAttachmentsZipPath('');
        fileApi.delAttachmentZipPath(content?.id);
      });
    }
  }, []);
  const iframeRef = useRef(null);
  React.useImperativeHandle(
    ref,
    () => ({
      getAttachRef: () => attacthRef,
      getIframeRef: () => iframeRef,
    }),
    [attacthRef, iframeRef.current]
  );

  // 邮件附件
  const AttachmentElement = useMemo(() => {
    return (
      <div ref={attacthRef} className="readmail-attachments" hidden={!curAttachments.length}>
        <div className="title">
          <ReadListIcons.AttachPinSvg />
          <span style={{ marginLeft: '4px' }}>
            {curAttachments.length}
            {getIn18Text('GEFUJIAN')}
          </span>
          {totalSize && <span>（{totalSize}）</span>}
          {/* 附件个数>1 && (electron环境) */}
          {!fromLocalEml && curAttachments.length > 1 && inElectron && !attactCardConfig?.hidePackDownload && (
            // curAttachments.length>1 && !inElectron?<AttachmentDownloadAction/>:
            <AttachmentDownloadAction
              downloadAction={type => {
                console.log('download.type:', type);
                if (type === 'zip') {
                  saveAttachmentZip();
                } else {
                  saveAllAttachment(content?._account);
                }
              }}
            />
          )}
          {/* web环境（附件不包含云附件) */}
          {!fromLocalEml &&
            curAttachments.length > 1 &&
            !inElectron &&
            !attactCardConfig?.hidePackDownload &&
            curAttachments.every(item => {
              return item.cloudAttachment !== true;
            }) && (
              <span className="save-all" onClick={() => saveAttachmentZip()}>
                {getIn18Text('DABAOXIAZAI')}
              </span>
            )}
        </div>
        <div className="attachment-list">
          {curAttachments?.length && (
            <>
              {curAttachments.map(item => {
                const cardElemnt = (
                  <DownloadCard
                    key={item.downloadId}
                    from="mail"
                    className="card "
                    id={item.downloadId}
                    mid={content?.id}
                    fid={content?.entry?.folder}
                    downloadInfo={item}
                    attachments={curAttachments}
                    irrevocable={downLoadIrrevocable}
                    showCloudPreview={(isTpMail || !readOnly) && !['cmecypt'].includes(item?.fileType || '') && !content?.isEncryptedMail}
                    showSaveForward={!readOnly && isMainAcc && !(isEncryptedMail && !isDecrypted)}
                    attactCardConfig={attactCardConfig}
                    isTpMail={!!content.isTpMail}
                    source={fromLocalEml ? 'eml' : ''}
                    _account={content?._account}
                  />
                );
                // if(attactCardConfig?.disabled){
                //   return (
                //     <div style={{cursor:'not-allowed'}} onClick={attactCardConfig?.onClick}>
                //       {cardElemnt}
                //     </div>
                //   )
                // }
                return cardElemnt;
              })}
            </>
          )}
        </div>
      </div>
    );
  }, [curAttachments, totalSize, attachmentsZipPath, downLoadIrrevocable, openDir, saveAttachmentZip, fromLocalEml, readOnly, isMainAcc, attactCardConfig, forceUpdate]);

  // const handleDivScroll = (event) => {
  //   const scrollLeft = event.target.scrollLeft;
  //   props.setScrollLeft && props.setScrollLeft(scrollLeft);
  // };

  const onIframeInitMinWidthRef = useCreateCallbackForEvent(onIframeInitMinWidth);
  const onIframeWidthChangeRef = useCreateCallbackForEvent(onIframeWidthChange);

  const MailContentEmement = useMemo(() => {
    return (
      <MailContent
        merge={merge}
        icsMail={icsMail}
        icsProps={icsProps}
        content={content}
        handleReply={handleReply}
        ref={re => {
          if (re && re.getIframeRef) {
            iframeRef.current = re.getIframeRef().current;
          }
        }}
        // mid={mid}
        isrcl={isrcl}
        forceUpdate={forceUpdate}
        mailIdChangeRecord={mailIdChangeRecord}
        readOnly={readOnly}
        onIframeWidthChange={onIframeWidthChangeRef}
        onIframeInitMinWidth={onIframeInitMinWidthRef}
      />
    );
  }, [merge, icsMail, icsProps, content, handleReply, isrcl, mailIdChangeRecord, readOnly, forceUpdate]);

  const mergeMailStWrap = useMemo(() => {
    return systemIsWindow() ? 'merge-mail-scroll-wrap-inwin' : 'merge-mail-scroll-wrap';
  }, []);

  if (showWrap) {
    return (
      <HorizontalScrollWrapComponent
        refkey={content?.id}
        className={`extheme ${mergeMailStWrap}`}
        // ref={ifreameWrap}
        // onScroll={handleDivScroll}
        style={{ backgroundColor: '#fff' }}
      >
        {MailContentEmement}
        {AttachmentElement}
      </HorizontalScrollWrapComponent>
    );
  }

  return (
    <HorizontalScrollWrapComponent refkey={content?.id} className="extheme" style={{ backgroundColor: '#fff' }}>
      {MailContentEmement}
      {AttachmentElement}
    </HorizontalScrollWrapComponent>
  );
};
export default React.forwardRef<ContentRef, Props>(Content);
