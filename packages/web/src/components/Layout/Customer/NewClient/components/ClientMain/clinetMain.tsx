/* eslint-disable no-tabs */
/* eslint-disable indent */
/*
 * @Author: sunmingxin
 * @Date: 2021-10-04 19:11:29
 * @LastEditTime: 2021-10-25 15:11:11
 * @LastEditors: sunmingxin
 */
import React, { useState, useContext, useEffect, useRef, useMemo } from 'react';
import TableList from '../ClientTableList/clientTableList';
import { EmptyList } from '@web-edm/components/empty/empty';
import style from './clientMain.module.scss';
import { clientContext } from '../../clientContext';
import { apiHolder, apis, CustomerApi, DataStoreApi, urlStore, RequestCompanyMyList as reqType } from 'api';
import { Skeleton, Menu, Dropdown, Button } from 'antd';
import { useLocation } from '@reach/router';
import qs from 'querystring';
import Search from '../Search/search';
import HeaderLayout from '../../../components/headerLayout/headerLayout';
import MarketButton from '../../../components/marketButton/MarketButton';
import CreateClientModal from '../CreateNewClientModal/createNewClientModal';
import ImportClientModal from '../ImportClientModal/importClientModal';
import { ReactComponent as CaretDownOutlined } from '@/images/icons/edm/caretDownOutlined.svg';
import { customerDataTracker, AddCustomerType } from '../../../tracker/customerDataTracker';
import CustomerTabs from '../../../components/Tabs/tabs';
import { PermissionCheckPage, PrivilegeCheck } from '@/components/UI/PrivilegeEnhance';
import { useAppDispatch, useAppSelector } from '@web-common/state/createStore';
import { getModuleDataPrivilegeAsync, isOwnerDataPrivilegeSelector } from '@web-common/state/reducer/privilegeReducer';
import { getModuleAccessSelector } from '@web-common/state/reducer/privilegeReducer';
const clientApi = apiHolder.api.requireLogicalApi(apis.customerApiImpl) as CustomerApi;
import TableFiledsModal from '../TableFieldsModal/tableFields';
const dataStoreApi = apiHolder.api.getDataStoreApi() as DataStoreApi;
import MarketingModal from '../../components/Marketing/marketingModal';
import Toast from '@web-common/components/UI/Message/SiriusMessage';
import useDownLoad from '@/components/Layout/Customer/components/hooks/useDownLoad';
import { getIn18Text } from 'api';
interface comsProps {
  className?: string | undefined;
}
const menuKey = {
  NEW: 'new',
  IMPORT: 'import',
  EXPORT: 'export',
  DATATRANSFER: 'dataTransfer',
};
const CUSTOMERS_DATA_TABLE_SETTING = 'CUSTOMERS_DATA_TABLE_SETTING';
const ClientMain: React.FC<comsProps> = () => {
  let [visible, setVisible] = useState<boolean>(false);
  let [batchVisible, setBatchVisible] = useState<boolean>(false);
  const { state, dispatch, fetchTableData } = useContext(clientContext).value;
  const [isShowTable, setIsShowTable] = useState<boolean>(false);
  let [isRecomend, setIsRecomend] = useState<boolean>(false);
  let [tableEvent, setTableEvent] = useState<number>(1);
  const [heightEvent, setHeightEvent] = useState(0);
  const [queryParams, setQueryParams] = useState<Record<string, string | string[]>>({});
  let [tableVisible, setTableVisible] = useState<boolean>(false);
  let [currentTableSetting, setCurrentTableSetting] = useState<string[]>([]);
  let tableRef = useRef<HTMLDivElement>(null);
  let [y, setY] = useState(0);
  const [marketingVisible, setMarketingVisible] = useState<boolean>(false);
  const appDispatch = useAppDispatch();
  const hasExport = useAppSelector(state => getModuleAccessSelector(state.privilegeReducer, 'CONTACT', 'EXPORT'));
  const { downLoadTableExcel } = useDownLoad();
  useEffect(() => {
    appDispatch(getModuleDataPrivilegeAsync('CONTACT'));
  }, []);
  /**
   * 关闭新建弹框，拉取table数据
   */
  const closeModal = (isUpdate?: boolean) => {
    setVisible(false);
    if (isUpdate) {
      // 批量上传更新数据
      fetchTableData();
    }
  };
  /**
   * 关闭导入客户弹框
   */
  const closeBatchModal = () => {
    setBatchVisible(false);
  };
  /**
   * 打开新建客户
   */
  const openModal = () => {
    setVisible(true);
    customerDataTracker.trackAddCustomer(AddCustomerType.Manual);
  };
  /**
   * 批量导入客户
   */
  const openBatchModal = () => {
    setBatchVisible(true);
    customerDataTracker.trackAddCustomer(AddCustomerType.Import);
  };
  /**
   * 新建客户
   */
  const handleButtonClick = () => {
    openModal();
  };
  const exportTableData = () => {
    const params = {
      req_type: state.activeTab,
      ...state.requestTableParam,
    } as reqType;
    delete params?.page;
    delete params?.page_size;
    clientApi.companyCheckExport(params).then(res => {
      if (res?.is_async) {
        Toast.warning({ content: res?.message, duration: 3 });
      } else {
        const reqUrl = urlStore.get('companyExport') as string;
        downLoadTableExcel(reqUrl, getIn18Text('KEHULIEBIAO'), params);
      }
    });
  };
  /**
   * 按钮list操作
   */
  const handleMenuClick = (e: { key: string }) => {
    switch (e.key) {
      case menuKey.NEW:
        openModal();
        break;
      case menuKey.IMPORT:
        openBatchModal();
        break;
      case menuKey.EXPORT:
        exportTableData();
        break;
      default:
        break;
    }
  };
  const menu = (
    <Menu onClick={handleMenuClick}>
      <Menu.Item key={menuKey.NEW}>
        <span style={{ color: '#51555C' }}>{getIn18Text('SHOUDONGXINJIAN')}</span>
      </Menu.Item>
      <Menu.Item key={menuKey.IMPORT}>
        <span style={{ color: '#51555C' }}>{getIn18Text('PILIANGDAORU')}</span>
      </Menu.Item>
      {hasExport ? (
        <Menu.Item key={menuKey.EXPORT}>
          <span style={{ color: '#51555C' }}>{getIn18Text('DAOCHULIEBIAO')}</span>
        </Menu.Item>
      ) : null}
    </Menu>
  );
  /*
   * tab切换，state状态初始化
   */
  const initState = tab => {
    dispatch({
      type: 'setActiveTab',
      payload: {
        activeTab: tab,
        requestTableParam: {
          sort: '',
          is_desc: '',
          page_size: 20,
        },
      },
    });
    dispatch({
      type: 'setLoading',
      payload: {
        isLoading: true,
      },
    });
  };
  /**
   *  tab切换
   */
  const tabsOnChange = (param: string) => {
    closeMessage();
    initState(Number(param));
    setTableEvent(Number(param));
    let topHeight = tableRef.current?.getBoundingClientRect().top;
    if (topHeight) {
      setY(topHeight);
    }
  };
  /**
   *  一键营销
   */
  const marketing = () => {
    if (state.selectedRows.length) {
      setMarketingVisible(true);
    } else {
      Toast.warning({
        content: getIn18Text('QINGXIANGOUXUANBIAOGESHUJU'),
      });
    }
    customerDataTracker.trackCustomerMatketing();
  };
  const handleAddNewClinet = () => {
    dispatch({
      type: 'setState',
      payload: {
        pageState: 'emialPage',
      },
    });
  };
  const getLocalTableSetting = () => {
    const { data } = dataStoreApi.getSync(CUSTOMERS_DATA_TABLE_SETTING);
    if (data) {
      const oldData = JSON.parse(data);
      setCurrentTableSetting(oldData);
    }
  };
  const storeTableSetting = (data: string[]) => {
    dataStoreApi.putSync(CUSTOMERS_DATA_TABLE_SETTING, JSON.stringify(data), {
      noneUserRelated: false,
    });
    getLocalTableSetting();
  };
  const tableSetting = (keys?: string[]) => {
    setTableVisible(false);
    if (Array.isArray(keys)) {
      storeTableSetting(keys);
    }
  };
  useEffect(() => {
    getLocalTableSetting();
  }, []);
  useEffect(() => {
    clientApi.initAllow().then(res => {
      // true 有推荐数据
      if (res.recommend) {
        setIsRecomend(true);
      }
    });
  }, []);
  const changeRecomend = () => {
    setIsRecomend(false);
  };
  useEffect(() => {
    if (state?.RresponseCompanyList?.original_size > 0) {
      setIsShowTable(true);
    } else {
      setIsShowTable(false);
    }
  }, [state.RresponseCompanyList]);
  const closeMessage = () => {
    dispatch({
      type: 'setUploadState',
      payload: {
        uploadInfo: null,
      },
    });
  };
  useEffect(() => {
    if (state.uploadInfo && !isShowTable) {
      Toast.warning({
        content: state.uploadInfo.message,
      });
      closeMessage();
    }
  }, [state.uploadInfo, isShowTable]);
  const location = useLocation();
  useEffect(() => {
    const moduleName = location.hash.substring(1).split('?')[0];
    const params = qs.parse(location.hash.split('?')[1]);
    if (moduleName === 'wm') {
      if (params.page !== 'customer' && params.page !== 'customerOpenSea') {
        return;
      }
    } else if (moduleName !== 'customer') {
      return;
    }
    if (params.tab) {
      tabsOnChange(params.tab as string);
    }
    // 单个负责人转数组
    if (params.managerIds && !Array.isArray(params.managerIds)) {
      params.managerIds = params.managerIds.split(',');
    }
    if (params.createTime && !Array.isArray(params.createTime)) {
      params.createTime = params.createTime.split(',');
    }
    if (!params.managerIds) {
      params.managerIds = [];
    }
    setQueryParams(params as Record<string, string | string[]>);
  }, [location.hash]);
  const isOwner = useAppSelector(state => isOwnerDataPrivilegeSelector(state.privilegeReducer, 'CONTACT'));
  const tabs = useMemo(
    () => (isOwner ? [getIn18Text('WODEKEHU'), getIn18Text('ZHUANFAGEIWO')] : [getIn18Text('WODEKEHU'), getIn18Text('QUANBUKEHU'), getIn18Text('ZHUANFAGEIWO')]),
    [isOwner]
  );
  const tabKeys = useMemo(() => (isOwner ? ['1', '3'] : ['1', '2', '3']), [isOwner]);
  return (
    <PermissionCheckPage resourceLabel="CONTACT" accessLabel="VIEW" menu="CONTACT_LIST">
      <div className={style.clientWrap}>
        <HeaderLayout title={getIn18Text('KEHU')}>
          <PrivilegeCheck accessLabel="OP" resourceLabel="CONTACT">
            <MarketButton onClick={marketing} className={style.marginRight} text={getIn18Text('YIJIANYINGXIAO')} />
            <Dropdown overlay={menu}>
              <Button type="primary" className="header-dropdown-btn" onClick={handleButtonClick}>
                {getIn18Text('XINJIANKEHU')}
                <CaretDownOutlined />
              </Button>
            </Dropdown>
          </PrivilegeCheck>
        </HeaderLayout>
        <CustomerTabs className={style.tabsTop} defaultActiveKey="1" tabNameList={tabs} tabKeys={tabKeys} activeKey={tableEvent.toString()} onChange={tabsOnChange} />
        <Search
          key={tableEvent}
          tabKey={tableEvent}
          className={style.search}
          onSetting={setTableVisible}
          onCollapse={() => setHeightEvent(Math.random())}
          createTime={queryParams.createTime as [string, string] | undefined}
          managerIds={queryParams.managerIds as string[]}
        />
        <Skeleton active loading={state.isLoading} paragraph={{ rows: 4 }}>
          <div className={style.clientTabWrap} ref={tableRef}>
            {isShowTable ? (
              <TableList
                isRecomend={isRecomend}
                tabNumber={tableEvent}
                setIsRecomend={changeRecomend}
                marketingEvent={() => setMarketingVisible(true)}
                currentTableSetting={currentTableSetting}
                heightEvent={heightEvent}
              />
            ) : (
              <div style={{ height: `calc(100vh - ${y}px)` }}>
                <EmptyList className={style.clientEmpty}>
                  <p className={style.emptyBlock}>
                    {getIn18Text('ZANWUKEHUTONGXUNLUSHUJU')}
                    <br />
                    {isRecomend && (
                      <span>
                        {getIn18Text('KETONGGUOLISHIYOUJIANWANGLAIJILU\uFF0CZIDONGBANGNINSHAIXUANTIANJIA')}
                        <br />
                        <a onClick={handleAddNewClinet}>{getIn18Text('TIANJIAXIANYOUKEHU')}</a>
                      </span>
                    )}
                  </p>
                </EmptyList>
              </div>
            )}
          </div>
        </Skeleton>
        {visible && <CreateClientModal visible={visible} onCancel={closeModal} pageType="new" />}
        {batchVisible && <ImportClientModal visible={batchVisible} onCancel={closeBatchModal} />}
        {tableVisible && <TableFiledsModal visible={tableVisible} list={currentTableSetting} onCancel={tableSetting} />}
        {marketingVisible && (
          <MarketingModal
            visible={marketingVisible}
            onCancel={() => {
              setMarketingVisible(false);
            }}
            onSubmit={() => {}}
          />
        )}
      </div>
    </PermissionCheckPage>
  );
};
export default ClientMain;
