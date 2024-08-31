import type { MailEntryModel, MailOpResult } from 'api';
import type { MailStore } from '@web-mail/types';
import moment from 'moment';

type UpdateType = 'read' | 'redFlag' | 'preferred' | 'tag' | 'top' | 'reply' | 'move' | 'defer' | 'suspiciousSpam' | 'requestReadReceiptLocal' | 'memo';

export const reducerHelper = {
  updateMailEntity(mailEntities: MailStore, type: UpdateType, mapResult?: MailOpResult) {
    if (mapResult) {
      mapResult.forEach((item, id) => {
        if (mailEntities[id]) {
          switch (type) {
            case 'read': {
              mailEntities[id].entry.readStatus = item.readStatus ? 'read' : 'unread';
              return;
            }
            case 'requestReadReceiptLocal': {
              mailEntities[id].entry.requestReadReceiptLocal = item.requestReadReceiptLocal;
              return;
            }
            case 'memo': {
              mailEntities[id].entry.memo = item.memo;
              return;
            }
            case 'redFlag': {
              mailEntities[id].entry.mark = item.redFlag ? 'redFlag' : 'none';
              return;
            }
            case 'preferred': {
              // const { id, mark } = eventData.params;
              // item.entry.preferred = mark ? 0 : 1;
              mailEntities[id].entry.preferred = item.preferred ? 1 : 0;
              return;
            }
            case 'tag': {
              mailEntities[id].tags = Array.from(new Set(item.tags));
              return;
            }
            case 'top': {
              // 没有包装过，使用内部表示进行判断
              mailEntities[id].entry.top = item.rank === -10;
              return;
            }
            case 'reply': {
              mailEntities[id].entry.replayed = item.replyStatus;
              mailEntities[id].entry.forwarded = item.forwardStatus;
              return;
            }
            case 'defer': {
              mailEntities[id].entry.isDefer = !!item.isDefer;
              mailEntities[id].entry.deferTime = moment(item.deferTime).format('YYYY-MM-DD HH:mm:ss');
              mailEntities[id].entry.deferNotice = !!item.deferNotice;
              return;
            }
            case 'suspiciousSpam': {
              mailEntities[id].entry.suspiciousSpam = !!item.suspiciousSpam;
              return;
            }
            // case 'move': {
            //   mailEntities[id].entry.folder = item.folder;
            //   return;
            // }
          }
        }
      });
    }
  },
  // 功能：依赖事件,对mailEntity做出修改,
  // 因为updateMailEntity存在mapResult没有的情况，目前是高级搜索后的单封邮件操作红旗
  // 目前看都是单封邮件
  updateMailEntityByEvent(mailEntities: MailStore, type: UpdateType, eventData?: any) {
    if (eventData.params) {
      const { mid, id: mailId, ids, add, isDefer, conf } = eventData.params || {};
      const id = Array.isArray(ids) && ids.length ? ids[0] : mailId || mid;
      if (mailEntities[id]) {
        switch (type) {
          case 'read': {
            mailEntities[id].entry.readStatus = eventData.params.mark ? 'read' : 'unread';
            return;
          }
          case 'redFlag': {
            mailEntities[id].entry.mark = eventData.params.mark ? 'redFlag' : 'none';
            return;
          }
          case 'tag': {
            if (add && add.length) {
              mailEntities[id].tags = mailEntities[id].tags
                ? Array.from(new Set([...(mailEntities[id].tags as string[]), ...add]))
                : Array.from(new Set(eventData.params.add));
            }
            return;
          }
          case 'defer': {
            const { deferTime, deferNotice } = conf || {};
            if (deferTime) {
              mailEntities[id].entry.isDefer = !!isDefer;
              mailEntities[id].entry.deferTime = moment(deferTime).format('YYYY-MM-DD HH:mm:ss');
              mailEntities[id].entry.deferNotice = !!deferNotice;
            }
            return;
          }
        }
      }
    }
  },
};
