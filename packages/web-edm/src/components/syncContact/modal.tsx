import React, { useState, useEffect } from 'react';
import { Form, Select } from 'antd';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import DownTriangle from '@web-common/components/UI/Icons/svgs/disk/DownTriangle';
import { apiHolder, apis, CustomerApi } from 'api';
import style from './modal.module.scss';
import { getIn18Text } from 'api';
const { Option } = Select;
const customerApi = apiHolder.api.requireLogicalApi(apis.customerApiImpl) as CustomerApi;
interface FormValues {
  clueBatch: string;
}
export interface ISyncContactProps {
  visible: boolean;
  onOk: (values: FormValues) => void;
  onCancel?: () => void;
}
export const SyncContactModal = (props: ISyncContactProps) => {
  const { visible, onOk } = props;
  const [form] = Form.useForm();
  const [clueBatch, setClueBatch] = useState<string>('0');
  const [clueBatchOptions, setClueBatchOptions] = useState<
    {
      label: string;
      value: string;
    }[]
  >([]);
  useEffect(() => {
    customerApi.getBaseInfo().then(data => {
      setClueBatchOptions(data.clue_batch.filter(item => item.value !== '0'));
    });
  }, []);
  const handleOk = () => {
    form.validateFields().then(values => onOk(values));
  };
  useEffect(() => {
    !visible && form.setFieldsValue({ clueBatch: '' });
  }, [visible]);
  return (
    <Modal title={getIn18Text('TONGBUZHIXIANSUO')} className={style.syncContactModal} visible={props.visible} onCancel={props.onCancel} onOk={handleOk} width={472}>
      <Form form={form}>
        <Form.Item label={getIn18Text('XIANSUOPICI')} name="clueBatch" required rules={[{ required: true, message: getIn18Text('QINGXUANZEXIANSUOPICI') }]}>
          <Select
            placeholder={getIn18Text('QINGXUANZEXIANSUOPICI')}
            value={clueBatchOptions.some(item => item.value === clueBatch) ? clueBatch : undefined}
            onChange={setClueBatch}
            suffixIcon={<DownTriangle />}
            dropdownClassName="edm-selector-dropdown"
          >
            {clueBatchOptions.map(({ label, value }) => (
              <Option key={value} value={value}>
                {label}
              </Option>
            ))}
          </Select>
        </Form.Item>
      </Form>
    </Modal>
  );
};
