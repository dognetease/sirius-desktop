import React, { useContext, useEffect, useState } from 'react';
import { Button } from 'antd';
import Table from '@/components/Layout/Customer/components/UI/Table/table';
import SiriusMessage from '@web-common/components/UI/Message/SiriusMessage';
import { clientContext } from '../../clientContext';
import { apiHolder, apis, CustomerApi, RequestCompanyMyList } from 'api';
import style from './clientTableList.module.scss';
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
import DistributeClueStatusModal from '@/components/Layout/Customer/components/DistributeClueModal/distributeClueStatus';
import { getIn18Text } from 'api';

const clientApi = apiHolder.api.requireLogicalApi(apis.customerApiImpl) as CustomerApi;

interface comsProps {
  heightEvent: number;
  currentTableSetting: string[];
}
const defaultPageSize = 20;
const RESOURCE_LABEL = 'CONTACT_OPEN_SEA';
const TableList: React.FC<comsProps> = ({ heightEvent, currentTableSetting }) => {
  let [loading, setLoading] = useState<boolean>(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<Array<string>>([]);
  const { state, dispatch, fetchTableData } = useContext(clientContext).value;
  const [columnslist, setColumnslist] = useState([]);
  const [current, setCurrent] = useState(1);
  const { tableRef, y } = useTableHeight(selectedRowKeys, heightEvent, state?.uploadInfo);
  const { prevDisabled, nextDisabled, currentId, setCurrentId, getPrevCompanyId, getNextCompanyId } = usePrevNext(state.companyList, 'id');
  const hasEditPermission = useAppSelector(state => getModuleAccessSelector(state.privilegeReducer, 'CONTACT', 'OP'));
  const [statusVisible, setStatusVisible] = useState(false);
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
  useEffect(() => {
    let list = getColumns(() => {}, examineCompany, deleteRepeatCompany) as any;
    if (currentTableSetting && currentTableSetting.length) {
      list = list.filter(item => {
        if (item.title === getIn18Text('CAOZUO') || currentTableSetting.includes(item.dataIndex)) {
          return true;
        }
        return false;
      });
      list.sort(sortTableBySetting);
    }
    if (!hasEditPermission) {
      list = list.filter((i: any) => i.title !== getIn18Text('CAOZUO'));
    }
    setColumnslist(list);
  }, [currentTableSetting]);
  /**
   * 查看详情
   */
  const examineCompany = (id: string) => {
    hasPrivilege(id, 'customer_open_sea', isPrivilege => {
      if (isPrivilege) {
        setCurrentId(id);
        setDetailVisible(true);
      }
    });
  };
  useJumpPage(examineCompany, 'customerOpenSea');
  /**
   * checkbox 更改
   */
  const rowSelection = {
    onChange: (selectedRowKeys, selectedRows: any[]) => {
      setSelectedRowKeys(selectedRowKeys);
    },
    selectedRowKeys,
  };
  const onCheckAllChange = e => {
    setSelectedRowKeys(e.target.checked ? state.companyList.map(i => String(i.id)) : []);
  };
  useEffect(() => {
    clearKeys();
  }, [state.companyList]);
  const clearKeys = () => {
    setSelectedRowKeys([]);
  };
  /*
   * 删除客户信息
   */
  const handleBatchHandler = () => {
    // customerDataTracker.trackCustomerBatchOperation(CustomerBatchOperation.BatchDelete, {
    //   selectNum: selectedRowKeys.length,
    // })
    ShowConfirm({ title: getIn18Text('QUERENSHANCHUKEHUMA\uFF1F'), type: 'danger', makeSure: makeSure });
  };
  const makeSure = (id?: string) => {
    clientApi.openSeaCustomerDelete(selectedRowKeys).then(res => {
      SiriusMessage.success({
        content: getIn18Text('SHANCHUCHENGGONG'),
      });
      clearKeys();
      fetchTableData();
    });
  };
  const deleteRepeatCompany = (id: string) => {
    // customerDataTracker.trackCustomerBatchOperation(CustomerBatchOperation.BatchDelete, {
    //   selectNum: 1, // 选择的数量
    // })
    ShowConfirm({ title: getIn18Text('QUERENSHANCHUKEHUMA\uFF1F'), type: 'danger', makeSure: () => makeSure(id) });
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
    clearKeys();
  };
  const closeAllocateModal = (param?: boolean) => {
    setStatusVisible(false);
    clearKeys();
    if (param == true) {
      fetchTableData();
    }
  };
  const receiveClues = () => {
    ShowConfirm({ title: getIn18Text('QUERENLINGQUZHEXIEKEHUMA\uFF1F'), makeSure: makeSureReceive });
  };
  const makeSureReceive = () => {
    if (setSelectedRowKeys.length) {
      clientApi.openSeaCustomerReceive(selectedRowKeys).then(res => {
        SiriusMessage.info({
          content: getIn18Text('LINGQUCHENGGONG'),
        });
        clearKeys();
        fetchTableData();
      });
    }
  };
  return (
    <>
      <div className={style.clientTableWrap}>
        <div ref={tableRef} className={style.clientTableBox}>
          <Table
            tableWidthKey="wm-customer-customer-opensea"
            className="edm-table edm-drag-table"
            columns={columnslist}
            loading={loading}
            rowKey="id"
            rowSelection={{
              type: 'checkbox',
              ...rowSelection,
            }}
            onChange={onTableEventChange}
            scroll={{ x: 1134, y }}
            dataSource={state.companyList}
            pagination={{
              showSizeChanger: true,
              showQuickJumper: true,
              defaultPageSize,
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
          <PrivilegeCheck accessLabel="ALLOT" resourceLabel={RESOURCE_LABEL}>
            <Button style={{ marginLeft: 12 }} onClick={() => setStatusVisible(true)}>
              {getIn18Text('FENPEI')}
            </Button>
          </PrivilegeCheck>
          <PrivilegeCheck accessLabel="CLAIM" resourceLabel={RESOURCE_LABEL}>
            <Button style={{ marginLeft: 12 }} onClick={receiveClues}>
              {getIn18Text('LINGQU')}
            </Button>
          </PrivilegeCheck>
          <PrivilegeCheck accessLabel="DELETE" resourceLabel={RESOURCE_LABEL}>
            <Button style={{ marginLeft: 12 }} danger type="primary" onClick={() => handleBatchHandler()}>
              {getIn18Text('SHANCHU')}
            </Button>
          </PrivilegeCheck>
        </SelectRowAction>

        <CustomerDetail
          visible={detailVisible}
          companyId={currentId}
          onPrev={getPrevCompanyId}
          onNext={getNextCompanyId}
          onClose={closeDetailModal}
          prevDisabled={prevDisabled}
          nextDisabled={nextDisabled}
        />
        {statusVisible && <DistributeClueStatusModal visible={statusVisible} onCancel={closeAllocateModal} ids={selectedRowKeys} isCustomer={true} />}
      </div>
    </>
  );
};
export default TableList;
