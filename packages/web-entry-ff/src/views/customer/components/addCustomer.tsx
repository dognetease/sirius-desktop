import React, { useState, useMemo, useEffect } from 'react';
import { Form, message } from 'antd';
import { apiHolder, apis, FFMSApi, FFMSLevelAdmin, FFMSRate, FFMSCustomer } from 'api';
// import { EnhanceSelect } from '@web-common/components/UI/Select';
import { EnhanceSelect } from '@lingxi-common-component/sirius-ui/Select';
// import { Input } from '@web-common/components/UI/Input';
import Input from '@lingxi-common-component/sirius-ui/Input';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import InputNumber from './inputNumber';
import style from './addCustomer.module.scss';

const ffmsApi = apiHolder.api.requireLogicalApi(apis.ffmsApi) as FFMSApi;

/**
 * 1. 客户类型价差管理
 * 2. 修改客户类型
 */
interface Props {
  type: 'new' | 'edit' | 'change';
  visible: boolean;
  accountId: string;
  onCancel: () => void;
  onSuccess: (type: 'new' | 'edit' | 'change') => void;
  customerType: FFMSLevelAdmin.CUSTOMER_TYPE;
  customerTypeList?: FFMSCustomer.TypeItem[];
  customerIdList?: string[];
  setActive?: (value: string) => void;
}

const AddCustomerType: React.FC<Props> = ({ type, accountId, customerType, visible, customerTypeList, customerIdList, setActive, onCancel, onSuccess }) => {
  const [form] = Form.useForm();
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [options, setOptions] = useState<FFMSRate.Option[]>([]);

  const title = useMemo(() => {
    return type === 'change' ? '修改客户类型' : type === 'new' ? '新增客户类型' : '编辑客户类型';
  }, [type]);

  useEffect(() => {
    if (visible && type === 'change') {
      customerTypeList &&
        setOptions(() =>
          customerTypeList.map(item => ({
            label: item.customerTypeName,
            value: item.customerTypeId,
          }))
        );
    }
    if (visible && type === 'edit') {
      customerTypeList && form.setFieldsValue(customerTypeList[0]);
    }
  }, [visible, type, customerTypeList]);

  const disabled = useMemo(() => {
    if (type === 'edit' && customerTypeList && customerTypeList[0]?.defaultType) return true;
    return customerType === FFMSLevelAdmin.CUSTOMER_TYPE.CO_LOADER || customerType === FFMSLevelAdmin.CUSTOMER_TYPE.POTENTIAL_CLIENT;
  }, [customerType, customerTypeList, type]);

  const gotoCustomerType = (active?: string) => {
    if (setActive && active) {
      setActive(active);
    }
  };

  const submit = () => {
    form.validateFields().then(res => {
      setConfirmLoading(true);
      if (type === 'change' && customerIdList) {
        ffmsApi
          .changeCustomerType({
            customerIdList,
            customerTypeId: res.customerTypeId,
            accountId,
          })
          .then(() => {
            onSuccess(type);
            const target = options.find(item => item.value === res.customerTypeId);
            message.success({
              content: (
                <span onClick={() => gotoCustomerType(target?.value)}>
                  客户类型修改成功，请前往<a>{target?.label}</a>查看
                </span>
              ),
              duration: 3,
            });
          })
          .finally(() => setConfirmLoading(false));
      } else {
        let params;
        if (type === 'new') {
          params = { ...res, customerType, customerTypeId: undefined };
        }
        if (type === 'edit') {
          params = { ...res, customerType, customerTypeId: customerTypeList && customerTypeList[0]?.customerTypeId };
        }
        ffmsApi
          .saveFfCustomerType(params)
          .then(() => {
            message.success(type === 'new' ? '创建成功' : '修改成功');
            onSuccess(type);
          })
          .finally(() => setConfirmLoading(false));
      }
    });
  };
  return (
    <>
      <Modal className={style.modal} title={title} visible={visible} destroyOnClose confirmLoading={confirmLoading} onCancel={() => onCancel()} onOk={submit}>
        <Form form={form} preserve={false} layout="vertical" className={style.form}>
          {type === 'change' ? (
            <Form.Item name="customerTypeId" label="客户类型名称" required rules={[{ required: true, message: '请选择客户类型' }]}>
              <EnhanceSelect size="large" placeholder="请选择客户类型" options={options} />
            </Form.Item>
          ) : (
            <>
              <Form.Item name="customerTypeName" label="客户类型名称" required rules={[{ required: true, message: '请输入客户类型' }]}>
                <Input disabled={disabled} maxLength={6} placeholder="请输入客户类型" />
              </Form.Item>
              <Form.Item name="advance" label="价差" required rules={[{ required: true, message: '请填写价差' }]}>
                <InputNumber style={{ width: '100%' }} precision={0} placeholder="请输入价差" />
              </Form.Item>
            </>
          )}
        </Form>
      </Modal>
    </>
  );
};

export default AddCustomerType;
