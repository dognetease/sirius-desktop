import React, { useEffect } from 'react';
import { Form } from 'antd';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import Input from '@/components/Layout/Customer/components/UI/Input/customerInput';
import DatePicker from '@/components/Layout/Customer/components/UI/DatePicker/datePicker';
import style from './dealInfo.module.scss';
import { getIn18Text } from 'api';
interface FormValues {
  turnover: string;
  deal_at: string;
  deal_info: string;
}
interface DealInfoProps {
  visible: boolean;
  title?: React.ReactNode;
  currencyName: string;
  onOk: (values: FormValues) => void;
  onCancel: () => void;
}
const { TextArea } = Input;
const DealInfo: React.FC<DealInfoProps> = props => {
  const { visible, title, currencyName, onOk, onCancel } = props;
  const [form] = Form.useForm();
  const handleOk = () => {
    form.validateFields().then(values => {
      onOk({
        ...values,
        deal_at: values.deal_at.valueOf(),
      });
    });
  };
  useEffect(() => {
    !visible &&
      form.setFieldsValue({
        turnover: '',
        deal_at: undefined,
        deal_info: '',
      });
  }, [visible]);
  return (
    <Modal className={style.dealInfo} title={title} visible={visible} width={429} onCancel={onCancel} onOk={handleOk}>
      <Form form={form}>
        <Form.Item label={getIn18Text('BIZHONG')} className={style.currency}>
          {currencyName}
        </Form.Item>
        <Form.Item
          label={getIn18Text('CHENGJIAOJINE')}
          name="turnover"
          required
          rules={[
            { required: true, message: getIn18Text('QINGSHURUCHENGJIAOJINE') },
            { pattern: /^\d+(.\d+)?$/, message: getIn18Text('QINGSHURUFEIFUSHU') },
          ]}
        >
          <Input placeholder={getIn18Text('QINGSHURUCHENGJIAOJINE')} />
        </Form.Item>
        <Form.Item label={getIn18Text('CHENGJIAOSHIJIAN')} name="deal_at" required rules={[{ required: true, message: getIn18Text('QINGXUANZECHENGJIAOSHIJIAN') }]}>
          <DatePicker placeholder={getIn18Text('QINGXUANZECHENGJIAOSHIJIAN')} style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item label={getIn18Text('CHENGJIAOXINXI')} name="deal_info">
          <TextArea placeholder={getIn18Text('QINGSHURUCHENGJIAOXINXI')} autoSize={{ minRows: 4 }} />
        </Form.Item>
      </Form>
    </Modal>
  );
};
DealInfo.defaultProps = {
  title: getIn18Text('CHENGJIAOXINXI'),
};
export default DealInfo;
