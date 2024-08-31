import { Modal } from 'antd';
import React, { useRef, useState, useEffect, useMemo } from 'react';
import style from './preview.module.scss';
import { AttachmentInfo } from 'api';
import { formatFileSize } from '@web-common/utils/file';
import { getIn18Text } from 'api';

export interface IPreviewContentProps {
  content: string[] | string;
  onCancel: () => any;
}
const PreviewContent = (props: IPreviewContentProps) => {
  const { content, onCancel } = props;
  const [resContent, setResContent] = useState<string[]>([]);
  const pcFrameRef = useRef<HTMLIFrameElement>(null);
  const mobileFrameRef = useRef<HTMLIFrameElement>(null);
  const hasContent = useMemo(() => {
    return resContent && resContent.length > 0 && (resContent[0] || resContent[1]);
  }, [resContent]);
  useEffect(() => {
    if (typeof content === 'string') {
      setResContent([content, content]);
    } else {
      setResContent(content);
    }
  }, [content]);
  const loadIframe = () => {
    try {
      if (!(pcFrameRef.current?.contentDocument && mobileFrameRef.current?.contentDocument)) {
        return;
      }
      const pcLinks = pcFrameRef.current.contentDocument.body.querySelectorAll('a') || [];
      const mobileLinks = mobileFrameRef.current.contentDocument.body.querySelectorAll('a') || [];
      for (let i = 0; i < pcLinks.length; i++) {
        pcLinks[i].style.cursor = 'default';
        pcLinks[i].href = '';
        pcLinks[i].onclick = function () {
          return false;
        };
      }
      for (let i = 0; i < mobileLinks.length; i++) {
        mobileLinks[i].style.cursor = 'default';
        mobileLinks[i].href = '';
        mobileLinks[i].onclick = function () {
          return false;
        };
      }
    } catch (e) {
      console.error('[error loadIframe preview]', e);
    }
  };
  if (!hasContent) {
    return null;
  }
  return (
    <Modal
      title={getIn18Text('YULAN')}
      visible={!!hasContent}
      footer={null}
      onCancel={onCancel}
      centered
      wrapClassName={style.modalWrap}
      bodyStyle={{ paddingTop: '0px' }}
      width={898}
    >
      <div className={style.previewContainer}>
        <div className={style.scroller}>
          <div className={style.previewWrap}>
            <div className={style.previewPc}>
              <iframe
                ref={pcFrameRef}
                title={getIn18Text('YULAN')}
                sandbox="allow-scripts allow-same-origin allow-downloads"
                data-alloy-tabstop="true"
                tabIndex={-1}
                srcDoc={resContent[0]}
                onLoad={loadIframe}
              />
            </div>
            <div className={style.previewMobile}>
              <iframe
                ref={mobileFrameRef}
                title={getIn18Text('YULAN')}
                sandbox="allow-scripts allow-same-origin allow-downloads"
                data-alloy-tabstop="true"
                tabIndex={-1}
                srcDoc={resContent[1]}
                onLoad={loadIframe}
              />
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default PreviewContent;

export function prepareAttachmentsForSend(attachmentList: AttachmentInfo[]) {
  if (attachmentList.length === 0) {
    return '';
  }
  const head = `<div><br/>附件(${attachmentList.length})</div>`;
  const body = attachmentList.map(a => {
    const size = formatFileSize(a.fileSize, 1024);
    const expireTime = a.expireTime === 0 ? getIn18Text('WUXIANQI') : moment(a.expireTime).format('yyyy-MM-DD HH:mm');

    return `<div class="netease-sirius-edm-attach" style="font-size: 14px; font-style: normal; font-variant-caps: normal; font-weight: normal; letter-spacing: normal; orphans: auto; text-align: start; text-indent: 0px; text-transform: none; white-space: normal; widows: auto; word-spacing: 0px; -webkit-text-size-adjust: auto; -webkit-text-stroke-width: 0px; text-decoration: none; clear: both; margin-top: 8px; font-family: verdana, Arial, Helvetica, sans-serif; border: 1px solid rgb(238, 238, 239); box-shadow: rgba(203, 205, 210, 0.3) 0px 5px 15px; border-top-left-radius: 6px; border-top-right-radius: 6px; border-bottom-right-radius: 6px; border-bottom-left-radius: 6px; color: rgb(38, 42, 51);">
              <div style="background-color: rgb(255, 255, 255); padding: 0px 12px; border-top-left-radius: 12px; border-top-right-radius: 12px; border-bottom-right-radius: 12px; border-bottom-left-radius: 12px; position: relative; background-position: initial initial; background-repeat: initial initial;"><div style="width: 24px; position: absolute; height: 40px; left: 16px; top: 4px;">
                  <img width="24px" height="24px" src="https://cowork-storage-public-cdn.lx.netease.com/lxbg/2021/06/22/ca9bd44fe5cb439f99b8507c9c0d626d.png" border="0" title="云附件" showheight="24px" showwidth="24px" style="width: 24px; height: 24px;" />
              </div>
              <div style="margin-left: 30px; border-bottom-width: 1px; border-bottom-style: solid; border-bottom-color: rgba(38, 42, 51, 0.08); margin-top: 16px; padding-bottom: 16px;">
                <div style="margin-left: 4px;">
                    <div style="padding: 1px; font-size: 14px; line-height: 14px;">
                      <span style="text-decoration: none; color: rgb(38, 42, 51); display: block; word-wrap: break-word;">
                          ${a.fileName}
                      </span>
                    </div>
                    <div style="padding: 1px; color: rgb(38, 42, 51, 0.4); font-size: 12px; margin-top: 4px;">
                      ${size}${a.type === 1 ? ' | 过期时间：' + expireTime : ''}
                      ${
                        a.type === 1
                          ? '<span style="margin-left: 2px; background: rgba(255, 181, 76, 0.16); border-radius: 1px; color: #FFB54C; font-size: 12px; padding: 2px 4px; transform: scale(0.83);">云附件</span>'
                          : ''
                      }
                    </div>
                  </div>
                </div>
              </div>
            </div>`;
  });
  return head + '<div>' + body.join('') + '</div>';
}
