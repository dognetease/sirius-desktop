import { MailEntryModel } from 'api';
import { Attachment } from './state';

export const currentMailSize = (currentMail: MailEntryModel, attachments: Attachment[]) => {
  // 获取currentmail 附件 + 内容的大小  内容直接取长度
  const { cid } = currentMail;
  const currentAttachments = attachments.filter(
    item => item && item.mailId === cid && item.type !== 'download' && item.status !== 'fail' && !(item.cloudAttachment || item?.flag?.usingCloud)
  );
  const currentAttachmentsSize = currentAttachments.reduce((pre, next) => pre + (next?.fileSize || 0), 0);
  const contentSize = currentMail.entry?.content?.content?.length;
  return currentAttachmentsSize + contentSize;
};
