/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable indent */
import React, { useEffect, useState, useRef, useContext } from 'react';
import { Provider } from 'react-redux';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import { Form } from 'antd';
import ReactDOM from 'react-dom';
import store, { useAppSelector } from '@web-common/state/createStore';
import SiriusMessage from '@web-common/components/UI/Message/SiriusMessage';
import { apiHolder, apis, BaseInfoRes, CustomerApi } from 'api';
import moment from 'moment';
import { cloneDeep } from 'lodash';
import { customerDataTracker } from '../../../tracker/customerDataTracker';
import { businessListLeft as leftList, businessListRight as rightList } from './config';
import { businessDataTracker, HandlerBusinessType } from '../../../tracker/businessDataTracker';
import FormComponents from '../../../components/commonForm/FormComponents';
import style from './createNewBussinessModal.module.scss';
import { customerContext } from '../../../customerContext';
import { getIn18Text } from 'api';
const clientApi = apiHolder.api.requireLogicalApi(apis.customerApiImpl) as CustomerApi;
interface ComsProps {
  visible: boolean;
  width: number; // 408 768
  onCancel: (param?: boolean) => void;
  id?: string;
  companyId?: number; // PageType new
  pageType: 'new' | 'edit'; // 页面状态 new edit
  isCustomer?: boolean; // 是否客户唤起商机弹框
}
// type NORMAL(0, "普通阶段"),
// DEAL(1, "成交阶段"),
// CLOSE(2, "关闭阶段"),
// REOPEN(3, "重新打开");
// 0: {value: "1", label: "需求描述", children: []}
// 1: {value: "2", label: "报价", children: []}
// 2: {value: "3", label: "合同", children: []}
// 3: {value: "4", label: "发货", children: []}
// 4: {value: "5", label: "成交", children: []}
// 5: {value: "6", label: "关闭", children: []}
// 6: {value: "7", label: "重新打开", children: []}
const modalStatus = {
  new: 'new',
  edit: 'edit',
};
const textMap = {
  ok_new: getIn18Text('CHUANGJIAN'),
  ok_edit: getIn18Text('BAOCUN'),
  title_new: getIn18Text('XINJIANSHANGJI'),
  title_edit: getIn18Text('BAOCUNSHANGJI'),
};
const STAGE_CLOSE = '6'; // 固定值
const STAGE_REOPEN = '7'; // 固定值
const NewBusinessModal: React.FC<ComsProps> = ({ visible, width, onCancel, pageType, id, companyId, isCustomer }) => {
  const [currentStage, setCurrentStage] = useState(0);
  const originalStage = useRef(0);
  const baseSelect = useAppSelector(state => state.customerReducer.baseSelect);
  const initRightList = () => {
    return cloneDeep(rightList).map(item => {
      if (item.name === 'company_id') {
        item.disabled = pageType === modalStatus.edit || companyId ? true : false;
      }
      return item;
    });
  };
  const [currentLeftList, setCurrentLeftList] = useState(cloneDeep(leftList));
  const [currentRightList, setCurrentRightList] = useState(initRightList);
  const [allRightList, setAllRightList] = useState(initRightList); // 商机阶段和客户下拉存放
  const [dealCode, setDealCode] = useState<number>(() => {
    let code = 5;
    baseSelect?.businessStages?.forEach(element => {
      if (element.type === 1) {
        code = element.value;
      }
    });
    return code;
  });
  /**
   * 处理下拉数据
   */
  const handerStagesOptions = (list, stage?) => {
    return getOptions(list, stage);
  };
  const getOptions = (list, stage) => {
    // 新建或者成交阶段 不展示关闭和重新打开
    if (pageType === modalStatus.new || stage === Number(dealCode)) {
      return list.map(item => {
        if (item.name === 'stage') {
          item.options = baseSelect?.businessStages.filter(el => el.value !== Number(STAGE_CLOSE) && el.value !== Number(STAGE_REOPEN));
        }
        return item;
      });
    }
    // 6关闭状态 STAGE_CLOSE，展示全部
    if (stage === Number(STAGE_CLOSE)) {
      return list.map(item => {
        if (item.name === 'stage') {
          item.options = baseSelect?.businessStages;
        }
        return item;
      });
    }
    // 非关闭 剔除重新打开
    if (stage !== Number(STAGE_CLOSE)) {
      return list.map(item => {
        if (item.name === 'stage') {
          item.options = baseSelect?.businessStages.filter(el => el.value !== Number(STAGE_REOPEN));
        }
        return item;
      });
    }
  };
  const getText = (type: 'title' | 'ok') => {
    if (type === 'ok') {
      return textMap[`${type}_${pageType}`];
    }
    return textMap[`${type}_${pageType}`];
  };
  const [form] = Form.useForm();
  useEffect(() => {
    console.log('xxxxxcompanyId', companyId, pageType);
    if (pageType === modalStatus.new) {
      /*
       * 客户下新家商机
       */
      if (companyId) {
        form.setFieldsValue({
          company_id: Number(companyId),
        });
        // 默认获取下拉联系人
        handerContactList(companyId);
      }
      // 变更商机下拉阶段
      setAllRightList([...handerStagesOptions([...allRightList])]);
      handlerClientOption();
    }
    if (pageType === modalStatus.edit) {
      /*
       * 线索编辑
       */
      if (id) {
        let param = {
          id,
        };
        clientApi.opportunityDetail(param).then(res => {
          res.contact_id_list = res.contact_list.map(item => item.contact_id);
          // 生日必须是moment格式才可以
          if (res.deal_at) {
            res.deal_at = moment(res.deal_at);
          }
          if (res.stage) {
            res.stage = res.stage.stage;
            setCurrentStage(Number(res.stage));
            originalStage.current = res.stage;
          }
          form.setFieldsValue(res);
          // 回显下拉选项
          // 变更商机下拉阶段
          setAllRightList([...handerStagesOptions([...allRightList], Number(res.stage))]);
          handlerClientOption(res.company_id, res.company_name);
          // 默认获取下拉联系人
          handerContactList(res.company_id);
        });
      }
    }
  }, []);
  // 调整备注的位置
  const isShowItem = (name: string, currentStage: number, place: string) => {
    // 成交阶段
    if (currentStage == Number(dealCode)) {
      if (['remark'].includes(name)) {
        return place === 'right';
      }
      return ['turnover', 'deal_info', 'deal_at'].includes(name);
    }
    // 关闭阶段
    if (currentStage == Number(STAGE_CLOSE)) {
      return ['close_reason'].includes(name);
    }
    // 备注
    if (['remark'].includes(name)) {
      return place === 'left';
    }
    // 默认不展示
    return false;
  };
  useEffect(() => {
    // 展示对应的状态
    let right = allRightList.filter(item => !item.isHidden || isShowItem(item.name, currentStage, 'right'));
    // 替换成现有的配置项
    // 更改展示条目
    setCurrentRightList([...right]);
    /**
     *  编辑状态 6， 不展示关闭原因
     * */
    let left = cloneDeep(leftList).filter(item => {
      if (pageType === modalStatus.edit && originalStage.current === Number(STAGE_CLOSE) && item.name === 'close_reason') {
        return false;
      } else {
        return !item.isHidden || isShowItem(item.name, currentStage, 'left');
      }
    });
    setCurrentLeftList([...left]);
  }, [currentStage, allRightList]);
  /**
   *  客户下拉初始化
   **/
  const handlerClientOption = (company_id?: number, company_name?: string) => {
    const param = {
      id: company_id ? company_id : companyId,
      page: 1,
      page_size: 50,
    };
    if (company_id) {
      let option = [
        {
          value: Number(company_id),
          label: company_name,
        },
      ];
      let list = allRightList.map(item => {
        if (item.name === 'company_id') {
          item.options = option;
        }
        return item;
      });
      setAllRightList([...list]);
    } else {
      clientApi.companySimpleList(param).then(res => {
        let option = res.content.map(item => {
          return {
            value: Number(item.company_id),
            label: item.company_name,
          };
        });
        // map操作对象时候，可以改变原来的数据
        let list = allRightList.map(item => {
          if (item.name === 'company_id') {
            item.options = option;
          }
          return item;
        });
        setAllRightList([...list]);
      });
    }
  };
  /**
   *  客户下联系人初始化
   **/
  const handerContactList = (company_id: number) => {
    const param = {
      company_id,
      condition: 'company',
    };
    clientApi.businessContactListById(param).then(res => {
      let list = allRightList.map(item => {
        if (item.name === 'contact_id_list') {
          item.options = res.map(item => {
            return {
              value: item.contact_id,
              label: item.contact_name,
            };
          });
        }
        return item;
      });
      setAllRightList([...list]);
    });
  };
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
  const onValuesChange = value => {
    const { company_id, stage } = value;
    if (company_id) {
      /**
       *  删除已经选择的联系人
       * */
      let formData = form.getFieldsValue();
      formData.contact_id_list = [];
      form.setFieldsValue(formData);
      handerContactList(company_id);
    }
    // company_id
    if (stage) {
      setCurrentStage(stage);
    }
  };
  /*
   *  form onFinish
   */
  const onFinish = formValues => {
    const { deal_at } = formValues;
    if (deal_at) {
      formValues.deal_at = deal_at.startOf('day').unix() * 1000;
    }
    const param = {
      ...formValues,
    };
    console.log('formValues', formValues, pageType);
    /**
     * 商机新建
     */
    if (pageType === modalStatus.new) {
      if (companyId) {
        customerDataTracker.trackCustomerDetailTopbar('AddBusiness_confirm');
      } else {
        businessDataTracker.trackHandlerBusiness(HandlerBusinessType.ConfirmNew);
      }
      clientApi.addOpportunity(param).then(res => {
        SiriusMessage.success({
          content: getIn18Text('CHUANGJIANCHENGGONG'),
        });
        onCancel(true);
      });
    }
    /**
     * 商机编辑
     */
    if (pageType === modalStatus.edit) {
      param.id = id;
      clientApi.editOpportunity(param).then(res => {
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
      cancelText={isCustomer ? getIn18Text('JINXINJIANKEHUYULIANXIREN') : getIn18Text('QUXIAO')}
      destroyOnClose={true}
      closable={!isCustomer}
      onCancel={onCancelCallBack}
    >
      <>
        <div className={style.modalHeader}>
          <span className={style.modalHeaderLeft}>{getIn18Text('JIBENXINXI')}</span>
        </div>
        <Form form={form} onValuesChange={onValuesChange} layout="vertical" labelAlign="left" name="dynamic_form_item" onFinish={onFinish}>
          <div className={style.modalContent}>
            <div className={style.modalBox}>
              <div className={style.modalContentClient}>
                <FormComponents list={currentLeftList} />
              </div>
              <div className={style.modalContentContact}>
                <FormComponents list={currentRightList} />
              </div>
            </div>
          </div>
        </Form>
      </>
    </Modal>
  );
};
export default NewBusinessModal;
export const createNewBusinessModal = (props: Omit<ComsProps, 'width' | 'visible' | 'pageType'>, container?: HTMLElement) => {
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
    pageType: 'new',
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
