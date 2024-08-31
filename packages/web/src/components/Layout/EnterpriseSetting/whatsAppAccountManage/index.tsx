import React, { useEffect, useMemo, useRef, useState } from 'react';
import { apiHolder, apis, DataTrackerApi, InsertWhatsAppApi, WhatsAppApi, WhatsAppBSP } from 'api';
import CustomerTabs from '@/components/Layout/Customer/components/Tabs/tabs';
import { PersonalMessage } from './personalMessage';
import { InsertWhatsApp } from '../insertWhatsApp/insertWhatsApp';
import PersonalChannel from './personalChannel';
import style from './style.module.scss';
import PersonalChannelOperation from '@/components/Layout/EnterpriseSetting/whatsAppAccountManage/personalChannel/components/personalChannelOperation';
import { BizWhatsAppV2 } from '../insertWhatsApp/BizWhatsAppV2';
import { useWaContextV2 } from '../../SNS/WhatsAppV2/context/WaContextV2';

const trackerApi = apiHolder.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;
// const productApi = api.requireLogicalApi(apis.productAuthApiImpl) as ProductAuthApi;
const insertWhatsAppApi = apiHolder.api.requireLogicalApi(apis.insertWhatsAppApiImpl) as InsertWhatsAppApi;
const whatsAppApi = apiHolder.api.requireLogicalApi(apis.whatsAppApiImpl) as unknown as WhatsAppApi;

type TabKey = 'personal' | 'business' | 'personalChannel' | 'businessV2';

interface PersonalChannelRef {
  onAllot: () => void;
  onModeAssignment: () => void;
}

export const WhatsAppAccountManage = () => {
  const { orgStatus: bizWaOrgStatusV2 } = useWaContextV2();
  const [bizWaVisibleV1, setBizWaVisibleV1] = useState<boolean>(false);
  const bizWaVisibleV2 = bizWaOrgStatusV2 !== 'UNPURCHASED';
  const [bizBsp, setBizBsp] = useState<WhatsAppBSP | null>(null);
  const [activeKey, setActiveKey] = useState<TabKey>('personal');
  const [operationInfo, setOperationInfo] = useState<Record<string, any>>({});

  const personalChannelRef = useRef<PersonalChannelRef>(null);
  // const showWa = productApi.getABSwitchSync('ws_personal');

  const handleChangeTab = (key: TabKey) => {
    setActiveKey(key);
    switch (activeKey) {
      case 'personal':
        trackerApi.track('WA_account_management_personal_number_record');
        break;
      case 'personalChannel':
        break;
      default:
      case 'business':
        trackerApi.track('WA_account_management_business_account');
        break;
    }
  };

  const onAddAllot = () => {
    if (personalChannelRef.current) {
      personalChannelRef.current.onAllot();
    }
  };

  const onModeAssignment = () => {
    if (personalChannelRef.current) {
      personalChannelRef.current.onModeAssignment();
    }
  };

  const tabList = useMemo(() => {
    const baseTabList = [
      {
        label: '个人号数据记录',
        value: 'personal',
      },
      {
        label: 'WhatsApp成员管理',
        value: 'personalChannel',
      },
    ];
    if (bizWaVisibleV1 && bizBsp === WhatsAppBSP.IB) {
      baseTabList.push({ label: '商业号管理', value: 'business' });
    }
    if (bizWaVisibleV2 && bizBsp === WhatsAppBSP.NX) {
      baseTabList.push({ label: '商业号管理', value: 'businessV2' });
    }
    return baseTabList;
  }, [bizWaVisibleV1, bizWaVisibleV2, bizBsp]);

  const tabBarExtraContent = useMemo(() => {
    // 注意，这里面需要做权限控制
    if (activeKey === 'personalChannel') {
      return (
        <PersonalChannelOperation
          leftChannelQuota={operationInfo.leftChannelQuota}
          totalChannelQuota={operationInfo.totalChannelQuota}
          onAddAllot={onAddAllot}
          modeAssignment={onModeAssignment}
        />
      );
    }
    return <></>;
  }, [activeKey, operationInfo.leftChannelQuota, operationInfo.totalChannelQuota]);

  useEffect(() => {
    insertWhatsAppApi.queryBindStatus().then(data => {
      if (['TRY', 'UNREGISTERED', 'PURCHASED', 'REGISTERED', 'VERIFIED'].includes(data.orgStatus)) {
        setBizWaVisibleV1(true);
      } else {
        setBizWaVisibleV1(false);
      }
    });
  }, []);

  useEffect(() => {
    whatsAppApi.getBsp().then(nextBsp => setBizBsp(nextBsp));
  }, []);

  return (
    <div className={style.container}>
      <p className={style.title}>WhatsApp账号管理</p>
      <CustomerTabs
        className={style.tabs}
        defaultActiveKey="personal"
        activeKey={activeKey}
        onChange={handleChangeTab}
        tabBarExtraContent={tabBarExtraContent}
        tabList={tabList}
      />
      <div className={style.content}>
        {activeKey === 'personal' && <PersonalMessage />}
        {activeKey === 'business' && <InsertWhatsApp />}
        {/* {activeKey === 'personalChannel' && showWa && <PersonalChannel ref={personalChannelRef} onDataChange={setOperationInfo} />} */}
        {activeKey === 'personalChannel' && <PersonalChannel ref={personalChannelRef} onDataChange={setOperationInfo} />}
        {activeKey === 'businessV2' && <BizWhatsAppV2 />}
      </div>
    </div>
  );
};
