import React, { useContext, useState, useMemo } from 'react';
import classnames from 'classnames';
import { Tabs, Table, TablePaginationConfig, Spin, Space, Divider } from 'antd';
import { ColumnsType } from 'antd/es/table';
import {
  CustomerRow,
  CustomerAutoTaskRow,
  CustomerManualTaskRow,
  apiHolder,
  apis,
  CustomerDiscoveryApi,
  RegularCustomerListReq,
  RegularCustomerList,
  CustomerManualTask,
} from 'api';
import { ReactComponent as QuestionIcon } from '@/images/icons/edm/question.svg';
import { DetailPanel } from '../../components/detailPanel';
import { CustomerDiscoveryContext, ActionType, CustomerSyncTypeMap, CustomerSyncType, CustomerRecommendType, ValidFlag } from '../../context';
import { DateFormat } from '../../../components/dateFormat';
import { RuleDetail } from '../../components/RuleDetail';
import { CustomerTags } from '../../components/CustomerTags';
import { useCustomerSync } from '../../hooks/useCustomerSync';
import { useContainerHeight } from '../../hooks/useContainerHeight';
import { useTableSearch } from '../../hooks/useTableSearch';
import { CustomerDetail } from '../CustomerDetail';
import { ConcatSelectModal } from '../../components/ConcatSeletModal';
import UniDrawerWrapper from '../../../../CustomsData/components/uniDrawer/uniDrawer';
import style from './style.module.scss';
import { getIn18Text } from 'api';

const { TabPane } = Tabs;
interface Props {
  data: CustomerAutoTaskRow | CustomerManualTaskRow;
  type: CustomerRecommendType;
  getContainer?: () => HTMLElement; // 指定抽屉挂载元素 解决发邮件弹窗被覆盖问题
}
const customerDiscoveryApi = apiHolder.api.requireLogicalApi(apis.customerDiscoveryApi) as CustomerDiscoveryApi;
export const CustomerList: React.FC<Props> = props => {
  const { data, type, getContainer } = props;
  const { state, dispatch } = useContext(CustomerDiscoveryContext);
  const { containerRef, containerHeight } = useContainerHeight();
  const [drawer, setDrawer] = useState<{
    visible: boolean;
    row: CustomerRow;
  }>({ visible: false, row: {} as CustomerRow });
  const fetchTableData = async (search: RegularCustomerListReq, pagination: TablePaginationConfig): Promise<[number, RegularCustomerList]> => {
    const res = await customerDiscoveryApi.getRegularCustomerList({
      ...search,
      page: pagination.current as number,
      pageSize: pagination.pageSize as number,
    });
    dispatch({ type: ActionType.UpdateCustomerTable, payload: res.data });
    return [res.total || 0, res];
  };
  const { pagination, pageChange, loading, searchParams, reload, setSearchParams } = useTableSearch<RegularCustomerListReq, RegularCustomerList>(fetchTableData, {
    validFlag: 'all',
    taskId: data.taskId,
  });
  const {
    markRecord,
    syncRecord,
    // assignRecord,
    // betchMarkRecord,
    // betchSyncRecord,
    // betchAssignRecord,
    customerModal,
    contactModal,
    // batchLoading,
    selectedRowKeys,
    setSelectedRowKeys,
  } = useCustomerSync();
  const selectRowChange = (newSelectedRowKeys: React.Key[]) => {
    setSelectedRowKeys(newSelectedRowKeys);
  };
  /**
   * 取消无效
   */
  const cancelMark = async (row: CustomerRow) => {
    // markRecord(row, true)
    const res = await markRecord(row, true);
    if (res?.validFlag) {
      dispatch({
        type: ActionType.UpdateCustomerTableRow,
        payload: { ...row, validFlag: res?.validFlag },
      });
    }
    if (searchParams.validFlag !== 'all') {
      // 非全部tab，则刷新列表
      reload();
    }
  };

  /**
   * 有同步、分配、标记等操作后，检查并更新任务状态
   */
  const checkTaskState = async () => {
    const taskInfo = await customerDiscoveryApi.getRecommendTaskInfo(data.taskId);
    const payload = {
      taskId: data.taskId,
      opFlag: 1,
      invalidDomainCount: taskInfo.invalidDomainCount,
      validDomainCount: taskInfo.validDomainCount,
      taskStatus: taskInfo.taskStatus,
    } as CustomerAutoTaskRow | CustomerManualTaskRow;
    if (type === CustomerRecommendType.Manual) {
      dispatch({ type: ActionType.UpdateManualTaskTableRow, payload });
    } else {
      dispatch({ type: ActionType.UpdateAutoTaskTableRow, payload });
    }
  };

  /**
   * 批量操作后刷新列表
   * @param fun
   * @param args
   */
  // const betchOperate = (fun: Function, args: string[] = []) => {
  //   let content = getIn18Text('SHIFOUQUERENPILIANGCAOZUO\uFF1F');
  //   if (fun === betchMarkRecord) {
  //     content = (getIn18Text('SHIFOUQUERENPILIANGBIAOJIWEIWUXIAO\uFF1F'));
  //   } else if (args[0] === CustomerSyncType.Clue) {
  //     content = (getIn18Text('SHIFOUQUERENPILIANGTONGBUZHIXIANSUO\uFF1F'));
  //   } else if (args[0] === CustomerSyncType.OpenSea) {
  //     content = (getIn18Text('SHIFOUQUERENPILIANGTONGBUZHIGONGHAI\uFF1F'));
  //   } else if (args[0] === CustomerSyncType.OtherClue) {
  //     content = (getIn18Text('SHIFOUQUERENPILIANGFENPEIZHIDINGREN\uFF1F'));
  //   }
  //   Modal.confirm({
  //     centered: true,
  //     content,
  //     onOk: async () => {
  //       await fun(...args);
  //       reload();
  //       checkTaskState();
  //     }
  //   });
  // };
  /**
   * 列表操作
   * @param fun
   * @param args
   */
  const customerOperate = async (fun: Function, args: any[]) => {
    await fun(...args);
    checkTaskState();
  };

  /** 展示详情 */
  const showCustomDetail = (row: CustomerRow) => {
    setDrawer({ visible: true, row });
  };
  const details = useMemo(() => {
    if (type === CustomerRecommendType.Auto) {
      return [
        {
          label: getIn18Text('TUISONGZONGLIANG'),
          value: data.totalDomainCount,
        },
        {
          label: getIn18Text('YOUXIAO'),
          value: data.validDomainCount,
          tips: getIn18Text('DUISHAIXUANDEJIEGUOTONGBUDAOXIANSUO\u3001KEHU\uFF0CJUNWEIYOUXIAOZHUANGTAI\uFF0CQIEBUKEZAICIBIANGENG'),
        },
        {
          label: getIn18Text('WUXIAO'),
          value: data.invalidDomainCount,
          tips: getIn18Text('WUXIAOZHUANGTAIWEIYIZHONGBIAOJI\uFF0C KESUISHIQUXIAOBINGJINXINGBIANGENG'),
        },
        {
          label: getIn18Text('SHIJIANDUAN'),
          value: (
            <>
              <DateFormat value={data.startTime} />
              {getIn18Text('ZHI')}
              <DateFormat value={data.endTime} />
            </>
          ),
        },
        { label: getIn18Text('SHAIXUANSHIJIAN'), value: <DateFormat value={data.finishTime} /> },
      ];
    }
    try {
      const rule: CustomerManualTask = JSON.parse(data.ruleContent);
      return [
        { label: getIn18Text('TUISONGZONGLIANG'), value: data.totalDomainCount },
        { label: getIn18Text('RENWUSHIJIAN'), value: <DateFormat value={data.createTime} /> },
        { label: getIn18Text('SHAIXUANSHIJIAN'), value: <DateFormat value={data.finishTime} /> },
        {
          label: getIn18Text('YOUJIANSHUJUFANWEI'),
          value: (
            <>
              <span className={style.ruleDataRange}>{rule.dataRange === 'personal' ? getIn18Text('GERENYOUJIAN') : getIn18Text('QIYEYOUJIAN')}</span>
              <RuleDetail rule={data.ruleContent}>
                <QuestionIcon />
              </RuleDetail>
            </>
          ),
        },
      ];
    } catch (e) {
      return [
        { label: getIn18Text('TUISONGZONGLIANG'), value: data.totalDomainCount },
        { label: getIn18Text('RENWUSHIJIAN'), value: <DateFormat value={data.createTime} /> },
        { label: getIn18Text('SHAIXUANSHIJIAN'), value: <DateFormat value={data.finishTime} /> },
        { label: getIn18Text('YOUJIANSHUJUFANWEI'), value: '--' },
      ];
    }
  }, [data]);
  const columns = [
    {
      title: getIn18Text('YUMING'),
      width: 300,
      render(_: string, row: CustomerRow) {
        const Domin = (
          <span className={style.linkBtn} onClick={() => showCustomDetail(row)}>
            {row.regularCustomerDomain}
          </span>
        );
        return (
          <>
            {Domin}
            <div>
              <CustomerTags data={row} />
            </div>
          </>
        );
      },
    },
    {
      title: getIn18Text('FASONG'),
      dataIndex: 'sendCount',
      key: 'sendCount',
    },
    type === CustomerRecommendType.Manual
      ? {
          title: getIn18Text('FASONGREN'),
          dataIndex: 'sendCount',
          key: 'sendCount',
        }
      : null,
    {
      title: getIn18Text('JIESHOU'),
      dataIndex: 'receiveCount',
      key: 'receiveCount',
    },
    {
      title: getIn18Text('SHOUJIANREN'),
      dataIndex: 'toCount',
      key: 'toCount',
    },
    {
      title: getIn18Text('BIAOJI'),
      width: type === CustomerRecommendType.Manual ? 180 : 140,
      render(_: string, row: CustomerRow) {
        const syncType: CustomerSyncType = row?.syncInfo?.type as CustomerSyncType;
        const isValid = row?.validFlag;
        if (row.isLoading) {
          return <Spin />;
        }
        if (isValid === ValidFlag.Invalid) {
          // 已标记为无效
          return (
            <span className={style.linkBtn} onClick={() => customerOperate(cancelMark, [row])}>
              {getIn18Text('QUXIAOWUXIAO')}
            </span>
          );
        }
        if (isValid === ValidFlag.Pending) {
          // 待定状态
          return <span>{getIn18Text('DAIDING')}</span>;
        }
        if (syncType !== CustomerSyncType.NotSync) {
          // 已被同步
          return <span>{CustomerSyncTypeMap[syncType]}</span>;
        }
        return (
          <div>
            <Space>
              <span className={style.linkBtn} onClick={() => customerOperate(markRecord, [row])}>
                {getIn18Text('WUXIAO')}
              </span>
              <span className={style.linkBtn} onClick={() => customerOperate(syncRecord, [CustomerSyncType.Company, row])}>
                {getIn18Text('LURUKEHU')}
              </span>
              {/* <Dropdown overlay={(
                <Menu onClick={({ key }) => customerOperate(syncRecord, [key, row])}>
                  <Menu.Item key={CustomerSyncType.Clue}>
                    <div className={style.menuItem}>{getIn18Text('XIANSUO')}</div>
                  </Menu.Item>
                  <Menu.Item key={CustomerSyncType.Company}>
                    <div className={style.menuItem}>{getIn18Text('KEHU')}</div>
                  </Menu.Item>
                </Menu>
              )}
              >
                <Space>
                  <span className={style.linkBtn}>{getIn18Text('TONGBU')}</span>
                  <DownOutlined style={{ color: '#396ee7' }} />
                </Space>
              </Dropdown> */}
              {/* {type === CustomerRecommendType.Manual
                ? (
                  <Dropdown overlay={(
                    <Menu onClick={({ key }) => customerOperate(assignRecord, [row, key])}>
                      <Menu.Item key={CustomerSyncType.OpenSea}>
                        <div className={style.menuItem}>{getIn18Text('XIANSUOGONGHAI')}</div>
                      </Menu.Item>
                      <Menu.Item key={CustomerSyncType.OtherClue}>
                        <div className={style.menuItem}>{getIn18Text('ZHIDINGREN')}</div>
                      </Menu.Item>
                    </Menu>
                  )}
                  >
                    <Space>
                      <span className={style.linkBtn}>{getIn18Text('FENPEI')}</span>
                      <DownOutlined style={{ color: '#396ee7' }} />
                    </Space>
                  </Dropdown>
                )
                : ''} */}
            </Space>
          </div>
        );
      },
    },
  ].filter(Boolean) as ColumnsType<CustomerRow>;
  return (
    <div className={classnames(style.ruleDetail, style.flex1, style.flex, style.flexCol)}>
      <DetailPanel title={getIn18Text('GUIZEXIANGQING')} data={details} />
      <Divider />
      <div>
        <span className={style.title}>{getIn18Text('SHAIXUANXIANGQINGLIEBIAO')}</span>
        <Tabs onChange={validFlag => setSearchParams({ ...searchParams, validFlag })} activeKey={searchParams.validFlag}>
          <TabPane tab={getIn18Text('QUANBU')} key="all" />
          <TabPane tab={getIn18Text('YOUXIAO')} key="valid" />
          <TabPane tab={getIn18Text('WUXIAO')} key="invalid" />
        </Tabs>
      </div>
      <div className={style.table} ref={containerRef}>
        <Table
          columns={columns}
          className={style.recommendTable}
          scroll={{
            y: `${containerHeight - 110}px`,
          }}
          rowKey="regularCustomerId"
          dataSource={state.customerTable}
          loading={loading}
          pagination={{
            ...pagination,
            onChange: pageChange,
          }}
          rowSelection={{
            selectedRowKeys,
            onChange: selectRowChange,
            getCheckboxProps: (row: CustomerRow) => ({
              disabled: row?.validFlag === ValidFlag.Invalid || row?.syncInfo?.type !== CustomerSyncType.NotSync || row?.validFlag === ValidFlag.Pending,
            }),
          }}
        />
      </div>
      {/* <div className={style.operation}>
        <Space>
          <Button
            disabled={selectedRowKeys.length === 0 || batchLoading}
            onClick={() => betchOperate(betchMarkRecord)}
          >
            {getIn18Text('WUXIAO')}
          </Button>
          <Button
            type="primary"
            disabled={selectedRowKeys.length === 0 || batchLoading}
            onClick={() => betchOperate(betchSyncRecord, [CustomerSyncType.Clue])}
          >
            {getIn18Text('TONGBUZHIXIANSUO')}
          </Button>
          {type === CustomerRecommendType.Manual
            ? (
              <>
                <Button
                  type="primary"
                  disabled={selectedRowKeys.length === 0 || batchLoading}
                  onClick={() => betchOperate(betchAssignRecord, [CustomerSyncType.OpenSea])}
                >
                  {getIn18Text('XIANSUOGONGHAI')}
                </Button>
                <Button
                  type="primary"
                  disabled={selectedRowKeys.length === 0 || batchLoading}
                  onClick={() => betchOperate(betchAssignRecord, [CustomerSyncType.OtherClue])}
                >
                  {getIn18Text('FENPEI')}
                </Button>
              </>
            )
            : ''}
        </Space>
      </div> */}

      {/* 详情抽屉 */}
      <CustomerDetail
        id={drawer.row.regularCustomerId}
        visible={drawer.visible}
        getContainer={getContainer}
        showReturnIcon={Boolean(true)}
        onChange={() => {
          checkTaskState();
        }}
        onClose={() => {
          setDrawer({ visible: false, row: {} as CustomerRow });
        }}
      />

      {/** 新建客户弹窗 */}
      {/* <CreateNewClientModal
        visible={customerModal.visible}
        onCancel={customerModal.onCancel}
        onSubmit={customerModal.onSubmit}
        extrData={customerModal.extrData}
      /> */}

      <UniDrawerWrapper
        visible={customerModal.visible}
        source={type === CustomerRecommendType.Manual ? 'mailFilterManual' : 'mailFilterAuto'}
        customerData={{ company_name: '', contact_list: [], company_domain: customerModal.domain }}
        customStatus="跟进中"
        onClose={customerModal.onClose}
        onSuccess={customerModal.onSuccess}
      />

      {/* 选择联系人弹窗 */}
      <ConcatSelectModal
        visible={contactModal.visible}
        onCancel={contactModal.onCancel}
        onConfirm={contactModal.onConfirm}
        extrData={contactModal.extrData}
        multiple={false}
      />
    </div>
  );
};
