import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useScroll } from 'react-use';
import { apiHolder, apis, AddressBookApi, EdmSendBoxApi } from 'api';
import qs from 'querystring';
import classnames from 'classnames';
// import { Tabs as SiriusTabs } from '@web-common/components/UI/Tabs';
import SiriusTabs from '@lingxi-common-component/sirius-ui/Tabs';
import { useLocation } from '@reach/router';
import UnsubscribeTable from '../../../blacklist/unsubscribeTable';
import Blacklist from '../../../blacklist/blacklist';
import { PermissionCheckPage } from '@/components/UI/PrivilegeEnhance';
import { CreateAutoMarktingTask } from './createAutoMarktingTask';
import addressBookStyle from '../../addressBook.module.scss';
import style from './index_new.module.scss';
import { ContactOverview } from './contact';
import Groups from '../../components/Groups/index';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import { PrivilegeCheck } from '@/components/UI/PrivilegeEnhance';
import { Recycle } from '../../components/Recycle/index';
// import Button from '@web-common/components/UI/Button';
import Button from '@lingxi-common-component/sirius-ui/Button';
import { ReactComponent as VideoIcon } from '@/images/icons/edm/video.svg';
import { recordDataTracker } from '../../utils';
import { edmDataTracker } from '../../../tracker/tracker';
import { ReactComponent as ErrorRedIcon } from '@/images/icons/edm/error-circle-filled-red.svg';
import { ReactComponent as CloseIcon } from '@/images/icons/edm/autoMarket/close.svg';
import { AiWriteMailReducer, useActions, ConfigActions } from '@web-common/state/createStore';
import { navigate } from '@reach/router';

const addressBookApi = apiHolder.api.requireLogicalApi(apis.addressBookApiImpl) as unknown as AddressBookApi;
const edmApi = apiHolder.api.requireLogicalApi(apis.edmSendBoxApiImpl) as EdmSendBoxApi;
const systemApi = apiHolder.api.getSystemApi();
const datastoreApi = apiHolder.api.getDataStoreApi();

const videoDrawerConfig = { videoId: 'V18', source: 'kehukaifa', scene: 'kehukaifa_10' };

const AddressBookNewIndex = () => {
  const location = useLocation();
  const query = useMemo(() => qs.parse(location.hash.split('?')[1]), [location]);

  const [tabKey, setTabKey] = useState<string>('overview');

  const [showMarktingConfig, setShowMarktingConfig] = useState(false);
  const [tabKeys] = useState(['overview', 'groups', 'blacklist', 'unsubscribe', 'recycle']);

  const [topTipslVisible, setTopTipslVisible] = useState(false);
  const { changeAiHostingInitObj } = useActions(AiWriteMailReducer);
  const { showVideoDrawer } = useActions(ConfigActions);
  const [videoModalVisible, setVideoModalVisible] = useState(false);

  const scrollRef = useRef(null);
  const { y: contactOverviewTabScrollY } = useScroll(scrollRef);

  useEffect(() => {
    recordDataTracker('pc_marketing_contactBook_page');
  }, []);

  // 获取taskId
  const [taskId, setTaskId] = useState('');
  // 获取taskId
  useEffect(() => {
    edmApi.getSendBoxConf({ type: 2 }, { noErrorMsgEmit: true }).then(result => {
      const manualTask = result?.manualPlan === 1;
      const taskId = result.hostingTaskId || '';
      setTaskId(taskId);

      const autoPlanCount = result?.autoPlanCount; // 用户已有的自动营销托管计划数量
      // 和服务端沟通，当没有自动获客任务时，taskId为空, 才需要显示入口引导
      if (taskId === '' || (autoPlanCount !== undefined && autoPlanCount !== null && autoPlanCount === 0)) {
        const closeTime = datastoreApi.getSync('addressAutoCustomerAcquisitionFlag')?.data;
        const currentTime = new Date().toLocaleDateString();
        // 当日（自然日）仅显示一次
        if (closeTime !== undefined && closeTime !== null && currentTime === closeTime) {
          setTopTipslVisible(false);
        } else {
          setTopTipslVisible(true);
        }
      }
    });
  }, []);

  useEffect(() => {
    if (query.defaultTabKey) {
      const tabKey = query.defaultTabKey as string;
      if (tabKeys.includes(tabKey)) {
        setTabKey(tabKey);
      }
    }
  }, [query.defaultTabKey]);

  useEffect(() => {
    if (!query.keyname || query.page !== 'addressBookIndex') {
      return;
    }

    setTabKey((preTabname: string) => {
      return tabKeys.includes(query.keyname as string) ? (query.keyname as string) : preTabname || 'overview';
    });
  }, [query.keyname]);

  const changeTabKey = key => {
    recordDataTracker('pc_marketing_contactBook_tab', {
      action: key,
    });
    setTabKey(key);
  };

  const clickStart = () => {
    changeAiHostingInitObj({ type: 'automatic', contacts: [], from: 'addressBook', back: '#edm?page=addressBookIndex', trackFrom: 'contactGuide' });
    navigate('#edm?page=aiHosting');
  };

  const clickTipsClose = () => {
    setTopTipslVisible(false);
    const closeTime = new Date().toLocaleDateString();
    datastoreApi.put('addressAutoCustomerAcquisitionFlag', closeTime);
  };

  return (
    // <PermissionCheckPage resourceLabel="ADDRESS_BOOK" accessLabel="VIEW" menu="ADDRESS_BOOK_LIST">

    // </PermissionCheckPage>

    <div className={classnames(style.container, addressBookStyle.addressBook)}>
      <div className={style.title}>
        <div>
          营销联系人
          <span className={classnames(style.caption)}>营销联系人数据来源于线索模块中负责人包含您的线索的所有联系人</span>
        </div>
        <p className={style.videoTip} onClick={() => showVideoDrawer(videoDrawerConfig)} style={{ marginRight: '1px' }}>
          <VideoIcon /> <span>如何选择适合你的邮件营销方式</span>
        </p>
      </div>
      {topTipslVisible === true && (
        <div className={style.topTips}>
          <div className={style.leftTips}>
            <ErrorRedIcon className={style.tipsError} />
            <span className={style.tipsTitle}>您有一个自动获客任务未开启，开启后系统自动匹配目标客户，全自动获客营销，大幅提升获客效率</span>
          </div>
          <div className={style.rightTips}>
            <span onClick={clickStart} className={style.tipsStart}>
              去开启
            </span>
            <CloseIcon
              onClick={() => {
                clickTipsClose();
              }}
              className={style.tipsClose}
            />
          </div>
        </div>
      )}
      <div className={classnames(style.tabWrapper)} ref={scrollRef}>
        <SiriusTabs
          className={style.tabs}
          activeKey={tabKey}
          onChange={activeKey => {
            changeTabKey;
            setTabKey(activeKey);
          }}
          destroyInactiveTabPane={true}
        >
          <SiriusTabs.TabPane key="overview" tab="联系人总览">
            <ContactOverview qs={{}} tabScrollY={contactOverviewTabScrollY} />
          </SiriusTabs.TabPane>
          <SiriusTabs.TabPane key="groups" tab="分组" destroyInactiveTabPane={true}>
            <Groups />
          </SiriusTabs.TabPane>
          <SiriusTabs.TabPane key="blacklist" tab="黑名单" destroyInactiveTabPane={true}>
            <Blacklist />
          </SiriusTabs.TabPane>
          <SiriusTabs.TabPane key="unsubscribe" tab="退订" destroyInactiveTabPane={true}>
            <UnsubscribeTable />
          </SiriusTabs.TabPane>
          <SiriusTabs.TabPane key="recycle" tab="回收站" destroyInactiveTabPane={true}>
            <Recycle />
          </SiriusTabs.TabPane>
        </SiriusTabs>
        <CreateAutoMarktingTask />
      </div>
    </div>
  );
};

const AddressBookNewIndexWrapper = () => {
  const query = useMemo(() => qs.parse(location.hash.split('?')[1]), [location]);

  if (query.page && query.page !== 'addressBookIndex') {
    return null;
  }

  return (
    <PermissionCheckPage resourceLabel="CHANNEL" accessLabel="VIEW" menu="ADDRESS_BOOK">
      <AddressBookNewIndex />
    </PermissionCheckPage>
  );
};

export default AddressBookNewIndexWrapper;
