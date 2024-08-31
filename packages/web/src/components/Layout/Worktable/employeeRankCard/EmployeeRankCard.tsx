import { Tooltip } from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import { WorktableCard } from '../card';
import styles from './EmployeeRankCard.module.scss';
import TopRankIcon from './TopRankIcon';
import querystring from 'querystring';
import { WorktableApi, api, apis, WorktableEmployeeListItem, MailProductApi, apiHolder, getIn18Text, ErrorReportApi } from 'api';
import moment from 'moment';
import { navigateToCustomerPage } from '@web-unitable-crm/api/helper';
import VirtualTable from '@web-common/components/UI/VirtualTable/VirtualTable';
import AvatarTag from '../../../../../../web-common/src/components/UI/Avatar/avatarTag';
import { pushNavigateCrossMultiClient, workTableTrackAction } from '../worktableUtils';
import { getTransText } from '@/components/util/translate';

const systemApi = apiHolder.api.getSystemApi();
const worktableApi = api.requireLogicalApi('worktableApiImpl') as WorktableApi;
const productApi = api.requireLogicalApi(apis.mailProductImplApi) as unknown as MailProductApi;
const errorReportApi: ErrorReportApi = apiHolder.api.requireLogicalApi(apis.errorReportImpl) as unknown as ErrorReportApi;

const EmployeeIsChampionMap: Record<string, number> = {
  edmEmailSendCount: 1, // 邮件营销发件数
  customerEmailSendCount: 2, // 客户邮件发送数
  customerEmailReplyCount: 4, // 回复客户邮件数
  newCreatedCustomerCount: 8, // 新建客户数
  newCreatedContactCount: 16, // 新建客户联系人数
  newCreatedFollowCount: 32, // 新建跟进动态数
  newCreatedOrderCount: 64,
};

const defaultDateRange = {
  start_date: moment().startOf('month').format('YYYYMMDD'),
  end_date: moment().endOf('month').format('YYYYMMDD'),
};

const EmployeeRankCard = () => {
  const [isLoading, setIsLoading] = useState(false);
  const memberList = useRef<undefined | string[]>();
  const dateRange = useRef<[string, string]>([defaultDateRange.start_date, defaultDateRange.end_date]);
  const sortType = useRef<string | undefined>();
  const [data, setData] = useState<WorktableEmployeeListItem[]>([]);
  const containerRef = useRef(null);
  // const customerTableId = useRef('')

  const getRangeDateArray = (key: string | string[]) => {
    if (key === 'TODAY') {
      return [moment().startOf('day').format('YYYY-MM-DD'), moment().endOf('day').format('YYYY-MM-DD')];
    }
    if (key === 'THIS_WEEK') {
      return [moment().weekday(0).format('YYYY-MM-DD'), moment().weekday(6).format('YYYY-MM-DD')];
    }
    if (key === 'THIS_MONTH') {
      return [moment().startOf('month').format('YYYY-MM-DD'), moment().endOf('month').format('YYYY-MM-DD')];
    }

    return key;
  };

  const EmployeeNavigateMap: Record<string, (date: string | string[], id: number, email: string) => void> = {
    edmEmailSendCount: (date: string | string[], id: number) => {
      const dateRange = getRangeDateArray(date) || [];
      const params: Record<string, string | number> = {
        tab: 2,
        sendTime: [dateRange[0], dateRange[1]].join(','),
        accountIds: id,
      };
      workTableTrackAction('waimao_worktable​_PK', 'number_of_email_marketing_sent');
      pushNavigateCrossMultiClient('#edm?page=index&_t=' + +new Date() + '&' + querystring.stringify(params));
    }, // 邮件营销发件数
    customerEmailSendCount: (date: string | string[], id: number, email: string) => {
      workTableTrackAction('waimao_worktable​_PK', 'number_of_emails_sent_customers');
      if (systemApi.getCurrentUser()?.id === email) {
        pushNavigateCrossMultiClient(`#mailbox`);
      } else {
        pushNavigateCrossMultiClient(`?initState={"fid_sd":"${id}"}&initTask=[{"type":"atSdTab"}]#mailbox`);
      }
    }, // 客户邮件发送数
    customerEmailReplyCount: (date: string | string[], id: number, email: string) => {
      workTableTrackAction('waimao_worktable​_PK', 'number_of_replies_to_customer_emails');
      if (systemApi.getCurrentUser()?.id === email) {
        pushNavigateCrossMultiClient(`#mailbox`);
      } else {
        pushNavigateCrossMultiClient(`?initState={"fid_sd":"${id}"}&initTask=[{"type":"atSdTab"}]#mailbox`);
      }
    }, //回复客户邮件数
    newCreatedCustomerCount: async (date: string | string[], id: number, email: string) => {
      const dateRange = getRangeDateArray(date) || [];
      const uniListFilter = {
        relation: 'and',
        subs: [
          {
            tradeKey: 'create_time',
            conditionMethod: 'gte',
            tradeValue: moment(dateRange[0]).toISOString(),
          },
          {
            tradeKey: 'create_time',
            conditionMethod: 'lte',
            tradeValue: moment(dateRange[1]).toISOString(),
          },
          {
            tradeKey: 'manager_list',
            conditionMethod: 'any-of',
            tradeValue: [`${id}`],
          },
        ],
      };
      // if (customerTableId.current === '') {
      //   const res = await productApi.getWaimaoProductTable({ tableKey: 'CUSTOMER' })
      //   customerTableId.current = res
      // }
      workTableTrackAction('waimao_worktable​_PK', 'number_of_new_customers');
      navigateToCustomerPage(
        {
          view: 'all',
          filter: uniListFilter,
        },
        systemApi.isWebWmEntry()
      );
    }, // 新建客户数
  };

  const fetchData = async (id?: number) => {
    setIsLoading(true);
    try {
      const { content } = await worktableApi.getEmployeePkList({
        page: 0,
        pageSize: 0,
        searchAccIds: memberList.current?.join(':'),
        searchDateScope: dateRange.current.join(':'),
        sort: sortType.current,
      });
      setData(content);
      if (id) errorReportApi.endTransaction({ id });
    } catch (error) {
      console.log(`worktableApi.getEmployeePkList error: ${error}`);
    }
    setIsLoading(false);
  };

  const renderRankValue = (value: number | null, key: string, row: any) => {
    const handleClick = (row: any) => {
      const accId = row['accId'];
      const email = row['email'];
      return () => {
        EmployeeNavigateMap[key] && EmployeeNavigateMap[key](dateRange.current, accId, email);
      };
    };

    if (value === null) {
      return (
        <div className={`${styles.tableValueGroup} ${styles.normalHover}`}>
          <Tooltip getPopupContainer={() => containerRef.current as unknown as HTMLElement} placement="bottom" title={getTransText('ZANWUCHAKANQUANXIAN')}>
            <span>--</span>
          </Tooltip>
        </div>
      );
    } else {
      const championVal = row['champion'] || 0;
      const currKeyVal = EmployeeIsChampionMap[key];
      const enableClick = ['newCreatedContactCount', 'newCreatedFollowCount', 'newCreatedOrderCount'].indexOf(key) < 0;

      return (
        <div
          className={`${styles.tableValueGroup} ${!enableClick ? styles.normalHover : ''}`}
          style={{ cursor: enableClick ? 'pointer' : 'auto' }}
          onClick={handleClick(row)}
        >
          <span>{value}</span>
          <div className={styles.topRankIconWrapper}>{(currKeyVal & championVal) === currKeyVal ? <TopRankIcon /> : null}</div>
        </div>
      );
    }
  };

  const columns = [
    {
      title: getTransText('XINGMING'),
      dataIndex: 'name',
      key: 'name',
      width: '16.4%',
      ellipsis: {
        showTitle: true,
      },
      render: (name: string, row: any) => {
        return (
          <div className={styles.tableNameGroup}>
            {row.avatar ? (
              <div className={styles.userIconWrap}>
                <img src={`${row.avatar}`} width="28" height="28" />
              </div>
            ) : (
              <AvatarTag
                user={{
                  name: name,
                }}
                size={28}
              />
            )}
            <Tooltip getPopupContainer={() => containerRef.current as unknown as HTMLElement} placement="bottom" title={name}>
              <span className={styles.name}>{name}</span>
            </Tooltip>
          </div>
        );
      },
    },
    {
      title: getTransText('YOUJIANYINGXIAOFASONGSHU'),
      dataIndex: 'edmEmailSendCount',
      key: 'edmEmailSendCount',
      sorter: true,
      ellipsis: {
        showTitle: true,
      },
      width: '15%',
      render: (edmEmailSendCount: number | null, row: any) => {
        return renderRankValue(edmEmailSendCount, 'edmEmailSendCount', row);
      },
    },
    {
      title: getTransText('KEHUYOUJIANFASONGSHU'),
      dataIndex: 'customerEmailSendCount',
      key: 'customerEmailSendCount',
      sorter: true,
      ellipsis: {
        showTitle: true,
      },
      width: '15%',
      render: (customerEmailSendCount: number | null, row: any) => {
        return renderRankValue(customerEmailSendCount, 'customerEmailSendCount', row);
      },
    },
    {
      title: getTransText('HUIFUKEHUYOUJIANSHU'),
      dataIndex: 'customerEmailReplyCount',
      key: 'customerEmailReplyCount',
      sorter: true,
      ellipsis: {
        showTitle: true,
      },
      width: '15%',
      render: (customerEmailReplyCount: number | null, row: any) => {
        return renderRankValue(customerEmailReplyCount, 'customerEmailReplyCount', row);
      },
    },
    {
      title: getTransText('XINJIANKEHUSHU'),
      dataIndex: 'newCreatedCustomerCount',
      key: 'newCreatedCustomerCount',
      sorter: true,
      ellipsis: {
        showTitle: true,
      },
      width: '13.5%',
      render: (newCreatedCustomerCount: number | null, row: any) => {
        return renderRankValue(newCreatedCustomerCount, 'newCreatedCustomerCount', row);
      },
    },
    {
      title: getTransText('XINJIANLIANXIRENSHU'),
      dataIndex: 'newCreatedContactCount',
      key: 'newCreatedContactCount',
      sorter: true,
      ellipsis: {
        showTitle: true,
      },
      width: '13.5%',
      render: (newCreatedContactCount: number | null, row: any) => {
        return renderRankValue(newCreatedContactCount, 'newCreatedContactCount', row);
      },
    },
    {
      title: getTransText('XINJIANGENJINSHU'),
      dataIndex: 'newCreatedFollowCount',
      key: 'newCreatedFollowCount',
      sorter: true,
      ellipsis: {
        showTitle: true,
      },
      width: '12%',
      render: (newCreatedFollowCount: number | null, row: any) => {
        return renderRankValue(newCreatedFollowCount, 'newCreatedFollowCount', row);
      },
    },
    {
      title: getIn18Text('XINZENGDINGDANSHU'),
      dataIndex: 'newCreatedOrderCount',
      key: 'newCreatedOrderCount',
      sorter: true,
      ellipsis: {
        showTitle: true,
      },
      width: '13.5%',
      render: (newCreatedOrderCount: number | null, row: any) => {
        return renderRankValue(newCreatedOrderCount, 'newCreatedOrderCount', row);
      },
    },
  ];

  const handleChange = (pagination: any, filters: any, sorter: any) => {
    if (Object.keys(sorter).length > 0) {
      const nextSortType = sorter.order ? `${sorter.columnKey}:${sorter.order === 'descend' ? 'desc' : 'asc'}` : undefined;
      if (nextSortType !== sortType.current) {
        sortType.current = nextSortType;
        fetchData();
      }
    }
  };

  const fetchMemberList = (cb: any) => {
    worktableApi.getEmployeePkMemberList().then(res => {
      cb(
        res.accList.map(item => {
          return {
            label: item.name,
            value: item.accId,
          };
        })
      );
    });
  };

  useEffect(() => {
    const id = errorReportApi.startTransaction({
      name: 'worktable_rankCard_init',
      op: 'loaded',
    });
    fetchData(id);
  }, []);

  return (
    <WorktableCard
      title={getTransText('YUANGONGPKBANG')}
      loading={isLoading}
      headerToolsConfig={[
        {
          onMemberChange: (changes: any) => {
            workTableTrackAction('waimao_worktable​_PK', 'member_selection');
            memberList.current = changes.account_id_list;
            const id = errorReportApi.startTransaction({
              name: 'worktable_rankCard_member_change',
              op: 'click',
            });
            fetchData(id);
          },
          fetchMemberOptionsList: fetchMemberList,
        },
        {
          onDatePickerChange: (changes: any) => {
            workTableTrackAction('waimao_worktable​_PK', 'time_selection');
            dateRange.current = [changes.start_date.replace(/-/g, ''), changes.end_date.replace(/-/g, '')];
            const id = errorReportApi.startTransaction({
              name: 'worktable_rankCard_picker_change',
              op: 'click',
            });
            fetchData(id);
          },
        },
        {
          tools: <div className={styles.ghostTools} />,
        },
      ]}
    >
      <div className={styles.employeeRankCard} ref={containerRef}>
        <VirtualTable
          className="edm-table"
          pagination={false}
          columns={columns}
          dataSource={data}
          scroll={{ y: 216 }}
          autoSwitchRenderMode={true}
          rowHeight={52}
          enableVirtualRenderCount={60}
          rowKey="accId"
          onChange={handleChange}
        />
      </div>
    </WorktableCard>
  );
};

export default EmployeeRankCard;
