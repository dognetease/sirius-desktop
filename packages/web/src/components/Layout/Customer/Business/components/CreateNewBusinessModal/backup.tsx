import React, { useEffect, useState, useContext, useRef } from 'react';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import style from './createNewBussinessModal.module.scss';
import { Form } from 'antd';
import { businessListLeft as leftList, businessListRight as rightList } from './config';
import FormComponents from '../../../components/commonForm/FormComponents';
import { apiHolder, apis, CustomerApi } from 'api';
const clientApi = apiHolder.api.requireLogicalApi(apis.customerApiImpl) as CustomerApi;
import SiriusMessage from '@web-common/components/UI/Message/SiriusMessage';
import moment from 'moment';
import { customerContext } from '../../../customerContext';
import { cloneDeep } from 'lodash';

interface ComsProps {
  visible: boolean;
  width: number; // 408 768
  onCancel: (param?: boolean) => void;
  id?: string;
  companyId?: number; // PageType new
  pageType: 'new' | 'edit'; // 页面状态 new edit
}

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
  ok_new: '创建',
  ok_edit: '保存',
  title_new: '新建商机',
  title_edit: '保存商机',
};

const STAGE_CLOSE = '6'; // 固定值
const STAGE_REOPEN = '7'; // 固定值

const NewBusinessModal: React.FC<ComsProps> = ({ visible, width, onCancel, pageType, id, companyId }) => {
  const { state } = useContext(customerContext).value;
  const { baseSelect } = state;
  const [currentStage, setCurrentStage] = useState(0);
  const originalStage = useRef(0);

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
  const [dealCode, setDealCode] = useState<string>('5'); // 成交code
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
          item.options = baseSelect.businessStages.filter(el => el.value !== Number(STAGE_CLOSE) && el.value !== Number(STAGE_REOPEN));
        }
        return item;
      });
    }
    // 6关闭状态 STAGE_CLOSE，展示全部
    if (stage === Number(STAGE_CLOSE)) {
      return list.map(item => {
        if (item.name === 'stage') {
          item.options = baseSelect.businessStages;
        }
        return item;
      });
    }
    // 非关闭 剔除重新打开
    if (stage !== Number(STAGE_CLOSE)) {
      return list.map(item => {
        if (item.name === 'stage') {
          item.options = baseSelect.businessStages.filter(el => el.value !== Number(STAGE_REOPEN));
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
          console.log('获取商机编辑数据2', res);
          // 变更商机下拉阶段
          setAllRightList([...handerStagesOptions([...allRightList], Number(res.stage))]);
          handlerClientOption();
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
    console.log('right-type-time-companyid-right-8-3', currentStage, right);
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
  const handlerClientOption = () => {
    const param = {
      id: companyId,
      page: 1,
      page_size: 50,
    };
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
      clientApi.addOpportunity(param).then(res => {
        SiriusMessage.success({
          content: '创建成功',
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
          content: '保存成功',
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
      cancelText="取消"
      destroyOnClose={true}
      onCancel={onCancelCallBack}
    >
      <>
        <div className={style.modalHeader}>
          <span className={style.modalHeaderLeft}>基本信息</span>
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
