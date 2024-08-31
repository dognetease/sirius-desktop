import React, { useState, useRef, useEffect, useReducer } from 'react';
import { Button, Dropdown, Menu, MenuProps } from 'antd';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import { ReactComponent as ConfirmIcon } from '@/images/icons/edm/confirm.svg';
import CustomerWrap from '../components/customerWrap/customerWrap';
import HeaderLayout from '../components/headerLayout/headerLayout';
import NewClueModal from './components/CreateNewClueModal/createNewClueModal';
import CustomerTabs from '../components/Tabs/tabs';
import style from './clue.module.scss';
import { ReactComponent as CaretDownOutlined } from '@/images/icons/edm/caretDownOutlined.svg';
import MyClue from './components/MyClue/myClue';
import AllClue from './components/AllClue/AllClue';
import { apiHolder, apis, CustomerApi, ResUploadCientFile as uploadType, newMyClueListReq as reqType, urlStore } from 'api';
const clientApi = apiHolder.api.requireLogicalApi(apis.customerApiImpl) as CustomerApi;
import ImportClueModal from './components/ImportClueModal/importClueModal';
import MarketButton from '../components/marketButton/MarketButton';
import { clueDataTracker, HandlerClueType } from '../tracker/clueDataTracker';
import { PermissionCheckPage, PrivilegeCheck } from '@/components/UI/PrivilegeEnhance';
import { getModuleAccessSelector } from '@web-common/state/reducer/privilegeReducer';
import MailsExchanged from '../NewClient/components/MailsExchanged/mailsExchanged';
import { useAppDispatch, useAppSelector } from '@web-common/state/createStore';
import { getModuleDataPrivilegeAsync, isOwnerDataPrivilegeSelector } from '@web-common/state/reducer/privilegeReducer';
import { clueContext, reducer, initClueState } from './clueContext';
import Toast from '@web-common/components/UI/Message/SiriusMessage';
import MarketingModal from './components/marketing/marketingModal';
import useDownLoad from '@/components/Layout/Customer/components/hooks/useDownLoad';
import { getIn18Text } from 'api';
const menuKey = {
  NEW: 'new',
  IMPORT: 'import',
  CONTACT: 'contact',
  EXPORT: 'export',
};
const RESOURCE_LABEL = 'CHANNEL';
const Clue: React.FC<any> = () => {
  const [state, dispatch] = useReducer(reducer, initClueState);
  let [visible, setVisible] = useState<boolean>(false);
  let [clueVisible, setClueVisible] = useState<boolean>(false);
  const [marketingVisible, setMarketingVisible] = useState(false);
  let [tabOne, setTabOne] = useState<boolean>(true);
  let [message, setMessage] = useState<string>('');
  let [tableEvent, setTableEvent] = useState<number>(0);
  let refValue = useRef({
    company_cnt: 0,
    contact_cnt: 0,
  });
  const [isRecomend, setIsRecomend] = useState<boolean>(false);
  const [isShowMails, setIsShowMails] = useState<boolean>(false);
  const [uploadInfo, setUploadInfo] = useState<uploadType>({} as uploadType);
  const { downLoadTableExcel } = useDownLoad();
  const hasExport = useAppSelector(state => getModuleAccessSelector(state.privilegeReducer, 'CHANNEL', 'EXPORT'));
  console.log('xxxclueExport', hasExport);
  useEffect(() => {
    clientApi.clueInitAllow().then(res => {
      // true 有推荐数据
      if (res.recommend) {
        setIsRecomend(true);
      }
    });
  }, []);
  const appDispatch = useAppDispatch();
  useEffect(() => {
    appDispatch(getModuleDataPrivilegeAsync(RESOURCE_LABEL));
  }, []);
  const createBusiness = () => {
    clueDataTracker.trackHandlerClue(HandlerClueType.New);
    setVisible(true);
  };
  // tabs
  const tabsOnChange = (param: string) => {
    setTabOne(param === '1');
    setTableEvent(0);
    dispatch({
      type: 'updateActiveTab',
      payload: {
        activeTab: Number(param),
      },
    });
  };
  const closeClueModal = (param?: boolean) => {
    if (param === true) {
      setTableEvent(Math.random());
    }
    setVisible(false);
  };
  const closeMessage = () => {
    setMessage('');
  };
  const closeClueVisable = () => {
    setClueVisible(false);
  };
  /**
   * 导入联系人
   */
  const getContactNums = () => {
    clientApi.getContactNums().then(res => {
      refValue.current = res;
      showConfirm();
    });
  };
  const showConfirm = () => {
    Modal.confirm({
      className: 'clientConfirm',
      title: `个人通讯录共 ${refValue.current?.company_cnt}个客户数据，共${refValue.current?.contact_cnt}个联系人，是否确认同步？`,
      icon: <ConfirmIcon />,
      content: getIn18Text('TONGBUHOUQINGJINRUXIANSUOZHONGJINXINGCHAKANHEXINXIWANSHAN'),
      centered: true,
      onOk() {
        return new Promise((resolve, reject) => {
          loadContactPerson(resolve);
        }).catch(() => console.log('Oops errors!'));
      },
      okButtonProps: {
        disabled: refValue.current.company_cnt === 0,
      },
      onCancel() {},
    });
  };
  // 一键同步
  const loadContactPerson = resolve => {
    clientApi.loadContactPerson().then(res => {
      setMessage(res.message);
      setTableEvent(Math.random());
      resolve();
    });
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
    clueDataTracker.trackHandlerClue(HandlerClueType.Marketing);
  };
  const exportTableData = () => {
    let params = {
      req_type: state.activeTab,
      ...state.requestParams,
    } as reqType;
    delete params?.page;
    delete params?.page_size;
    clientApi.clueCheckExport(params).then(res => {
      if (res?.is_async) {
        Toast.warning({ content: res?.message, duration: 3 });
      } else {
        let reqUrl = urlStore.get('clueExport') as string;
        downLoadTableExcel(reqUrl, getIn18Text('XIANSUOLIEBIAO'), params);
      }
    });
  };
  /**
   * 按钮list操作
   */
  const handleMenuClick = (e: Partial<Parameters<Exclude<MenuProps['onClick'], undefined>>[0]>) => {
    if (e.key === menuKey.NEW) {
      createBusiness();
    }
    if (e.key === menuKey.IMPORT) {
      setClueVisible(true);
      setUploadInfo({} as uploadType);
      clueDataTracker.trackHandlerClue(HandlerClueType.Import);
    }
    if (e.key === menuKey.CONTACT) {
      getContactNums();
      clueDataTracker.trackHandlerClue(HandlerClueType.Synchronous);
    }
    if (e.key === menuKey.EXPORT) {
      exportTableData();
    }
  };
  const menu = (
    <Menu onClick={handleMenuClick}>
      <Menu.Item key={menuKey.NEW}>
        <span style={{ color: '#51555C' }}>{getIn18Text('XINJIANXIANSUO')}</span>
      </Menu.Item>
      <Menu.Item key={menuKey.IMPORT}>
        <span style={{ color: '#51555C' }}>{getIn18Text('PILIANGDAORU')}</span>
      </Menu.Item>
      <Menu.Item key={menuKey.CONTACT}>
        <span style={{ color: '#51555C' }}>{getIn18Text('GERENTONGXUNLUDAORU')}</span>
      </Menu.Item>
      {hasExport ? (
        <Menu.Item key={menuKey.EXPORT}>
          <span style={{ color: '#51555C' }}>{getIn18Text('DAOCHULIEBIAO')}</span>
        </Menu.Item>
      ) : (
        ''
      )}
    </Menu>
  );
  const isOwner = useAppSelector(state => isOwnerDataPrivilegeSelector(state.privilegeReducer, RESOURCE_LABEL));
  return (
    <PermissionCheckPage resourceLabel={RESOURCE_LABEL} accessLabel="VIEW" menu="CONTACT_CHANNEL_LIST">
      <clueContext.Provider value={{ state, dispatch }}>
        <CustomerWrap>
          {isShowMails ? (
            <MailsExchanged condition="clue" close={() => setIsShowMails(false)} />
          ) : (
            <div className={style.customerLeadWrap}>
              <HeaderLayout title={getIn18Text('XIANSUO')}>
                <PrivilegeCheck accessLabel="OP" resourceLabel={RESOURCE_LABEL}>
                  <MarketButton onClick={marketing} className={style.marginRight} text={getIn18Text('YIJIANYINGXIAO')} />
                  <Dropdown overlay={menu}>
                    <Button type="primary" className="header-dropdown-btn" onClick={createBusiness}>
                      {getIn18Text('XINJIANXIANSUO')}
                      <CaretDownOutlined />
                    </Button>
                  </Dropdown>
                </PrivilegeCheck>
              </HeaderLayout>
              <CustomerTabs
                className={style.tabsTop}
                defaultActiveKey="1"
                tabNameList={isOwner ? [getIn18Text('WODEXIANSUO')] : [getIn18Text('WODEXIANSUO'), getIn18Text('QUANBUXIANSUO')]}
                onChange={tabsOnChange}
              />
              {tabOne ? (
                <MyClue
                  message={message}
                  closeMessage={closeMessage}
                  marketingEvent={() => setMarketingVisible(true)}
                  tableEvent={tableEvent}
                  isRecomend={isRecomend}
                  setIsRecomend={() => setIsRecomend(false)}
                  changePage={() => setIsShowMails(true)}
                  uploadInfo={uploadInfo}
                  onChangeInfo={setUploadInfo}
                />
              ) : (
                <AllClue
                  message={message}
                  marketingEvent={() => setMarketingVisible(true)}
                  closeMessage={closeMessage}
                  tableEvent={tableEvent}
                  uploadInfo={uploadInfo}
                  onChangeInfo={setUploadInfo}
                />
              )}
              {visible && <NewClueModal width={408} visible={visible} onCancel={closeClueModal} pageType={'new'} isContact={false} />}
              {clueVisible && <ImportClueModal visible={clueVisible} onChangeInfo={setUploadInfo} onCancel={closeClueVisable} />}
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
          )}
        </CustomerWrap>
      </clueContext.Provider>
    </PermissionCheckPage>
  );
};
export default Clue;
