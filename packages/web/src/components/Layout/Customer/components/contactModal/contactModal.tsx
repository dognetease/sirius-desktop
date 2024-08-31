import React, { useEffect, useState } from 'react';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import style from './contactModal.module.scss';
import { Form } from 'antd';
import { apiHolder, apis, CustomerApi } from 'api';
const clientApi = apiHolder.api.requireLogicalApi(apis.customerApiImpl) as CustomerApi;
import SiriusMessage from '@web-common/components/UI/Message/SiriusMessage';
import { allCustomerContact, clueContact } from './config';
import FormComponents from '../commonForm/FormComponents';
import { fromatContact, isSpEmpty } from '../../utils/format';
import { useAppSelector } from '@web-common/state/createStore';
import CheckAllFields from '../../NewClient/components/checkAllFields/checkAllFields';
import { getFieldState } from '@web-common/state/reducer/customerReducer';
import useCheckCustomerFields from '../hooks/useCustomerFields';
import { cloneDeep } from 'lodash';
import { getIn18Text } from 'api';
interface ComsProps {
  visible: boolean;
  width: number; // 408 768
  onCancel: (param?: boolean) => void;
  id?: string;
  contactId?: string;
  condition: string;
  pageType: 'new' | 'edit'; // 页面状态 new edit
  name: string;
}
const modalStatus = {
  new: 'new',
  edit: 'edit',
};
const textMap = {
  ok_new: getIn18Text('CHUANGJIAN'),
  ok_edit: getIn18Text('BAOCUN'),
  title_new: getIn18Text('XINJIANLIANXIREN'),
  title_edit: getIn18Text('BAOCUNLIANXIREN'),
  contact_title_new: getIn18Text('XINZENGLIANXIREN'),
  contact_title_edit: getIn18Text('BAOCUNLIANXIREN'),
};
// 动态表格初始化
const initContactList = [
  {
    main_contact: true,
    telephones: [{}],
    social_platform: [{}],
  },
];
const initClue = {
  contact_list: initContactList,
};
const NewBusinessModal: React.FC<ComsProps> = ({ visible, width, onCancel, pageType, contactId, id, condition, name }) => {
  const [form] = Form.useForm();
  const [checkValue, setCheckValue] = useState<boolean>(false);
  const [radioValue, setRadioValue] = useState<number>(1); //兼容客户模块 0 选中 1 未选中
  const [isEditMainContact, setIsEditMainContact] = useState<boolean>(false);
  const globalField = useAppSelector(state => getFieldState(state.customerReducer));
  const [contactsData, setContactsData] = useState<any>(() => allCustomerContact);
  const [fieldVisible, setFieldVisible] = useState<boolean>(false);
  const [checkData, setCheckData] = useState<{
    field: string;
    value: string;
    company_id?: string;
  }>();
  const { initConfig, changeConfigList, onFinishFailed } = useCheckCustomerFields(null, setContactsData);
  const asyncCheck = async (value: string, item: any, isError: boolean) => {
    const Dom = () => (
      <div>
        {item.selfMessage || getIn18Text('ZIDUANZHONGFU')}
        <a
          style={{ paddingLeft: 5 }}
          onClick={() => {
            setCheckData({
              field: item.checkName || item.name,
              value,
              company_id: id,
            });
            setFieldVisible(true);
          }}
        >
          {getIn18Text('DIANJICHAZHONG')}
        </a>
      </div>
    );
    if (!value) {
      return Promise.resolve();
    } else {
      if (item.isSubmit) {
        if (item.isMulChecked && isError) {
          return Promise.reject(Dom());
        }
        if (!item.isMulChecked && item.selfMessage) {
          return Promise.reject(Dom());
        }
        return Promise.resolve();
      } else {
        const params = {
          [item.checkName || item.name]: value,
          company_id: id,
        };
        let res = await clientApi.singleJudgeRepeat(params);
        console.log('xxx-check-reault', res);
        if (res.result) {
          if (res.fieldName === 'contactEmailSuffix') {
            item.checkName = 'email_suffix';
            value = value.substring(value.lastIndexOf('@') + 1);
          }
          return Promise.reject(Dom);
        } else {
          return Promise.resolve();
        }
      }
    }
  };
  useEffect(() => {
    globalField && initConfig(globalField, [], allCustomerContact, asyncCheck);
  }, [globalField]);
  const getText = (type: 'ok' | 'title') => {
    if (type === 'ok') {
      return textMap[`${type}_${pageType}`];
    }
    return textMap[`${type}_${pageType}`];
  };
  useEffect(() => {
    if (pageType === modalStatus.edit) {
      /*
       * 联系人编辑
       */
      let contactParam = {
        condition,
        contact_id: contactId,
      } as any;
      if (condition === 'clue') {
        contactParam.clue_id = id;
      }
      if (condition === 'company') {
        contactParam.company_id = id;
      }
      clientApi.contactDetail(contactParam).then(res => {
        console.log('获取联系人详情数据', res);
        // 组装成多个联系人格式
        form.setFieldsValue({
          contact_list: [fromatContact(res)],
        });
        // 设置主联系人
        if (condition === 'clue') {
          setCheckValue(res.main_contact);
        } else {
          setRadioValue(res.main_contact ? 0 : 1);
        }
        setIsEditMainContact(res.main_contact);
      });
    }
  }, []);
  /*
   *   提交事件
   */
  const formSubmit = () => {
    if (condition === 'company') {
      changeConfigList(true, [], contactsData);
      setTimeout(() => {
        form.submit();
      });
    } else {
      form.submit();
    }
  };
  const finishFailed = () => {
    onFinishFailed([], contactsData);
  };
  /*
   *  form onFinish
   */
  const onFinish = (values: any) => {
    let formValues = cloneDeep(values);
    const { contact_list } = formValues;
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
    const param = {
      ...formValues,
    };
    let contactParam = {
      condition,
      ...param.contact_list[0],
      main_contact: condition === 'clue' ? checkValue : radioValue === 0, // 是都添加主联系人
    };
    let customerCheck = {
      contact_list: [contactParam],
      company_id: '',
    };
    if (condition === 'clue') {
      contactParam.clue_id = id;
    }
    if (condition === 'company') {
      contactParam.company_id = id;
      customerCheck.company_id = id as string;
    }
    // 新建联系人的格式
    if (pageType === modalStatus.new) {
      if (condition === 'company') {
        clientApi.batchJudgeRepeat(customerCheck as any).then(checkResult => {
          if (!changeConfigList(false, [], contactsData, checkResult)) {
            clientApi.contactAdd(contactParam).then(res => {
              SiriusMessage.success({
                content: getIn18Text('CHUANGJIANCHENGGONG'),
              });
              onCancel(true);
            });
          } else {
            setTimeout(() => {
              form.submit();
            });
          }
        });
      } else {
        clientApi.contactAdd(contactParam).then(res => {
          SiriusMessage.success({
            content: getIn18Text('CHUANGJIANCHENGGONG'),
          });
          onCancel(true);
        });
      }
    } else {
      /**
       * 联系人编辑
       */
      contactParam.contact_id = contactId;
      if (condition === 'company') {
        clientApi.batchJudgeRepeat(customerCheck as any).then(checkResult => {
          if (!changeConfigList(false, [], contactsData, checkResult)) {
            clientApi.contactEdit(contactParam).then(res => {
              SiriusMessage.success({
                content: getIn18Text('BAOCUNCHENGGONG'),
              });
              onCancel(true);
            });
          } else {
            setTimeout(() => {
              form.submit();
            });
          }
        });
      } else {
        clientApi.contactEdit(contactParam).then(res => {
          SiriusMessage.success({
            content: getIn18Text('BAOCUNCHENGGONG'),
          });
          onCancel(true);
        });
      }
    }
  };
  /*
   * onCancelCallBack
   */
  const onCancelCallBack = () => {
    onCancel();
  };
  /*
   * 更改主联系人checkbox
   */
  const onRadioChange = value => {
    if (condition === 'clue') {
      setCheckValue(value.target.checked);
    } else {
      setRadioValue(value.target.value);
      let formData = form.getFieldsValue();
      formData.contact_list = formData.contact_list.map((item, index) => {
        item.main_contact = Number(value.target.value) === index;
        return item;
      });
      form.setFieldsValue(formData);
    }
  };
  return (
    <Modal
      title={getText('title')}
      getContainer={false}
      wrapClassName={style.createCustomerModalWrap}
      width={width}
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
      destroyOnClose={true}
      onCancel={onCancelCallBack}
    >
      <Form
        form={form}
        initialValues={initClue}
        onFinishFailed={condition === 'company' ? finishFailed : () => {}}
        layout="vertical"
        labelAlign="left"
        name="dynamic_form_item"
        onFinish={onFinish}
      >
        <div className={style.modalHeader}>
          <div className={style.modalHeaderRightContact}>
            <span>
              {condition === 'clue' ? getIn18Text('GUANLIANXIANSUO\uFF1A') : getIn18Text('GUANLIANKEHU\uFF1A')}
              {name}
            </span>
          </div>
        </div>
        <div className={style.modalContent}>
          <div className={style.modalContentContact}>
            <FormComponents
              list={condition === 'clue' ? clueContact : contactsData}
              checkValue={checkValue}
              radioValue={radioValue}
              isEditMainContact={isEditMainContact}
              onRadioChange={onRadioChange}
            />
          </div>
        </div>
        {fieldVisible && <CheckAllFields checkData={checkData} visible={fieldVisible} onCancel={() => setFieldVisible(false)} />}
      </Form>
    </Modal>
  );
};
export default NewBusinessModal;
