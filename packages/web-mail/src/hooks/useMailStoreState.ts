/**
 *  从邮件store中组合邮件结构，屏蔽底层差异，以useState类似的使用方式提供
 *  useMailStoreState hook中，邮件的model存储在redux中，id存储在本地state中。
 *  ex:
 *   const [mailDataList, setMailDataList] = useMailStoreState([初始化值]);
 */
import { useCallback, useState, useMemo } from 'react';
import { MailEntryModel } from 'api';
import { useActions, useAppSelector, MailActions, RootState } from '@web-common/state/createStore';
import { createSelector } from '@reduxjs/toolkit';
import { isMailDiff } from '@web-mail/utils/mailCompare';

type Setter<T> = (mailList: T | ((list: T) => T)) => void;

type StateType = MailEntryModel[] | MailEntryModel;

/**
 *
 * @param initMailList 初始化的邮件modal[]
 * @returns
 */
// eslint-disable-next-line
const useMailStoreState = <T extends StateType>(initMailList?: T | null, noMerge?: boolean): [list: T | null, setter: Setter<T>] => {
  const [selectMailIds, setSelectMailIds] = useState<string[] | string>(
    Array.isArray(initMailList) ? initMailList?.map(mail => mail?.entry?.id) : initMailList?.entry?.id || ''
  );
  const mailStore = useCallback((state: RootState) => state.mailReducer.mailEntities, []);
  // 判定是否走替换而不是融合
  const updateMailStroeReducer = noMerge ? useActions(MailActions).updateMailEntitiesNoMerge : useActions(MailActions).updateMailEntities;

  const mailSelecter = useMemo(
    () =>
      createSelector([mailStore], store => {
        if (Array.isArray(selectMailIds)) {
          return selectMailIds ? selectMailIds.map(id => store[id]) : [];
        } else {
          return store[selectMailIds];
        }
      }),
    [selectMailIds]
  );

  const selectMailList = useAppSelector(mailSelecter, (prev, next) => !isMailDiff(prev as MailEntryModel, next as MailEntryModel, undefined, true)) as T;

  // 模拟react setState的实现
  const setter: Setter<T> = useCallback(
    mailList => {
      let list;
      if (typeof mailList === 'function') {
        list = mailList(selectMailList);
      } else {
        list = mailList;
      }
      if (Array.isArray(list)) {
        if (list) {
          // 写入仓库
          updateMailStroeReducer({
            mailList: list,
          });
          setSelectMailIds(list.map(item => item.entry.id));
        }
      } else {
        if (list) {
          list = list as MailEntryModel;
          updateMailStroeReducer({
            mailList: [list],
          });
        }
        setSelectMailIds(list?.entry?.id);
      }
    },
    [setSelectMailIds]
  );

  return [selectMailIds ? selectMailList : null, setter];
};

export default useMailStoreState;
