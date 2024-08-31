import { MailEntryModel, util, MailBoxEntryContactInfoModel } from 'api';

export interface isMailDiffConf {
  simpleKeys?: Array<keyof MailEntryModel>;
  simpleKeysInEntry?: Array<keyof MailEntryModel['entry']>;
  arrayKeys?: Array<keyof MailEntryModel>;
  arrayKeysInEntry?: Array<keyof MailEntryModel['entry']>;
  senderAndReceiver?: boolean;
  attachment?: boolean;
}

export const DEFAULT_MAIL_DIFF_CONFIG: isMailDiffConf = {
  simpleKeys: ['updateTime', 'isOneRcpt', 'taskId', 'totalSize', 'isTpMail', 'owner'],
  simpleKeysInEntry: [
    'brief',
    'deferNotice',
    'deferTime',
    'eTeamType',
    'folder',
    'forwarded',
    'directForwarded',
    'openCount',
    'innerCount',
    'innerRead',
    'isDefer',
    'isDraft',
    'isIcs',
    'isScheduleSend',
    'mark',
    'memo',
    'popRead',
    'langType',
    'linkAttached',
    'memo',
    'praiseId',
    'preferred',
    'priority',
    'rclStatus',
    'rcptCount',
    'rcptFailed',
    'rcptSucceed',
    'readCount',
    'readStatus',
    'receiveTime',
    'replayed',
    'requestReadReceipt',
    'sendTime',
    'sentMailId',
    'sndStatus',
    'suspiciousSpam',
    'system',
    'threadMessageCount',
    'threadMessageFirstId',
    'requestReadReceiptLocal',
    'tid',
    'title',
    'top',
  ],
  arrayKeys: ['convFids', 'tags'],
  arrayKeysInEntry: ['threadMessageIds'],
  senderAndReceiver: true,
  attachment: true,
};

const isSendersReceiversDiff = (itemsA?: MailBoxEntryContactInfoModel[], itemsB?: MailBoxEntryContactInfoModel[]): boolean => {
  const itA = Array.isArray(itemsA) ? itemsA : [];
  const itB = Array.isArray(itemsB) ? itemsB : [];
  const itASet = new Set(itA.map(v => v.originName + v.contactItem?.contactItemVal || ''));
  const itBSet = new Set(itB.map(v => v.originName + v.contactItem?.contactItemVal || ''));
  return util.isArrayDifferent([...itASet], [...itBSet]);
};

export const isSenderReceiverDiff = (itemA: MailEntryModel, itemB: MailEntryModel): boolean => {
  const senderA = itemA.sender.originName + itemA.sender.contactItem?.contactItemVal || '';
  const senderB = itemB.sender.originName + itemB.sender.contactItem?.contactItemVal || '';
  if (senderA !== senderB) {
    return true;
  }

  const isReceiversDiff = isSendersReceiversDiff(itemA.receiver, itemB.receiver);
  if (isReceiversDiff) {
    return true;
  }

  return isSendersReceiversDiff(itemA.senders, itemB.senders);
};

export const isAttachmentDiff = (itemA: MailEntryModel, itemB: MailEntryModel): boolean => {
  const attachmentUrlsA = Array.isArray(itemA.entry.attachment) ? itemA.entry.attachment.map(v => v.fileUrl).filter(v => !!v) : [];
  const attachmentUrlsB = Array.isArray(itemB.entry.attachment) ? itemB.entry.attachment.map(v => v.fileUrl).filter(v => !!v) : [];
  return !util.isArrayContains(attachmentUrlsA as string[], attachmentUrlsB as string[]);
};

export const isMailDiff = (itemA?: MailEntryModel, itemB?: MailEntryModel, config: isMailDiffConf = DEFAULT_MAIL_DIFF_CONFIG, forContent = false): boolean => {
  try {
    if (!itemA && !itemB) {
      return false;
    }
    if (!itemB || !itemA) {
      return true;
    }

    const idA = itemA.isThread ? itemA.threadId : itemA.id;
    const idB = itemB.isThread ? itemB.threadId : itemB.id;
    const isIdDiff = !!idB && idA !== idB;
    if (isIdDiff) {
      console.log('[isMailDiff] isIdDiff');
      return true;
    }

    if (itemA.isThread && itemB.isThread && itemA.entry.threadMessageCount != itemB.entry.threadMessageCount) {
      console.log('[isMailDiff] Thread Content Count');
      return true;
    }

    if (forContent) {
      const contentEncodingA = itemA.entry.content.encoding;
      const contentEncodingB = itemB.entry.content.encoding;
      if (contentEncodingA !== contentEncodingB) {
        console.log('[isMailDiff] isContentEncodingDiff');
        return true;
      }

      const contentMd5A = itemA.entry.content.md5;
      const contentMd5B = itemB.entry.content.md5;
      if (contentMd5A !== contentMd5B) {
        console.log('[isMailDiff] isContentMd5Diff');
        return true;
      }

      const contentLengthA = itemA.entry.content.content.length;
      const contentLengthB = itemB.entry.content.content.length;
      if (contentLengthA !== contentLengthB) {
        console.log('[isMailDiff] isContentLenDiff');
        return true;
      }
    }

    if (config.simpleKeys) {
      const simpleKeysDiff = config.simpleKeys.some(key => itemA[key] !== itemB[key]);
      if (simpleKeysDiff) {
        console.log('[isMailDiff] simpleKeysDiff');
        return true;
      }
    }

    if (config.simpleKeysInEntry) {
      const simpleKeysInEntryDiff = config.simpleKeysInEntry.some(key => itemA.entry[key] !== itemB.entry[key]);
      if (simpleKeysInEntryDiff) {
        console.log('[isMailDiff] simpleKeysInEntry');
        return true;
      }
    }

    if (config.arrayKeys) {
      const arrayKeysDiff = config.arrayKeys.some(key => util.isArrayDifferent(itemA[key], itemB[key]));
      if (arrayKeysDiff) {
        console.log('[isMailDiff] arrayKeysDiff');
        return true;
      }
    }

    if (config.arrayKeysInEntry) {
      const arrayKeysInEntryDiff = config.arrayKeysInEntry.some(key => util.isArrayDifferent(itemA.entry[key] as string[], itemB.entry[key] as string[]));
      if (arrayKeysInEntryDiff) {
        console.log('[isMailDiff] arrayKeysInEntryDiff');
        return true;
      }
    }

    if (config.senderAndReceiver) {
      const senderAndReceiverDiff = isSenderReceiverDiff(itemA, itemB);
      if (senderAndReceiverDiff) {
        console.log('[isMailDiff] senderAndReceiverDiff');
        return true;
      }
    }

    if (config.attachment) {
      const attachmentDiff = isAttachmentDiff(itemA, itemB);
      if (attachmentDiff) {
        console.log('[isMailDiff] attachmentDiff');
        return true;
      }
    }

    const originLangA = itemA?.entry?.langListMap?.originLang;
    const originLangB = itemB?.entry?.langListMap?.originLang;

    if (!originLangA && !originLangB) {
      return false;
    }
    if (!originLangA || !originLangB) {
      return true;
    }
    if (originLangA !== originLangB) {
      return true;
    }
  } catch (e) {
    console.error('[isMailDiff Error]', e);
  }
  return false;
};

export const isMailListDiff = (itemsA?: MailEntryModel[], itemsB?: MailEntryModel[], config: isMailDiffConf = DEFAULT_MAIL_DIFF_CONFIG): boolean => {
  try {
    if (!itemsA && !itemsB) {
      return false;
    }
    if (!itemsA || !itemsB) {
      return true;
    }
    if (itemsA?.length != itemsB?.length) {
      return true;
    }
    for (let i = 0; i < itemsA.length; i++) {
      const isDiff = isMailDiff(itemsA[i], itemsB[i], config);
      if (isDiff) {
        console.log('[isMailDiff] list', itemsA[i], itemsB[i]);
        return true;
      }
    }
    return false;
  } catch (e) {
    console.error('[isMailDiff] list error', e);
    return true;
  }
};
