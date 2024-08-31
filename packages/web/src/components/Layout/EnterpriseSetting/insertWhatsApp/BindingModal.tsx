import React, { useEffect, useState, useMemo, useRef } from 'react';
import { Button } from 'antd';
import { Sender } from 'api';
import SiriusModal from '@web-common/components/UI/Modal/SiriusModal';
import ArrowLeft from '@web-common/components/UI/Icons/svgs/disk/ArrowLeft';
import { BindingForm } from './BindingForm';
import { BindingSetting } from '../whatsAppMarketing/bindingSetting';
import style from './bindingModal.module.scss';
import { getIn18Text } from 'api';
export interface BindingModalProps {
  visible: boolean;
  item?: Sender;
  onClose?: () => void;
  onOk: (item: Sender) => void;
}
export const BindingModal: React.FC<BindingModalProps> = props => {
  const formRef = React.createRef();
  const [step, setStep] = useState<number>(0);
  const modalTitle = useMemo(() => {
    return step === 0 || props.item?.id ? (
      getIn18Text('WhatsApp BANGDINGSHEZHI')
    ) : (
      <Button type="text" className={style.backBtn} onClick={() => setStep(0)}>
        <ArrowLeft />
        {getIn18Text('FANHUISHANGYIBU')}
      </Button>
    );
  }, [step, props.item]);
  useEffect(() => {
    if (props.item?.id) {
      setStep(1);
    } else {
      setStep(0);
    }
  }, [props.item]);
  const handleOk = () => {
    formRef.current.validateFields().then(values => {
      props.onOk(values);
    });
  };
  return (
    <SiriusModal
      visible={props.visible}
      title={modalTitle}
      onCancel={props.onClose}
      onOk={handleOk}
      width={820}
      okText={getIn18Text('BAOCUN')}
      footer={step === 0 ? null : undefined}
    >
      {step === 0 ? <BindingSetting showTitle={false} goTo={setStep} /> : <BindingForm ref={formRef} {...props} />}
    </SiriusModal>
  );
};
