import React, { useState, useRef, useEffect, useContext } from 'react';
import { Skeleton, Button, Dropdown, Menu, MenuProps } from 'antd';
import qs from 'querystring';
import Table from '@/components/Layout/Customer/components/UI/Table/table';
import Search from '../Search/search';
import style from './MyClue.module.scss';
import { EmptyList } from '@web-edm/components/empty/empty';
import Message from '../../../NewClient/components/Message/message';
import { getColumns } from './column';
import useTableDataLoader from '../../../components/hooks/useTableDataLoader';
import useTableHeight from '../../../components/hooks/useTableHeight';
import SelectRowAction from '../../../components/MultiSelectAction/multiSelectAction';
import NewClueModal from '../CreateNewClueModal/createNewClueModal';
// import ChangeClueStatusModal from '../ChangeClueStatusModal/changeClueStatus';
import ChangeClueStatusModal from '../ChangeStatusModal/changeStatusModal';
import SiriusMessage from '@web-common/components/UI/Message/SiriusMessage';
import ClueDetail from '../../components/ClueDetail/clueDetail';
import usePrevNext from '../../../components/hooks/usePrevNext';
import ShowConfirm from '../../../components/confirm/makeSureConfirm';
import { apiHolder, apis, CustomerApi, EdmSendBoxApi, newMyClueListReq, ResUploadCientFile as uploadType, newMyClueListReq as reqType, urlStore } from 'api';
const clientApi = apiHolder.api.requireLogicalApi(apis.customerApiImpl) as CustomerApi;
import { clueDataTracker, BatchOperationType } from '../../../tracker/clueDataTracker';
import { getModuleAccessSelector } from '@web-common/state/reducer/privilegeReducer';
import { useAppSelector } from '@web-common/state/createStore';
import { PrivilegeCheck } from '@/components/UI/PrivilegeEnhance';
import QuestionPopover from '../../../components/questionPopover/QuestionPopover';
import ReturnReason from '@/components/Layout/Customer/components/ReturnReasonModal/returnReasonModal';
import useJumpPage from '../../../components/hooks/useJumpPage';
import { hasPrivilege } from '../../../utils/privilegeValid';
import ShiftManager from '@/components/Layout/Customer/components/ShiftModal/shiftManager';
const httpApi = apiHolder.api.getDataTransApi();
import { clueContext } from '../../clueContext';
import useDispatch from '../../useDispatch';
import useDownLoad from '@/components/Layout/Customer/components/hooks/useDownLoad';
import { ReactComponent as CaretDownOutlined } from '@/images/icons/edm/caretDownOutlined.svg';
import { getIn18Text } from 'api';
interface ComsProps {
  message: string;
  closeMessage: () => void;
  tableEvent: number;
  isRecomend: boolean;
  setIsRecomend: () => void;
  changePage: () => void;
  uploadInfo: uploadType;
  onChangeInfo: (params: uploadType) => void;
  marketingEvent: () => void;
}
interface SelectItem {
  id: string;
  name: string;
}
const defaultPageSize = 20;
const customerStatus = '4';
const menuKey = {
  clue_status: 'clue_status',
  clue_source: 'clue_source',
  clue_batch: 'clue_batch',
};
const MyClue: React.FC<ComsProps> = ({ message, closeMessage, tableEvent, isRecomend, setIsRecomend, changePage, uploadInfo, onChangeInfo, marketingEvent }) => {
  const [columnslist, setColumnslist] = useState([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState<Array<string>>([]);
  const [selectedRowItems, setSelectedRowItems] = useState<Array<SelectItem>>([]);
  const [visible, setVisable] = useState(false);
  const [statusVisible, setStatusVisible] = useState(false);
  const hasEditPermission = useAppSelector(state => getModuleAccessSelector(state.privilegeReducer, 'CHANNEL', 'OP'));
  const hasForceDelete = useAppSelector(state => getModuleAccessSelector(state.privilegeReducer, 'CHANNEL', 'FORCE_DELETE'));
  const [searchParam, setSearchParam] = useState<Partial<newMyClueListReq>>({
    page: 1,
    page_size: 20,
  });
  const cacheSearchParam = useRef({
    page: 1,
    page_size: defaultPageSize,
  });
  const { loading, isSHowSkeleton, hasClue, tableList, total, requestTableData, current } = useTableDataLoader(clientApi, 'myClueList', searchParam);
  const [searchExpand, setSearchExpand] = useState(false);
  const { tableRef, y } = useTableHeight(selectedRowKeys, hasClue, message, searchExpand, uploadInfo?.message);
  const [detailVisible, setDetailVisible] = useState<boolean>(false);
  const { prevDisabled, nextDisabled, currentId, setCurrentId, getPrevCompanyId, getNextCompanyId } = usePrevNext(tableList, 'id');
  const [contentText, setContentText] = useState(
    getIn18Text('14TIANNEI\uFF0CCUNZAIWANGLAIYOUJIAN\uFF08ZUISHAO1FENGFAJIAN+1FENGSHOUJIAN\uFF09\uFF0CKEDAORUCIBUFENKEHUSHUJUDAOXIANSUOHUOKEHU')
  );
  const [reasonVisible, setReasonVisible] = useState<boolean>(false);
  const [shiftVisible, setShiftVisible] = useState<boolean>(false);
  const { state, dispatch } = useContext(clueContext);
  const { downLoadTableExcel } = useDownLoad();
  const [batchType, setBatchType] = useState<'clue_status' | 'clue_source' | 'clue_batch'>('clue_status');
  useDispatch(dispatch, selectedRowKeys, searchParam, total);

  useEffect(() => {
    const moduleName = location.hash.substring(1).split('?')[0];
    const params = qs.parse(location.hash.split('?')[1]);
    if (moduleName !== 'customer') {
      return;
    }
    if (params?.page === 'clue' && params?.clueId) {
      let list = params.clueId.split(',');
      list.length && handerSearch({ clue_id_list: list });
    }
  }, [location.hash]);

  useEffect(() => {
    let list = getColumns(editClue, examineClue, requestTableData, deleteRepeatClue) as any;
    if (!hasEditPermission) {
      list = list.filter((i: any) => i.title !== getIn18Text('CAOZUO'));
    }
    setColumnslist(list);
  }, [hasEditPermission]);
  useEffect(() => {
    if (tableEvent !== 0) {
      requestTableData();
    }
  }, [tableEvent]);
  useEffect(() => {
    if (uploadInfo?.message) {
      requestTableData();
    }
  }, [uploadInfo?.message]);
  // useEffect(() => {
  //     clearKeys();
  // }, [searchParam])
  const editClue = id => {
    setCurrentId(id);
    setVisable(true);
  };
  const examineClue = (id: string) => {
    hasPrivilege(id, 'clue', isPrivilege => {
      if (isPrivilege) {
        setCurrentId(id);
        setDetailVisible(true);
      }
    });
  };
  useJumpPage(examineClue, 'clue');
  /*
   * 关闭编辑弹框
   */
  const closeClueModal = (param?: boolean) => {
    if (param === true) {
      requestTableData();
    }
    setVisable(false);
  };
  /*
   *  table 搜索条件请求数据
   */
  const handerSearch = (params: Partial<newMyClueListReq>) => {
    console.log('xxxxxxxx-搜素', params);
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
    onChange: (selectedRowKeys, selectedRows: any[]) => {
      console.log('selectedRowKeys', selectedRowKeys);
      let items = selectedRows.map(item => {
        return {
          id: item.id,
          name: item.name,
        };
      });
      setSelectedRowItems([...items]);
      setSelectedRowKeys(selectedRowKeys);
    },
    preserveSelectedRowKeys: true,
    selectedRowKeys,
  };
  const onCheckAllChange = e => {
    setSelectedRowKeys(e.target.checked ? tableList.map(i => String(i.id)) : []);
  };
  const clearKeys = () => {
    setSelectedRowKeys([]);
  };
  /*
   * 手动一键营销
   */
  const marketing = () => {
    marketingEvent(); // 一键营销事件
    clueDataTracker.trackTableBatchOperation(BatchOperationType.Marketing, selectedRowKeys.length);
  };
  /*
   * 修改线索状态
   */
  const changeClueStatus = () => {
    clueDataTracker.trackTableBatchOperation(BatchOperationType.Status, selectedRowKeys.length);
    setStatusVisible(true);
  };
  /*
   *  关闭修改线索弹框
   */
  const closeStatusModal = param => {
    setStatusVisible(false);
    // 请求数据
    if (param == true) {
      requestTableData();
      clearKeys();
    }
  };
  const makeSure = (id?: string) => {
    let ids = id ? [id] : selectedRowKeys;
    clientApi.clueDelete(ids).then(res => {
      if (res) {
        SiriusMessage.success({
          content: getIn18Text('SHANCHUCHENGGONG'),
        });
      }
      clearKeys();
      requestTableData();
    });
  };
  const forceMakeSure = () => {
    clientApi.clueForceDelete(selectedRowKeys).then(res => {
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
  const deleteClues = async () => {
    clueDataTracker.trackTableBatchOperation(BatchOperationType.Delete, selectedRowKeys.length);
    // let isHasCustomer = tableList.filter(el => selectedRowKeys.includes(el.id)).some(item => item.status === customerStatus);
    const res = await clientApi.existTransferCustomer(selectedRowKeys);
    // 有强制删除
    if (hasForceDelete && res.result) {
      let title = getIn18Text('CUNZAIZHUANKEHUXIANSUO\uFF0CKEQIANGZHISHANCHU\uFF0CSHIFOUQIANGZHISHANCHU\uFF1F');
      ShowConfirm({ title, okText: getIn18Text('SHI'), cancelText: getIn18Text('FOU'), type: 'danger', makeSure: forceMakeSure });
    } else {
      ShowConfirm({ title: getIn18Text('QUERENSHANCHUXIANSUOMA\uFF1F'), type: 'danger', makeSure: makeSure });
    }
  };
  const deleteRepeatClue = (id: string) => {
    ShowConfirm({ title: getIn18Text('QUERENSHANCHUXIANSUOMA\uFF1F'), type: 'danger', makeSure: () => makeSure(id) });
  };
  /**
   * 关闭客户详情页面
   */
  const closeDetailModal = (isUpdate: boolean) => {
    if (isUpdate === true) {
      clearKeys();
      requestTableData();
    }
    setDetailVisible(false);
  };
  const returnOpenSea = () => {
    setReasonVisible(true);
  };
  const returnReasonHandler = (params?: boolean) => {
    if (params === true) {
      clearKeys();
      requestTableData();
    }
    setReasonVisible(false);
  };
  const downLoadExcel = async () => {
    let id = uploadInfo.download_id;
    const url = await clientApi.downLoadFailClue();
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
        a.download = getIn18Text('DAORUSHIBAIDEXIANSUOSHUJU.xlsx');
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        a.remove();
      });
  };
  const exportTableData = () => {
    let params = {
      req_type: state.activeTab,
      ids: selectedRowKeys,
    } as reqType;
    clientApi.clueCheckExport(params).then(res => {
      if (res?.is_async) {
        SiriusMessage.warning({ content: res?.message, duration: 3 });
      } else {
        let reqUrl = urlStore.get('clueExport') as string;
        downLoadTableExcel(reqUrl, getIn18Text('XIANSUOLIEBIAO'), params);
      }
    });
  };
  const handleMenuClick = (e: Partial<Parameters<Exclude<MenuProps['onClick'], undefined>>[0]>) => {
    setBatchType(e.key as 'clue_status' | 'clue_source' | 'clue_batch');
    setStatusVisible(true);
  };
  const menu = (
    <Menu onClick={handleMenuClick}>
      <Menu.Item key={menuKey.clue_source}>
        <span style={{ color: '#51555C' }}>{getIn18Text('XIUGAIXIANSUOLAIYUAN')}</span>
      </Menu.Item>
      <Menu.Item key={menuKey.clue_batch}>
        <span style={{ color: '#51555C' }}>{getIn18Text('XIUGAIXIANSUOPICI')}</span>
      </Menu.Item>
    </Menu>
  );
  return (
    <div className={style.myClueWrap}>
      <Search className={style.tabsTop} handerSearch={handerSearch} onCollapse={setSearchExpand} isShowManager={false} />
      <Skeleton active loading={isSHowSkeleton} paragraph={{ rows: 4 }}>
        {isRecomend && (
          <Message
            className={style.tabsTop}
            message={getIn18Text('KETONGGUOLISHIYOUJIANWANGLAIJILU\uFF0CZIDONGBANGNINSHAIXUANTIANJIA')}
            type={'warning'}
            alertClose={() => setIsRecomend()}
          >
            <a onClick={changePage}>{getIn18Text('TIANJIAXIANYOUKEHU')}</a>
            <QuestionPopover className={style.clientQuestion} content={contentText} placement="top" />
          </Message>
        )}
        {hasClue && message && <Message className={style.tabsTop} message={message} type="info" alertClose={closeMessage}></Message>}
        {uploadInfo?.message && (
          <Message
            className={style.tabsTop}
            message={uploadInfo.message}
            type={uploadInfo?.status_code === 'fail' ? 'fail' : 'info'}
            alertClose={() => onChangeInfo({} as uploadType)}
          >
            {uploadInfo?.download_id && <a onClick={downLoadExcel}>{getIn18Text('XIAZAISHIBAIJIEGUO')}</a>}
          </Message>
        )}
        {!hasClue && (
          <EmptyList bodyClassName={style.emptyListBody} style={{ height: y }}>
            <div>{getIn18Text('ZANWUXIANSUO')}</div>
          </EmptyList>
        )}
        {hasClue && (
          <div ref={tableRef} className={style.tableWrap}>
            <Table
              tableWidthKey="wm-customer-myclue"
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
                // onChange: onPaginationChange
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
        <PrivilegeCheck accessLabel="EXPORT" resourceLabel="CHANNEL">
          <Button style={{ marginLeft: 12 }} onClick={() => exportTableData()}>
            {getIn18Text('DAOCHU')}
          </Button>
        </PrivilegeCheck>
        <PrivilegeCheck accessLabel="OP" resourceLabel="CHANNEL">
          <Button
            style={{ marginLeft: 12 }}
            onClick={() => {
              setShiftVisible(true);
              clueDataTracker.trackTableBatchOperation(BatchOperationType.TransferLeads, selectedRowKeys.length);
            }}
          >
            {getIn18Text('ZHUANYI')}
          </Button>
          <Button style={{ marginLeft: 12 }} onClick={returnOpenSea}>
            {getIn18Text('TUIHUIGONGHAI')}
          </Button>
          <Button style={{ marginLeft: 12 }} onClick={marketing}>
            {getIn18Text('YIJIANYINGXIAO')}
          </Button>
          <Dropdown overlay={menu}>
            <Button
              style={{ marginLeft: 12 }}
              type="primary"
              onClick={() => {
                setStatusVisible(true);
                setBatchType('clue_status');
                clueDataTracker.trackTableBatchOperation(BatchOperationType.Status, selectedRowKeys.length);
              }}
            >
              {getIn18Text('XIUGAIXIANSUOZHUANGTAI')}
              <CaretDownOutlined />
            </Button>
          </Dropdown>
        </PrivilegeCheck>
        <PrivilegeCheck accessLabel="DELETE" resourceLabel="CHANNEL">
          <Button danger type="primary" style={{ marginLeft: 12 }} onClick={() => deleteClues()}>
            {getIn18Text('SHANCHU')}
          </Button>
        </PrivilegeCheck>
      </SelectRowAction>
      {visible && <NewClueModal width={408} visible={visible} onCancel={closeClueModal} pageType={'edit'} isContact={false} id={currentId} />}
      {statusVisible && <ChangeClueStatusModal type={batchType} visible={statusVisible} onCancel={closeStatusModal} ids={selectedRowKeys} />}
      {reasonVisible && <ReturnReason visible={reasonVisible} ids={selectedRowKeys} onCancel={returnReasonHandler} />}
      {shiftVisible && (
        <ShiftManager
          visible={shiftVisible}
          data={selectedRowItems}
          shiftType={'shift'}
          modalType={'clue'}
          onCancel={param => {
            setShiftVisible(false);
            if (param === true) {
              clearKeys();
              requestTableData();
            }
          }}
        />
      )}
      <ClueDetail
        visible={detailVisible}
        clueId={currentId}
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
