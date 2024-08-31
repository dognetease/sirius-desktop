import React from 'react';
import styles from './style.module.scss';
import { Form, Input, Radio } from 'antd';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
// import Button from '@web-common/components/UI/Button';
import Button from '@lingxi-common-component/sirius-ui/Button';
import { getIn18Text } from 'api';

interface ModalParams {
  visible: boolean;
  onClose?: ((e: React.MouseEvent<HTMLElement, MouseEvent>) => void) | undefined;
  onSubmit: (value: any) => void;
}

const { TextArea } = Input;

export const FeedBackModal = (props: ModalParams) => {
  return (
    <Modal
      visible={props.visible}
      getContainer={false}
      width={480}
      title={getIn18Text('YIJIANFANKUI')}
      footer={null}
      maskClosable={false}
      className={styles.feedBackModal}
      destroyOnClose={true}
      onCancel={props.onClose}
    >
      <span className={styles.subTitle}>您的问题和建议，对我们很重要</span>
      <Form onFinish={props.onSubmit} className={styles.semForm} requiredMark={false} colon={false}>
        <Form.Item initialValue={'PROPOSAL'} name="type" label="推广需求">
          <Radio.Group name="radiogroup" defaultValue={'PROPOSAL'}>
            <Radio value={'PROPOSAL'}>建议</Radio>
            <Radio value={'ISSUE'}>问题</Radio>
            <Radio value={'OTHER'}>其他</Radio>
          </Radio.Group>
        </Form.Item>
        <Form.Item name="content" label="反馈内容" rules={[{ required: true, message: '请输入反馈内容!' }]}>
          <TextArea maxLength={500} rows={2} />
        </Form.Item>
        <Form.Item>
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
