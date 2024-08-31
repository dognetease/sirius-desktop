import { useAppDispatch, useAppSelector } from '@web-common/state/createStore';
import { WorktableActions } from '@web-common/state/reducer';
import { getAllCustomerPanelAsync, getMyCustomerPanelAsync } from '@web-common/state/reducer/worktableReducer';
import classNames from 'classnames';
import moment from 'moment';
import qs from 'querystring';
import { navigate } from 'gatsby-link';
import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { navigateToCustomerPage } from '@web-unitable-crm/api/helper';
import { getFilterText, WorktableCard } from '../card';
import cardStyle from '../workTable.module.scss';
import styles from './customerCard.module.scss';
import { CustomerOperate, worktableDataTracker } from '../worktableDataTracker';
import { apiHolder as api, apis, ErrorReportApi, MailProductApi } from 'api';
import { pushNavigateCrossMultiClient, workTableTrackAction } from '../worktableUtils';
import { getTransText } from '@/components/util/translate';
import { getIn18Text } from 'api';
const errorReportApi: ErrorReportApi = api.api.requireLogicalApi(apis.errorReportImpl) as unknown as ErrorReportApi;

const productApi = api.api.requireLogicalApi(apis.mailProductImplApi) as unknown as MailProductApi;
const systemApi = api.api.getSystemApi();
const titles = [
  getIn18Text('XINZENGKEHU'),
  getIn18Text('XINZENGLIANXIREN'),
  // getIn18Text("XINZENGSHANGJI"),
  getIn18Text('XINZENGGENJINDONGTAI'),
  getIn18Text('DINGDANSHU'),
];
type DATA_KEYS = 'new_company_count' | 'new_contact' | 'new_follow_count' | 'new_order_count';
const dataKeys: DATA_KEYS[] = ['new_company_count', 'new_contact', 'new_follow_count', 'new_order_count'];

// 新增客户icon
const ClientIcon = () => {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.25 9H22.5" stroke="white" stroke-width="1.5" stroke-linecap="round" />
      <path d="M18.75 12H22.5" stroke="white" stroke-width="1.5" stroke-linecap="round" />
      <path d="M20.25 15H22.5" stroke="white" stroke-width="1.5" stroke-linecap="round" />
      <circle cx="9.75" cy="7.125" r="4.125" fill="white" />
      <path
        d="M18 20.3251V17.8501C18 15.5719 16.1532 13.7251 13.875 13.7251H5.625C3.34683 13.7251 1.5 15.5719 1.5 17.8501V20.3251C1.5 20.7807 1.86937 21.1501 2.325 21.1501H17.175C17.6306 21.1501 18 20.7807 18 20.3251Z"
        fill="white"
      />
    </svg>
  );
};

// 新增联系人
const ContactIcon = () => {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="10" cy="5.3125" r="4.0625" fill="white" />
      <path
        d="M18.125 18.125V15.625C18.125 13.2088 16.1662 11.25 13.75 11.25H6.25C3.83375 11.25 1.875 13.2088 1.875 15.625V18.125C1.875 18.4702 2.15482 18.75 2.5 18.75H17.5C17.8452 18.75 18.125 18.4702 18.125 18.125Z"
        fill="white"
      />
    </svg>
  );
};

// 新增跟进动态
const TrendsIcon = (props: { type: string }) => {
  return props.type === 'allCustomer' ? (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M2.36108 2.36095C2.36108 1.97742 2.672 1.6665 3.05553 1.6665H16.9444C17.3279 1.6665 17.6389 1.97742 17.6389 2.36095V17.6387C17.6389 18.0223 17.3279 18.3332 16.9444 18.3332H9.99997H3.05553C2.672 18.3332 2.36108 18.0223 2.36108 17.6387V2.36095Z"
        fill="white"
      />
      <path d="M5.83337 5.8335H14.1667M5.83337 10.0002H10.6945" stroke="#7088FF" stroke-width="1.38889" stroke-linecap="round" />
    </svg>
  ) : (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M2.36108 2.36095C2.36108 1.97742 2.672 1.6665 3.05553 1.6665H16.9444C17.3279 1.6665 17.6389 1.97742 17.6389 2.36095V17.6387C17.6389 18.0223 17.3279 18.3332 16.9444 18.3332H9.99997H3.05553C2.672 18.3332 2.36108 18.0223 2.36108 17.6387V2.36095Z"
        fill="white"
      />
      <path d="M5.83337 5.8335H14.1667M5.83337 10.0002H10.6945" stroke="#FFB54C" stroke-width="1.38889" stroke-linecap="round" />
    </svg>
  );
};

const OrderIcon = (props: { type: string }) => {
  return props.type === 'allCustomer' ? (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        fill-rule="evenodd"
        clip-rule="evenodd"
        d="M3.61108 2.7666H5.66002V4.40037C5.66002 4.73174 5.92865 5.00037 6.26002 5.00037H14.46C14.7914 5.00037 15.06 4.73174 15.06 4.40037V2.7666H17.1111C17.8014 2.7666 18.3611 3.32625 18.3611 4.0166V17.5166C18.3611 18.207 17.8014 18.7666 17.1111 18.7666H10.3611H3.61108C2.92073 18.7666 2.36108 18.207 2.36108 17.5166V4.0166C2.36108 3.32625 2.92073 2.7666 3.61108 2.7666ZM14.2569 8.85776C14.5235 8.57781 14.5127 8.13472 14.2328 7.8681C13.9528 7.60148 13.5097 7.61229 13.2431 7.89224L8.75 12.61L6.7569 10.5172C6.49028 10.2373 6.04719 10.2265 5.76724 10.4931C5.48729 10.7597 5.47648 11.2028 5.7431 11.4828L8.2431 14.1078C8.37522 14.2465 8.55843 14.325 8.75 14.325C8.94157 14.325 9.12478 14.2465 9.2569 14.1078L14.2569 8.85776Z"
        fill="white"
      />
      <rect x="6.84998" y="1" width="7" height="3" rx="0.6" fill="white" />
    </svg>
  ) : (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        fill-rule="evenodd"
        clip-rule="evenodd"
        d="M3.61108 2.7666H5.66002V4.40037C5.66002 4.73174 5.92865 5.00037 6.26002 5.00037H14.46C14.7914 5.00037 15.06 4.73174 15.06 4.40037V2.7666H17.1111C17.8014 2.7666 18.3611 3.32625 18.3611 4.0166V17.5166C18.3611 18.207 17.8014 18.7666 17.1111 18.7666H10.3611H3.61108C2.92073 18.7666 2.36108 18.207 2.36108 17.5166V4.0166C2.36108 3.32625 2.92073 2.7666 3.61108 2.7666ZM14.2569 8.85776C14.5235 8.57781 14.5127 8.13472 14.2328 7.8681C13.9528 7.60148 13.5097 7.61229 13.2431 7.89224L8.75 12.61L6.7569 10.5172C6.49028 10.2373 6.04719 10.2265 5.76724 10.4931C5.48729 10.7597 5.47648 11.2028 5.7431 11.4828L8.2431 14.1078C8.37522 14.2465 8.55843 14.325 8.75 14.325C8.94157 14.325 9.12478 14.2465 9.2569 14.1078L14.2569 8.85776Z"
        fill="white"
      />
      <rect x="6.84998" y="1" width="7" height="3" rx="0.6" fill="white" />
    </svg>
  );
};

const defaultDateRange = {
  start_date: moment().startOf('month').format('YYYY-MM-DD'),
  end_date: moment().endOf('month').format('YYYY-MM-DD'),
};

export interface CustomerCardProps {
  type?: 'myCustomer' | 'allCustomer';
}
export const CustomerCard: React.FC<CustomerCardProps> = props => {
  const { type = 'myCustomer' } = props;
  const state = useAppSelector(state => (type === 'allCustomer' ? state.worktableReducer.allCustomer : state.worktableReducer.myCustomer));
  const { loading, data, filters } = state;
  const appDispatch = useAppDispatch();
  // const customerTableId = useRef<string>('');
  const dateRange = useRef<[string, string]>([defaultDateRange.start_date, defaultDateRange.end_date]);
  const memberList = useRef<undefined | string[]>();

  const fetchData = (id?: number) => {
    if (type === 'allCustomer') {
      appDispatch(
        getAllCustomerPanelAsync({
          ...filters,
          account_id_list: memberList.current,
          start_date: dateRange.current[0],
          end_date: dateRange.current[1],
        })
      ).then(() => {
        if (id) errorReportApi.endTransaction({ id });
      });
    } else {
      appDispatch(
        getMyCustomerPanelAsync({
          ...filters,
          start_date: dateRange.current[0],
          end_date: dateRange.current[1],
        })
      ).then(() => {
        if (id) errorReportApi.endTransaction({ id });
      });
    }
  };
  useEffect(() => {
    const id = errorReportApi.startTransaction({
      name: `worktable_${type}_init`,
      op: 'loaded',
    });
    fetchData(id);
  }, []);
  const handleItemClick = async (key: DATA_KEYS) => {
    switch (key) {
      case 'new_company_count': {
        const uniListFilter = {
          relation: 'and',
          subs: [
            {
              tradeKey: 'create_time',
              conditionMethod: 'gte',
              tradeValue: moment(dateRange.current[0]).toISOString(),
            },
            {
              tradeKey: 'create_time',
              conditionMethod: 'lte',
              tradeValue: moment(dateRange.current[1]).toISOString(),
            },
            {
              tradeKey: 'manager_list',
              conditionMethod: 'any-of',
              tradeValue: [...(memberList.current || [])],
            },
          ],
        };
        // if (customerTableId.current === '') {
        //   const res = await productApi.getWaimaoProductTable({ tableKey: 'CUSTOMER' })
        //   customerTableId.current = res
        // }
        workTableTrackAction(type === 'allCustomer' ? 'waimao_worktable_allCustomers' : 'waimao_worktable_myCustomers', 'new_customer');
        navigateToCustomerPage(
          {
            view: type === 'myCustomer' ? 'my' : 'all',
            filter: uniListFilter,
          },
          systemApi.isWebWmEntry()
        );
        // worktableDataTracker.trackCustomerOperate(type === 'myCustomer' ? 'my' : 'all', CustomerOperate.newCustomerClick);
        break;
      }
    }
  };
  const handleRefresh = () => {
    const id = errorReportApi.startTransaction({
      name: `worktable_${type}-refresh`,
      op: 'click',
    });
    fetchData(id);
    worktableDataTracker.trackCustomerOperate(type === 'myCustomer' ? 'my' : 'all', CustomerOperate.refresh);
  };

  return (
    <WorktableCard
      title={type === 'myCustomer' ? getTransText('WODEKEHUSHUJU') : getTransText('TUANDUIKEHUSHUJU')}
      loading={loading}
      showTeamIconInTitle={type !== 'myCustomer'}
      headerToolsConfig={[
        {
          resourceLabel: 'CONTACT',
          onMemberChange:
            type === 'myCustomer'
              ? undefined
              : (changes: any) => {
                  memberList.current = changes.account_id_list;
                  workTableTrackAction('waimao_worktable_allCustomers', 'member_selection');
                  const id = errorReportApi.startTransaction({
                    name: `worktable_${type}_member_change`,
                    op: 'click',
                  });
                  fetchData(id);
                },
        },
        {
          onDatePickerChange: (changes: any) => {
            dateRange.current = [changes.start_date, changes.end_date];
            workTableTrackAction(type === 'allCustomer' ? 'waimao_worktable_allCustomers' : 'waimao_worktable_myCustomers', 'time_selection');
            const id = errorReportApi.startTransaction({
              name: `worktable_${type}_picker_change`,
              op: 'click',
            });
            fetchData(id);
          },
        },
        {
          onRefresh: handleRefresh,
        },
      ]}
    >
      <div className={cardStyle.cardContainer}>
        {/* <div className={cardStyle.cardFilter}>
          {filterNode}
        </div> */}
        <div style={{ flex: 1 }}>
          <div className={styles.gridContainer}>
            {titles.map((text, index) => {
              return (
                <div className={classNames([styles.item, index > 0 && styles.leftBorder])}>
                  <div className={classNames(styles.leftIcon, styles['itemStyle' + type + (index + 1)])}>
                    {index === 0 && <ClientIcon />}
                    {index === 1 && <ContactIcon />}
                    {index === 2 && <TrendsIcon type={type} />}
                    {index === 3 && <OrderIcon type={type} />}
                  </div>
                  <div className={styles.rightCont}>
                    <span className={classNames(styles.num, index === 0 && styles.clickable)} onClick={() => handleItemClick(dataKeys[index])}>
                      {data ? `+${data[dataKeys[index]]}` : '-'}
                    </span>
                    <span className={styles.text}>{text}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </WorktableCard>
  );
};
