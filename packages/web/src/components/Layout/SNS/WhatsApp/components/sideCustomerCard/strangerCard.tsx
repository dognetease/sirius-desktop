import React, { useState } from 'react';
import { Tabs } from 'antd';
import classnames from 'classnames';
import { ContactDetail, RequestBusinessaAddCompany } from 'api';

import { EmptyList } from '@web-edm/components/empty/empty';
import CustomerPicker from '@web-edm/addressBook/components/CustomerPicker';
import EditNewClientModal from '@/components/Layout/Customer/NewClient/components/CreateNewClientModal/createNewClientModal';

import { AddManagerIcon, AddCustomerIcon } from '@/components/Layout/Customer/components/sidebar/component/icons';
import * as defaultLogo from '@/images/icons/customerDetail/default-logo.png';
import style from './index.module.scss';
import UniDrawer from '@/components/Layout/CustomsData/components/uniDrawer/uniDrawer';
import { getTransText } from '@/components/util/translate';
import { getIn18Text } from 'api';

interface StrangerCardProps {
  info: {
    avatar?: string | React.ReactNode;
    snsName: string;
    snsId: string;
  };
  customInfoRows?: React.ReactNode[];
  onAddToCompanyCallback?: (companyId: string) => void;
}

const { TabPane } = Tabs;

const EmptyTip = (
  <EmptyList>
    <div>{getTransText('ZHUANWEIKEHUHOUKESHIYONGDONGTAIDENGGONGNENG')}</div>
  </EmptyList>
);

export const StrangerCard = (props: StrangerCardProps) => {
  const { info, customInfoRows, onAddToCompanyCallback } = props;

  const [customerPickerVisible, setCustomerPickerVisible] = useState(false);
  const [addToCompany, setAddToCompany] = useState<{ visible: boolean; companyId: string; contacts: Partial<ContactDetail>[] }>();
  const [createCompanyVisible, setCreateCompanyVisible] = useState(false);
  const [companyInitData, setCompanyInitData] = useState<Partial<RequestBusinessaAddCompany>>();
  const [pickedId, setPickedId] = useState<string>();

  const [uniState, setUniState] = useState<{
    visible: boolean;
    customerData?: Partial<RequestBusinessaAddCompany>;
    customerId?: number;
  }>({
    visible: false,
  });

  const handleAddCustomer = () => {
    // setCreateCompanyVisible(true);
    // setCompanyInitData({
    //   contact_list: [{
    //     contact_name: info.snsId,
    //     whats_app: info.snsId
    //   }]
    // });

    setUniState({
      visible: true,
      customerData: {
        contact_list: [
          {
            contact_name: info.snsId,
            whats_app: info.snsId,
          },
        ],
      },
    });
  };
  const handleAddContact = () => {
    setCustomerPickerVisible(true);
  };
  // eslint-disable-next-line camelcase
  const handleCreatedCompany = (companyDetail: { company_id: string }) => {
    if (companyDetail && onAddToCompanyCallback) {
      // bind
      onAddToCompanyCallback(companyDetail.company_id);
    }
  };
  const handleUniSuccess = (id?: number) => {
    if (!onAddToCompanyCallback) return;
    if (id) {
      // bind
      onAddToCompanyCallback(String(id));
    } else if (pickedId) {
      onAddToCompanyCallback(pickedId);
    }
  };
  return (
    <div className={style.emptyTipCard}>
      <div className={style.header}>
        <div className={style.headerInfo}>
          <div className={style.headerInfoMain}>
            <div className={style.flexRow}>
              <span className={style.companyName} title={info.snsName}>
                {info.snsName}
              </span>
            </div>
            {customInfoRows?.map(row => (
              <div className={style.row}>{row}</div>
            ))}
          </div>
          <img alt="logo" width="50" height="50" src={info.avatar || defaultLogo} />
        </div>
        <div className={style.actions}>
          <div onClick={handleAddCustomer} className={style.actionButton}>
            <div className={style.actionIconWrap}>
              <AddCustomerIcon />
            </div>
            <div>{getIn18Text('addCustomer')}</div>
          </div>
          <div onClick={handleAddContact} className={style.actionButton}>
            <div className={style.actionIconWrap}>
              <AddManagerIcon />
            </div>
            <div>{getIn18Text('TIANJIADAOYIYOUKEHU')}</div>
          </div>
        </div>
      </div>
      <div className={style.body}>
        <Tabs className={classnames('waimao-tabs', style.flexTabs)}>
          <TabPane tab={getIn18Text('DONGTAI')} key="1">
            {EmptyTip}
          </TabPane>
          <TabPane tab={getIn18Text('JICHUXINXI')} key="2">
            {EmptyTip}
          </TabPane>
          <TabPane tab={getIn18Text('LIANXIREN')} key="3">
            {EmptyTip}
          </TabPane>
          <TabPane tab={getIn18Text('WANGLAIYOUJIAN')} key="4">
            {EmptyTip}
          </TabPane>
        </Tabs>
      </div>
      <CustomerPicker
        title={`将${info.snsName}添加至现有客户`}
        visible={customerPickerVisible}
        onCancel={() => {
          setCustomerPickerVisible(false);
          setAddToCompany(undefined);
        }}
        onOk={(companyId: string) => {
          setCustomerPickerVisible(false);
          setPickedId(companyId);
          setUniState({
            visible: true,
            customerId: companyId as any,
            customerData: {
              contact_list: [
                {
                  contact_name: info.snsName,
                  whats_app: info.snsId,
                },
              ],
            },
          });
        }}
      />
      {addToCompany?.visible ? (
        <EditNewClientModal
          visible={Boolean(addToCompany?.visible)}
          pageType="edit"
          companyId={addToCompany.companyId}
          afterCompanyDetailFetched={detail => {
            detail.contact_list = [...(detail.contact_list || []), ...addToCompany.contacts] as any;
            return detail;
          }}
          onCancel={isSuccess => {
            if (isSuccess && onAddToCompanyCallback) {
              onAddToCompanyCallback(addToCompany.companyId);
            }
            setAddToCompany(undefined);
          }}
        />
      ) : null}
      {createCompanyVisible && (
        <EditNewClientModal
          visible={createCompanyVisible}
          pageType="new"
          canCreateBusiness={false}
          afterCompanyDetailFetched={detail =>
            ({
              ...detail,
              ...companyInitData,
            } as any)
          }
          onCancel={() => setCreateCompanyVisible(false)}
          onSuccess={handleCreatedCompany}
        />
      )}
      <UniDrawer
        visible={uniState.visible}
        customerId={uniState.customerId}
        customerData={uniState.customerData as any}
        onClose={() => setUniState({ visible: false })}
        onSuccess={handleUniSuccess}
        source="waStranger"
      />
    </div>
  );
};
