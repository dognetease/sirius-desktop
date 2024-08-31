import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '@web-common/state/createStore';
import qs from 'querystring';
import { navigate } from '@reach/router';
import modalStyle from './modal.module.scss';
import { WorktableModal } from './modal';
import moment from 'moment';
import { Filters, getAllCustomerPanelAsync, getMyCustomerPanelAsync } from '@web-common/state/reducer/worktableReducer';
import { WorktableActions } from '@web-common/state/reducer';
import styles from '../customerCard/customerCard.module.scss';
import classNames from 'classnames';
import { apiHolder as api, apis, MailProductApi } from 'api';
import { CustomerOperate, fromCardFilters, worktableDataTracker } from '../worktableDataTracker';
import { getIn18Text } from 'api';
const titles = [getIn18Text('XINZENGKEHU'), getIn18Text('XINZENGLIANXIREN'), getIn18Text('XINZENGSHANGJI'), getIn18Text('XINZENGGENJINDONGTAI')];
type DATA_KEYS = 'new_company_count' | 'new_contact' | 'new_follow_count' | 'new_opportunity_count';
const dataKeys: DATA_KEYS[] = ['new_company_count', 'new_contact', 'new_opportunity_count', 'new_follow_count'];
const productApi = api.api.requireLogicalApi(apis.mailProductImplApi) as unknown as MailProductApi;
export const CustomerPanelModal = (props: { type: 'myCustomer' | 'allCustomer' }) => {
  const { type } = props;
  const { showModal, filters, data } = useAppSelector(state => (type === 'myCustomer' ? state.worktableReducer.myCustomer : state.worktableReducer.allCustomer));
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
      appDispatch(type === 'myCustomer' ? getMyCustomerPanelAsync(filters) : getAllCustomerPanelAsync(filters));
    },
    [type]
  );
  const handleFilterChange = (changes: Partial<Filters>) => {
    const newFilter = {
      ...modalFilters,
      ...changes,
    };
    setModalFilters(newFilter);
    fetchData(newFilter);
    const filterType = fromCardFilters(changes);
    filterType && worktableDataTracker.trackCustomerFilter(type === 'myCustomer' ? 'my' : 'all', filterType);
  };
  // const customerTableId = useRef<string>('');
  const handleItemClick = async (key: DATA_KEYS) => {
    switch (key) {
      case 'new_company_count': {
        const uniListFilter = {
          relation: 'and',
          subs: [
            {
              tradeKey: 'create_time',
              conditionMethod: 'gte',
              tradeValue: moment(modalFilters.start_date).toISOString(),
            },
            {
              tradeKey: 'create_time',
              conditionMethod: 'lte',
              tradeValue: moment(modalFilters.end_date).toISOString(),
            },
            {
              tradeKey: 'manager_list',
              conditionMethod: 'any-of',
              tradeValue: [...(modalFilters.account_id_list || [])],
            },
          ],
        };
        // if (customerTableId.current === '') {
        //     const res = await productApi.getWaimaoProductTable({ tableKey: 'CUSTOMER' })
        //     customerTableId.current = res
        // }
        // console.log("===>>>>debug", `#/unitable-crm?tableId=${customerTableId.current}&from=CUSTOMER&viewId=${type === 'myCustomer' ? 'MINE' : 'ALL'}&filter=${encodeURIComponent(JSON.stringify(uniListFilter))}`)
        navigate(`#/unitable-crm/custom/list?activeTab=${type === 'myCustomer' ? 'my' : 'all'}&filter=${encodeURIComponent(JSON.stringify(uniListFilter))}`);

        worktableDataTracker.trackCustomerOperate(type === 'myCustomer' ? 'my' : 'all', CustomerOperate.newCustomerClick);
        break;
      }
    }
  };
  const handleRefresh = () => {
    fetchData(modalFilters);
    worktableDataTracker.trackCustomerOperate(type === 'myCustomer' ? 'my' : 'all', CustomerOperate.refresh);
  };
  const showFilters = {
    account: type === 'allCustomer',
  };
  const prefixText = type === 'myCustomer' ? getIn18Text('WODE') : getIn18Text('QUANBU');
  return (
    <WorktableModal
      visible={showModal}
      subText={prefixText + getIn18Text('KEHUKANBAN\uFF1ACHAKANSHUJUCHUANGJIANSHIJIANFANWEINEI\uFF0CXINZENGDEKEHU\u3001LIANXIREN\u3001SHANGJI\u3001GENJINDONGTAI\u3002')}
      onRefresh={handleRefresh}
      onClose={() => appDispatch(WorktableActions.closeModal(type))}
      onFilterChange={handleFilterChange}
      filterValues={filters}
      filterVisbile={showFilters}
    >
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, 216px)', justifyContent: 'space-between', gridRowGap: 16 }}>
        {titles.map((text, index) => {
          return (
            <div className={classNames([styles.item, styles['itemStyle' + (index + 1)]])}>
              <span className={styles.text}>{text}</span>
              <span className={classNames(styles.num, index === 0 && styles.clickable)} onClick={() => handleItemClick(dataKeys[index])}>
                {data ? data[dataKeys[index]] : '-'}
              </span>
            </div>
          );
        })}
      </div>
    </WorktableModal>
  );
};
