import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import DownOutlined from '@ant-design/icons/DownOutlined';
import UpOutlined from '@ant-design/icons/UpOutlined';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import style from './createClientBussinessModal.module.scss';
import { Form } from 'antd';
import { ReactComponent as AddIcon } from '@/images/icons/edm/add.svg';
import { businessList as originBusinessList, customerContact, customerFormList } from './config';
import FormComponents from '../../../components/commonForm/FormComponents';
import { apiHolder, apis, CustomerApi } from 'api';
import { clueToClientBusiness, fromatContact, isEmpty } from '../../../utils/format';
import SiriusMessage from '@web-common/components/UI/Message/SiriusMessage';
import { cloneDeep } from 'lodash';
import useCheckCustomerFields from '../../../components/hooks/useCustomerFields';
import store, { useAppSelector } from '@web-common/state/createStore';
import CheckAllFields from '../../../NewClient/components/checkAllFields/checkAllFields';
import { getFieldState } from '@web-common/state/reducer/customerReducer';
import { clueDataTracker, HandlerClueType } from '../../../tracker/clueDataTracker';
import ShowConfirm from '../../../components/confirm/makeSureConfirm';
import { Provider } from 'react-redux';
import { getIn18Text } from 'api';

const clientApi = apiHolder.api.requireLogicalApi(apis.customerApiImpl) as CustomerApi;

interface ComsProps {
  visible: boolean;
  width: number; // 408 768
  onCancel: (succ?: boolean) => void;
  clueId?: string;
  isBusiness: boolean; // 是否包含商机
}
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
const NewBusinessModal: React.FC<ComsProps> = ({ visible, width, onCancel, clueId, isBusiness }) => {
  const [form] = Form.useForm();
  const [customerList, setCustomerList] = useState<any>([]);
  const [contactsData, setContactsData] = useState<any>(() => customerContact);
  const [radioValue, setRadioValue] = useState<number>(0);
  const [height, setHeight] = useState<number>(0);
  // const {state} = useContext(customerContext).value;
  const baseSelect = useAppSelector(state => state.customerReducer.baseSelect);
  const [dealCode, setDealCode] = useState<number>(5);
  const globalField = useAppSelector(state => getFieldState(state.customerReducer));
  const [fieldVisible, setFieldVisible] = useState<boolean>(false);
  const [modalOkBtnLoading, setModalOkBtnLoading] = useState<boolean>(false);
  const [checkData, setCheckData] = useState<{
    field: string;
    value: string;
    company_id?: string;
  }>();
  const { initConfig, changeConfigList, onFinishFailed } = useCheckCustomerFields(setCustomerList, setContactsData);
  const asyncCheck = async (value: string, item: any, isError: boolean) => {
    const Dom = () => (
      <div>
        {item.selfMessage || getIn18Text('ZIDUANZHONGFU')}
        <a
          style={{ paddingLeft: 5 }}
          onClick={() => {
            setCheckData({ field: item.checkName || item.name, value });
            setFieldVisible(true);
          }}
        >
          {getIn18Text('DIANJICHAZHONG')}
        </a>
      </div>
    );
    console.log('xxxxx-evnet', value, item, 'isError', isError);
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
        };
        let res = await clientApi.singleJudgeRepeat(params);
        console.log('xxx-check-reault', res);
        if (res.result) {
          if (res.fieldName === 'contactEmailSuffix') {
            item.checkName = 'email_suffix';
            value = value.substring(value.lastIndexOf('@') + 1);
          }
          return Promise.reject(Dom());
        } else {
          return Promise.resolve();
        }
      }
    }
  };
  // 弹窗状态变化的时候取消loading
  useEffect(() => {
    setModalOkBtnLoading(false);
  }, [visible]);

  useEffect(() => {
    globalField && initConfig(globalField, customerFormList, customerContact, asyncCheck);
    console.log('xxxglobalField', globalField);
  }, [globalField]);
  useEffect(() => {
    baseSelect?.businessStages?.forEach(element => {
      if (element.type === 1) {
        setDealCode(element.value);
      }
    });
  }, [baseSelect?.businessStages]);
  const businessListInit = () => {
    return originBusinessList
      .filter(item => !item.isHidden)
      .map(item => {
        // 转商机，剔除关闭和重新打开
        if (item.name === 'stage') {
          item.options = baseSelect.businessStages.filter(el => el.value !== 6 && el.value !== 7);
        }
        return item;
      });
  };
  const [businessList, setBusinessList] = useState<any[]>(businessListInit);
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
    console.log('xxxxxx-changefrom', value.target.value, formData);
    form.setFieldsValue(formData);
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
  /*
   *   form onValuesChange
   *   隐藏以后注意值需要手动销毁from中存储的值
   */
  const onValuesChange = value => {
    const { stage } = value;
    if (stage) {
      /*
       *  显示成交相关信息
       */
      if (Number(stage) === dealCode) {
        setBusinessList(originBusinessList);
      } else {
        /*
         *  隐藏成交相关信息
         */
        setBusinessList(businessListInit);
      }
    }
  };
  /*
   *   form onFinish
   */
  const onFinish = values => {
    setModalOkBtnLoading(true);
    let formValues = cloneDeep(values);
    // 成交日期
    if (formValues.deal_at) {
      formValues.deal_at = formValues.deal_at.startOf('day').unix() * 1000;
    }
    let params = clueToClientBusiness(formValues, clueId, isBusiness);
    let clientParms = params.customer;
    clientApi.batchJudgeRepeat(clientParms).then(checkResult => {
      console.log('checkResult', checkResult, customerList, contactsData);
      if (!changeConfigList(false, customerList, contactsData, checkResult)) {
        clueDataTracker.trackHandlerClue(HandlerClueType.ConfirmClueToCustomer);
        clientApi.changeTOCustomer(params).then(res => {
          SiriusMessage.success({
            content: getIn18Text('CHUANGJIANCHENGGONG'),
          });
          onCancel(res);
        });
      } else {
        setModalOkBtnLoading(false);
        setTimeout(() => {
          form.submit();
        });
      }
    });
  };
  const finishFailed = () => {
    setModalOkBtnLoading(false);
    onFinishFailed(customerList, contactsData);
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
  /**
   * 页面初始
   */
  useEffect(() => {
    if (clueId) {
      clientApi.getClueDetail({ id: clueId }).then(res => {
        res.contact_list = res.contact_list.map((item, index) => {
          return fromatContact(item);
        });
        if (isEmpty(res.contact_list)) {
          res.contact_list = initContactList as any;
        }
        res.name = ''; // 剔除掉线索name值
        console.log('client-id-10', res);
        form.setFieldsValue(res);
        console.log('id-10-detail', form.getFieldsValue());
      });
    }
  }, []);
  const changeCollapse = () => {
    setHeight(height ? 0 : 10000);
    setTimeout(() => {
      let arrElements = document.getElementsByClassName('contactItemScrollCard');
      let element = arrElements[0];
      // 滚动到指定区域
      element.scrollIntoView({ behavior: 'smooth', inline: 'nearest' });
    });
  };
  return (
    <Modal
      title={getIn18Text('WANSHANKEHUZILIAO')}
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
      confirmLoading={modalOkBtnLoading}
      okText={getIn18Text('BAOCUN')}
      cancelText={getIn18Text('QUXIAO')}
      destroyOnClose={true}
      onCancel={onCancelCallBack}
    >
      <>
        <div className={style.modalHeader}>
          {false ? (
            <>
              <div className={style.modalHeaderRightContact}>
                <span>
                  {getIn18Text('GUANLIANGONGSI\uFF1A')}
                  {'companyName'}
                </span>
              </div>
            </>
          ) : (
            <>
              <span className={style.modalHeaderLeft}>{getIn18Text('JIBENXINXI')}</span>
              <div className={style.modalHeaderRight}>
                <span>{getIn18Text('LIANXIREN')}</span>
                <span className={style.addBtn} onClick={addContact}>
                  <AddIcon />
                  {getIn18Text('XINZENG')}
                </span>
              </div>
            </>
          )}
        </div>
        <Form
          form={form}
          initialValues={{ contact_list: [{ telephones: [{}], social_platform: [{}] }] }}
          onValuesChange={onValuesChange}
          scrollToFirstError={scrollOption as any}
          layout="vertical"
          labelAlign="left"
          name="dynamic_form_item"
          onFinishFailed={() => finishFailed()}
          onFinish={onFinish}
        >
          <div className={style.modalContent}>
            <div className={style.modalContentClient}>
              {/* 客户相关字段 */}
              {isBusiness ? (
                <>
                  <FormComponents className={style.nameBox} list={customerList.slice(0, 1)} />
                  <div style={{ maxHeight: height, overflow: height ? 'visible' : 'hidden', transition: '0.5s' }}>
                    <FormComponents className={style.nameBox} list={customerList.slice(1)} />
                  </div>
                </>
              ) : (
                <FormComponents list={customerList} />
              )}
              {/* 商机相关字段 */}
              {isBusiness && (
                <div className={style.handlerItem} onClick={changeCollapse}>
                  {height ? (
                    <>
                      {getIn18Text('SHOUQIXINXI')}
                      <UpOutlined />
                    </>
                  ) : (
                    <>
                      {getIn18Text('ZHANKAITIANXIEGENGDUOXINXI')}
                      <DownOutlined />
                    </>
                  )}
                  <h3 className={style.businessTitle}>{getIn18Text('SHANGJIXINXI')}</h3>
                </div>
              )}
              {/* 商机相关字段 */}
              {isBusiness && <FormComponents list={businessList} />}
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
export default NewBusinessModal;
export type ClueToCustomerModalProps = Omit<ComsProps, 'width' | 'visible' | 'isBusiness'>;
export const confirmClueToCustomerModal = (props: ClueToCustomerModalProps, container?: HTMLElement) => {
  return new Promise<boolean>(resolve => {
    const title = getIn18Text('QUEDINGJIANGXIANSUOZHUANWEIKEHUBINGCHUANGJIANSHANGJI\uFF1F');
    ShowConfirm({
      title,
      okText: getIn18Text('QUEDING'),
      cancelText: getIn18Text('JINZHUANWEIKEHU'),
      makeSure: () => {
        resolve(true);
      },
      onCancel: () => {
        resolve(false);
      },
    });
  }).then(flag => {
    createClueToCustomerModal(props, flag, container);
  });
};
export const createClueToCustomerModal = (props: ClueToCustomerModalProps, createBO: boolean, container?: HTMLElement) => {
  const div = document.createElement('div');
  const parent = container || document.body;
  const destroy = () => {
    ReactDOM.unmountComponentAtNode(div);
    parent.removeChild(div);
  };
  const options: ComsProps = {
    ...props,
    width: 768,
    visible: true,
    isBusiness: createBO,
    onCancel(isSuccess?: boolean) {
      props.onCancel(isSuccess);
      destroy();
    },
  };
  parent.appendChild(div);
  ReactDOM.render(
    <Provider store={store}>
      <NewBusinessModal {...options} />
    </Provider>,
    div
  );
  return destroy;
};
