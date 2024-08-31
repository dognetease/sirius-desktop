import React, { useContext, useEffect, useRef, useState } from 'react';
import { Button } from 'antd';
import Table from '@/components/Layout/Customer/components/UI/Table/table';
import CreateNewClientModal from '../CreateNewClientModal/createNewClientModal';
import SiriusMessage from '@web-common/components/UI/Message/SiriusMessage';
import MergeClientModal from '../MergeClientModal/mergeClientModal';
import CompareClientModal from '../MergeClientModal/compareClientModal';
import BusinessModal from '../MergeClientModal/businessModal';
import AddLabelModal from '../MergeClientModal/addLabelModal';
import { clientContext } from '../../clientContext';
import { apiHolder, apis, companyCheckExportReq as exportType, CustomerApi, RequestCompanyMyList, urlStore } from 'api';
import style from './clientTableList.module.scss';
import QuestionPopover from '../../../components/questionPopover/QuestionPopover';
import Message from '../Message/message';
import { CustomerBatchOperation, customerDataTracker, CustomerListAction } from '../../../tracker/customerDataTracker';
import { getColumns } from './column';
import CustomerDetail from '../CustomerDetail/customerDetail';
import useTableHeight from '../../../components/hooks/useTableHeight';
import usePrevNext from '../../../components/hooks/usePrevNext';
import ShowConfirm from '../../../components/confirm/makeSureConfirm';
import SelectRowAction from '../../../components/MultiSelectAction/multiSelectAction';
import { useAppSelector } from '@web-common/state/createStore';
import { getModuleAccessSelector } from '@web-common/state/reducer/privilegeReducer';
import { PrivilegeCheck } from '@/components/UI/PrivilegeEnhance';
import { hasPrivilege } from '../../../utils/privilegeValid';
import useJumpPage from '../../../components/hooks/useJumpPage';
import ShiftManager from '@/components/Layout/Customer/components/ShiftModal/shiftManager';
import ReturnReason from '@/components/Layout/Customer/components/ReturnReasonModal/returnReasonModal';
import useDownLoad from '@/components/Layout/Customer/components/hooks/useDownLoad';
import { trackForMutations } from '@reduxjs/toolkit/dist/immutableStateInvariantMiddleware';
import { getIn18Text } from 'api';
const clientApi = apiHolder.api.requireLogicalApi(apis.customerApiImpl) as CustomerApi;
const httpApi = apiHolder.api.getDataTransApi();

interface comsProps {
  isRecomend: boolean;
  setIsRecomend: () => void;
  tabNumber: number;
  heightEvent: number;
  currentTableSetting: string[];
  marketingEvent: () => void;
}
interface SelectItem {
  id: string;
  name: string;
}
const modalStatus = {
  new: 'new',
  edit: 'edit',
  examine: 'examine',
};
const defaultPageSize = 20;
const TableList: React.FC<comsProps> = ({ isRecomend, setIsRecomend, tabNumber, heightEvent, currentTableSetting, marketingEvent }) => {
  let [visible, setVisible] = useState<boolean>(false);
  let [labelVisible, setLabelVisible] = useState<boolean>(false);
  let [mergeVisible, setMergeVisible] = useState<boolean>(false);
  let [businessVisible, setBusinessVisible] = useState<boolean>(false);
  let [combineVisible, setCombineVisible] = useState<boolean>(false);
  let [combineData, setCombineData] = useState<any>({});
  const [detailVisible, setDetailVisible] = useState(false);
  const [dupField, setDupField] = useState<string>('');
  let [mergeList, setMergeList] = useState([]);
  let pageType = useRef<string>(modalStatus.new);
  const [selectedRowKeys, setSelectedRowKeys] = useState<Array<string>>([]);
  const [selectedRowItems, setSelectedRowItems] = useState<Array<SelectItem>>([]);
  const [companyIdList, setCurrentIdList] = useState<string>('');
  const { state, dispatch, fetchTableData } = useContext(clientContext).value;
  const [columnslist, setColumnslist] = useState([]);
  const [current, setCurrent] = useState(1);
  const { tableRef, y } = useTableHeight(selectedRowKeys, heightEvent, isRecomend, state?.uploadInfo);
  const { prevDisabled, nextDisabled, currentId, setCurrentId, getPrevCompanyId, getNextCompanyId } = usePrevNext(state.companyList, 'company_id');
  const hasEditPermission = useAppSelector(state => getModuleAccessSelector(state.privilegeReducer, 'CONTACT', 'OP'));
  const [contentText, setContentText] = useState(
    getIn18Text('14TIANNEI\uFF0CCUNZAIWANGLAIYOUJIAN\uFF08ZUISHAO1FENGFAJIAN+1FENGSHOUJIAN\uFF09\uFF0CKEDAORUCIBUFENKEHUSHUJUDAOXIANSUOHUOKEHU')
  );
  const [shiftVisible, setShiftVisible] = useState<boolean>(false);
  const [shiftType, setShiftType] = useState<'shift' | 'add'>('shift');
  const [reasonVisible, setReasonVisible] = useState<boolean>(false);
  const { downLoadTableExcel } = useDownLoad();
  useEffect(() => {
    dispatch({
      type: 'updateSelectedRow',
      payload: {
        selectedRows: selectedRowKeys,
      },
    });
    return () => {
      dispatch({
        type: 'updateSelectedRow',
        payload: {
          selectedRows: [],
        },
      });
    };
  }, [selectedRowKeys]);
  const commonDispatch = (params: Partial<RequestCompanyMyList>) => {
    dispatch({
      type: 'fetchTableData',
      payload: {
        requestTableParam: params,
      },
    });
  };
  const sortTableBySetting = (a, b) => {
    let sortList = [...currentTableSetting, 'operation'];
    return sortList.indexOf(a.dataIndex) - sortList.indexOf(b.dataIndex);
  };
  /**
   *  初始化查询
   * type: 1 // 0: 全部客户； 1:我的客户； 2:未完善客户
   */
  useEffect(() => {
    let list = getColumns(editClientInfo, examineCompany, deleteRepeatCompany) as any;
    if (currentTableSetting && currentTableSetting.length) {
      list = list.filter(item => {
        if (item.title === getIn18Text('CAOZUO') || currentTableSetting.includes(item.dataIndex)) {
          return true;
        }
        return false;
      });
      list.sort(sortTableBySetting);
    }
    if (!hasEditPermission || tabNumber === 3) {
      list = list.filter((i: any) => i.title !== getIn18Text('CAOZUO'));
    }
    setColumnslist(list);
    console.log('table-list', list, currentTableSetting);
  }, [currentTableSetting]);
  /**
   * 查看商机信息
   * */
  const examineBusiness = () => {
    setBusinessVisible(true);
  };
  // 合并客户
  const mergeClient = (id, list) => {
    setCurrentId(id);
    setMergeVisible(true);
    setMergeList(list);
    // 合并客户点击事件
    customerDataTracker.trackCustomerMergeClick();
  };
  /**
   * 查看详情
   */
  const examineCompany = (id: string) => {
    hasPrivilege(id, 'company', isPrivilege => {
      if (isPrivilege) {
        setCurrentId(id);
        setDetailVisible(true);
      }
    });
  };
  useJumpPage(examineCompany, 'customer');
  /**
   * 编辑用户资料
   */
  const editClientInfo = (id: string, type: string) => {
    pageType.current = type;
    setVisible(true);
    setCurrentId(id);
    customerDataTracker.trackCustomerListAction(type === modalStatus.examine ? CustomerListAction.ClickName : CustomerListAction.Edit);
  };
  /**
   * 关闭合并信息弹框
   */
  const closeMergeModal = (refId, name) => {
    if (typeof refId === 'string') {
      // companyCompare
      let param = {
        company_id: currentId,
        ref_company_id: refId,
      };
      setDupField(name);
      clientApi.companyCompare(param).then(res => {
        console.log('res-compare', res);
        setCombineData(res);
        setCombineVisible(true);
      });
    }
    setMergeVisible(false);
  };
  /**
   * 关闭合并信息弹框(目前没有重新拉取合并数据)
   */
  const closeCombineModal = (isUpdate?: boolean) => {
    if (isUpdate === true) {
      fetchTableData();
    }
    setCurrentId('');
    setCombineVisible(false);
  };
  /**
   * 关闭创建客户弹框
   */
  const closeCreateModal = (isUpdate?: boolean) => {
    setVisible(false);
    // 重新获取数据
    if (isUpdate) {
      fetchTableData();
    }
  };
  /**
   * 关闭批量添加标签
   */
  const closeLabelModal = data => {
    if (data === true) {
      clearKeys();
      fetchTableData();
    }
    setLabelVisible(false);
  };
  /**
   * checkbox 更改
   */
  const rowSelection = {
    onChange: (selectedRowKeys: any[], selectedRows: any[]) => {
      let items = selectedRows.map(item => {
        return {
          id: item.company_id,
          name: item.company_name,
        };
      });
      setSelectedRowItems([...items]);
      setSelectedRowKeys(selectedRowKeys);
    },
    preserveSelectedRowKeys: true,
    selectedRowKeys,
  };
  const onCheckAllChange = e => {
    setSelectedRowKeys(e.target.checked ? state.companyList.map(i => String(i.company_id)) : []);
  };
  const clearKeys = () => {
    setSelectedRowKeys([]);
  };
  /*
   * 删除客户信息
   */
  const handleBatchHandler = () => {
    customerDataTracker.trackCustomerBatchOperation(CustomerBatchOperation.BatchDelete, {
      selectNum: selectedRowKeys.length, // 选择的数量
    });
    ShowConfirm({ title: getIn18Text('QUERENSHANCHUKEHUMA\uFF1F'), type: 'danger', makeSure: makeSure });
  };
  const makeSure = (id?: string) => {
    const param = {
      company_id_list: id ? id : selectedRowKeys.join(','),
    };
    clientApi.deleteCompany(param).then(res => {
      SiriusMessage.success({
        content: getIn18Text('SHANCHUCHENGGONG'),
      });
      clearKeys();
      fetchTableData();
    });
  };
  const deleteRepeatCompany = (id: string) => {
    customerDataTracker.trackCustomerBatchOperation(CustomerBatchOperation.BatchDelete, {
      selectNum: 1, // 选择的数量
    });
    ShowConfirm({ title: getIn18Text('QUERENSHANCHUKEHUMA\uFF1F'), type: 'danger', makeSure: () => makeSure(id) });
  };
  const handleBatchAddLabel = (data: string[]) => {
    customerDataTracker.trackCustomerBatchOperation(CustomerBatchOperation.BatchLabel, {
      selectNum: data.length, // 选择的数量
    });
    let company_id_list = data.join(',');
    setCurrentIdList(company_id_list);
    setLabelVisible(true);
  };
  /**
   * 提示框模块
   */
  const alertClose = () => {
    setIsRecomend();
  };
  const closeMessage = () => {
    dispatch({
      type: 'setUploadState',
      payload: {
        uploadInfo: null,
      },
    });
  };
  /**
   * 打开推荐往来邮件页面
   */
  const changePage = () => {
    dispatch({
      type: 'setState',
      payload: {
        pageState: 'emialPage',
      },
    });
  };
  /**
   * 关闭客户详情页面
   */
  const closeDetailModal = (isUpdate: boolean) => {
    if (isUpdate === true) {
      fetchTableData();
    }
    setDetailVisible(false);
  };
  useEffect(() => {
    setCurrent(state.requestTableParam.page || 1);
  }, [state.requestTableParam]);
  /**
   * table事件更改排序
   * onTableEventChange
   * isDesc： true //降序， 升序
   */
  const onTableEventChange = (pagination, filters, sorter) => {
    console.log('pagination', pagination, sorter);
    const { field, order } = sorter;
    const { current, pageSize } = pagination;
    let currentField = field === 'active_time' ? 'follow_time' : field;
    let params = {
      sort: order ? currentField : '',
      is_desc: order === 'ascend' ? false : order === 'descend' ? true : '',
      page: current,
      page_size: pageSize,
    };
    commonDispatch(params);
  };
  /*
   * 手动一键营销
   */
  const marketing = () => {
    customerDataTracker.trackCustomerBatchOperation(CustomerBatchOperation.Marketing, {
      selectNum: selectedRowKeys.length, // 选择的数量
    });
    marketingEvent();
  };
  const downLoadExcel = async () => {
    let id = state?.uploadInfo?.download_id;
    const url = await clientApi.downLoadFailClient();
    httpApi
      .get(
        `${url}?download_id=${id}`,
        {},
        {
          responseType: 'blob',
        }
      )
      .then(res => {
        const blob = res.rawData;
        var a = document.createElement('a');
        a.href = URL.createObjectURL(blob); // 将流文件写入a标签的href属性值
        a.download = getIn18Text('DAORUSHIBAIDEKEHUSHUJU.xlsx');
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        a.remove();
      });
  };
  const returnOpenSea = () => {
    if (selectedRowKeys.length) {
      setReasonVisible(true);
    }
  };
  const returnReasonHandler = (params?: boolean) => {
    if (params === true) {
      fetchTableData();
      clearKeys();
    }
    setReasonVisible(false);
  };
  const exportTableData = () => {
    const params = {
      req_type: state.activeTab,
      ids: selectedRowKeys,
    } as exportType;
    clientApi.companyCheckExport(params).then(res => {
      if (res?.is_async) {
        SiriusMessage.warning({ content: res?.message, duration: 3 });
      } else {
        const reqUrl = urlStore.get('companyExport') as string;
        downLoadTableExcel(reqUrl, getIn18Text('KEHULIEBIAO'), params);
      }
    });
  };
  return (
    <>
      <div className={style.clientTableWrap}>
        <div className={style.clientTableMessage}>
          {isRecomend && (
            <Message message={getIn18Text('KETONGGUOLISHIYOUJIANWANGLAIJILU\uFF0CZIDONGBANGNINSHAIXUANTIANJIA')} type={'warning'} alertClose={alertClose}>
              <a onClick={changePage}>{getIn18Text('TIANJIAXIANYOUKEHU')}</a>
              <QuestionPopover className={style.clientQuestion} content={contentText} placement="top" />
            </Message>
          )}
          {state?.uploadInfo && (
            <Message message={state.uploadInfo?.message} type={state.uploadInfo?.status_code === 'fail' ? 'fail' : 'info'} alertClose={closeMessage}>
              {state.uploadInfo?.download_id && <a onClick={downLoadExcel}>{getIn18Text('XIAZAISHIBAIJIEGUO')}</a>}
            </Message>
          )}
        </div>
        <div ref={tableRef} className={style.clientTableBox}>
          <Table
            tableWidthKey="wm-customer-all"
            className="edm-table edm-drag-table"
            columns={columnslist}
            rowKey="company_id"
            rowSelection={
              tabNumber === 3
                ? undefined
                : {
                    type: 'checkbox',
                    ...rowSelection,
                  }
            }
            onChange={onTableEventChange}
            scroll={{ x: 1134, y }}
            dataSource={state.companyList}
            pagination={{
              showSizeChanger: true,
              showQuickJumper: true,
              defaultPageSize,
              // pageSize: defaultPageSize,
              size: 'small',
              showTotal: total => `共${total}条`,
              total: state?.RresponseCompanyList?.total_size,
              pageSizeOptions: ['20', '50', '100'],
              className: 'pagination-wrap',
              current: current,
              defaultCurrent: 1,
            }}
          />
        </div>
        <SelectRowAction
          selectedRowKeys={selectedRowKeys}
          tableLength={state.companyList.length}
          onCheckAllChange={onCheckAllChange}
          subTitle={
            <>
              {getIn18Text('YIXUAN')}
              <span style={{ color: '#386EE7' }}>{selectedRowKeys.length}</span>
              {getIn18Text('GEKEHU')}
            </>
          }
          subAllTitle={
            <>
              {getIn18Text('GOUXUANQUANBU')}
              <span style={{ color: '#386EE7' }}>{state?.RresponseCompanyList?.total_size}</span>
              {getIn18Text('GEKEHU')}
            </>
          }
        >
          <Button type="text" onClick={clearKeys}>
            {getIn18Text('QUXIAO')}
          </Button>
          <PrivilegeCheck accessLabel="EXPORT" resourceLabel="CONTACT">
            <Button style={{ marginLeft: 12 }} onClick={() => exportTableData()}>
              {getIn18Text('DAOCHU')}
            </Button>
          </PrivilegeCheck>
          <PrivilegeCheck accessLabel="OP" resourceLabel="CONTACT">
            <Button
              style={{ marginLeft: 12 }}
              onClick={() => {
                setShiftVisible(true);
                setShiftType('add');
                customerDataTracker.trackCustomerBatchOperation(CustomerBatchOperation.AddResPeople, {
                  selectNum: selectedRowKeys.length, // 选择的数量
                });
              }}
            >
              {getIn18Text('TIANJIAFUZEREN')}
            </Button>
          </PrivilegeCheck>
          <PrivilegeCheck accessLabel="OP" resourceLabel="CONTACT">
            <Button
              style={{ marginLeft: 12 }}
              onClick={() => {
                setShiftVisible(true);
                setShiftType('shift');
                customerDataTracker.trackCustomerBatchOperation(CustomerBatchOperation.Transfer, {
                  selectNum: selectedRowKeys.length, // 选择的数量
                });
              }}
            >
              {getIn18Text('ZHUANYI')}
            </Button>
          </PrivilegeCheck>
          <PrivilegeCheck accessLabel="OP" resourceLabel="CONTACT">
            <Button style={{ marginLeft: 12 }} onClick={returnOpenSea}>
              {getIn18Text('TUIHUIGONGHAI')}
            </Button>
          </PrivilegeCheck>
          <PrivilegeCheck accessLabel="OP" resourceLabel="CONTACT">
            <Button style={{ marginLeft: 12 }} onClick={marketing}>
              {getIn18Text('YIJIANYINGXIAO')}
            </Button>
          </PrivilegeCheck>
          <PrivilegeCheck accessLabel="DELETE" resourceLabel="CONTACT">
            <Button style={{ marginLeft: 12 }} danger type="primary" onClick={() => handleBatchHandler()}>
              {getIn18Text('SHANCHU')}
            </Button>
          </PrivilegeCheck>
          <PrivilegeCheck accessLabel="OP" resourceLabel="CONTACT">
            <Button type="primary" style={{ marginLeft: 12 }} onClick={() => handleBatchAddLabel(selectedRowKeys)}>
              {getIn18Text('TIANJIABIAOQIAN')}
            </Button>
          </PrivilegeCheck>
        </SelectRowAction>
        <MergeClientModal onCancel={closeMergeModal} list={mergeList} visible={mergeVisible} />

        <CompareClientModal dupField={dupField} combineData={combineData} onCancel={closeCombineModal} visible={combineVisible} />
        {visible && <CreateNewClientModal visible={visible} onCancel={closeCreateModal} pageType={pageType.current as 'edit' | 'new'} companyId={currentId} />}
        {labelVisible && <AddLabelModal visible={labelVisible} companyIdList={companyIdList} onCancel={closeLabelModal} />}
        {businessVisible && <BusinessModal onCancel={closeMergeModal} list={mergeList} visible={businessVisible} />}
        {shiftVisible && (
          <ShiftManager
            visible={shiftVisible}
            data={selectedRowItems}
            shiftType={shiftType}
            onCancel={param => {
              setShiftVisible(false);
              if (param === true) {
                clearKeys();
                fetchTableData();
              }
            }}
          />
        )}
        {reasonVisible && <ReturnReason visible={reasonVisible} ids={selectedRowKeys} isCustomer={true} onCancel={returnReasonHandler} />}
        <CustomerDetail
          visible={detailVisible}
          companyId={currentId}
          onPrev={getPrevCompanyId}
          onNext={getNextCompanyId}
          onClose={closeDetailModal}
          prevDisabled={prevDisabled}
          nextDisabled={nextDisabled}
        />
      </div>
    </>
  );
};
export default TableList;
