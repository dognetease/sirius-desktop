import React, { useEffect, useState } from 'react';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import style from './createNewClueModal.module.scss';
import { Form } from 'antd';
import { ReactComponent as AddIcon } from '@/images/icons/edm/add.svg';
import { apiHolder, apis, CustomerApi } from 'api';
const clientApi = apiHolder.api.requireLogicalApi(apis.customerApiImpl) as CustomerApi;
import SiriusMessage from '@web-common/components/UI/Message/SiriusMessage';
import { customerFormList, customerContact } from './config';
import FormComponents from '../../../components/commonForm/FormComponents';
import { fromatContact, isEmpty, isSpEmpty, checkOtherItems } from '../../../utils/format';
import { cloneDeep } from 'lodash';
import { clueDataTracker, HandlerClueType } from '../../../tracker/clueDataTracker';
import { getIn18Text } from 'api';
interface ComsProps {
  visible: boolean;
  width: number; // 408 768
  onCancel: (param?: boolean) => void;
  companyId?: string;
  id?: string;
  pageType: 'new' | 'edit'; // 页面状态 new edit
  isContact: boolean; // 是否是联系人
}
const modalStatus = {
  new: 'new',
  edit: 'edit',
};
const textMap = {
  ok_new: getIn18Text('CHUANGJIAN'),
  ok_edit: getIn18Text('BAOCUN'),
  title_new: getIn18Text('XINJIANXIANSUO'),
  title_edit: getIn18Text('BAOCUNXIANSUO'),
  contact_title_new: getIn18Text('XINZENGLIANXIREN'),
  contact_title_edit: getIn18Text('BAOCUNLIANXIREN'),
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
const scrollOption = {
  behavior: 'smooth',
  block: 'center',
  inline: 'center',
};
const NewBusinessModal: React.FC<ComsProps> = ({ visible, width, onCancel, pageType, isContact, companyId, id }) => {
  const [form] = Form.useForm();
  const [customerList, setCustomerList] = useState(customerFormList);
  const [radioValue, setRadioValue] = useState<number>(0);
  const getText = (type: 'ok' | 'title') => {
    if (type === 'ok') {
      return textMap[`${type}_${pageType}`];
    }
    if (isContact) {
      return textMap[`contact_${type}_${pageType}`];
    }
    return textMap[`${type}_${pageType}`];
  };
  useEffect(() => {
    // if (pageType === modalStatus.new) {
    // }
    if (pageType === modalStatus.edit) {
      console.log('id-10-detail', id, isContact);
      /*
       * 线索编辑
       */
      if (!isContact && id) {
        clientApi.getClueDetail({ id }).then(res => {
          res.contact_list = res.contact_list.map((item, index) => {
            return fromatContact(item);
          });
          if (isEmpty(res.contact_list)) {
            res.contact_list = [...initContactList] as any;
          }
          console.log('id-10', res);
          form.setFieldsValue(res);
        });
      }
    }
  }, [id]);
  /*
   *   提交事件
   */
  const formSubmit = () => {
    form.submit();
  };
  /*
   *   form onValuesChange
   *   隐藏以后注意值需要手动销毁from中存储的值
   */
  // const onValuesChange = (value) => {
  //     console.log('value', value);
  // }
  /*
   *   form onFinish
   */
  const onFinish = (values: any) => {
    let formValues = cloneDeep(values);
    console.log('formValues', formValues);
    const { contact_list } = formValues;
    // 处理电话和平台为空的情况
    formValues.contact_list.map(item => {
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
      if (Object.keys(item).length === 1) {
        delete item.main_contact;
      }
      return item;
    });
    if (isSpEmpty(contact_list)) {
      formValues.contact_list = [];
    }
    const param = {
      ...formValues,
    };
    /**
     * 线索新建
     */
    if (pageType === modalStatus.new) {
      clueDataTracker.trackHandlerClue(HandlerClueType.ConfirmNew);
      clientApi.addNewClue(param).then(res => {
        SiriusMessage.success({
          content: getIn18Text('CHUANGJIANCHENGGONG'),
        });
        onCancel(true);
      });
    }
    /**
     * 线索编辑
     */
    if (pageType === modalStatus.edit) {
      param.id = id;
      clientApi.editClue(param).then(res => {
        SiriusMessage.success({
          content: getIn18Text('BAOCUNCHENGGONG'),
        });
        onCancel(true);
      });
    }
  };
  /*
   * onCancelCallBack
   */
  const onCancelCallBack = () => {
    onCancel();
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
      let arrElements = document.getElementsByClassName('contactItemScrollCard');
      let index = arrElements.length - 1;
      let element = arrElements[index];
      // 滚动到指定区域
      element.scrollIntoView({ behavior: 'smooth', inline: 'nearest' });
    });
  };
  /*
   * 更改主联系人
   */
  const onRadioChange = value => {
    setRadioValue(value.target.value);
    let formData = form.getFieldsValue();
    formData.contact_list = formData.contact_list.map((item, index) => {
      item.main_contact = Number(value.target.value) === index;
      return item;
    });
    form.setFieldsValue(formData);
  };
  return (
    <Modal
      title={getText('title')}
      getContainer={false}
      wrapClassName={style.createClueModalWrap}
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
        initialValues={{ contact_list: [{ telephones: [{}], social_platform: [{}] }] }}
        scrollToFirstError={scrollOption as any}
        layout="vertical"
        labelAlign="left"
        name="dynamic_form_item"
        onFinish={onFinish}
      >
        <div className={style.modalContent}>
          <div className={style.modalContentContact}>
            <div className={style.modalHeader}>
              <span className={style.modalHeaderLeft}>{getIn18Text('JIBENXINXI')}</span>
            </div>
            <FormComponents list={customerList} />
            <div className={style.modalHeader}>
              <div className={style.modalHeaderRight}>
                <span>{getIn18Text('LIANXIREN')}</span>
                <span className={style.addBtn} onClick={addContact}>
                  <AddIcon />
                  {getIn18Text('XINZENG')}
                </span>
              </div>
            </div>
            <FormComponents list={customerContact} multiple={true} radioValue={radioValue} onRadioChange={onRadioChange} />
          </div>
        </div>
      </Form>
    </Modal>
  );
};
export default NewBusinessModal;
