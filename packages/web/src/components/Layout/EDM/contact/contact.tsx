import { Input, Select, Table, Button, Checkbox } from 'antd';
import { CheckboxChangeEvent } from 'antd/lib/checkbox';
import _ from 'lodash';
import React, { useEffect, useRef, useState, useReducer } from 'react';
import { IHistoryActionData } from '../components/historyAction/modal';
import { apiHolder, apis, EdmSendBoxApi, getIn18Text } from 'api';
import { navigate } from '@reach/router';
import style from '../edm.module.scss';
import { EdmPageProps } from '../pageProps';
import DownTriangle from '@web-common/components/UI/Icons/svgs/disk/DownTriangle';
import { ContactTrackingFilterType, edmDataTracker, EDMPvType, HistoryActionTrigger } from '../tracker/tracker';
import { EmptyList } from '../components/empty/empty';
import { RefreshSvg } from '@web-common/components/UI/Icons/svgs/ReadListSvgs';
import { MailReplyListModal } from '../components/historyAction/replyModal';
import { ArriveModal } from '../components/historyAction/arriveModal';
import { ReadSummaryModal } from '../components/historyAction/readSummaryModal';
import CustomerTabs from '../../Customer/components/Tabs/tabs';
import { ColumnsType, SorterResult, TablePaginationConfig } from 'antd/lib/table/interface';
import { getModuleAccessSelector, isOwnerDataPrivilegeSelector } from '@web-common/state/reducer/privilegeReducer';
import { useAppSelector } from '@web-common/state/createStore';
import { PermissionCheckPage, PrivilegeCheck } from '@/components/UI/PrivilegeEnhance';
import { ReactComponent as UpLine } from '@/images/icons/edm/up-line.svg';
import SearchIcon from '@web-common/components/UI/Icons/svgs/SearchSvg';
import toast from '@web-common/components/UI/Message/SiriusMessage';

const { Option } = Select;

interface contactInfo {
  contactEmail: string;
  contactName: string;
  sendCount: number;
  arriveCount: number;
  readCount: number;
  replyCount: number;
  unsubscribeCount: number;
  recentlyUpdateTime: string;
  parentArriveCount?: number;
}
interface IContactFilter {
  page: number;
  sent?: boolean;
  traceStatus?: number;
  minSendCount?: number;
  minReadCount?: number;
}
const edmApi = apiHolder.api.requireLogicalApi(apis.edmSendBoxApiImpl) as EdmSendBoxApi;
let fetchDataTimestamp = 0;
export const Contact: React.FC<EdmPageProps> = () => {
  // table 外层容器
  const container = useRef<HTMLDivElement>(null);
  // loading状态
  const [loading, setLoading] = useState(false);
  const hasEditPermission = useAppSelector(state => getModuleAccessSelector(state.privilegeReducer, 'EDM', 'OP'));
  // 列表数据
  const [list, setList] = useReducer((state: contactInfo[], action: { type: string; payload: contactInfo[] }) => {
    switch (action.type) {
      case 'update':
        return action.payload;
      case 'append':
        return [...state, ...action.payload];
    }
    return state;
  }, []);
  // 排序字段
  const [sort, setSort] = useState(''); // 排序字段，格式形如xxx:desc/asc，根据某个字段升序或降序。支持排序字段为：sendCount（发送数）、readCount（阅读数）、replyCount（回复数）、recentlyUpdateTime（最新动态时间）
  // 每次请求条数
  const [pageSize, setPageSize] = useState(20);
  // 总条数
  const [totalRecords, setTotalRecords] = useState<number>(10000);
  const [modalData, setModalData] = useState<Array<any>>([]);
  const [replyModal, setReplyModal] = useState<{
    data?: any[];
    visible: boolean;
  }>({
    visible: false,
  });
  // 表格高度
  const [tableHeight, setTableHeight] = useState(456);
  const mainRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState(1);

  const [showRowSelection, setShowRowSelection] = useState<boolean>(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [exporting, setExporting] = useState<boolean>(false);
  const [arriveModal, setArriveModal] = useState<{ visible: boolean; data?: any }>({ visible: false });

  const handleExport = () => {
    setExporting(true);
    edmApi
      .exportContactList({
        pageSize,
        sort,
        ...filters,
      })
      .then(data => {
        window.location.href = data.download_url;
      })
      .catch(error => {
        toast.error({ content: error?.message || '导出失败' });
      })
      .finally(() => {
        setExporting(false);
      });
  };

  const handleCheckAllChange = (e: CheckboxChangeEvent) => {
    if (e.target.checked) {
      setSelectedRowKeys(list.map(item => item.contactEmail));
    } else {
      setSelectedRowKeys([]);
    }
  };

  // useEffect(() => {
  //     const listContactEmails = list.map(item => item.contactEmail);
  //     setSelectedRowKeys(selectedRowKeys.filter(item => listContactEmails.includes(item)));
  // }, [list]);

  const handleResend = async () => {
    const contacts = list.filter(item => selectedRowKeys.includes(item.contactEmail));
    const id = await edmApi.createDraft();

    await edmApi.saveDraft({
      draftId: id,
      currentStage: 0,
      contentEditInfo: {
        emailContent: '',
        emailAttachment: '',
      },
      sendSettingInfo: {},
      receiverInfo: {
        contacts: contacts.map(item => ({
          name: item.contactName || '',
          email: item.contactEmail,
        })),
      },
    });

    navigate('#edm?page=write&id=' + id);
  };

  const [filters, setFilters] = useReducer(
    (state: IContactFilter, action: { type: string; payload?: any }) => {
      switch (action.type) {
        case 'loadMore': {
          return {
            ...state,
            page: state.page + 1,
          };
        }
        case 'refresh': {
          return {
            ...state,
            page: 0,
          };
        }
        case 'update': {
          return {
            ...state,
            ...action.payload,
          };
        }
      }
      return {
        ...state,
        ...action.payload,
      };
    },
    {
      page: 0,
    }
  );

  // const getScrollHeight = ()=>{
  //     // table 的DOM
  //     const tableDom = mainRef.current?.querySelector('.ant-table-body')
  //     if(tableDom && tableDom.scrollHeight - tableDom.scrollTop + tableDom.clientHeight > 90){
  //         setFilters({
  //             type: 'loadMore'
  //         });
  //     }
  // }
  // const debounceGetScrollHeight = _.debounce(getScrollHeight, 300)
  // useEffect(()=>{
  //     // table 的DOM
  //     const taleDom = mainRef.current?.querySelector('.ant-table-body')
  //     // 监听table滚动
  //     taleDom?.addEventListener('scroll', debounceGetScrollHeight)
  //     return ()=>{
  //         taleDom?.removeEventListener('scroll',debounceGetScrollHeight)
  //     }
  // },[mainRef.current])
  // 获取列表数据
  const getListData = () => {
    if ((loading || list.length >= totalRecords) && filters.page > 0) {
      return;
    }
    const params: { [key: string]: number | string } = {
      pageSize,
      sort,
      ...filters,
    };
    Object.keys(params).forEach(k => {
      if (params[k] === undefined || params[k] === '') {
        delete params[k];
      }
    });
    setLoading(true);
    const _lastFetchTime = (fetchDataTimestamp = +new Date());
    const promise = activeTab == 2 ? edmApi.getEdmTraceListAll(params) : edmApi.getEdmTraceList(params);
    promise
      .then(data => {
        if (_lastFetchTime !== fetchDataTimestamp) {
          return;
        }
        setList({ type: 'update', payload: data.contactInfoList });
        setTotalRecords(data.totalContactCount || 0);
      })
      .catch(e => {
        console.log(e);
      })
      .finally(() => {
        setLoading(false);
      });
  };
  useEffect(() => {
    getListData();
  }, [filters]);
  useEffect(() => {
    setFilters({
      type: 'update',
      payload: {
        page: 0,
      },
    });
    getListData();
    setShowRowSelection(false);
    setSelectedRowKeys([]);
  }, [activeTab]);
  // 邮件状态过滤 select options
  const optionList = [
    {
      name: '全部',
      id: '',
    },
    {
      name: '回复/退订',
      id: 0,
    },
    {
      name: '有回复',
      id: 1,
    },
    {
      name: '未回复',
      id: 3,
    },
    {
      name: '有退订',
      id: 2,
    },
    {
      name: '未退订',
      id: 4,
    },
    {
      name: '未回复/未退订',
      id: 5,
    },
  ];

  // 发送数input改变
  const searchEmailKey = (e: React.FormEvent<HTMLInputElement>) => {
    const value = (e.target as HTMLInputElement).value;
    if (value !== filters.contactEmailKey) {
      setFilters({ type: 'update', payload: { contactEmailKey: value, page: 0 } });
    }
  };

  // 邮件状态过滤改变
  const mailStateChange = (value: number) => {
    setSort('');
    setFilters({
      type: 'update',
      payload: {
        page: 0,
        traceStatus: value,
        sort: undefined,
      },
    });
    edmDataTracker.trackContactFilterClick(ContactTrackingFilterType.State);
  };

  // 是否送达过滤改变
  const sentChange = (value: number | undefined) => {
    setSort('');
    setFilters({
      type: 'update',
      payload: {
        page: 0,
        sent: value === undefined ? undefined : !!value,
        sort: undefined,
      },
    });
    edmDataTracker.trackContactFilterClick(ContactTrackingFilterType.Sent);
  };

  // 发送数input改变
  const searchSendCount = (e: React.FormEvent<HTMLInputElement>) => {
    const value = (e.target as HTMLInputElement).value;
    if (value !== filters.minSendCount) {
      setFilters({ type: 'update', payload: { minSendCount: value, page: 0 } });
      edmDataTracker.trackContactFilterClick(ContactTrackingFilterType.SendNum);
    }
  };
  // 送达数input改变
  const searchArriveCount = (e: React.FormEvent<HTMLInputElement>) => {
    const value = (e.target as HTMLInputElement).value;
    if (value !== filters.minArriveCount) {
      setFilters({ type: 'update', payload: { minArriveCount: value, page: 0 } });
      edmDataTracker.trackContactFilterClick(ContactTrackingFilterType.ArriveNum);
    }
  };
  // 阅读数input改变
  const searchReadCount = (e: React.FormEvent<HTMLInputElement>) => {
    const value = (e.target as HTMLInputElement).value;
    if (value !== filters.minReadCount) {
      setFilters({ type: 'update', payload: { minReadCount: value, page: 0 } });
      edmDataTracker.trackContactFilterClick(ContactTrackingFilterType.OpenNum);
    }
  };

  const columns: ColumnsType<contactInfo> = [
    {
      title: '邮箱',
      ellipsis: true,
      width: 216,
      fixed: 'left',
      dataIndex: 'contactEmail',
    },
    {
      title: '联系人',
      width: 116,
      ellipsis: true,
      dataIndex: 'contactName',
    },
    {
      title: '发件次数',
      width: 110,
      dataIndex: 'sendCount',
      sorter: (a: contactInfo, b: contactInfo) => a.sendCount - b.sendCount,
    },
    {
      title: '送达次数',
      width: 110, // setArriveModal({ visible: false })
      dataIndex: 'arriveCount',
      sorter: (a: contactInfo, b: contactInfo) => a.arriveCount - b.arriveCount,
      render(arriveCount: number, item: contactInfo) {
        // eslint-disable-next-line jsx-a11y/anchor-is-valid
        if (item.parentArriveCount != null && item.parentArriveCount > 0) {
          return <a onClick={() => openArraiveModal(item, HistoryActionTrigger.Arrive)}>{item.parentArriveCount}</a>;
        }
        return arriveCount > 0 ? <a onClick={() => openArraiveModal(item, HistoryActionTrigger.Arrive)}>{arriveCount}</a> : '-';
      },
    },
    {
      title: '打开次数',
      width: 110,
      ellipsis: true,
      dataIndex: 'readCount',
      sorter: (a: contactInfo, b: contactInfo) => a.readCount - b.readCount,
      render(readCount: number, item: contactInfo) {
        // eslint-disable-next-line jsx-a11y/anchor-is-valid
        return readCount > 0 ? <a onClick={() => openMenuFor(item, HistoryActionTrigger.ReadCount)}>{readCount}</a> : '-';
      },
    },
    {
      title: '是否回复',
      width: 110,
      dataIndex: 'replyCount',
      sorter: (a: contactInfo, b: contactInfo) => a.replyCount - b.replyCount,
      render(replyCount: number, item: contactInfo) {
        return replyCount > 0 ? <a onClick={() => openReplyListModal(item, HistoryActionTrigger.Reply)}>是</a> : '-';
      },
    },
    {
      title: '是否退订',
      width: 90,
      dataIndex: 'unsubscribeCount',
      render(unsubscribeCount: number, item: contactInfo) {
        return unsubscribeCount > 0 ? <a onClick={() => openMenuFor(item, HistoryActionTrigger.Unsubscribe)}>是</a> : '-';
      },
    },
    // {
    //     title: '操作',
    //     width: 90,
    //     dataIndex: 'companyId',
    //     render(id?: string) {
    //         return id ? <a onClick={()=>navigate('#customer?page=customer&id=' + id)}>客户资料</a> : '-';
    //     }
    // }
  ];
  if (!hasEditPermission) {
    columns.splice(columns.length - 1, 1);
  }
  const openMenuFor = (detail: contactInfo, from: HistoryActionTrigger) => {
    edmDataTracker.trackHistoryAction('contactTracking', from);

    const promise =
      activeTab == 2 ? edmApi.getReadOperateListAll({ contactEmail: detail.contactEmail }) : edmApi.getReadOperateList({ contactEmail: detail.contactEmail });

    promise.then(data => {
      const arr: any[] = data.operateInfoList.map(i => ({
        ...i,
        edmSubject: (i as any).edmSubject || '',
      }));
      setModalData(arr);
    });
  };

  const openReplyListModal = (detail: contactInfo, from: HistoryActionTrigger) => {
    edmDataTracker.trackHistoryAction('contactTracking', from);

    const promise =
      activeTab == 2 ? edmApi.getReplyOperateListAll({ contactEmail: detail.contactEmail }) : edmApi.getReplyOperateList({ contactEmail: detail.contactEmail });

    promise.then(data => {
      setReplyModal({
        visible: true,
        data: data.operateInfoList,
      });
    });
  };

  const openArraiveModal = async (detail: contactInfo, from: HistoryActionTrigger) => {
    edmDataTracker.trackHistoryAction('contactTracking', from);
    let res;
    if (activeTab == 2) {
      res = await edmApi.getArriveOperatesAll({ contactEmail: detail.contactEmail });
    } else {
      res = await edmApi.getArriveOperates({ contactEmail: detail.contactEmail });
    }
    setArriveModal({ visible: true, data: res?.arriveInfoList ?? [] });
  };

  // 排序改变
  const handleTableChange = (pagination: any, _: any, sorterResult: SorterResult<contactInfo> | SorterResult<contactInfo>[]) => {
    const sorter = Array.isArray(sorterResult) ? sorterResult[0] : sorterResult;
    const { field, order } = sorter;
    const sortMap = {
      ascend: 'asc',
      descend: 'desc',
    };
    setSort(order ? `${field}:${sortMap[order]}` : '');
    setFilters({
      type: 'update',
      payload: {
        page: pagination.current - 1,
      },
    });
    setPageSize(pagination.pageSize);
  };
  useEffect(() => {
    edmDataTracker.trackPv(EDMPvType.ContactTracking);
  });
  useEffect(() => {
    const observer = new ResizeObserver(entries => {
      for (let entry of entries) {
        const dimensions = entry.contentRect;
        setTableHeight(dimensions.height - 101);
      }
    });
    if (mainRef.current) {
      setTableHeight(mainRef.current.clientHeight - 101);
      observer.observe(mainRef.current);
    }
    return () => {
      observer.disconnect();
    };
  }, [mainRef.current]);

  const isOwner = useAppSelector(state => isOwnerDataPrivilegeSelector(state.privilegeReducer, 'EDM'));
  const tabs = isOwner ? ['我的数据'] : ['我的数据', '全部数据'];

  const [minSendCount, setMinSendCount] = useState<string>('');
  const [minArriveCount, setMinArriveCount] = useState<string>('');
  const [minReadCount, setMinReadCount] = useState<string>('');

  const [filterFolded, setFilterFolded] = useState<boolean>(true);

  const handleFilterCountChange = (event: React.FormEvent<HTMLInputElement>, changeHandler: Function) => {
    const { value } = event.target as HTMLInputElement;
    const isValueValid = /^\d*$/.test(value);

    isValueValid && changeHandler(value);
  };

  return (
    <PermissionCheckPage resourceLabel="EDM" accessLabel="VIEW" menu="EDM_DATA_STAT">
      <div
        className={style.container}
        ref={container}
        style={{
          paddingBottom: 46,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <div className={style.pageHeader}>
          <span className={style.title}>{getIn18Text('SHUJUTONGJI')}</span>
          {list.length > 0 && (
            <span className={style.subTitle}>
              {getIn18Text('GONG')}
              <em className={style.num}>{totalRecords}</em>
              {getIn18Text('GELIANXIREN')}
            </span>
          )}
          <a
            className="edm-page-refresh"
            onClick={() => {
              setFilters({ type: 'refresh' });
              setShowRowSelection(false);
              setSelectedRowKeys([]);
            }}
          >
            <RefreshSvg />
          </a>
        </div>
        <div style={{ margin: '16px 0 18px' }}>
          <CustomerTabs tabNameList={tabs} defaultActiveKey="1" onChange={setActiveTab} className="" />
        </div>
        <div
          className={style.contactSearch}
          style={{
            marginBottom: 4,
            height: filterFolded ? 40 : 82,
            overflow: 'hidden',
            transition: 'height 0.3s',
          }}
        >
          <Input
            placeholder="请输入邮箱"
            style={{ width: 160, fontSize: 12, marginRight: 8, marginBottom: 8 }}
            prefix={<SearchIcon />}
            onPressEnter={searchEmailKey}
            onBlur={searchEmailKey}
          />

          <Select
            style={{ width: 160, fontSize: 12, marginRight: 8, marginBottom: 8 }}
            placeholder="请选择过滤条件"
            optionFilterProp="children"
            onChange={mailStateChange}
            suffixIcon={<DownTriangle />}
            dropdownClassName="edm-selector-dropdown"
            className="no-border-select"
          >
            {optionList.map(item => {
              return (
                <Option value={item.id} key={item.id}>
                  {item.name}
                </Option>
              );
            })}
          </Select>

          <Input
            placeholder="填写发件次数"
            suffix="以上"
            style={{ width: 160, fontSize: 12, marginRight: 8, marginBottom: 8 }}
            value={minSendCount}
            onChange={event => handleFilterCountChange(event, setMinSendCount)}
            onPressEnter={searchSendCount}
            onBlur={searchSendCount}
          />

          <Input
            placeholder="填写送达次数"
            suffix="以上"
            style={{ width: 160, fontSize: 12, marginRight: 8, marginBottom: 8 }}
            value={minArriveCount}
            onChange={event => handleFilterCountChange(event, setMinArriveCount)}
            onPressEnter={searchArriveCount}
            onBlur={searchArriveCount}
          />

          <a
            style={{
              fontSize: 12,
              marginRight: 8,
              userSelect: 'none',
            }}
            onClick={() => setFilterFolded(!filterFolded)}
          >
            {filterFolded ? '展开筛选' : '收起筛选'}
            <UpLine
              style={{
                transform: filterFolded ? 'rotate(0)' : 'rotate(180deg)',
                verticalAlign: '0.1em',
                marginLeft: 4,
              }}
            />
          </a>

          <br />

          <Input
            placeholder="填写打开次数"
            suffix="以上"
            style={{ width: 160, fontSize: 12, marginRight: 8, marginBottom: 8 }}
            value={minReadCount}
            onChange={event => handleFilterCountChange(event, setMinReadCount)}
            onBlur={searchReadCount}
            onPressEnter={searchReadCount}
          />

          <Select
            className="no-border-select"
            dropdownClassName="edm-selector-dropdown"
            style={{ width: 160, fontSize: 12, marginRight: 8, marginBottom: 8 }}
            placeholder="请选择是否送达"
            onChange={sentChange}
            suffixIcon={<DownTriangle />}
            allowClear
          >
            <Option value={1} key={1}>
              是
            </Option>
            <Option value={0} key={0}>
              否
            </Option>
          </Select>
        </div>
        <div className="main" style={{ flexGrow: 1, overflow: 'hidden' }} ref={mainRef}>
          <Table
            className={`${style.contactTable}`}
            style={{ display: list.length === 0 ? 'none' : '' }}
            rowKey="contactEmail"
            onChange={handleTableChange}
            loading={loading}
            columns={columns}
            dataSource={list}
            scroll={{ y: tableHeight }}
            sortDirections={['descend', 'ascend']}
            locale={{
              sortTitle: '排序',
              triggerDesc: '点击降序',
              triggerAsc: '点击升序',
              cancelSort: '取消排序',
            }}
            rowSelection={
              showRowSelection
                ? {
                    selectedRowKeys,
                    preserveSelectedRowKeys: true,
                    onChange: rowKeys => setSelectedRowKeys(rowKeys as string[]),
                  }
                : undefined
            }
            pagination={{
              style: {
                display: 'flex',
                alignItems: 'center',
                height: 56,
                margin: 0,
              },
              size: 'small',
              total: totalRecords,
              current: filters.page + 1,
              pageSize,
              pageSizeOptions: ['20', '50', '100'],
              showSizeChanger: true,
            }}
            // onChange={({ current }) => {
            //     setFilters({ type: 'update', payload: {
            //         page: current
            //     }});
            //     setSelectedRowKeys([]);
            // }}
          />
          {list.length === 0 && (
            <EmptyList>
              <p>当前没有任何联系人</p>
            </EmptyList>
          )}
        </div>
        {!!list.length && (
          <div
            className="footer"
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 0,
              height: 60,
              paddingLeft: 32,
              paddingRight: 24,
              backgroundColor: showRowSelection ? '#ffffff' : 'transparent',
              boxShadow: showRowSelection ? 'inset 0px 0.5px 0px rgb(38 42 51 / 24%)' : 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
            }}
          >
            {showRowSelection ? (
              <>
                {/* <Checkbox
                                        style={{ marginRight: 'auto' }}
                                        checked={list.length === selectedRowKeys.length}
                                        indeterminate={selectedRowKeys.length > 0 && selectedRowKeys.length < list.length}
                                        onChange={handleCheckAllChange}
                                    >
                                        全选
                                    </Checkbox> */}
                <span style={{ marginRight: 'auto' }}>已选择{selectedRowKeys.length}个数据</span>
                <Button
                  style={{ marginRight: 12 }}
                  onClick={() => {
                    setShowRowSelection(false);
                    setSelectedRowKeys([]);
                  }}
                >
                  取消
                </Button>
                <PrivilegeCheck resourceLabel="EDM" accessLabel="OP">
                  <Button style={{ border: '1px solid #C3D3F8' }} type="primary" ghost onClick={handleResend} disabled={selectedRowKeys.length === 0}>
                    再次发件
                  </Button>
                </PrivilegeCheck>
              </>
            ) : (
              <PrivilegeCheck resourceLabel="EDM" accessLabel="OP">
                {activeTab == 1 && (
                  <>
                    <Button type="primary" ghost style={{ marginRight: 8 }} loading={exporting} onClick={handleExport}>
                      导出
                    </Button>
                    <Button type="primary" ghost onClick={() => setShowRowSelection(true)}>
                      再次发件
                    </Button>
                  </>
                )}
              </PrivilegeCheck>
            )}
          </div>
        )}
        <ReadSummaryModal visible={modalData.length > 0} data={modalData} onCancel={() => setModalData([])} />
        <MailReplyListModal onCancel={() => setReplyModal({ visible: false })} data={replyModal.data} visible={replyModal.visible} />
        <ArriveModal onCancel={() => setArriveModal({ visible: false })} data={arriveModal.data} visible={arriveModal.visible} />
      </div>
    </PermissionCheckPage>
  );
};
