import React, { useState, useRef, useEffect, useContext } from 'react';
import { Skeleton, Button } from 'antd';
import Table from '@/components/Layout/Customer/components/UI/Table/table';
import Search from '../Search/search';
import style from './allBusiness.module.scss';
import { EmptyList } from '@web-edm/components/empty/empty';
import Message from '../../../NewClient/components/Message/message';
import { getColumns } from '../MyBusiness/column';
import useTableDataLoader from '../../../components/hooks/useTableDataLoader';
import useTableHeight from '../../../components/hooks/useTableHeight';
import SelectRowAction from '../../../components/MultiSelectAction/multiSelectAction';
import ClientBusinessModal from '../CreateNewBusinessModal/createNewBussinessModal';
import ChangeClueStatusModal from '../ChangeClueStatusModal/changeClueStatus';
import SiriusMessage from '@web-common/components/UI/Message/SiriusMessage';
import OpportunityDetail from '../../components/OpportunityDetail/opportunityDetail';
import usePrevNext from '../../../components/hooks/usePrevNext';
import { apiHolder, apis, CustomerApi, opportunityCheckExportReq as exportType, opportunityListReq, urlStore } from 'api';
import ShowConfirm from '../../../components/confirm/makeSureConfirm';
import { BatchOperationType, businessDataTracker } from '../../../tracker/businessDataTracker';
import { PrivilegeCheck } from '@/components/UI/PrivilegeEnhance';
import { useAppSelector } from '@web-common/state/createStore';
import { getModuleAccessSelector } from '@web-common/state/reducer/privilegeReducer';
import { hasPrivilege } from '../../../utils/privilegeValid';
import useDispatch from '../../useDispatch';
import { businessContext } from '../../businessContext';
import useDownLoad from '@/components/Layout/Customer/components/hooks/useDownLoad';
import { getIn18Text } from 'api';

const clientApi = apiHolder.api.requireLogicalApi(apis.customerApiImpl) as CustomerApi;

interface ComsProps {
  message: string;
  closeMessage: () => void;
  tableEvent: number;
  marketingEvent: () => void;
}
const defaultPageSize = 20;
const MyClue: React.FC<ComsProps> = ({ message, closeMessage, marketingEvent, tableEvent }) => {
  const { state, dispatch } = useContext(businessContext);
  const [columnslist, setColumnslist] = useState([]);
  // api, path, pagination
  const [selectedRowKeys, setSelectedRowKeys] = useState<Array<number>>([]);
  const [visible, setVisable] = useState(false);
  const [statusVisible, setStatusVisible] = useState(false);
  const [searchParam, setSearchParam] = useState<Partial<opportunityListReq>>({
    page: 1,
    page_size: 20,
  });
  const cacheSearchParam = useRef({
    page: 1,
    page_size: defaultPageSize,
  });
  const { loading, isSHowSkeleton, hasClue, tableList, total, requestTableData, current } = useTableDataLoader(clientApi, 'opportunityListAll', searchParam);
  const { tableRef, y } = useTableHeight(selectedRowKeys, hasClue, message);
  const [detailVisible, setDetailVisible] = useState<boolean>(false);
  const { prevDisabled, nextDisabled, currentId, setCurrentId, getPrevCompanyId, getNextCompanyId } = usePrevNext(tableList, 'id');
  const hasEditPermission = useAppSelector(state => getModuleAccessSelector(state.privilegeReducer, 'COMMERCIAL', 'OP'));
  const { downLoadTableExcel } = useDownLoad();
  /*
   * 一键营销 hooks
   */
  useDispatch(dispatch, selectedRowKeys, searchParam, total);
  useEffect(() => {
    let list = getColumns(editBusiness, examineBusiness) as any;
    if (!hasEditPermission) {
      list = list.filter((i: any) => i.title !== getIn18Text('CAOZUO'));
    }
    setColumnslist(list);
  }, []);
  // useEffect(() => {
  //     clearKeys();
  // }, [searchParam])
  const editBusiness = id => {
    console.log(id);
    setCurrentId(id);
    setVisable(true);
  };
  const examineBusiness = (id: string) => {
    hasPrivilege(id, 'opportunity', isPrivilege => {
      if (isPrivilege) {
        setCurrentId(id);
        setDetailVisible(true);
      }
    });
  };
  /*
   * 关闭编辑弹框
   */
  const closeBusinessModal = (param?: boolean) => {
    setVisable(false);
    if (param === true) {
      requestTableData();
    }
  };
  /*
   *  关闭修改商机弹框
   */
  const closeStatusModal = param => {
    setStatusVisible(false);
    clearKeys();
    // 请求数据
    if (param === true) {
      requestTableData();
    }
  };
  /*
   *  table 搜索条件请求数据
   */
  const handerSearch = (params: Partial<opportunityListReq>) => {
    cacheSearchParam.current = {
      ...cacheSearchParam.current,
      ...params,
      page: 1,
    };
    setSearchParam(cacheSearchParam.current);
  };
  /*
   *  table 排序
   */
  const onTableEventChange = (pagination, filters, sorter) => {
    const { current, pageSize } = pagination;
    const { field, order } = sorter;
    let params = {};
    if (order) {
      params = {
        order_by: field,
        asc_flag: order === 'ascend' ? true : order === 'descend' ? false : '',
      };
    } else {
      params = {
        order_by: '',
        asc_flag: '',
      };
    }
    cacheSearchParam.current.page = current;
    cacheSearchParam.current.page_size = pageSize;
    cacheSearchParam.current = {
      ...cacheSearchParam.current,
      ...params,
    };
    setSearchParam({
      ...cacheSearchParam.current,
    });
  };
  /*
   *  除以每页的数量
   */
  const showTotal = (total: number) => {
    return (
      <span style={{ color: '#7d8085' }}>
        {getIn18Text('GONG')}
        {Math.ceil(total)}
        {getIn18Text('TIAO')}
      </span>
    );
  };
  /**
   * checkbox 更改
   */
  const rowSelection = {
    onChange: selectedRowKeys => {
      setSelectedRowKeys(selectedRowKeys);
    },
    preserveSelectedRowKeys: true,
    selectedRowKeys,
  };
  const onCheckAllChange = e => {
    setSelectedRowKeys(e.target.checked ? tableList.map(i => i.id) : []);
  };
  const clearKeys = () => {
    setSelectedRowKeys([]);
  };
  /*
   * 一键营销
   */
  const marketing = () => {
    businessDataTracker.trackTableBatchOperation(BatchOperationType.Marketing, selectedRowKeys.length);
    marketingEvent();
  };
  /*
   * 删除商机
   */
  const makeSure = () => {
    let params = {
      ids: selectedRowKeys,
    };
    clientApi.batchDeleteOpportunity(params).then(res => {
      if (res) {
        SiriusMessage.success({
          content: getIn18Text('SHANCHUCHENGGONG'),
        });
      }
      clearKeys();
      requestTableData();
    });
  };
  /*
   * 删除商机
   */
  const deleteBusiness = () => {
    businessDataTracker.trackTableBatchOperation(BatchOperationType.Delete, selectedRowKeys.length);
    ShowConfirm({
      title: getIn18Text('YAOSHANCHUSHANGJIMA\uFF1F'),
      type: 'danger',
      okText: getIn18Text('SHANCHU'),
      cancelText: getIn18Text('QUXIAO'),
      makeSure,
    });
  };
  /**
   * 关闭客户详情页面
   */
  const closeDetailModal = isUpdate => {
    if (isUpdate === true) {
      requestTableData();
    }
    setDetailVisible(false);
  };
  const exportTableData = () => {
    let params = {
      req_type: state.activeTab,
      ids: selectedRowKeys,
    } as exportType;
    clientApi.businessCheckExport(params).then(res => {
      if (res?.is_async) {
        SiriusMessage.warning({ content: res?.message, duration: 3 });
      } else {
        let reqUrl = urlStore.get('businessExport') as string;
        downLoadTableExcel(reqUrl, getIn18Text('SHANGJILIEBIAO'), params);
      }
    });
  };
  return (
    <div className={style.myClueWrap}>
      <Search className={style.tabsTop} handerSearch={handerSearch} />
      <Skeleton active loading={isSHowSkeleton} paragraph={{ rows: 4 }}>
        {!hasClue && (
          <EmptyList bodyClassName={style.emptyListBody} style={{ height: y }}>
            <div>{getIn18Text('ZANWUSHANGJI')}</div>
          </EmptyList>
        )}
        {hasClue && message && <Message className={style.tabsTop} message={message} type="info" alertClose={closeMessage}></Message>}
        {hasClue && (
          <div ref={tableRef} className={style.tableWrap}>
            <Table
              tableWidthKey="wm-customer-allbusiness"
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
              dataSource={tableList}
              pagination={{
                showTotal,
                size: 'small',
                total: total,
                pageSizeOptions: ['20', '50', '100'],
                defaultPageSize,
                className: 'pagination-wrap',
                showSizeChanger: true,
                showQuickJumper: true,
                current: current,
                defaultCurrent: 1,
              }}
            />
          </div>
        )}
      </Skeleton>
      <SelectRowAction
        selectedRowKeys={selectedRowKeys}
        tableLength={tableList.length}
        onCheckAllChange={onCheckAllChange}
        subTitle={
          <>
            {getIn18Text('YIXUAN')}
            <span style={{ color: '#386EE7' }}>{selectedRowKeys.length}</span>
            {getIn18Text('GESHANGJI')}
          </>
        }
      >
        <Button style={{ marginLeft: 12 }} onClick={clearKeys}>
          {getIn18Text('QUXIAO')}
        </Button>
        <PrivilegeCheck accessLabel="EXPORT" resourceLabel="COMMERCIAL">
          <Button style={{ marginLeft: 12 }} onClick={() => exportTableData()}>
            {getIn18Text('DAOCHU')}
          </Button>
        </PrivilegeCheck>
        <PrivilegeCheck accessLabel="OP" resourceLabel="COMMERCIAL">
          <Button style={{ marginLeft: 12 }} onClick={marketing}>
            {getIn18Text('YIJIANYINGXIAO')}
          </Button>
        </PrivilegeCheck>
        <PrivilegeCheck accessLabel="DELETE" resourceLabel="COMMERCIAL">
          <Button danger type="primary" style={{ marginLeft: 12 }} onClick={deleteBusiness}>
            {getIn18Text('SHANCHU')}
          </Button>
        </PrivilegeCheck>
      </SelectRowAction>
      {visible && <ClientBusinessModal width={768} visible={visible} pageType="edit" id={currentId} onCancel={closeBusinessModal} />}
      {statusVisible && <ChangeClueStatusModal visible={statusVisible} onCancel={closeStatusModal} ids={selectedRowKeys} />}
      <OpportunityDetail
        visible={detailVisible}
        opportunityId={currentId}
        onPrev={getPrevCompanyId}
        onNext={getNextCompanyId}
        onClose={closeDetailModal}
        prevDisabled={prevDisabled}
        nextDisabled={nextDisabled}
      />
    </div>
  );
};
export default MyClue;
