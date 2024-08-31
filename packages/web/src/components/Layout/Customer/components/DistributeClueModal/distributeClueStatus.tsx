import React, { useEffect, useState, useRef } from 'react';
import { Form } from 'antd';
import Modal from '@/components/Layout/components/Modal/modal';
import style from './distributeClueStatus.module.scss';
import { apiHolder, apis, CustomerApi, ContactApi } from 'api';
import { useAddressRepeatedAction } from '@web-edm/addressBook/hooks/useAddressRepeatedAction';
const clientApi = apiHolder.api.requireLogicalApi(apis.customerApiImpl) as CustomerApi;
const contactApi = apiHolder.api.requireLogicalApi('contactApi') as ContactApi;

import SiriusMessage from '@web-common/components/UI/Message/SiriusMessage';
import Select from '../UI/Select/customerSelect';
import { cloneDeep, debounce } from 'lodash';
import { getIn18Text } from 'api';
interface optionItem {
  label: string;
  value: string;
}
interface manager extends optionItem {
  key: string;
}

interface finishValue {
  manager: manager;
}

interface ComsProps {
  visible: boolean;
  onCancel: (param?: boolean) => void;
  onSubmit?: (param?: any) => void;
  ids: string[];
  isCustomer?: boolean;
  getContainer?: false | HTMLElement | (() => HTMLElement);
}

const ChangeStatusModal: React.FC<ComsProps> = ({ visible, onCancel, onSubmit, ids, isCustomer, getContainer = false }) => {
  const { action, ActionRadioGroup } = useAddressRepeatedAction();
  const [form] = Form.useForm();
  let [status, setStatus] = useState<string>();
  const [optionList, setOption] = useState<optionItem[]>([]);
  const originOptions = useRef<optionItem[]>([]);
  const [contactIds, setContactIds] = useState<string[]>();

  useEffect(() => {
    let param = { productId: 'fastmail', productVersionId: 'professional' };
    clientApi.getCustomerAccount(param).then(res => {
      console.log('waimao-contacts-1', res.members);
      let list = res?.members.map(item => item.memberAccId);
      setContactIds(list);
    });
  }, []);

  useEffect(() => {
    if (contactIds && contactIds.length) {
      contactApi.doGetContactById(contactIds).then(res => {
        console.log('res-contact-list', res);
        originOptions.current = res.map(item => {
          const { id, accountName, contactName } = item.contact;
          return {
            value: id,
            label: `${contactName}(${accountName})`,
          };
        });
        // 默认截取前两百个数据
        setOption(cloneDeep(originOptions.current.slice(0, 200)));
      });
    }
  }, [contactIds]);

  /*
   *   提交事件
   */
  const formSubmit = () => {
    form.submit();
  };
  /*
   * onCancelCallBack
   */
  const clueChange = type => {
    setStatus(type);
  };

  const onCancelCallBack = () => {
    onCancel();
  };

  const onFinish = (values: finishValue) => {
    const { label, value } = values.manager;
    let params = {
      ids,
      manager_id: value,
      manager_name: label.split('(')[0],
    };
    let Promise;
    if (onSubmit) {
      onSubmit({ ...params, action });
      return;
    }
    if (isCustomer) {
      Promise = clientApi.openSCAllocate(params);
    } else {
      Promise = clientApi.openSeaAllocate(params);
    }
    Promise.then(res => {
      SiriusMessage.success({
        content: '分配成功',
      });
      onCancel(true);
    });
  };
  // filterOption=false
  const searchOptions = (value: string) => {
    let list = cloneDeep(originOptions.current.filter(item => item.label.includes(value)));
    setOption([...list.slice(0, 200)]);
  };

  return (
    <Modal
      title={getIn18Text('FENPEI')}
      getContainer={getContainer}
      wrapClassName={style.clueModalWrap}
      width={480}
      onOk={formSubmit}
      visible={visible}
      okText={getIn18Text('QUEDING')}
      cancelText={getIn18Text('QUXIAO')}
      okButtonProps={{ disabled: !status }}
      destroyOnClose={true}
      onCancel={onCancelCallBack}
    >
      <div className={style.content}>
        <Form form={form} name="distribute" onFinish={onFinish} layout="horizontal" autoComplete="off">
          <Form.Item
            label={getIn18Text('QINGXUANZEFUZEREN')}
            name="manager"
            rules={[
              {
                required: true,
                message: getIn18Text('QINGXUANZEFUZEREN!'),
              },
            ]}
          >
            <Select
              placeholder={getIn18Text('QINGXUANZEFUZEREN')}
              style={{ width: '100%' }}
              onChange={clueChange}
              labelInValue={true}
              filterOption={false}
              options={optionList}
              showSearch
              onSearch={debounce(searchOptions, 1000)}
            ></Select>
          </Form.Item>
        </Form>
        <ActionRadioGroup style={{ marginTop: 20 }} />
      </div>
    </Modal>
  );
};
export default ChangeStatusModal;
