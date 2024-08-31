import React, { useMemo } from 'react';
import IconCard from '@web-common/components/UI/IconCard/index';
import { zoneData, zoneVar } from './zone.js';
import { apiHolder as api, apis, ContactAndOrgApi, getIn18Text } from 'api';
import { useContactModel, useCustomerModel } from '@web-common/hooks/useContactModel';
import './index.scss';
import styles from '@web-mail-write/components/MailInfo/mailInfo.module.scss';
import { useHeightestPriorityEmail } from '@web-mail-write/components/WriteContact/writeSide';
import { transContactItem2MailContactModel } from '@web-common/utils/contact_util';
import { Timer } from './index';

export interface TimeZoneProps {}
const contactApi = api.api.requireLogicalApi(apis.contactApiImpl) as ContactAndOrgApi;

// 邮件+写信页面展示时区组件
const TimeZoneWriteMail: React.FC<TimeZoneProps> = props => {
  // const { contact, curAccount } = props;
  // 邮件+展示当前选中的联系人
  const { contactItem } = useHeightestPriorityEmail();
  const contact = useMemo(() => {
    if (!contactItem) {
      return undefined;
    } else {
      const contactModel = transContactItem2MailContactModel(contactItem);
      return contactModel.contact || undefined;
    }
  }, [contactItem]);

  const curAccount = useMemo(() => contact?._account, [contact]);
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
    } else if (country) {
      onZone = zoneData.find(i => i.country === country);
    }
    if (onZone) {
      res.label = lang === 'en' ? onZone.timezoneEn : onZone.timezone;
      res.zoneOffset = onZone.zoneOffset;
    }
    return res;
  }, [contactZone, country]);

  // 如果没有获取到则返回空
  if (!contact) {
    return <></>;
  }

  if (!process.env.BUILD_ISEDM) {
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

  return country && zoneParams.label ? (
    <div className={styles.infoItem}>
      <span className={styles.infoLabel}></span>
      <span className={styles.colonLabel}></span>
      <div className="edm-u-timezone-container" style={{ height: 44, marginTop: 0, paddingLeft: 12 }}>
        <span className="timeZoneContactName">{contact.contact?.contactName}</span>
        <span className="timeZoneAccountName">{contact.contact?.displayEmail || contact.contact?.accountName}：</span>
        <span className="area-icon">
          <IconCard type="tongyong_dizhi" stroke="#8D92A1" />
        </span>
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
      </div>
    </div>
  ) : (
    <></>
  );
};

export default TimeZoneWriteMail;
