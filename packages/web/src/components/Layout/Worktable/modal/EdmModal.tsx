import React, { useCallback, useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@web-common/state/createStore';
import modalStyle from './modal.module.scss';
import { WorktableModal } from './modal';
import { Filters, getAllEdmPanelAsync, getMyEdmPanelAsync } from '@web-common/state/reducer/worktableReducer';
import { WorktableActions } from '@web-common/state/reducer';
import { EmailCardColors, NumCard } from '../emailCard/EmailCard';
import { EDM_ITEMS } from '../edmCard/EdmCard';
import { CardFilter, EdmCardOperate, fromCardFilters, worktableDataTracker } from '../worktableDataTracker';
import { getIn18Text } from 'api';
export const EdmPanelModal = (props: { type: 'myEdm' | 'allEdm' }) => {
  const type = props.type;
  const { showModal, data, filters } = useAppSelector(state => (type === 'myEdm' ? state.worktableReducer.myEdm : state.worktableReducer.allEdm));
  const appDispatch = useAppDispatch();
  const [modalFilters, setModalFilters] = useState<Filters>(filters);
  useEffect(() => {
    setModalFilters(filters);
  }, [filters]);
  // 关闭时同步筛选条件到卡片
  useEffect(() => {
    if (!showModal) {
      appDispatch(
        WorktableActions.setFilter({
          panelKey: type,
          filters: modalFilters,
        })
      );
    }
  }, [showModal]);
  const fetchData = useCallback(
    (filters: Filters) => {
      appDispatch(type === 'myEdm' ? getMyEdmPanelAsync(filters) : getAllEdmPanelAsync(filters));
    },
    [type]
  );
  const handleRefresh = () => {
    fetchData(modalFilters);
    worktableDataTracker.trackEdmOperate(type === 'myEdm' ? 'my' : 'all', EdmCardOperate.refresh);
  };
  const handleFilterChange = (changes: Partial<Filters>) => {
    const newFilter = {
      ...modalFilters,
      ...changes,
    };
    setModalFilters(newFilter);
    fetchData(newFilter);
    const filterType = fromCardFilters(changes);
    filterType && worktableDataTracker.trackEdmFilter(type === 'myEdm' ? 'my' : 'all', filterType);
  };
  const prefixText = type === 'myEdm' ? getIn18Text('WODE') : getIn18Text('QUANBU');
  return (
    <WorktableModal
      visible={showModal}
      subText={prefixText + getIn18Text('YOUJIANYINGXIAO\uFF1ACHAKANWODEYOUJIANYINGXIAO\uFF0CTONGJIFAJIANZONGSHU\u3001SONGDAZONGSHUDENG\u3002')}
      onRefresh={handleRefresh}
      onClose={() => appDispatch(WorktableActions.closeModal(type))}
      filterValues={filters}
      filterVisbile={{
        account: type === 'allEdm',
        resourceLabel: 'EDM',
      }}
      onFilterChange={handleFilterChange}
    >
      <div className={modalStyle.grid4}>
        {EDM_ITEMS.map((item, i) => {
          let text: string | number = '-';
          if (data && data[item.dataIndex] !== null && data[item.dataIndex] !== undefined) {
            text = item.transformer ? item.transformer(data[item.dataIndex]) : data[item.dataIndex];
          }
          return (
            <div className={modalStyle.numCard} key={item.dataIndex}>
              <NumCard text={item.title} color={EmailCardColors[i]}>
                {text}
              </NumCard>
            </div>
          );
        })}
      </div>
    </WorktableModal>
  );
};
