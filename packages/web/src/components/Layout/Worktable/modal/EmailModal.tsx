import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@web-common/state/createStore';
import modalStyle from './modal.module.scss';
import { WorktableModal } from './modal';
import { Filters, getMyEmailsPanelAsync } from '@web-common/state/reducer/worktableReducer';
import { WorktableActions } from '@web-common/state/reducer';
import { EmailCardColors, EMAIL_NUM_ITEMS, NumCard } from '../emailCard/EmailCard';
import { MyEmailOperate, worktableDataTracker } from '../worktableDataTracker';
import { getIn18Text } from 'api';
export const EmailPanelModal = () => {
  const appDispatch = useAppDispatch();
  const { showModal, filters, data } = useAppSelector(state => state.worktableReducer.myEmail);
  const [modalFilters, setModalFilters] = useState<Filters>(filters);
  useEffect(() => {
    setModalFilters(filters);
  }, [filters]);
  // 关闭时同步筛选条件到卡片
  useEffect(() => {
    if (!showModal) {
      appDispatch(
        WorktableActions.setFilter({
          panelKey: 'myEmail',
          filters: modalFilters,
        })
      );
    }
  }, [showModal]);
  const fetchData = (filters: Filters) => {
    appDispatch(getMyEmailsPanelAsync(filters));
  };
  const handleRefresh = () => {
    fetchData(modalFilters);
    worktableDataTracker.trackMyMailOperate(MyEmailOperate.refresh);
  };
  const handleFilterChange = (changes: Record<string, string | string[]>) => {
    const newFilters = {
      ...modalFilters,
      ...changes,
    };
    setModalFilters(newFilters);
    fetchData(newFilters);
    worktableDataTracker.trackMyMailFilter();
  };
  return (
    <WorktableModal
      visible={showModal}
      subText={getIn18Text('WODEKEHUYOUJIAN\uFF1AGUOLVYOUJIANDESHOU/FASHIJIAN\uFF0CTONGJIXIANSUO\u3001KEHU\u3001SHANGJIGUANLIANLIANXIRENDESHOU/FAJIANDENGSHUJU\u3002')}
      onRefresh={handleRefresh}
      onClose={() => appDispatch(WorktableActions.closeModal('myEmail'))}
      filterValues={filters}
      onFilterChange={handleFilterChange}
    >
      {data && (
        <div className={modalStyle.grid4}>
          {EMAIL_NUM_ITEMS.map((item, i) => (
            <div className={modalStyle.numCard} key={item.dataIndex}>
              <NumCard text={item.title} color={EmailCardColors[i]}>
                {data[item.dataIndex]}
              </NumCard>
            </div>
          ))}
        </div>
      )}
    </WorktableModal>
  );
};
