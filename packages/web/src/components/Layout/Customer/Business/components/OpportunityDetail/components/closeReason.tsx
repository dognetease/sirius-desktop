import React, { useState, useEffect } from 'react';
import { Form } from 'antd';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import Input from '@/components/Layout/Customer/components/UI/Input/customerInput';
import style from './dealInfo.module.scss';
import { getIn18Text } from 'api';
interface FormValues {
  reason: string;
}
interface CloseReasonProps {
  visible: boolean;
  onOk: (values: FormValues) => void;
  onCancel: () => void;
}
const { TextArea } = Input;
const CloseReason: React.FC<CloseReasonProps> = props => {
  const { visible, onOk, onCancel } = props;
  const [form] = Form.useForm();
  const handleOk = () => {
    form.validateFields().then(values => onOk(values));
  };
  useEffect(() => {
    !visible && form.setFieldsValue({ reason: '' });
  }, [visible]);
  return (
    <Modal className={style.dealInfo} title={getIn18Text('GUANBI')} visible={visible} width={472} onCancel={onCancel} onOk={handleOk}>
      <Form form={form}>
        <Form.Item label={getIn18Text('GUANBIYUANYIN')} name="reason" required rules={[{ required: true, message: getIn18Text('QINGSHURUGUANBIYUANYIN') }]}>
          <TextArea placeholder={getIn18Text('QINGSHURUGUANBIYUANYIN')} autoSize={{ minRows: 4 }} />
        </Form.Item>
      </Form>
    </Modal>
  );
};
CloseReason.defaultProps = {};
export default CloseReason;
