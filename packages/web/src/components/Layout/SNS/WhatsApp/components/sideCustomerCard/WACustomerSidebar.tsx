import { getIn18Text, api, apis, CustomerApi, CustomerDetail } from 'api';
/* eslint-disable camelcase */
import React, { useEffect, useState, useRef } from 'react';
import classnames from 'classnames';
import { Button, Radio, RadioChangeEvent, Space } from 'antd';
import { useAppDispatch, useAppSelector } from '@web-common/state/createStore';
import { CustomerCardActions } from '@web-common/state/reducer';
import { PageLoading } from '@/components/UI/Loading';
import { ReactComponent as WAIcon } from '@/images/icons/whatsApp/wa-icon-outline.svg';
import { ReactComponent as MailIcon } from '@/images/icons/edm/autoMarket/mail.svg';
import { ReactComponent as AccountIcon } from '@/images/icons/whatsApp/account.svg';
// import EditNewClientModal from '@/components/Layout/Customer/NewClient/components/CreateNewClientModal/createNewClientModal';

import style from './index.module.scss';
import { SidebarCustomerInfo } from '@/components/Layout/Customer/components/sidebar/customerInfo';
import { StrangerCard } from './strangerCard';
import { EditContactInfo } from '@/components/Layout/Customer/components/sidebar/component/contactList/editContact';
import * as defaultLogo from '@/images/icons/customerDetail/default-logo.png';
import { whatsAppTracker } from '../../../tracker';
import UniDrawer from '@/components/Layout/CustomsData/components/uniDrawer/uniDrawer';
import { getTransText } from '@/components/util/translate';

interface WACustomerSidebarProps {
  isNewBsp?: boolean;
  chatId?: string;
  snsInfo: {
    snsId: string;
    snsName: string;
    avatar?: string;
  };
  onBindCompanyChange?: (bindInfo: { whatsappId: string; companyId: string }) => void;
  className?: string;
  style?: React.CSSProperties;
  from?: string;
}

const customerApi = api.requireLogicalApi(apis.customerApiImpl) as CustomerApi;

// const getBindCompany = (id: string) => customerApi.getBindCustomerByWhatsAppId(id);
// const bindCompany = (snsId: string, companyId: string) => customerApi.bindWhatsAppIdToCompany({ whatsappId: snsId, companyId });

export enum ViewType {
  detail = 'detail',
  stranger = 'stanger',
  customerList = 'customerList',
}

export const WACustomerSidebar = (props: WACustomerSidebarProps) => {
  const { isNewBsp, snsInfo, onBindCompanyChange, className, style: styleFromProps, from, chatId } = props;
  const { snsId, snsName, avatar } = snsInfo;
  const [loading, setLoading] = useState(false);
  const [viewType, setViewType] = useState<ViewType>(ViewType.stranger); // 'stranger', 'customerList',
  const [customerList, setCustomerList] = useState<CustomerDetail[]>([]);
  const [detail, setDetail] = useState<CustomerDetail>();
  const [editView, setEditView] = useState<string>();
  const [editContactId, setEditContactId] = useState<string>();
  const [companyIdToBind, setCompanyIdToBind] = useState<string>();
  const dispatch = useAppDispatch();
  const snapshots = useAppSelector(state => state.customerCardReducer.snapshots);
  const [snapshotValues, setSnapshotValues] = useState<Record<string, any>>();
  const [editCompanyVisible, setEditCompanyVisible] = useState(false);
  const customerInfoRef = useRef<any>(null);

  const getBindCompany = (id: string) => (isNewBsp ? customerApi.getBspBindCustomerByWhatsAppId(chatId!) : customerApi.getBindCustomerByWhatsAppId(id));
  const bindCompany = (waId: string, companyId: string) =>
    isNewBsp ? customerApi.bspBindWhatsAppIdToCompany({ whatsappId: chatId!, companyId }) : customerApi.bindWhatsAppIdToCompany({ whatsappId: waId, companyId });

  const fetchList = (whatsappId: string) =>
    customerApi.getCustomerListByWhatsAppId(whatsappId).then(res => {
      if (res.resourceIdList.length === 0) {
        setViewType(ViewType.stranger);
      } else {
        setCustomerList(res.resourceIdList);
        setCompanyIdToBind(res.resourceIdList[0].company_id);
        setViewType(ViewType.customerList);
      }
    });

  const fetchDetail = (company_id: string) => customerApi.getCustomerDetail({ company_id }).then(res => setDetail(res));

  const onChatChange = async (whatsappId: string) => {
    try {
      setLoading(true);
      const lastBindCompany = await getBindCompany(whatsappId);
      if (lastBindCompany) {
        setDetail(lastBindCompany);
        setViewType(ViewType.detail);
        onBindCompanyChange && onBindCompanyChange({ whatsappId, companyId: lastBindCompany.company_id });
      } else {
        await fetchList(whatsappId);
      }
    } catch (e) {
      setViewType(ViewType.stranger);
      console.warn(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (snsInfo.snsId && detail?.company_id) {
      const key = snsId + '_' + detail.company_id;
      // console.log('snapshort', key, snapshots[key]);
      if (snapshots[key]) {
        const snapshot = snapshots[key];
        setSnapshotValues(snapshot.formValues);
        setEditView(snapshot.editView);
      } else {
        setSnapshotValues(undefined);
        setEditView(undefined);
      }
    } else {
      setEditView(undefined);
    }
  }, [snsInfo.snsId, detail?.company_id]);

  const handleAddToCompanyCallback = async (companyId: string) => {
    // 绑定，成功后获取绑定信息
    try {
      setLoading(true);
      await bindCompany(snsId, companyId);
      // uni接入后，绑定成功后会有延时，暂时请求3次处理
      const req = retryReq<CustomerDetail>(
        () =>
          getBindCompany(snsId).then(v => {
            if (!v) {
              throw new Error('empty CompnayInfo');
            }
            return v;
          }),
        4,
        count => count * 1000
      );
      const lastBindCompany = await req();
      if (lastBindCompany) {
        setDetail(lastBindCompany);
        setViewType(ViewType.detail);
        onBindCompanyChange && onBindCompanyChange({ whatsappId: snsId, companyId: lastBindCompany.company_id });
      } else {
        setViewType(ViewType.stranger);
      }
    } catch (e) {
      setViewType(ViewType.stranger);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (snsId) {
      onChatChange(snsId);
    }
  }, [snsId]);

  useEffect(() => {
    whatsAppTracker.trackSidebarShow(from || 'wa-personal');
  }, []);

  const handleChange = (e: RadioChangeEvent) => {
    setCompanyIdToBind(e.target.value);
  };

  const handleStartEditContact = (contactId: string) => {
    setEditContactId(contactId);
    setEditView('contactInfo');
  };

  const handleEditContactChange = (_: any, allValues: any) => {
    // 保存到redux
    const key = snsInfo.snsId + '_' + detail?.company_id;
    dispatch(
      CustomerCardActions.updateSnapshot({
        key,
        snapshot: {
          editView: 'contactInfo',
          formValues: allValues,
        },
      })
    );
  };

  const handleCloseEditInfo = (succ?: boolean) => {
    setEditView(undefined);
    const key = snsInfo.snsId + '_' + detail?.company_id;
    dispatch(CustomerCardActions.removeKey(key));
    if (succ && detail) {
      fetchDetail(detail.company_id);
      customerInfoRef.current?.refreshContactList();
    }
  };

  // const handleEditCompanyCallback = (success?: boolean) => {
  //   setEditCompanyVisible(false);
  //   if (success && detail) {
  //     fetchDetail(detail.company_id);
  //   }
  // };
  const handleEditCompanyCallback = (id?: number, data?: any) => {
    if (String(id) === detail?.company_id && data) {
      // 更新
      console.log('uniCallback', id, data);
      setDetail({
        ...detail,
        ...data,
      });
    }
  };

  const snsIdRow = (
    <div className={style.strangerInfo}>
      <WAIcon />
      <span>
        {/* WhatsApp号码： */}
        {snsId}
      </span>
    </div>
  );

  return (
    <div className={classnames(style.waSidebar, className, 'customer-global-style')} style={styleFromProps}>
      {ViewType.customerList === viewType && (
        <div className={style.customerList}>
          <div className={style.scroller}>
            <p>
              {getTransText('WAIMAOTONGYIZIDONGWEININPIPEIDAO')}
              {customerList.length}
              {getTransText('QINGXUANZEXIANGYAOGUANLIANDEKEHU')}
            </p>
            <div className={style.customerListWrap}>
              <Radio.Group onChange={handleChange} value={companyIdToBind} style={{ width: '100%' }}>
                <Space direction="vertical" style={{ width: '100%' }}>
                  {customerList.map(customer => {
                    const contact = customer.contact_list ? customer.contact_list[0] : undefined;
                    return (
                      <div
                        key={customer.company_id}
                        onClick={() => setCompanyIdToBind(customer.company_id)}
                        className={classnames(style.customerListItem, customer.company_id === companyIdToBind ? style.selectedCustomer : '')}
                      >
                        <Radio value={customer.company_id} />
                        <div className={style.customerInfoBox}>
                          <div className={style.customerLeft}>
                            <h3>{customer.company_name}</h3>
                            <div className={style.contactRow}>
                              <AccountIcon />
                              <span>{contact?.contact_name}</span>
                            </div>
                            <div className={style.contactRow}>
                              <MailIcon />
                              <span>{contact?.email}</span>
                            </div>
                            <div className={style.contactRow}>
                              <WAIcon />
                              <span>{contact?.whats_app}</span>
                            </div>
                          </div>
                          <img alt="logo" width="50" height="50" src={customer?.company_logo || defaultLogo} />
                        </div>
                      </div>
                    );
                  })}
                </Space>
              </Radio.Group>
            </div>
          </div>
          <div className={style.customerFooter}>
            <Button type="primary" disabled={!companyIdToBind} onClick={() => companyIdToBind && handleAddToCompanyCallback(companyIdToBind)} block>
              {getIn18Text('QUEDING')}
            </Button>
          </div>
        </div>
      )}
      {ViewType.detail === viewType && detail !== undefined ? (
        <SidebarCustomerInfo
          ref={customerInfoRef}
          info={detail}
          hideAddOpportunity // 隐藏新建商机按钮
          onEdit={() => setEditCompanyVisible(true)}
          onEditContact={handleStartEditContact}
          hasBusiness={false}
          actionKeys={['edit', 'newSchedule', 'newFollow']}
          role="myCustomer"
        />
      ) : null}
      {ViewType.stranger === viewType && (
        <StrangerCard
          info={{
            snsName,
            snsId,
            avatar,
          }}
          customInfoRows={[snsIdRow]}
          onAddToCompanyCallback={handleAddToCompanyCallback}
        />
      )}
      {loading ? <PageLoading /> : null}
      {/* {
        editCompanyVisible && (
          <EditNewClientModal
            visible={editCompanyVisible}
            pageType="edit"
            companyId={detail?.company_id}
            onCancel={handleEditCompanyCallback}
          />
        )
      } */}
      {ViewType.detail === viewType && detail && editView === 'contactInfo' && (
        <EditContactInfo
          visible={editView === 'contactInfo'}
          resourceId={detail.company_id}
          contactId={editContactId as string}
          initValues={snapshotValues}
          contactType="company"
          onClose={handleCloseEditInfo}
          onFormChange={handleEditContactChange}
        />
      )}
      <UniDrawer
        visible={editCompanyVisible}
        customerId={detail?.company_id as any}
        onClose={() => setEditCompanyVisible(false)}
        onSuccess={handleEditCompanyCallback}
        source="waCustomer"
      />
    </div>
  );
};

function retryReq<T>(asyncFunc: () => Promise<T>, retryTimes: number, intervalFn: (count: number) => number) {
  let count = 0;
  const req = (resolve: (value: T) => void, reject: (reason: any) => void) => {
    console.log('retryReq', count);
    asyncFunc().then(
      data => {
        resolve(data);
      },
      err => {
        count++;
        if (count > retryTimes) {
          reject(err);
          return;
        }
        setTimeout(() => req(resolve, reject), intervalFn(count));
      }
    );
  };
  return function () {
    return new Promise<T>((resolve, reject) => {
      req(resolve, reject);
    });
  };
}
