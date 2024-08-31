import React, { useEffect, useState } from 'react';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import style from './createNewClientModal.module.scss';
import { Form, Button, Checkbox } from 'antd';
import { ReactComponent as AddIcon } from '@/images/icons/edm/add.svg';
import { customerFormList, customerContact, formListItem as formListItemType, customerContactType } from './config';
import FormComponents from '../../../components/commonForm/FormComponents';
import { apiHolder, apis, CustomerApi, DataStoreApi, RequestBusinessaAddCompany as resDataType, CustomerDetail } from 'api';
const clientApi = apiHolder.api.requireLogicalApi(apis.customerApiImpl) as CustomerApi;
import { fromatContact, isEmpty, isSpEmpty, checkPictures, checkOtherItems } from '../../../utils/format';
import SiriusMessage from '@web-common/components/UI/Message/SiriusMessage';
import ClientBusinessModal from '../../../Business/components/CreateNewBusinessModal/createNewBussinessModal';
const dataStoreApi = apiHolder.api.getDataStoreApi() as DataStoreApi;
const CUSTOMER_CREATE_BUSINESS = 'CUSTOMER_CREATE_BUSINESS';
import { cloneDeep } from 'lodash';
import { useAppSelector } from '@web-common/state/createStore';
import CheckAllFields from '../checkAllFields/checkAllFields';
import { getFieldState } from '@web-common/state/reducer/customerReducer';
import useCheckCustomerFields from '../../../components/hooks/useCustomerFields';
import { customerDataTracker, AddCustomerType } from '../../../tracker/customerDataTracker';
import { getIn18Text } from 'api';

interface ComsProps {
  visible: boolean;
  onCancel: (param?: boolean) => void;
  pageType: 'new' | 'edit'; // 页面状态 new edit
  companyId?: string;
  afterCompanyDetailFetched?: (detail: CustomerDetail) => CustomerDetail;
  onSuccess?: (res: any) => void;
  canCreateBusiness?: boolean;
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

// 动态表格初始化
const defaultContactList = [{ main_contact: false, telephones: [{}], social_platform: [{}] }];
const initContactList = [
  {
    main_contact: true,
    telephones: [{}],
    social_platform: [{}],
  },
];

const CreateNewClientModal: React.FC<ComsProps> = ({ visible, pageType, onCancel, companyId, afterCompanyDetailFetched, canCreateBusiness = true, onSuccess }) => {
  const [form] = Form.useForm();
  const [customerList, setCustomerList] = useState<formListItemType[]>([]);
  const [contactsData, setContactsData] = useState<customerContactType>(() => customerContact);
  const [radioValue, setRadioValue] = useState<number>(0);
  const [isCreateBusiness, setIsCreateBusiness] = useState(true);
  const [currentCompanyId, setCurrentCompanyId] = useState<string>('');
  const globalField = useAppSelector(state => getFieldState(state.customerReducer));
  const [fieldVisible, setFieldVisible] = useState<boolean>(false);
  const [checkData, setCheckData] = useState<{ field: string; value: string; company_id?: string }>();
  const { initConfig, changeConfigList, onFinishFailed } = useCheckCustomerFields(setCustomerList, setContactsData);

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
      } else if (isError) {
        return Promise.resolve();
      } else {
        const params = {
          [item.checkName || item.name]: value,
          company_id: companyId,
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
    globalField && initConfig(globalField, customerFormList, customerContact, asyncCheck);
  }, [globalField]);

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
  const onFinish = (formValues: resDataType) => {
    let values = cloneDeep(formValues);
    const { contact_list } = values;
    console.log('company_logo', values, formValues);
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
        item.telephones =
          telephones &&
          telephones.map(el => {
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
          customerDataTracker.trackAddCustomer(AddCustomerType.ConfirmNew);
          clientApi.addNewClient(param).then(res => {
            const { company_id } = res;
            SiriusMessage.success({
              content: getIn18Text('CHUANGJIANCHENGGONG'),
            });
            if (isCreateBusiness) {
              setCurrentCompanyId(company_id);
            } else {
              onCancel(true);
              onSuccess && onSuccess(res);
            }
          });
        } else {
          setTimeout(() => {
            form.submit();
          });
        }
      });
    }
    if (pageType === modalStatus.edit) {
      param.company_id = companyId;
      clientApi.batchJudgeRepeat(param).then(checkResult => {
        console.log('checkResult', checkResult);
        if (!changeConfigList(false, customerList, contactsData, checkResult)) {
          clientApi.editCompany(param).then(res => {
            SiriusMessage.success({
              content: getIn18Text('BAOCUNCHENGGONG'),
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

  /**
   * 页面初始
   */
  useEffect(() => {
    console.log('页面打开page-open', pageType, companyId);
    form.setFieldsValue({ contact_list: initContactList }); // >>> 编辑和新增都临时添加
    if (pageType === modalStatus.new) {
      // 需要判断是否新建和编辑 main_contact
      let info = { contact_list: initContactList };
      if (afterCompanyDetailFetched) {
        info = afterCompanyDetailFetched(info as any);
      }
      form.setFieldsValue(info);
      const { data } = dataStoreApi.getSync(CUSTOMER_CREATE_BUSINESS);
      if (data) {
        let oldData = JSON.parse(data);
        setIsCreateBusiness(oldData);
      }
    }
    /**
     * 客户编辑
     */
    if (pageType === modalStatus.edit) {
      clientApi.getCompanyDetail(companyId as string).then(info => {
        if (!info) return;
        if (afterCompanyDetailFetched) {
          info = afterCompanyDetailFetched(info);
        }
        info.contact_list = info.contact_list.map((item, index) => {
          return fromatContact(item);
        });
        if (isEmpty(info.contact_list)) {
          info.contact_list = initContactList;
        }
        // 处理客户标签
        if (!isEmpty(info.label_list)) {
          info.label_list = info.label_list.map(item => item.label_name);
        }
        if (isEmpty(info.social_media)) {
          info.social_media = [{ type: '', number: '', name: '' }];
        }
        // 填充数据
        console.log('edit-info-3XXXXXXXXXXX', info);
        form.setFieldsValue(info);
      });
    }
  }, []);

  const onChangeBusiness = (value: boolean) => {
    setIsCreateBusiness(value);
    dataStoreApi.putSync(CUSTOMER_CREATE_BUSINESS, JSON.stringify(value), {
      noneUserRelated: false,
    });
  };

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
        paddingLeft: 0,
      }}
      visible={visible}
      okText={getText('ok')}
      cancelText={getIn18Text('QUXIAO')}
      destroyOnClose={true}
      onCancel={onCancelCallBack}
      footer={[
        canCreateBusiness && pageType === 'new' && (
          <Checkbox checked={isCreateBusiness} onChange={e => onChangeBusiness(e.target.checked)}>
            {getIn18Text('SHIFOUCHUANGJIANSHANGJI')}
          </Checkbox>
        ),
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
            social_media: [{}],
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
          onFinish={onFinish}
          onFinishFailed={finishFailed}
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
        {isCreateBusiness && Boolean(currentCompanyId) && (
          <ClientBusinessModal
            visible={isCreateBusiness && Boolean(currentCompanyId)}
            width={768}
            id={undefined}
            isCustomer={true}
            companyId={currentCompanyId as unknown as number}
            pageType={'new'}
            onCancel={() => {
              onCancel(true);
            }}
          />
        )}
        {fieldVisible && <CheckAllFields checkData={checkData} visible={fieldVisible} onCancel={() => setFieldVisible(false)} />}
      </>
    </Modal>
  );
};
export default CreateNewClientModal;
