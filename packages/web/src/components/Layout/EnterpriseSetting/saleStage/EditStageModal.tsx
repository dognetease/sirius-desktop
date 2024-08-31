import React, { useEffect, useState } from 'react';
import { Form } from 'antd';
import Input from '@/components/Layout/Customer/components/UI/Input/customerInput';
import { api, apis, StageItem, SaleStageApi } from 'api';
import Toast from '@web-common/components/UI/Message/SiriusMessage';
// import style from './fieldSetting.module.scss';
import SiriusModal from '@web-common/components/UI/Modal/SiriusModal';
import classnames from 'classnames';
import { getIn18Text } from 'api';
const saleStageApi = api.requireLogicalApi(apis.saleStageApiImpl) as SaleStageApi;
const FormItem = Form.Item;
export interface EditStageModalProps {
  visible: boolean;
  item?: StageItem;
  onClose?: () => void;
  onOk?: () => void;
}
export const EditStageModal: React.FC<EditStageModalProps> = props => {
  const [form] = Form.useForm<StageItem>();
  const [loading, setLoading] = useState(false);
  const { visible, item } = props;
  const rules = {
    name: [{ required: true, message: getIn18Text('QINGSHURU') }],
  };
  useEffect(() => {
    if (item?.name) {
      form.setFieldsValue({ name: item.name });
    }
    return () => {
      form.resetFields();
    };
  }, [item?.name]);
  const handleOk = () => {
    form.validateFields().then(() => {
      setLoading(true);
      const payload = {
        ...item,
        ...form.getFieldsValue(),
      };
      const service = !item?.id ? saleStageApi.addStage(payload) : saleStageApi.updateStage(payload);
      service
        .then(() => {
          Toast.success({ content: `保存成功` });
          props.onOk && props.onOk();
        })
        .finally(() => {
          setLoading(false);
        });
    });
  };
  if (item === undefined) {
    return null;
  }
  return (
    <SiriusModal visible={visible} title={getIn18Text('XIAOSHOUJIEDUAN')} onCancel={props.onClose} onOk={handleOk} confirmLoading={loading}>
      <Form form={form}>
        <FormItem label={item.id ? getIn18Text('BIANJI') : getIn18Text('XINZENG')} name="name" rules={rules.name}>
          <Input placeholder={getIn18Text('QINGSHURU')} maxLength={20} />
        </FormItem>
      </Form>
    </SiriusModal>
  );
};
