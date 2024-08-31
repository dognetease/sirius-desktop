import React, { useState, useEffect } from 'react';
import { Select, Input, Form } from 'antd';
import { apis, apiHolder, AddressBookApi, AddressBookReturnOpenSeaParams } from 'api';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import style from './index.module.scss';
import { getIn18Text } from 'api';
const { Option } = Select;
const { TextArea } = Input;
const reasons = [
  {
    label: getIn18Text('LIANXIBUSHANGKEHU'),
    value: getIn18Text('LIANXIBUSHANGKEHU'),
  },
  {
    label: getIn18Text('KEHUZANWUXUQIU'),
    value: getIn18Text('KEHUZANWUXUQIU'),
  },
  {
    label: getIn18Text('WEIMANZUKEHUXUQIU'),
    value: getIn18Text('WEIMANZUKEHUXUQIU'),
  },
  {
    label: getIn18Text('QITA'),
    value: getIn18Text('QITA'),
  },
];
export interface ReturnToOpenSeaProps {
  visible: boolean;
  title: string;
  ids: number[];
  onSuccess: (ids: number[]) => void;
  onError: (error: Error) => void;
  onClose: () => void;
}
const addressBookApi = apiHolder.api.requireLogicalApi(apis.addressBookApiImpl) as unknown as AddressBookApi;
const ReturnToOpenSea: React.FC<ReturnToOpenSeaProps> = props => {
  const { visible, title, ids, onSuccess, onError, onClose } = props;
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState<boolean>(false);
  const handleSubmit = (values: Omit<AddressBookReturnOpenSeaParams, 'ids'>) => {
    setSubmitting(true);
    addressBookApi
      .returnContactsToOpenSea({ ...values, ids })
      .then(() => {
        onSuccess(ids);
      })
      .finally(() => {
        setSubmitting(false);
      });
  };
  useEffect(() => {
    !visible && form.resetFields();
  }, [visible]);
  return (
    <Modal
      className={style.returnToOpenSea}
      width={538}
      visible={visible}
      title={title}
      onCancel={onClose}
      onOk={() => form.submit()}
      okButtonProps={{ loading: submitting }}
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Form.Item label={getIn18Text('TUIGONGHAIYUANYIN')} name="returnReason" rules={[{ required: true }]} required>
          <Select placeholder={getIn18Text('QINGXUANZETUIGONGHAIYUANYIN')}>
            {reasons.map(item => (
              <Option value={item.value}>{item.label}</Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item label={getIn18Text('TUIGONGHAIBEIZHU')} name="returnRemark">
          <TextArea placeholder={getIn18Text('TIANXIEBEIZHU')} />
        </Form.Item>
      </Form>
    </Modal>
  );
};
export default ReturnToOpenSea;
