import React, { useEffect, useState } from 'react';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import { cloneDeep } from 'lodash';
import { Form, Button, Spin } from 'antd';
import { CustomerDiscoveryApi, apiHolder, apis } from 'api';
import SiriusMessage from '@web-common/components/UI/Message/SiriusMessage';
import { ReactComponent as AddIcon } from '@/images/icons/edm/add.svg';
import { customerFormList, customerContact } from './config';
import FormComponents from '../../../components/commonForm/FormComponents';
import { isSpEmpty, checkPictures, checkOtherItems } from '../../../utils/format';
import style from './style.module.scss';
import { getIn18Text } from 'api';
export interface CustomerData {}
export interface InitialForm {
  company_domain: string;
  company_name: string;
  contact_list: Array<{
    email: string;
    contact_name: string;
    main_contact: boolean;
  }>;
}
export interface CustomerModalProps {
  companyId?: string;
  visible: boolean;
  onCancel: () => void;
  extrData: any;
  onSubmit: (customerData: CustomerData, ids: string[], callBack?: () => void) => void | Promise<void>;
  callBack?: () => void;
}
const scrollOption = {
  behavior: 'smooth',
  block: 'center',
  inline: 'center',
};
// 动态表格初始化
const defaultContactList = [{ main_contact: false, telephones: [{}], social_platform: [{}] }];
const initContactList = [
  {
    main_contact: true,
    telephones: [{}],
    social_platform: [{}],
  },
];
const customerDiscoveryApi = apiHolder.api.requireLogicalApi(apis.customerDiscoveryApi) as CustomerDiscoveryApi;
export const CreateNewClientModal: React.FC<CustomerModalProps> = ({ visible, onCancel, onSubmit, companyId, callBack, extrData }) => {
  const [form] = Form.useForm();
  const [customerList] = useState(customerFormList);
  const [radioValue, setRadioValue] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [initialForm, setInitialForm] = useState<InitialForm>();
  async function fetchDate() {
    setDetailLoading(true);
    const res = await customerDiscoveryApi.getRegularCustomerDetail(extrData[0]);
    const detail = res.data || {};
    const contactList = detail?.receiverList?.length
      ? (detail.receiverList || []).map((receiver, index) => ({
          email: receiver.email,
          contact_name: receiver.name,
          main_contact: index === 0,
          telephones: [{}],
          social_platform: [{}],
        }))
      : initContactList;
    setInitialForm({
      company_domain: detail.regularCustomerDomain,
      company_name: detail.companyName,
      contact_list: contactList,
    });
    setDetailLoading(false);
  }
  useEffect(() => {
    if (extrData && extrData[0]) {
      fetchDate();
    }
  }, [extrData]);
  /*
   * 更改主联系人
   */
  const onRadioChange = value => {
    setRadioValue(value.target.value);
    const formData = form.getFieldsValue();
    formData.contact_list = formData.contact_list.map((item, index) => {
      item.main_contact = Number(value.target.value) === index;
      return item;
    });
    form.setFieldsValue(formData);
  };
  /*
   *   提交事件
   */
  const formSubmit = () => {
    form.submit();
  };
  /*
   *   form onFinish
   */
  const onFinish = (formValues: any) => {
    let values = cloneDeep(formValues);
    const { contact_list } = values;
    if (checkPictures(values)) {
      SiriusMessage.error({
        content: getIn18Text('TUPIANZHENGZAISHANGCHUAN\uFF0CQINGSHAOHOUZAISHI!'),
      });
      return;
    }
    // 处理电话和平台为空的情况
    contact_list.map(item => {
      const { social_platform, telephones, birthday } = item;
      if (isSpEmpty(social_platform)) {
        delete item.social_platform;
      }
      if (isSpEmpty(telephones)) {
        delete item.telephones;
      } else {
        item.telephones = telephones.map(el => {
          return el.number;
        });
      }
      if (birthday) {
        item.birthday = birthday.format('YYYY-MM-DD');
      }
      return item;
    });
    let isCheck = checkOtherItems(values);
    if (isCheck) {
      SiriusMessage.error({
        content: getIn18Text('CUNZAIBIAOQIANCHAOGUO20GEZIFU!'),
      });
      return;
    }
    // const param = {
    //   ...values
    // };
    if (onSubmit) {
      setLoading(true);
      Promise.resolve(onSubmit(values as CustomerData, extrData, callBack)).finally(() => setLoading(false));
    }
  };
  const onCancelCallBack = () => {
    onCancel();
    setLoading(false);
  };
  /*
   * addContact 新增联系人
   */
  const addContact = () => {
    let formData = form.getFieldsValue();
    formData.contact_list = [...formData.contact_list, ...defaultContactList];
    form.setFieldsValue(formData);
    console.log(form);
    setTimeout(() => {
      const arrElements = document.getElementsByClassName('contactItemScrollCard');
      const index = arrElements.length - 1;
      const element = arrElements[index];
      // 滚动到指定区域
      element.scrollIntoView({ behavior: 'smooth', inline: 'nearest' });
    });
  };
  /**
   * 页面初始
   */
  // useEffect(() => {
  //   form.setFieldsValue({ contact_list: initContactList });
  // }, []);
  return (
    <Modal
      title={getIn18Text('CHUANGJIAN')}
      getContainer={false}
      wrapClassName={style.createCustomerModalWrap}
      width="768"
      onOk={formSubmit}
      maskClosable={false}
      bodyStyle={{
        maxHeight: '436px',
        marginBottom: '16px',
        paddingTop: 0,
        paddingBottom: 0,
      }}
      visible={visible}
      okText={getIn18Text('XINJIANKEHU')}
      cancelText={getIn18Text('QUXIAO')}
      destroyOnClose={Boolean(true)}
      onCancel={onCancelCallBack}
      footer={[
        <Button key="cancel" onClick={onCancelCallBack}>
          {getIn18Text('QUXIAO')}
        </Button>,
        <Button key="submit" type="primary" loading={loading} onClick={formSubmit}>
          {getIn18Text('QUEDING')}
        </Button>,
      ]}
    >
      {detailLoading ? (
        <Spin />
      ) : (
        <>
          <div className={style.modalHeader}>
            <span className={style.modalHeaderLeft}>{getIn18Text('JIBENXINXI')}</span>
            <div className={style.modalHeaderRight}>
              <span>{getIn18Text('LIANXIREN')}</span>
              <span className={style.addBtn} onClick={addContact}>
                <AddIcon />
                {getIn18Text('XINZENG')}
              </span>
            </div>
          </div>
          <Form
            form={form}
            initialValues={initialForm}
            scrollToFirstError={scrollOption as any}
            layout="vertical"
            labelAlign="left"
            name="dynamic_form_item"
            onFinish={onFinish}
          >
            <div className={style.modalContent}>
              <div className={style.modalContentClient}>
                <FormComponents list={customerList} companyId={companyId} />
              </div>
              {/* 联系人相关字段 */}
              <div className={style.modalContentContact}>
                <FormComponents list={customerContact} radioValue={radioValue} onRadioChange={onRadioChange} />
              </div>
            </div>
          </Form>
        </>
      )}
    </Modal>
  );
};
