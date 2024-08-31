import React, { useEffect } from 'react';
import { Form } from 'antd';
import Input from '@/components/Layout/Customer/components/UI/Input/customerInput';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import style from './taskCreateModal.module.scss';
import { getIn18Text } from 'api';
interface TaskCreateValue {
  taskName: string;
  taskDesc: string;
}
interface TaskCreateModalProps {
  title: string;
  visible: boolean;
  initialValue?: TaskCreateValue;
  onCancel: () => void;
  onOk: (values: TaskCreateValue) => void;
}
const TaskCreateModal: React.FC<TaskCreateModalProps> = props => {
  const { title, visible, initialValue, onCancel, onOk } = props;
  const [form] = Form.useForm();
  const handleSubmit = () => {
    form.validateFields().then(values => {
      onOk(values);
    });
  };
  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };
  useEffect(() => {
    if (initialValue) {
      form.setFieldsValue(initialValue);
    }
  }, [initialValue]);
  return (
    <Modal className={style.taskCreateModal} visible={visible} title={title} width={480} onCancel={handleCancel} onOk={handleSubmit}>
      <Form form={form} layout="vertical">
        <Form.Item
          label={getIn18Text('RENWUMINGCHENG')}
          name="taskName"
          required
          rules={[
            {
              validator: (_, value: string) => (!!value.trim() ? Promise.resolve() : Promise.reject(getIn18Text('QINGSHURURENWUMINGCHENG'))),
            },
            { max: 30, message: getIn18Text('QINGSHURUBUCHAOGUO 30 ZIDERENWUMINGCHENG') },
          ]}
        >
          <Input placeholder={getIn18Text('QINGSHURURENWUMINGCHENG')} />
        </Form.Item>
        <Form.Item label={getIn18Text('RENWUMIAOSHU')} name="taskDesc" rules={[{ max: 30, message: getIn18Text('QINGSHURUBUCHAOGUO 30 ZIDERENWUMIAOSHU') }]}>
          <Input.TextArea placeholder={getIn18Text('QINGSHURURENWUMIAOSHU')} rows={2} />
        </Form.Item>
      </Form>
    </Modal>
  );
};
export default TaskCreateModal;
