import React, { useMemo, useEffect, useState } from 'react';
import IconCard from '@web-common/components/UI/IconCard/index';
import moment from 'moment';
import { zoneData, zoneVar } from './zone.js';
import { ContactModel, apiHolder as api, apis, ContactAndOrgApi, DataTrackerApi, locationHelper, getIn18Text } from 'api';
import { useContactModel, useCustomerModel } from '@web-common/hooks/useContactModel';
// import { isMainAccount } from '@web-mail/util';
import './index.scss';
import { CustomerAsideDetailType } from '@web-mail/state/slice/customerMailReducer/types';
import { tabType } from '@web-common/state/reducer/mailTabReducer';
import { MailActions } from '@web-common/state/reducer';
import { useAppDispatch, useAppSelector } from '@web-common/state/createStore';
// import useState2RM from '@web-mail/hooks/useState2ReduxMock';
import { PrivilegeCheckForMailPlus } from '@/components/UI/PrivilegeEnhance';
import { UniDrawerModuleId, showUniDrawer } from '@lxunit/app-l2c-crm';

interface TimerProps {
  zoneOffset: number;
}

export const Timer: React.FC<TimerProps> = props => {
  const { zoneOffset } = props;
  const [, setRenderKey] = useState(1);

  useEffect(() => {
    const timer = setInterval(() => {
      setRenderKey(Math.random());
    }, 1000);
    // 组件卸载清除定时器
    return () => clearInterval(timer);
  }, []);

  const getCustomerTime = () => {
    var timezone = zoneOffset;
    var offset_GMT = new Date().getTimezoneOffset();
    var nowDate = new Date().getTime();
    return new Date(nowDate + offset_GMT * 60 * 1000 + timezone * 60 * 60 * 1000);
  };

  return (
    <span style={{ fontFamily: 'Helvetica, Arial' }}>
      {moment(getCustomerTime()).format('YYYY-MM-DD')}&nbsp;{moment(getCustomerTime()).format('HH:mm:ss')}
    </span>
  );
};

export interface TimeZoneProps {
  contact?: ContactModel;
  curAccount?: string;
  isTpMail: boolean;
  sliceId: string;
}
const contactApi = api.api.requireLogicalApi(apis.contactApiImpl) as ContactAndOrgApi;
const trackApi = api.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;
const eventApi = api.api.getEventApi();

const TimeZone: React.FC<TimeZoneProps> = props => {
  const { contact, curAccount, isTpMail, sliceId } = props;
  const dispatch = useAppDispatch();
  // uni弹窗
  // const [, setUniCustomerParam] = useState2RM('uniCustomerParam');

  const currentTabType = useAppSelector(state => state.mailTabReducer.currentTab.type);
  // 客户页签下-客户详情展示的 email
  const setCustomerAsideDetail = (type: CustomerAsideDetailType) => {
    const isCustomerTab = currentTabType === tabType.customer;
    if (isCustomerTab) {
      dispatch(MailActions.updateCustomerAsideDetail_cm({ sliceId, data: { type } }));
    } else {
      dispatch(MailActions.updateCustomerAsideDetail({ type }));
    }
  };

  // const isMailAccount = useMemo(() => isMainAccount(), [curAccount]);
  const email = useMemo(() => (contact ? contactApi.doGetModelDisplayEmail(contact) : ''), [contact]);
  const contactId = useMemo(() => contact?.contact?.id, [contact]);
  const reduxContact = useContactModel({ email, contactId, _account: curAccount });
  const orgData = useCustomerModel({
    customerId: reduxContact?.customerOrgModel?.companyId,
    email,
    _account: curAccount,
    emailRole: reduxContact?.customerOrgModel?.role,
  });
  const area = useMemo(() => orgData?.area, [orgData]);
  const country = useMemo(() => (area ? area.split('-')[1] : ''), [area]);
  const capital = useMemo(() => (area ? area.split('-')[2] : ''), [area]);
  const city = useMemo(() => (area ? area.split('-')[3] : ''), [area]);
  const contactZone = useMemo(() => orgData?.zone, [orgData]);
  const zoneParams = useMemo(() => {
    const res: any = { label: '', zoneOffset: null };
    let onZone: any = null;
    const lang = typeof window !== 'undefined' ? window.systemLang : 'zh';
    if (contactZone) {
      onZone = zoneVar.find(i => i.value === contactZone);
      // res.label = zoneVar.find(i => i.value === contactZone)?.timezone;
      // res.zoneOffset = zoneVar.find(i => i.value === contactZone)?.zoneOffset;
    } else if (country) {
      onZone = zoneData.find(i => i.country === country);
      // res.label = zoneData.find(i => i.country === country)?.timezone;
      // res.zoneOffset = zoneData.find(i => i.country === country)?.zoneOffset;
    }
    if (onZone) {
      res.label = lang === 'en' ? onZone.timezoneEn : onZone.timezone;
      res.zoneOffset = onZone.zoneOffset;
    }
    return res;
  }, [contactZone, country]);

  const openEdit = (e: any) => {
    e.stopPropagation();
    trackApi.track('waimao_mail_click_writeTimezone');
    setCustomerAsideDetail('detail');
    const customerId = reduxContact?.customerOrgModel?.companyId || orgData?.id;
    if (customerId) {
      // setUniCustomerParam({
      //   visible: true,
      //   customerId: Number(customerId),
      //   uniType: 'editCustomer',
      //   source: 'mailListRead',
      //   onSuccess: () => {
      //     // 编辑成功后，发送事件，重新请求一次数据
      //     eventApi.sendSysEvent({
      //       eventName: 'mailMenuOper',
      //       eventStrData: 'headerCardVisible',
      //       eventData: { success: true, type: 'customer' },
      //     });
      //   },
      // });
      // 编辑客户
      showUniDrawer({
        moduleId: UniDrawerModuleId.CustomerDetail,
        moduleProps: {
          visible: true,
          onClose: () => {},
          onSuccess: () => {
            // 编辑成功后，发送事件，重新请求一次数据
            eventApi.sendSysEvent({
              eventName: 'mailMenuOper',
              eventStrData: 'headerCardVisible',
              eventData: { success: true, type: 'customer' },
            });
          },
          customerId: Number(customerId),
          source: 'mailListRead',
        },
      });
    }
  };

  // if (!inEdm || !contact || !isMailAccount) {
  if (!process.env.BUILD_ISEDM || !contact) {
    return <></>;
  }

  // 改为通过role字段来判断，todo：公海客户是否需要展示
  if (!reduxContact?.customerOrgModel?.role || !['myCustomer', 'colleagueCustomer', 'openSeaCustomer'].includes(reduxContact.customerOrgModel.role)) {
    // 发件人不是客户和线索
    return <></>;
  }

  if (country && !zoneParams.label) {
    // 如果客户有国家，但是在zone.js未找到国家对应的时区，不展示
    return <></>;
  }

  return (
    <div className="edm-u-timezone-container">
      <span className="area-icon">
        <IconCard type="tongyong_dizhi" stroke="#8D92A1" />
      </span>
      {country && zoneParams.label ? (
        <p className="edm-u-timezone-zone">
          <span className="time-area">{city || capital || country}</span>
          <span className="time-icon">
            <IconCard type="tongyong_shijian_xian" stroke="#8D92A1" />
          </span>
          {/* 当地时间： */}
          <span>{getIn18Text('DANGDISHIJIAN')}：</span>
          <Timer zoneOffset={zoneParams.zoneOffset} />
          <span>&nbsp;({zoneParams.label})</span>
        </p>
      ) : (
        <p className="edm-u-timezone-edit">
          {/* 未获取到客户所在国家，无法展示当地时间 */}
          {getIn18Text('WEIHUOKESHIJIAN')}
          {!isTpMail && !locationHelper.testPathMatch('/readMail') && (
            <PrivilegeCheckForMailPlus accessLabel="OP" resourceLabel="CONTACT">
              <span className="open-detail-btn" onClick={openEdit}>
                {/* 去填写 */}
                {getIn18Text('QUTIANXIE')}
              </span>
            </PrivilegeCheckForMailPlus>
          )}
        </p>
      )}
    </div>
  );
};

export default TimeZone;
