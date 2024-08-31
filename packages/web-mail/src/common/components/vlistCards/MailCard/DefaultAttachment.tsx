import React from 'react';
import { MailFileAttachModel, SystemApi, MailEntryModel, apiHolder, AccountApi, apis } from 'api';
import { MailCardComProps } from '../../../../types';
import ImgPreview from '@web-common/components/UI/ImagePreview/index';
import IconCard, { IconMapKey } from '@web-common/components/UI/IconCard';
import { decodeAttFileName } from '@web-common/components/util/file';
const imgTypes = ['jpg', 'JPG', 'jpeg', 'JPEG', 'png', 'PNG', 'svg', 'SVG', 'gif', 'GIF'];
const systemApi = apiHolder.api.getSystemApi() as SystemApi;
const accountApi = apiHolder.api.requireLogicalApi(apis.accountApiImpl) as AccountApi;
import { useAppSelector } from '@web-common/state/createStore';
import { getIn18Text } from 'api';

export const ATTACHMENT_KEYS = [
  '_account',
  'downloadContentId',
  'downloadId',
  'fileName',
  'filePreviewUrl',
  'fileType',
  'fileUrl',
  'id',
  'flag',
  'mailId',
  'type',
  'fileSize',
  'attType',
];

const openImgAttachment = (attachment: MailFileAttachModel[], fileSourceKey: string) => {
  // todo： 附件预览，此处需要测试
  const onList = attachment
    .filter(i => i.fileType && imgTypes.includes(i.fileType))
    .map(i => ({
      ...i,
      nonOriginal: true,
      downloadUrl: i.fileUrl,
      previewUrl: i.filePreviewUrl,
      name: i.fileName,
      size: i.fileSize,
    })) as any;
  // 附件有多个且各种类型，所以在图片附件预览时index要取相对于所有图片附件的index
  const imgIndex = onList.findIndex(i => i.fileSourceKey === fileSourceKey);
  ImgPreview.preview({ data: onList, startIndex: imgIndex });
};
const cloudPreview = (data: MailEntryModel, file: any, _account?: string) => {
  const { attachment, id } = data.entry || {};
  const type = file?.fileType;
  if (type && imgTypes.includes(type) && attachment) {
    openImgAttachment(attachment, file?.fileSourceKey);
    return;
  }
  if (systemApi.isElectron() && window.electronLib) {
    systemApi.createWindowWithInitData('resources', {
      eventName: 'initPage',
      eventData: {
        downloadContentId: id,
        downloadId: file?.downloadId,
        filePreviewUrl: file?.filePreviewUrl,
        attachments: [{ ...file, downloadContentId: data?.id }],
        fileName: file?.fileName,
        type: 'attachment',
        // eslint-disable-next-line max-len
        hash: `https://resources/#type=attachment&mid=${file?.contentId}&fileName=${file?.fileName}&size=${file?.fileSize}&downloadId=${file?.downloadId}&downloadContentId=${data?.id}`,
      },
    });
  } else {
    // eventApi.sendSysEvent({
    //     eventName: 'mailMenuOper',
    //     eventData: {
    //         visible: true,
    //         downloadContentId: file?.fileUrl,
    //         attachments: [{ ...file, downloadContentId: data?.id }]
    //     },
    //     eventStrData: 'attachmentPreview',
    // });

    // downloadContentId外层的通过outDownloadContentId来传递
    const downloadInfo = { ...file, downloadContentId: data?.id };
    if (_account) {
      downloadInfo.account = accountApi.getEmailIdByEmail(_account);
    }
    const searchStrArr = ATTACHMENT_KEYS.map(k => `${k}=${encodeURIComponent((downloadInfo && downloadInfo[k]) || '')}`);
    let searchStr = searchStrArr.join('&');
    window.open(`${systemApi.getContextPath()}/attachment/?outDownloadContentId=${encodeURIComponent(downloadInfo?.downloadContentId as string)}&${searchStr}`);

    // todo:此处需要解耦，不能耦合对应的对象
    // 迁移为消息，解耦，后续做
    // attachmentActions.doAttachmentPreview({
    //   visible: true,
    //   downloadContentId: file?.fileUrl,
    //   attachments: [{ ...file, downloadContentId: data?.id }]
    // });
  }
};

const sortAttachmentsBySearchKey = (items: MailFileAttachModel[], shouldFilter: boolean, searchKey: string) => {
  if (!shouldFilter || !searchKey) return items;
  const hasItems: MailFileAttachModel[] = [];
  const unhasItems: MailFileAttachModel[] = [];
  if (items && items.length) {
    items.forEach(item => {
      if (item.fileName.includes(searchKey)) {
        hasItems.push(item);
      } else {
        unhasItems.push(item);
      }
    });
    return hasItems.concat(unhasItems);
  }
  return items;
};

// 转义特殊字符
const escapeRegExp = (str: string) => {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

const highLightStrBySearchKey = (str: string, isSearching: boolean, searckKey: string) => {
  if (!str || !isSearching || !searckKey) return str;
  if (str.includes('<b>' + searckKey + '</b>')) return str;
  return str.replaceAll(escapeRegExp(searckKey), '<b>' + searckKey + '</b>');
};

// 默认附件展示逻辑
export const defaultComAttachment = (props: MailCardComProps) => {
  const { data } = props;
  const isSearching = useAppSelector(state => !!state.mailReducer.mailSearching);
  const mailSearchKey = useAppSelector(state => state.mailReducer.mailSearchKey);
  const shouldFilterAttachment = !!(isSearching && mailSearchKey);
  const { isThread, isTpMail, isEncryptedMail, isDecrypted, _account } = data || {};
  const { attachment } = data.entry || {};
  const filteAttachments = attachment?.filter(item => !item.inlined && item.fileType !== 'ics' && item.type !== 'netfolder');
  const attachmentList = sortAttachmentsBySearchKey(filteAttachments || [], shouldFilterAttachment, mailSearchKey);
  const unDecrypted = isEncryptedMail && !isDecrypted;
  return (
    <>
      {attachmentList?.map((_item, index) => {
        const type = unDecrypted ? 'other' : (_item.fileType as IconMapKey) || 'other';
        const fileName = highLightStrBySearchKey(_item.fileName, isSearching, mailSearchKey);
        if (index < 2) {
          return (
            <div
              className="attachment"
              style={{ width: attachmentList.length < 2 ? '' : '50%' }}
              onClick={e => {
                if (!isThread && !isTpMail && unDecrypted) {
                  e.stopPropagation();
                  e.preventDefault();
                  // 聚合邮件不可预览附件
                  cloudPreview(data, _item, _account);
                }
              }}
            >
              <div className="attachment-logo">
                <IconCard type={type} />
              </div>
              <div className="attachment-name">
                <span dangerouslySetInnerHTML={{ __html: decodeAttFileName(fileName || _item.fileName || getIn18Text('WEIMINGMING')) }} />
              </div>
            </div>
          );
        }
        return '';
      })}
      {attachmentList && attachmentList.length > 2 ? <div className="attachment-num">{`+${attachmentList.length - 2}`}</div> : ''}
    </>
  );
};
// 通栏布局附件展示逻辑
export const defaultComAttachmentLong = (props: MailCardComProps) => {
  const { data } = props;
  const { isThread, _account } = data || {};
  const { attachment } = data.entry || {};
  const isSearching = useAppSelector(state => !!state.mailReducer.mailSearching);
  const mailSearchKey = useAppSelector(state => state.mailReducer.mailSearchKey);
  const shouldFilterAttachment = !!(isSearching && mailSearchKey);
  const filterAttachment = attachment?.filter(item => !item.inlined && item.fileType !== 'ics' && item.type !== 'netfolder');
  const attachmentList = sortAttachmentsBySearchKey(filterAttachment || [], shouldFilterAttachment, mailSearchKey);
  const wrapDoms = document.getElementsByClassName('long-attachments-warp');
  const clientWidth = wrapDoms && wrapDoms.length && wrapDoms[0].clientWidth;
  const itemWidth = 134; // 通栏下附件固定宽度126，间距8
  let needShowNum = attachmentList?.length || 0; // 需要展示数量
  let canShowNum = Math.floor(clientWidth / itemWidth); // 可以展示数量
  // 如果可以放的下
  if (needShowNum <= canShowNum) {
    return (
      <>
        {attachmentList?.map((_item, index) => {
          const type = (_item.fileType as IconMapKey) || 'other';
          const fileName = highLightStrBySearchKey(_item.fileName, isSearching, mailSearchKey);
          return (
            <div
              className="attachment"
              style={{ width: 126, marginRight: 8 }}
              key={index}
              onClick={e => {
                if (!isThread) {
                  e.stopPropagation();
                  e.preventDefault();
                  // 聚合邮件不可预览附件
                  cloudPreview(data, _item, _account);
                }
              }}
            >
              <div className="attachment-logo">
                <IconCard type={type} />
              </div>
              <div className="attachment-name">
                <span dangerouslySetInnerHTML={{ __html: decodeAttFileName(fileName || _item.fileName || getIn18Text('WEIMINGMING')) }} />
              </div>
            </div>
          );
        })}
      </>
    );
  } else {
    // 放不下则截断处理一下
    return (
      <>
        {attachmentList?.map((_item, index) => {
          const type = (_item.fileType as IconMapKey) || 'other';
          if (index < canShowNum || (canShowNum === 0 && index === 0)) {
            return (
              <div
                className="attachment"
                style={{ width: 126, marginRight: 8 }}
                onClick={e => {
                  if (!isThread) {
                    e.stopPropagation();
                    e.preventDefault();
                    // 聚合邮件不可预览附件
                    cloudPreview(data, _item, _account);
                  }
                }}
              >
                <div className="attachment-logo">
                  <IconCard type={type} />
                </div>
                <div className="attachment-name">
                  <span dangerouslySetInnerHTML={{ __html: decodeAttFileName(_item.fileName || getIn18Text('WEIMINGMING')) }} />
                </div>
              </div>
            );
          } else {
            return '';
          }
        })}
        {
          // 判断clientWidth != 0,是临时解决通过dom获取卡片宽度的缺陷方法...该方法在首次加载，且渲染第一个卡片的时候，可能会获取不到宽度导致错误的总数计算
        }
        {clientWidth != 0 ? <div className="attachment-num">{`+${needShowNum - canShowNum}`}</div> : <></>}
      </>
    );
  }
  // return (<>
  //   {attachmentList?.map((_item, index) => {
  //     const type = (_item.fileType as IconMapKey) || 'other';
  //     if (index < 4) {
  //       return (<div className="attachment" style={{ width: attachmentList.length < 4 ? '' : '25%' }} onClick={e => {
  //         if (!isThread) {
  //           e.stopPropagation();
  //           e.preventDefault();
  //           // 聚合邮件不可预览附件
  //           cloudPreview(data, _item);
  //         }
  //       }}>
  //         <div className="attachment-logo">
  //           <IconCard type={type} />
  //         </div>
  //         <div className="attachment-name">
  //           <span dangerouslySetInnerHTML={{ __html: decodeAttFileName(_item.fileName || (getIn18Text("WEIMINGMING"))) }} />
  //         </div>
  //       </div>);
  //     }
  //     return '';
  //   })}
  //   {attachmentList && attachmentList.length > 4 ? <div className="attachment-num">{`+${attachmentList.length - 4}`}</div> : ''}
  // </>);
};
