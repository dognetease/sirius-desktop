/**
 *  从邮件store中组合邮件结构，屏蔽底层差异，以useState类似的使用方式提供
 *  ex:
 *   const [mailDataList, setMailDataList] = useMailStroe('mailList');
 *  warn： 如果邮件id从仓库中换取不到实体，可能存在实体列表短与id列表的问题
 */
import { useCallback, useMemo } from 'react';
import { MailEntryModel } from 'api';
import { MailActions, useActions, useAppSelector, RootState } from '@web-common/state/createStore';
import { createSelector } from '@reduxjs/toolkit';
import lodash from 'lodash';
import { isMailListDiff } from '@web-mail/utils/mailCompare';
import { EdmMailKeys } from '@web-mail/types';

type UseMailStoreConfig = {
  key: string;
  exclude: string[];
};

// 分离存储id和model到store的reducer
const UPDATE_MAIL_ID_REDUCER = 'doUpdateMailId';

/**
 *
 * @param stateName redux中对应存储邮件id的数组，必须为 string[]
 * @param config hook的融合配置
 * @param sliceId
 * @returns type
 */
const useMailStore = (
  stateName: 'mailDataList' | 'searchList' | 'readMailChildMailList',
  config?: UseMailStoreConfig,
  sliceId?: string,
  type?: EdmMailKeys
): [MailEntryModel[], (mailList: MailEntryModel[] | ((mailList: MailEntryModel[]) => MailEntryModel[])) => void] => {
  // 从新创建的 slice 中获取 idList
  const selectMailIds = useCallback(
    (state: RootState) => {
      if (sliceId) {
        if (state.mailReducer[type][sliceId]) {
          return state.mailReducer[type][sliceId][stateName];
        }
        throw new Error('slice not exist');
      }
      return state.mailReducer[stateName];
    },
    [stateName, type, sliceId]
  );

  const excludeKeyMap = useCallback((state: RootState) => state.mailReducer.mailExcludeKeyMap, []);
  const mailStore = useCallback((state: RootState) => state.mailReducer.mailEntities, []);
  const updateIdReducer = useActions(MailActions)[UPDATE_MAIL_ID_REDUCER];
  const updateMailStoreReducer = useActions(MailActions).updateMailEntities;

  const mailSelector = useMemo(
    () =>
      createSelector([selectMailIds, mailStore, excludeKeyMap], (ids: string[], store, excludeMap) => {
        const mailList = ids ? ids.map(id => store[id])?.filter(item => item) : [];
        if (config && config.key && config.exclude && config.exclude.length) {
          return mailList.map(mail => {
            const res = mail
              ? {
                  ...mail,
                  entry: {
                    ...mail.entry,
                  },
                }
              : {};
            config.exclude.forEach(path => {
              lodash.set(res, path, lodash.get(excludeMap, [config.key, mail.entry.id].join('.') + path));
            });
            return res;
          });
        } else {
          return mailList;
        }
      }),
    [selectMailIds]
  );

  const selectMailList = useAppSelector(mailSelector, (prev, next) => !isMailListDiff(prev as MailEntryModel[], next as MailEntryModel[])) as MailEntryModel[];

  const setter = (mailList: MailEntryModel[] | ((mailList: MailEntryModel[]) => MailEntryModel[])) => {
    let list: MailEntryModel[] = [];
    if (typeof mailList === 'function') {
      list = mailList(selectMailList);
    } else {
      list = mailList;
    }
    if (Array.isArray(list)) {
      // 写入仓库
      updateIdReducer({
        stateName,
        mailList: list,
        sliceId,
        type,
      });
    } else {
      // list = list as MailEntryModel;
      updateMailStoreReducer({
        mailList: [list],
      });
      updateIdReducer({
        stateName,
        mailList: [list],
        sliceId,
        type,
      });
    }
  };

  return [selectMailList, setter];
};

export default useMailStore;
