import { apiHolder as api } from 'api';
import React, { useState, useEffect, useCallback, useRef, useImperativeHandle } from 'react';
import AttachmentCard from '@web-mail/components/AttachmentCard';
import './index.scss';
import { Attachment as AttachmentType } from '@web-common/state/state';
import { actions as attachmentActions } from '@web-common/state/reducer/attachmentReducer';
import useCreateCallbackForEvent from '@web-common/hooks/useCreateCallbackForEvent';
import { useActions, useAppSelector } from '@web-common/state/createStore';
import debounce from 'lodash/debounce';
import AttachmentIcon from '../AttachmentIcon';

const eventApi = api.api.getEventApi();
interface Props {
  writeLetterProp: string;
}
export interface DownloadQueueItem {
  id: string;
  index: number;
  fun: Function;
}

const Attachment = React.forwardRef((props: Props, ref) => {
  const { writeLetterProp } = props;
  const attachmentsDivRef = useRef(null);
  const attachments = useAppSelector(state => state.attachmentReducer.attachments);
  const attachmentsRef = useRef(attachments);
  attachmentsRef.current = attachments;
  const currentMailId = useAppSelector(state => state.mailReducer.currentMail.cid);
  const waittingMailIds = useAppSelector(state => state.mailReducer.waittingMailIds);
  const actions = useActions(attachmentActions);
  const [currentLength, setCurrentLength] = useState(0);
  const downloadQueueRef = useRef<DownloadQueueItem[]>([]);

  // 取消上传
  const cancelUpload = (id: number) => {
    actions.doDelAttachment({ id });
  };

  const cancelDownload = ({ downloadId, abortDownload, expired }: AttachmentType) => {
    if (typeof abortDownload === 'function') abortDownload();
    actions.doChangeAttachment({
      downloadId,
      status: 'before',
      expired,
    });
  };

  // 上传后（成功/失败）
  const debounceSaveDraft = useCallback(
    debounce((mailId: number | string | undefined) => {
      if (!mailId) return;
      // if (mailId && mailId === currentMailId) {
      // 当前邮件的所有附件
      const currentAttachments = attachmentsRef.current.filter(item => item.mailId === currentMailId && item.type !== 'download');
      // 存在上传中，则不存
      if (currentAttachments.some(item => item?.status && ['uploading', 'deleting'].includes(item?.status))) return;
      console.log('申请保存草稿');
      eventApi.sendSysEvent({
        eventName: 'toSaveDraft',
        eventStrData: '',
        eventData: {
          type: 'localAndRemote',
          trigger: 'attachChange',
          mailId,
        },
      });
      // }
    }, 2000),
    [currentMailId, attachments]
  );

  // 发信前校验
  const checkMailBefSend = (sendMailId: string) => {
    const mailAtts = (attachmentsRef.current || []).filter(item => item.mailId === sendMailId && item.type !== 'download');
    if (mailAtts.length === 0) return false;
    // 校验附件是否都上传成功
    return mailAtts.every(item => item.status === 'success');
  };

  // 上传成功后自动发信
  const uploadSucAutoSend = useCreateCallbackForEvent((sendMailId: string) => {
    if (waittingMailIds.includes(sendMailId)) {
      // 校验附件是否都上传成功
      const checkRes = checkMailBefSend(sendMailId);
      if (checkRes) {
        // 发信
        eventApi.sendSysEvent({
          eventName: 'toSendMail',
          eventStrData: '',
          eventData: { sendMailId },
        });
      }
    }
  });

  // 附件发生改变 滚动到可视区域
  useEffect(() => {
    let list = attachments
      .filter(i => i.mailId === currentMailId)
      .map(v => ({
        ...v,
        size: v.size,
        attachmentType: v.cloudAttachment ? 'netfolder' : v.type,
      }));
    // 不是转发的邮件就不会有 forwardWithout 在转发邮件里面删除了附件才会 forwardWithout = true
    list = list.filter(i => !i.forwardWithout);
    setCurrentLength(list.length);
  }, [attachments, currentMailId]);

  useEffect(() => {
    const eid = eventApi.registerSysEventObserver('attachToCloud', {
      func: e => {
        const { attachItem } = e.eventData;
        const { realId } = attachItem;
        realId && actions.doTransAttachmentToCloud(realId);
      },
    });
    return () => {
      eventApi.unregisterSysEventObserver('attachToCloud', eid);
    };
  }, []);

  useImperativeHandle(ref, () => ({
    scrollIntoView: () => {
      setTimeout(() => {
        (attachmentsDivRef.current as any).scrollIntoView();
      }, 0);
    },
  }));

  const flushDownloadQueue = debounce(() => {
    const sortedArr = downloadQueueRef.current.sort((a, b) => {
      return a.index - b.index;
    });
    downloadQueueRef.current = [];
    while (sortedArr.length) {
      const headOne = sortedArr.shift();
      headOne && headOne?.fun(true);
    }
    actions.doBatchStartAttachments(sortedArr.map(item => item?.id));
  }, 300);

  const seqDownload = (downloadItem: DownloadQueueItem) => {
    downloadQueueRef.current = [...downloadQueueRef.current, downloadItem];
    flushDownloadQueue();
  };

  return (
    <div className="attachment" id="attachmentArea" ref={attachmentsDivRef}>
      <div className="attachment-list">
        {attachments.map((file, index) => {
          if (file.type !== 'download') {
            return (
              <AttachmentCard
                index={index}
                writeLetterProp={writeLetterProp}
                optType="upload"
                className={`card ${file.mailId === currentMailId ? '' : 'hide'}`}
                file={file}
                key={file.id}
                id={file.id}
                noneMoreOperate
                cancel={() => {
                  cancelUpload(file.id);
                }}
                delete={() => {
                  cancelUpload(file.id);
                }}
                expired={file.expired}
                debounceSaveDraft={debounceSaveDraft}
                seqDownload={seqDownload}
                uploadSucAutoSend={uploadSucAutoSend}
              />
            );
          }
          return file.mailId === currentMailId ? (
            <AttachmentCard
              index={index}
              optType="download"
              className={`card ${[file.mailId].includes(currentMailId) && !file.forwardWithout ? '' : 'hide'}`}
              key={file.fileUrl}
              downloadInfoStatus={file.status || ''}
              downloadInfoProcess={file.process || 0}
              noneMoreOperate
              id={file.downloadId}
              cancel={() => {
                cancelDownload(file);
              }}
              downloadInfo={file}
              writeLetterProp={writeLetterProp}
              expired={file.expired}
              seqDownload={seqDownload}
              uploadSucAutoSend={uploadSucAutoSend}
            />
          ) : (
            <></>
          );
        })}
      </div>
      {currentLength ? <AttachmentIcon currentLength={currentLength} /> : ''}
    </div>
  );
});

export default Attachment;
