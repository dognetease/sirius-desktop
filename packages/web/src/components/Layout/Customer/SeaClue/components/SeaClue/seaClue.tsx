import React, { useState, useRef, useEffect } from 'react';
import { Skeleton, Button } from 'antd';
import Table from '@/components/Layout/Customer/components/UI/Table/table';
import Search from '../Search/search';
import style from './seaClue.module.scss';
import { EmptyList } from '@web-edm/components/empty/empty';
import { getColumns } from './column';
import useTableDataLoader from '../../../components/hooks/useTableDataLoader';
import useTableHeight from '../../../components/hooks/useTableHeight';
import SelectRowAction from '../../../components/MultiSelectAction/multiSelectAction';
import DistributeClueStatusModal from '@/components/Layout/Customer/components/DistributeClueModal/distributeClueStatus';
import SiriusMessage from '@web-common/components/UI/Message/SiriusMessage';
import SeaClueDetail from '../SeaClueDetail/seaClueDetail';
import usePrevNext from '../../../components/hooks/usePrevNext';
import ShowConfirm from '../../../components/confirm/makeSureConfirm';
import { apiHolder, apis, CustomerApi, newMyClueListReq } from 'api';
const clientApi = apiHolder.api.requireLogicalApi(apis.customerApiImpl) as CustomerApi;
import { openSeaDataTracker, BatchOperationType } from '../../../tracker/openSeaDataTracker';
import useJumpPage from '../../../components/hooks/useJumpPage';
import { hasPrivilege } from '../../../utils/privilegeValid';
import { PrivilegeCheck } from '@/components/UI/PrivilegeEnhance';
import { getIn18Text } from 'api';
const RESOURCE_LABEL = 'CHANNEL_OPEN_SEA';
interface ComsProps {
  message?: string;
  closeMessage?: () => void;
  marketEvent?: number;
  tableEvent?: number;
}
const defaultPageSize = 20;
const MyClue: React.FC<ComsProps> = ({ message }) => {
  const [columnslist, setColumnslist] = useState([]);
  // api, path, pagination
  const [selectedRowKeys, setSelectedRowKeys] = useState<Array<string>>([]);
  const [statusVisible, setStatusVisible] = useState(false);
  const [searchExpand, setSearchExpand] = useState(false);
  const [searchParam, setSearchParam] = useState<Partial<newMyClueListReq>>({
    page: 1,
    page_size: 20,
  });
  const cacheSearchParam = useRef({
    page: 1,
    page_size: defaultPageSize,
  });
  const { loading, isSHowSkeleton, hasClue, tableList, total, requestTableData, current } = useTableDataLoader(clientApi, 'openSeaList', searchParam);
  const { tableRef, y } = useTableHeight(selectedRowKeys, hasClue, message, searchExpand);
  const [detailVisible, setDetailVisible] = useState<boolean>(false);
  const { prevDisabled, nextDisabled, currentId, setCurrentId, getPrevCompanyId, getNextCompanyId } = usePrevNext(tableList, 'id');
  useEffect(() => {
    let list = getColumns(examineClue) as any;
    setColumnslist(list);
    requestTableData();
  }, []);
  const examineClue = (id: string) => {
    hasPrivilege(id, 'open_sea', isPrivilege => {
      if (isPrivilege) {
        setCurrentId(id);
        setDetailVisible(true);
      }
    });
  };
  // 消息跳转详情
  useJumpPage(examineClue, 'seaClue');
  /*
   *  table 搜索条件请求数据
   */
  const handerSearch = (params: Partial<newMyClueListReq>) => {
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
  const onCheckAllChange = e => {
    setSelectedRowKeys(e.target.checked ? tableList.map(i => String(i.id)) : []);
  };
  const clearKeys = () => {
    setSelectedRowKeys([]);
  };
  /*
   * 分配公海线索
   */
  const allocateHandler = () => {
    openSeaDataTracker.trackTableBatchOperation(BatchOperationType.Assign, selectedRowKeys.length);
    setStatusVisible(true);
  };
  /*
   *  关闭分配线索弹框
   */
  const closeAllocateModal = (param?: boolean) => {
    console.log('paramxxx', param);
    setStatusVisible(false);
    clearKeys();
    // 请求数据
    if (param == true) {
      requestTableData();
    }
  };
  const makeSureDelete = () => {
    console.log('makeSure');
    clientApi.openSeaDelete(selectedRowKeys).then(res => {
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
   * 删除线索
   */
  const deleteClues = () => {
    openSeaDataTracker.trackTableBatchOperation(BatchOperationType.Delete, selectedRowKeys.length);
    ShowConfirm({ title: getIn18Text('QUERENSHANCHUXIANSUOMA\uFF1F'), type: 'danger', makeSure: makeSureDelete });
  };
  /*
   * 领取线索
   */
  const receiveClues = () => {
    openSeaDataTracker.trackTableBatchOperation(BatchOperationType.Claim, selectedRowKeys.length);
    ShowConfirm({ title: getIn18Text('QUERENLINGQUZHEXIEXIANSUOMA\uFF1F'), makeSure: makeSureReceive });
  };
  const makeSureReceive = () => {
    if (setSelectedRowKeys.length) {
      clientApi.openSeaReceive(selectedRowKeys).then(res => {
        if (res) {
          SiriusMessage.info({
            content: getIn18Text('LINGQUCHENGGONG'),
          });
          clearKeys();
          requestTableData();
        }
      });
    }
  };
  /**
   * 关闭客户详情页面
   */
  const closeDetailModal = (isUpdate: boolean) => {
    if (isUpdate === true) {
      requestTableData();
    }
    setDetailVisible(false);
  };
  return (
    <div className={style.myClueWrap}>
      <Search className={style.tabsTop} onCollapse={setSearchExpand} handerSearch={handerSearch} />
      <Skeleton active loading={isSHowSkeleton} paragraph={{ rows: 4 }}>
        {!hasClue && (
          <EmptyList bodyClassName={style.emptyListBody} style={{ height: y }}>
            <div>{getIn18Text('ZANWUXIANSUO')}</div>
          </EmptyList>
        )}
        {hasClue && (
          <div ref={tableRef} className={style.tableWrap}>
            <Table
              tableWidthKey="wm-customer-seaclue"
              className="edm-table edm-drag-table"
              columns={columnslist}
              loading={loading}
              rowKey="id"
              rowSelection={{
                selectedRowKeys,
                preserveSelectedRowKeys: true,
                onChange(keys) {
                  setSelectedRowKeys(keys as string[]);
                },
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
            {getIn18Text('GEXIANSUO')}
          </>
        }
      >
        <Button style={{ marginLeft: 12 }} onClick={clearKeys}>
          {getIn18Text('QUXIAO')}
        </Button>
        <PrivilegeCheck accessLabel="CLAIM" resourceLabel={RESOURCE_LABEL}>
          <Button style={{ marginLeft: 12 }} onClick={receiveClues}>
            {getIn18Text('LINGQU')}
          </Button>
        </PrivilegeCheck>
        <PrivilegeCheck accessLabel="ALLOT" resourceLabel={RESOURCE_LABEL}>
          <Button style={{ marginLeft: 12 }} onClick={allocateHandler}>
            {getIn18Text('FENPEI')}
          </Button>
        </PrivilegeCheck>
        <PrivilegeCheck accessLabel="DELETE" resourceLabel={RESOURCE_LABEL}>
          <Button danger type="primary" style={{ marginLeft: 12 }} onClick={deleteClues}>
            {getIn18Text('SHANCHU')}
          </Button>
        </PrivilegeCheck>
      </SelectRowAction>
      {statusVisible && <DistributeClueStatusModal visible={statusVisible} onCancel={closeAllocateModal} ids={selectedRowKeys} />}
      <SeaClueDetail
        visible={detailVisible}
        openSeaId={currentId}
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
