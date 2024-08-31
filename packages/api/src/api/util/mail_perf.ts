import { api } from '@/api/api';
import { apis } from '@/config';
import { PerformanceApi, PerformanceTimerType } from '@/api/system/performance';
import { MailSearchTypes, WriteLetterPropType } from '@/api/logical/mail';

const performanceImpl = api.requireLogicalApi(apis.performanceImpl) as PerformanceApi;
type PefStage = 'start' | 'end';

interface MailListPefParams {
  isThread: boolean;
  noCache: boolean;
  read: boolean | undefined;
  label0: number;
  startIndex?: number;
  count?: number;
  folder?: number;
}

interface MailContentPerfParams {
  isThread: boolean;
  mid?: string;
  folder?: number;
  read?: boolean;
}

interface MailWritePerfParams {
  writeType: WriteLetterPropType;
}

interface MailSearchPerfParams {
  noCache: boolean;
  fid?: number;
  searchRange: MailSearchTypes;
  searchWord?: string;
  count?: number;
}

interface MailMovePerfParams {
  isThread?: boolean;
  result?: 'success' | 'fail';
}

interface MailAttachPerfParams {
  fileSize?: number;
  fileType?: string;
  result?: 'success' | 'fail' | 'cancel';
}

export const mailPerfTool = {
  mailList(stage: PefStage, params: MailListPefParams) {
    const statKey = 'mail_list_load_time';

    const isThread = params?.isThread ? 'isThread' : 'noThread';
    const hasCache = params?.noCache ? 'noCache' : 'hasCache';
    // eslint-disable-next-line no-nested-ternary
    const readStatus = params?.read !== undefined ? (params?.read ? 'read' : 'unread') : 'all';
    // eslint-disable-next-line no-nested-ternary
    const redFlag = params?.label0 !== undefined ? (params?.label0 === 1 ? 'red' : 'notRed') : 'all';
    const statSubKey = `${isThread}_${hasCache}_${readStatus}_${redFlag}`;

    if (stage === 'start') {
      performanceImpl
        .time({
          statKey,
          statSubKey,
          params: {
            start_index: params?.startIndex || 0,
            folder: params?.folder || '',
          },
        })
        .catch();
    } else {
      setTimeout(() => {
        performanceImpl
          .timeEnd({
            statKey,
            statSubKey,
            params: { mail_count: params?.count || 0 },
          })
          .catch();
      }, 0);
    }
  },

  mailContent(type: 'inner' | 'window' | 'push', stage: PefStage, params: MailContentPerfParams) {
    const statKey = `mail_content_${type}_load_time`;

    const isThread = params?.isThread ? 'isThread' : 'noThread';
    const statSubKey = `${isThread}`;

    if (stage === 'start') {
      performanceImpl.time({ statKey, statSubKey }).catch();
    } else {
      const perfParams = {
        mid: params?.mid || '',
        folder: params?.folder || '',
        read_status: params?.read !== undefined ? params?.read : false,
      };
      setTimeout(() => {
        performanceImpl.timeEnd({ statKey, statSubKey, params: perfParams }).catch();
      }, 0);
    }
  },

  writeMail(stage: PefStage, params: MailWritePerfParams) {
    const statKey = 'mail_write_load_time';

    const writeType = params?.writeType || 'common';
    const statSubKey = `${writeType}`;

    if (stage === 'start') {
      performanceImpl.time({ statKey, statSubKey }).catch();
    } else {
      setTimeout(() => {
        performanceImpl.timeEnd({ statKey, statSubKey }).catch();
      }, 0);
    }
  },

  searchMail(searchType: 'local' | 'sever' | 'advanced', stage: PefStage, params: MailSearchPerfParams) {
    const statKey = 'mail_search_load_time';
    const hasCache = params.noCache ? 'noCache' : 'hasCache';
    const folderType = params.fid ? 'singleFolder' : 'allFolder';
    const searchRange = params.searchRange === 'all' ? 'allItem' : 'singleItem';
    const statSubKey = searchType === 'advanced' ? `${searchType}_${hasCache}` : `${searchType}_${hasCache}_${folderType}_${searchRange}`;

    if (stage === 'start') {
      performanceImpl
        .time({
          statKey,
          statSubKey,
          params: {
            search_word: params.searchWord || '',
            search_range: params.searchRange,
          },
        })
        .catch();
    } else {
      setTimeout(() => {
        performanceImpl
          .timeEnd({
            statKey,
            statSubKey,
            params: {
              mail_count: params?.count || 0,
            },
          })
          .catch();
      }, 0);
    }
  },

  attachmentTransfer(type: 'upload' | 'download', attachmentType: 'cloud' | 'common' | 'all', stage: PefStage, params?: MailAttachPerfParams) {
    const statKey = `mail_attachment_${type}_time`;
    const statSubKey = `${attachmentType}`;

    if (stage === 'start') {
      performanceImpl.time({ statKey, statSubKey }).catch();
    } else {
      setTimeout(() => {
        if (params?.fileSize && params?.fileSize > 0) {
          mailPerfTool
            .attachmentSpeed(type, {
              fileSize: params?.fileSize,
              statKey,
              statSubKey,
            })
            .then(() => {
              const perfParams = {
                file_size: params?.fileSize || 0,
                file_type: params?.fileType || '',
                result: params?.result || 'success',
              };
              performanceImpl.timeEnd({ statKey, statSubKey, params: perfParams }).catch();
            });
        }
      }, 0);
    }
  },

  async attachmentSpeed(type: 'upload' | 'download', params: { statKey: string; statSubKey: string; fileSize: number }) {
    const { statKey, statSubKey, fileSize } = params;
    const currentLogs = await performanceImpl.getTimerLog({ statKey, statSubKey });
    if (Array.isArray(currentLogs) && currentLogs.length > 0) {
      const currentLog = (currentLogs as PerformanceTimerType[]).find(log => log.recording);
      if (currentLog) {
        const duration = Date.now() - currentLog.start;
        if (duration >= 0 && fileSize > 0) {
          const accuracy = 100;
          const speed = Math.round((fileSize / 1024 / (duration / 1000)) * accuracy) / 100;
          performanceImpl
            .point({
              statKey: `mail_attachment_${type}_speed`,
              statSubKey,
              value: speed,
              valueType: 5,
            })
            .catch();
        }
      }
    }
  },

  moveMail(type: 'move' | 'delete' | 'completeDelete' | 'deleteFolder', stage: PefStage, params: MailMovePerfParams) {
    const statKey = `mail_${type}_time`;
    const isThread = params.isThread ? 'isThread' : 'noThread';
    const statSubKey = `${isThread}`;
    if (stage === 'start') {
      performanceImpl
        .time({
          statKey,
          statSubKey,
        })
        .catch();
    } else {
      setTimeout(() => {
        performanceImpl
          .timeEnd({
            statKey,
            statSubKey,
            params: {
              result: params?.result || 'success',
            },
          })
          .catch();
      }, 0);
    }
  },
};
