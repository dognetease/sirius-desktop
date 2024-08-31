/* eslint-disable react/jsx-props-no-spreading */
import React, { useEffect, useState, useEffect, useMemo } from 'react';
import { Provider } from 'react-redux';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import { Form, Button } from 'antd';
import { api, apis, RequestBusinessaAddCompany as customerType, EdmCustomsApi, CustomerApi, GlobalSearchApi, resultObject } from 'api';
import SiriusMessage from '@web-common/components/UI/Message/SiriusMessage';
import store, { useAppSelector, useAppDispatch } from '@web-common/state/createStore';
import { getCompanyCheckRules, getFieldState } from '@web-common/state/reducer/customerReducer';
import { cloneDeep } from 'lodash';
import ReactDOM from 'react-dom';
import style from './createNewClientModal.module.scss';
import { ReactComponent as AddIcon } from '@/images/icons/edm/add.svg';
import { customerFormList, customerContact, formListItem as formListItemType, customerContactType } from './config';
import FormComponents from '../../../components/commonForm/FormComponents';
import { fromatContact, isEmpty, isSpEmpty, checkPictures, checkOtherItems } from '../../../utils/format';
import CheckAllFields from '../checkAllFields/checkAllFields';
import useCheckCustomerFields from '../../../components/hooks/useCustomerFields';
import { getIn18Text } from 'api';

const edmCustomsApi = api.requireLogicalApi(apis.edmCustomsApiImpl) as EdmCustomsApi;
const clientApi = api.requireLogicalApi(apis.customerApiImpl) as CustomerApi;

const globalSearchApi = api.requireLogicalApi(apis.globalSearchApiImpl) as GlobalSearchApi;
interface ComsProps {
  visible: boolean;
  onCancel: (param?: boolean) => void;
  onSuccess?: (res: any) => void;
  pageType: 'new' | 'edit'; // 页面状态 new edit
  companyId?: string;
  customerData: customerType;
  from?: string;
  // 只保留必须的联系人字段
  liteField?: string[];
  globalSearchSource?: number;
}

const modalStatus = {
  new: 'new',
  edit: 'edit',
};

const textMap = {
  ok_new: getIn18Text('CHUANGJIAN'),
  ok_edit: getIn18Text('BAOCUN'),
  title_new: getIn18Text('XINJIANKEHU'),
  title_edit: getIn18Text('BAOCUNKEHU'),
};

const scrollOption = {
  behavior: 'smooth',
  block: 'center',
  inline: 'center',
};
const repeatNumber = 1;

// 动态表格初始化
const defaultContactList = [{ main_contact: false, telephones: [{}], social_platform: [{}] }];

const CreateNewClientModal: React.FC<ComsProps> = ({ visible, pageType, onCancel, onSuccess, companyId, customerData, from, liteField, globalSearchSource }) => {
  const [form] = Form.useForm();
  const filteredCustomerContact = useMemo<customerContactType>(
    () =>
      liteField
        ? {
            ...customerContact,
            children: customerContact.children.filter(e => e.required || liteField.includes(e.name)),
          }
        : customerContact,
    [liteField]
  );
  const [customerList, setCustomerList] = useState<formListItemType[]>([]);
  const [contactsData, setContactsData] = useState<customerContactType>(filteredCustomerContact);
  const [radioValue, setRadioValue] = useState<number>(0);
  const globalField = useAppSelector(state => getFieldState(state.customerReducer));
  const [fieldVisible, setFieldVisible] = useState<boolean>(false);
  const [checkData, setCheckData] = useState<{ field: string; value: string; company_id?: string }>();
  const { initConfig, changeConfigList, onFinishFailed } = useCheckCustomerFields(setCustomerList, setContactsData);

  const appDispatch = useAppDispatch();
  useEffect(() => {
    appDispatch(getCompanyCheckRules());
  }, []);

  const asyncCheck = async (value: string, item: any, isError: boolean) => {
    console.log('xxxxx-evnet', value, item.isSubmit, item.selfMessage, isError);
    const Dom = () => (
      <div>
        {item.selfMessage || getIn18Text('ZIDUANZHONGFU')}
        <a
          style={{ paddingLeft: 5 }}
          onClick={() => {
            setCheckData({
              field: item.checkName || item.name,
              value,
              company_id: companyId,
            });
            setFieldVisible(true);
          }}
        >
          点击查重
        </a>
      </div>
    );
    if (!value) {
      return Promise.resolve();
    }
    if (item.isSubmit) {
      if (item.isMulChecked && isError) {
        return Promise.reject(Dom());
      }
      if (!item.isMulChecked && item.selfMessage) {
        return Promise.reject(Dom());
      }
      return Promise.resolve();
    }
    const params = {
      [item.checkName || item.name]: value,
      company_id: companyId,
    };
    const res = await clientApi.singleJudgeRepeat(params);
    console.log('xxx-check-reault', res);
    if (res.result) {
      if (res.fieldName === 'contactEmailSuffix') {
        item.checkName = 'email_suffix';
        value = value.substring(value.lastIndexOf('@') + 1);
      }
      return Promise.reject(Dom);
    }
    return Promise.resolve();
  };

  useEffect(() => {
    globalField && initConfig(globalField, customerFormList, filteredCustomerContact, asyncCheck);
    console.log('xxxglobalField', globalField);
  }, [globalField]);

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

  const getText = (type: 'ok' | 'title') => {
    if (type === 'ok') {
      return textMap[`${type}_${pageType}`];
    }
    return textMap[`${type}_${pageType}`];
  };

  /*
   *   提交事件
   */
  const formSubmit = () => {
    changeConfigList(true, customerList, contactsData);
    setTimeout(() => {
      form.submit();
    });
  };

  const finishFailed = () => {
    onFinishFailed(customerList, contactsData);
  };
  /*
   *   form onFinish
   */
  const onFinish = (formValues: any) => {
    const values = cloneDeep(formValues);
    const { contact_list } = values;
    console.log('company_logo', values);
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
        item.telephones = telephones.map(el => el.number);
      }
      if (birthday) {
        item.birthday = birthday.format('YYYY-MM-DD');
      }
      return item;
    });

    const isCheck = checkOtherItems(values);
    if (isCheck) {
      SiriusMessage.error({
        content: getIn18Text('CUNZAIBIAOQIANCHAOGUO10GEZIFU!'),
      });
      return;
    }

    const param = {
      ...values,
    };
    /**
     * 联系人和客户的新建和编辑
     */
    if (pageType === modalStatus.new) {
      clientApi.batchJudgeRepeat(param).then(checkResult => {
        console.log('checkResult', checkResult);
        if (!changeConfigList(false, customerList, contactsData, checkResult)) {
          let promise;
          if (from === 'globalSearch') {
            promise = globalSearchApi.addCustomer({
              ...param,
              sourceType: globalSearchSource,
            });
          } else if (from === 'emailPlus' || from === 'addressBook') {
            promise = clientApi.addNewClient(param);
          } else {
            promise = edmCustomsApi.customsAddCustomer(param);
          }
          promise.then(res => {
            SiriusMessage.success({
              content: getIn18Text('LURUKEHUCHENGGONG'),
            });
            onCancel(true);
            onSuccess && onSuccess(res);
          });
        } else {
          setTimeout(() => {
            form.submit();
          });
        }
      });
    }
  };

  const onCancelCallBack = () => {
    onCancel();
  };
  /*
   * addContact 新增联系人
   */
  const addContact = () => {
    const formData = form.getFieldsValue();
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
  useEffect(() => {
    if (pageType === modalStatus.new) {
      customerData.contact_list = customerData.contact_list.map(item => fromatContact(item));
      form.setFieldsValue(customerData);
    }
  }, []);

  console.log('form', customerFormList);
  return (
    <Modal
      title={getText('title')}
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
      okText={getText('ok')}
      cancelText={getIn18Text('QUXIAO')}
      destroyOnClose
      onCancel={onCancelCallBack}
      footer={[
        <Button key="cancel" onClick={onCancelCallBack}>
          {getIn18Text('QUXIAO')}
        </Button>,
        <Button key="submit" type="primary" onClick={formSubmit}>
          {getIn18Text('QUEDING')}
        </Button>,
      ]}
    >
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
          initialValues={{
            contact_list: [
              {
                telephones: [{}],
                social_platform: [{}],
              },
            ],
          }}
          scrollToFirstError={scrollOption as any}
          layout="vertical"
          labelAlign="left"
          name="dynamic_form_item"
          onFinishFailed={finishFailed}
          onFinish={onFinish}
        >
          <div className={style.modalContent}>
            <div className={style.modalContentClient}>
              <FormComponents list={customerList} companyId={companyId} />
            </div>
            {/* 联系人相关字段 */}
            <div className={style.modalContentContact}>
              <FormComponents list={contactsData} radioValue={radioValue} onRadioChange={onRadioChange} />
            </div>
          </div>
        </Form>
        {fieldVisible && <CheckAllFields checkData={checkData} visible={fieldVisible} onCancel={() => setFieldVisible(false)} />}
      </>
    </Modal>
  );
};
export default CreateNewClientModal;

export const createNewCustomerModal = (
  // eslint-disable-next-line camelcase
  props: {
    email?: string;
    contact_name?: string;
    onSuccess: (param?: resultObject) => void;
  },
  from: string = 'emailPlus',
  container?: HTMLElement
) => {
  const div = document.createElement('div');
  let parent: HTMLElement | null = container || document.body;
  const destroy = () => {
    if (parent) {
      ReactDOM.unmountComponentAtNode(div);
      parent.removeChild(div);
      parent = null;
    }
  };
  const data: any = {
    contact_list: [],
  };
  if (props.email || props.contact_name) {
    data.contact_list.push({
      email: props.email,
      contact_name: props.contact_name,
    });
  }
  const options: ComsProps = {
    visible: true,
    from,
    pageType: 'new',
    customerData: data as unknown as any,
    onSuccess(res: any) {
      props.onSuccess(res);
      destroy();
    },
    onCancel(isSuccess?: boolean) {
      if (!isSuccess) {
        destroy();
      }
    },
  };
  parent.appendChild(div);
  ReactDOM.render(
    <Provider store={store}>
      <CreateNewClientModal {...options} />
    </Provider>,
    div
  );
  return destroy;
};
