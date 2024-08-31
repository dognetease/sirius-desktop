import React from 'react';
import styles from './style.module.scss';
import { Form, Input, Checkbox } from 'antd';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
// import Button from '@web-common/components/UI/Button';
import Button from '@lingxi-common-component/sirius-ui/Button';

const options = [
  { label: '对SEM感兴趣，想了解更多', value: 'INTEREST' },
  { label: '获取SEM/SEO推广技巧', value: 'GET_MARKET_TIPS' },
  { label: '希望有专人帮忙运营维护', value: 'OPERATION_MAINTENANCE' },
  { label: '其他', value: 'OTHER' },
];
interface SemFormModalParams {
  visible: boolean;
  onClose?: ((e: React.MouseEvent<HTMLElement, MouseEvent>) => void) | undefined;
  onSubmit: (value: any) => void;
}

export const SemFormModal = (props: SemFormModalParams) => {
  return (
    <Modal
      visible={props.visible}
      getContainer={false}
      width={480}
      title="SEM营销推广"
      footer={null}
      maskClosable={false}
      className={styles.semFormModal}
      destroyOnClose={true}
      onCancel={props.onClose}
    >
      <span className={styles.subTitle}>提交营销需求，专属客服1V1为您服务</span>
      <Form className={styles.semForm} onFinish={props.onSubmit} labelCol={{ span: 5 }} wrapperCol={{ span: 19 }} requiredMark={false} colon={false}>
        <Form.Item name="name" label="您的称呼" rules={[{ required: true, message: '昵称不能为空!' }]}>
          <Input placeholder="请输入内容" />
        </Form.Item>
        <Form.Item
          name="phone"
          label="联系电话"
          rules={[
            { required: true, message: '请输入联系电话!' },
            { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的联系电话!' },
          ]}
        >
          <Input placeholder="请输入内容" />
        </Form.Item>
        <Form.Item name="marketingNeeds" label="推广需求">
          <Checkbox.Group className={styles.checkboxGroup} options={options} />
        </Form.Item>
        <Form.Item wrapperCol={{ offset: 5, span: 19 }}>
          <Button btnType="minorLine" type="button" onClick={props.onClose}>
            取消
          </Button>
          <Button btnType="primary" type="submit">
            立即提交
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
};
