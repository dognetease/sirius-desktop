import SiriusModal from '@web-common/components/UI/Modal/SiriusModal';
import { ModalProps, Skeleton } from 'antd';
import { formatFileSize } from '@web-common/utils/file';
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react';
import React, { useEffect, useRef, useState, useMemo } from 'react';
import IconCard, { IconMapKey } from '@web-common/components/UI/IconCard';
import { renderToString } from 'react-dom/server';
import { apiHolder, apis, EdmSendBoxApi, ResponseSendBoxCopy, EdmEmailInfo } from 'api';
import moment from 'moment';
import { ReactComponent as ReplyHeaderHolder } from '@/images/icons/edm/replyheader.svg';
import Header from './header';
import { getIn18Text } from 'api';
const edmApi = apiHolder.api.requireLogicalApi(apis.edmSendBoxApiImpl) as EdmSendBoxApi;
interface IViewEdmContent {
  id: string;
  info?: EdmEmailInfo | null;
}
const headerHolderImg = renderToString(<ReplyHeaderHolder style={{ width: '100%', marginTop: '20px' }} />);
function prepareAttachmentsForSend(attachmentList: any[]) {
  if (attachmentList.length === 0) return '';
  const head = `<div><br/>普通附件(${attachmentList.length})</div>`;
  const body = attachmentList.map(a => {
    const size = formatFileSize(a.fileSize);
    let icon;
    const extName = String(a.fileName).split('.').pop() as IconMapKey;
    if (a.type === 0) {
      icon = renderToString(<IconCard type={extName} width={24} height={24} />);
    } else {
      icon =
        '<img width="24px" height="24px" src="https://cowork-storage-public-cdn.lx.netease.com/lxbg/2021/06/22/ca9bd44fe5cb439f99b8507c9c0d626d.png" border="0" title="云附件" showheight="24px" showwidth="24px" style="width: 24px; height: 24px;">';
    }
    return `<div class="netease-sirius-edm-attach" style="font-size: 14px; font-style: normal; font-variant-caps: normal; font-weight: normal; letter-spacing: normal; orphans: auto; text-align: start; text-indent: 0px; text-transform: none; white-space: normal; widows: auto; word-spacing: 0px; -webkit-text-size-adjust: auto; -webkit-text-stroke-width: 0px; text-decoration: none; clear: both; margin-top: 1px; margin-bottom: 1px; font-family: verdana, Arial, Helvetica, sans-serif; border: 1px solid rgb(238, 238, 239); box-shadow: rgba(203, 205, 210, 0.3) 0px 5px 15px; border-top-left-radius: 6px; border-top-right-radius: 6px; border-bottom-right-radius: 6px; border-bottom-left-radius: 6px; color: rgb(38, 42, 51);">
            <div style="background-color: rgb(255, 255, 255); padding: 0px 12px; border-top-left-radius: 12px; border-top-right-radius: 12px; border-bottom-right-radius: 12px; border-bottom-left-radius: 12px; position: relative; background-position: initial initial; background-repeat: initial initial;"><div style="width: 24px; position: absolute; height: 40px; left: 16px; top: 4px;">
                <a href="${a.downloadUrl}">
                ${icon}
                </a>
            </div>
            <div style="padding-right: 32px; margin-left: 30px; border-bottom-width: 1px; border-bottom-style: solid; border-bottom-color: rgba(38, 42, 51, 0.08); margin-top: 16px; padding-bottom: 16px;">
                <div style="margin-left: 4px;">
                    <div style="padding: 1px; font-size: 14px; line-height: 14px;">
                    <a href="${a.downloadUrl}" target="_blank" rel="noopener" download="${a.downloadUrl}" style="text-decoration: none; color: rgb(38, 42, 51); display: block;">
                        ${a.fileName}
                    </a>
                    </div>
                    <div style="padding: 1px; color: rgb(38, 42, 51); opacity: 0.4; font-size: 12px; margin-top: 4px;">${size}</div>
                    </div>
                </div>
                <a class="divNeteaseSiriusCloudAttachItem" href="${a.downloadUrl}" download="${a.downloadUrl}" style="text-decoration: none; display: block; font-size: 12px; line-height: 12px; position: absolute; right: 16px; top: 29px; margin-top: -14px; color: rgb(56, 110, 231);">下载</a>
                </div>
            </div>
        <br class="Apple-interchange-newline">`;
  });
  return head + '<div>' + body.join('') + '</div>';
}
export const ViewEdmContent = (props: IViewEdmContent & ModalProps) => {
  const contentScrollRef = useRef<OverlayScrollbarsComponent>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [data, setData] = useState<ResponseSendBoxCopy | null>(null);
  const onScrollToAttacth = (index: number) => {};
  useEffect(() => {
    if (props.id && props.visible) {
      edmApi.copyFromSendBox({ edmEmailId: props.id }).then(data => {
        setData(data);
      });
    } else {
      setData(null);
    }
  }, [props.id, props.visible]);
  const { id, ...config } = props;
  // let emailSubject = data?.sendSettingInfo.emailSubject;
  // if (data?.sendSettingInfo.emailSubjects) {
  //   emailSubject = data?.sendSettingInfo.emailSubjects[0]?.subject || emailSubject;
  // }
  function parseAttachments(str?: string) {
    try {
      return JSON.parse(str as string);
    } catch (e) {
      return [];
    }
  }
  const srcDoc = useMemo(() => {
    const attachments = (parseAttachments(data?.contentEditInfo.emailAttachment) || []).filter(v => v.type === 0);
    const attachmentHtml = prepareAttachmentsForSend(attachments);
    if (data?.replyEdmEmailId) {
      return `${data?.contentEditInfo.emailContent || ''} ${headerHolderImg} ${attachmentHtml}`;
    }
    return `${data?.contentEditInfo.emailContent || ''} ${attachmentHtml}`;
  }, [data]);
  const modalTitle = useMemo(() => data?.sendSettingInfo.edmSubject || getIn18Text('YOUJIANXIANGQING'), [data]);
  return (
    <SiriusModal title={modalTitle} {...config} width={668} footer={null} className="sirius-no-drag">
      <Skeleton loading={data === null}>
        {data && (
          <OverlayScrollbarsComponent ref={contentScrollRef} options={{ scrollbars: { autoHide: 'leave', autoHideDelay: 0 } }} className="mail-read-content">
            <Header content={data} info={props.info} onScrollToAttacth={() => onScrollToAttacth(0)} />
            <iframe
              title={getIn18Text('YULAN')}
              sandbox="allow-same-origin allow-downloads"
              tabIndex={-1}
              srcDoc={srcDoc}
              ref={iframeRef}
              style={{
                width: 620,
                height: 500,
                marginTop: 16,
                border: 'none',
              }}
            />
          </OverlayScrollbarsComponent>
        )}
      </Skeleton>
    </SiriusModal>
  );
};
