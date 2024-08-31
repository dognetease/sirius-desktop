import React, { useState, useEffect, useReducer } from 'react';
import { Button, Dropdown, Menu } from 'antd';
import CustomerWrap from '../components/customerWrap/customerWrap';
import HeaderLayout from '../components/headerLayout/headerLayout';
import ClientBusinessModal from './components/CreateNewBusinessModal/createNewBussinessModal';
import CustomerTabs from '../components/Tabs/tabs';
import style from './business.module.scss';
import { ReactComponent as CaretDownOutlined } from '@/images/icons/edm/caretDownOutlined.svg';
import MyBusiness from './components/MyBusiness/myBusiness';
import AllBusiness from './components/AllBusiness/allBusiness';
import MarketButton from '../components/marketButton/MarketButton';
import { businessDataTracker, HandlerBusinessType } from '../tracker/businessDataTracker';
import { PermissionCheckPage, PrivilegeCheck } from '@/components/UI/PrivilegeEnhance';
import { getModuleDataPrivilegeAsync, isOwnerDataPrivilegeSelector } from '@web-common/state/reducer/privilegeReducer';
import { getModuleAccessSelector } from '@web-common/state/reducer/privilegeReducer';
import { useAppDispatch, useAppSelector } from '@web-common/state/createStore';
import { businessContext, reducer, initBusinessState } from './businessContext';
import Toast from '@web-common/components/UI/Message/SiriusMessage';
import MarketingModal from './components/marketing/marketingModal';
import useDownLoad from '@/components/Layout/Customer/components/hooks/useDownLoad';
import { apiHolder, apis, CustomerApi, opportunityListReq as reqType, urlStore } from 'api';
import { getIn18Text } from 'api';
const clientApi = apiHolder.api.requireLogicalApi(apis.customerApiImpl) as CustomerApi;
const menuKey = {
  NEW: 'new',
  IMPORT: 'import',
  CONTACT: 'contact',
  EXPORT: 'export',
};
const Business: React.FC<any> = () => {
  const [state, dispatch] = useReducer(reducer, initBusinessState);
  let [tabOne, setTabOne] = useState<boolean>(true);
  let [message, setMessage] = useState<string>('');
  let [marketEvent, setMarketEvent] = useState<number>(0);
  let [tableEvent, setTableEvent] = useState<number>(0);
  const [businessVisible, setbusinessVisible] = useState<boolean>(false);
  const [marketingVisible, setMarketingVisible] = useState(false);
  const appDispatch = useAppDispatch();
  const { downLoadTableExcel } = useDownLoad();
  useEffect(() => {
    appDispatch(getModuleDataPrivilegeAsync('COMMERCIAL'));
  }, []);
  const hasExport = useAppSelector(state => getModuleAccessSelector(state.privilegeReducer, 'COMMERCIAL', 'EXPORT'));
  const createBusiness = () => {
    businessDataTracker.trackHandlerBusiness(HandlerBusinessType.New);
    setbusinessVisible(true);
  };
  // tabs
  const tabsOnChange = (param: string) => {
    setTabOne(param === '1');
    setMarketEvent(0);
    setTableEvent(0);
    dispatch({
      type: 'updateActiveTab',
      payload: {
        activeTab: Number(param),
      },
    });
  };
  // 客户和商机弹框
  const closeBusinessModal = (param?: boolean) => {
    if (param === true) {
      setTableEvent(Math.random());
    }
    setbusinessVisible(false);
  };
  const closeMessage = () => {
    setMessage('');
  };
  /**
   * 一键营销
   */
  const marketing = () => {
    if (state.selectedRows.length) {
      setMarketingVisible(true);
    } else {
      Toast.warning({
        content: getIn18Text('QINGXIANGOUXUANBIAOGESHUJU'),
      });
    }
    // setMarketEvent(Math.random());
    businessDataTracker.trackHandlerBusiness(HandlerBusinessType.Marketing);
  };
  const exportTableData = () => {
    let params = {
      req_type: state.activeTab,
      ...state.requestParams,
    } as reqType;
    delete params?.page;
    delete params?.page_size;
    clientApi.businessCheckExport(params).then(res => {
      if (res?.is_async) {
        Toast.warning({ content: res?.message, duration: 3 });
      } else {
        let reqUrl = urlStore.get('businessExport') as string;
        downLoadTableExcel(reqUrl, getIn18Text('SHANGJILIEBIAO'), params);
      }
    });
  };
  /**
   * 按钮list操作
   */
  const handleMenuClick = e => {
    if (e.key === menuKey.NEW) {
      createBusiness();
    }
    if (e.key === menuKey.EXPORT) {
      exportTableData();
    }
    // if (e.key === menuKey.IMPORT) {
    //     businessDataTracker.trackHandlerBusiness(HandlerBusinessType.Import);
    // }
  };
  const menu = (
    <Menu onClick={handleMenuClick}>
      <Menu.Item key={menuKey.NEW}>
        <span style={{ color: '#51555C' }}>{getIn18Text('XINJIANSHANGJI')}</span>
      </Menu.Item>
      {hasExport ? (
        <Menu.Item key={menuKey.EXPORT}>
          <span style={{ color: '#51555C' }}>{getIn18Text('DAOCHU')}</span>
        </Menu.Item>
      ) : (
        ''
      )}
    </Menu>
  );
  const isOwner = useAppSelector(state => isOwnerDataPrivilegeSelector(state.privilegeReducer, 'COMMERCIAL'));
  return (
    <PermissionCheckPage resourceLabel="COMMERCIAL" accessLabel="VIEW" menu="CONTACT_COMMERCIAL_LIST">
      <businessContext.Provider value={{ state, dispatch }}>
        <CustomerWrap>
          <div className={style.customerLeadWrap}>
            <HeaderLayout title={getIn18Text('SHANGJI')}>
              <PrivilegeCheck accessLabel="OP" resourceLabel="COMMERCIAL">
                <MarketButton onClick={marketing} className={style.marginRight} text={getIn18Text('YIJIANYINGXIAO')} />
                <Dropdown overlay={menu}>
                  <Button type="primary" className="header-dropdown-btn" onClick={createBusiness}>
                    {getIn18Text('XINJIANSHANGJI')}
                    <CaretDownOutlined />
                  </Button>
                </Dropdown>
              </PrivilegeCheck>
            </HeaderLayout>
            <CustomerTabs
              className={style.tabsTop}
              defaultActiveKey="1"
              tabNameList={isOwner ? [getIn18Text('WODESHANGJI')] : [getIn18Text('WODESHANGJI'), getIn18Text('QUANBUSHANGJI')]}
              onChange={tabsOnChange}
            />
            {tabOne ? (
              <MyBusiness message={message} closeMessage={closeMessage} marketingEvent={() => setMarketingVisible(true)} tableEvent={tableEvent} />
            ) : (
              <AllBusiness message={message} closeMessage={closeMessage} marketingEvent={() => setMarketingVisible(true)} tableEvent={tableEvent} />
            )}
            {businessVisible && <ClientBusinessModal width={768} visible={businessVisible} pageType="new" onCancel={closeBusinessModal} />}
            {marketingVisible && (
              <MarketingModal
                visible={true}
                onCancel={() => {
                  setMarketingVisible(false);
                }}
                onSubmit={() => {}}
              />
            )}
          </div>
        </CustomerWrap>
      </businessContext.Provider>
    </PermissionCheckPage>
  );
};
export default Business;
