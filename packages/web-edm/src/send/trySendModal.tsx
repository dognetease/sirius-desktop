import React, { useState } from 'react';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import { Form, Input, ModalProps } from 'antd';
import style from './write.module.scss';
import classnames from 'classnames';
import { getIn18Text } from 'api';
export type TrySendModalProps = Omit<ModalProps, 'title' | 'okButtonProps' | 'onOK'> & {
  onSend(email: string): Promise<boolean>;
};
export const TrySendModal = (props: TrySendModalProps) => {
  const [disabled, setDisabled] = useState(true);
  const [loading, setLoading] = useState(false);
  const [emailValidateTrigger, setEmailValidateTrigger] = useState('onBlur');
  const [form] = Form.useForm<{
    email: string;
  }>();
  const { onOk, ...rest } = props;
  const handleSend = () => {
    form.validateFields().then(values => {
      setLoading(true);
      props.onSend(values.email).finally(() => setLoading(false));
    });
  };
  const handleChange = () => {
    setDisabled(form.getFieldError('email').length > 0);
  };
  return (
    <Modal
      title={getIn18Text('SHIFAYOUJIAN')}
      visible={props.visible}
      width={400}
      okButtonProps={{
        disabled: disabled,
        loading,
      }}
      onOk={handleSend}
      {...rest}
      className="custom-modal-header custom-modal-header"
    >
      <Form form={form} requiredMark={false} onFieldsChange={handleChange}>
        <Form.Item
          label={getIn18Text('YOUJIANDEZHI')}
          rules={[
            { required: true, message: getIn18Text('QINGSHURUYOUXIANGDEZHI') },
            { type: 'email', message: getIn18Text('YOUXIANGGESHIBUZHENGQUE') },
          ]}
          style={{ marginBottom: 0 }}
          name="email"
          validateTrigger={emailValidateTrigger}
        >
          <Input
            placeholder={getIn18Text('QINGSHURUYOUXIANGDEZHI')}
            onChange={() => setEmailValidateTrigger(form.getFieldError('email').length ? 'onChange' : 'onBlur')}
          />
        </Form.Item>
        <p style={{ margin: '12px 0 0 70px', color: '#7D8085' }}>{getIn18Text('FASONGYOUJIANGEIZIJIHUOTAREN')}</p>
      </Form>
    </Modal>
  );
};
