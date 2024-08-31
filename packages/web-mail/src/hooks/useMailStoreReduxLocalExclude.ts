/**
 *  从邮件store中组合邮件结构，屏蔽底层差异，以useState类似的使用方式提供
 *  ex:
 *   const [mailDataList, setMailDataList] = useMailStroe('mailList');
 *   warn: 没有引用，废弃
 */
import { useCallback, useMemo, useState } from 'react';
import { MailEntryModel } from 'api';
import store, { MailActions, useActions, useAppSelector, RootState } from '@web-common/state/createStore';
import { createSelector } from '@reduxjs/toolkit';
import { MailBoxReducerState, MailBoxReducerKey } from '../types';
import lodash from 'lodash';

type UseMailStoreConfig = {
  key: string;
  exclude: string[];
};
// 分离存储id和model到stroe的reducer
const UDATE_MAILID_REDUCER = 'doUpdateMailId';

/**
 *
 * @param stateName redux中对应存储邮件id的数组，必须为 string[]
 * @param config hook的融合配置
 * @returns
 */
const useMailStore = <T extends MailBoxReducerKey>(stateName: T, config?: UseMailStoreConfig) => {
  const selectMailIds = useCallback((state: RootState) => state.mailReducer[stateName] as string[], [stateName]);
  const mailStore = useCallback((state: RootState) => state.mailReducer.mailEntities, []);
  const updateIdReducer = useActions(MailActions)[UDATE_MAILID_REDUCER];
  const updateMailStroeReducer = useActions(MailActions).updateMailEntities;
  const updateMailStroeEacludeReducer = useActions(MailActions).updateMailEntitiesExclude;
  // 邮件额外字段的本地存贮map
  const [mailExcludeMap, setMailExcludeMap] = useState<{ [key: string]: any }>({});

  const mailSelecter = useMemo(
    () =>
      createSelector([selectMailIds, mailStore], (ids: string[], store) => {
        const mailList = ids ? ids.map(id => store[id])?.filter(item => item) : [];
        if (config?.exclude && config.exclude.length) {
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
              lodash.set(res, path, lodash.get(mailExcludeMap, [config.key, mail.entry.id].join('.') + path));
            });
            return res;
          });
        } else {
          return mailList;
        }
      }),
    [selectMailIds]
  );

  const selectMailList = useAppSelector(mailSelecter) as MailEntryModel[];

  const setter = (mailList: MailEntryModel[] | ((mailList: MailEntryModel[]) => MailEntryModel[])) => {
    let list: MailEntryModel[];
    if (typeof mailList === 'function') {
      list = mailList(selectMailList);
    } else {
      list = mailList;
    }
    if (list) {
      if (Array.isArray(list)) {
        if (list) {
          // 写入仓库
          if (config?.exclude && config?.exclude.length) {
            // exclude字段存入本地store
            setMailExcludeMap(map => {
              list.forEach(mail => {
                config.exclude.forEach(path => {
                  try {
                    const value = lodash.get(mail, path);
                    if (map[mail.entry.id]) {
                      map[mail.entry.id][path] = value;
                    } else {
                      map[mail.entry.id] = {
                        [path]: value,
                      };
                    }
                  } catch (e) {
                    console.error('[useMailStore Err] exclude Merge Error');
                  }
                });
              });
            });
            // 邮件拆分写入store
            updateMailStroeEacludeReducer({
              mailList: list,
              exclude: config.exclude,
            });
          } else {
            // 邮件直接写入store
            updateMailStroeReducer({
              mailList: list,
            });
          }
          updateIdReducer({
            stateName,
            mailList: list,
          });
        }
      } else {
        list = list as MailEntryModel;
        updateMailStroeReducer({
          mailList: [list],
        });
        updateIdReducer({
          stateName,
          mailList: [list],
        });
      }
    }
  };

  return [selectMailList, setter];
};

export default useMailStore;
