import React, { useState } from 'react';
import Styles from './mobile-modal.module.scss';
import SiriusModal from '@lingxi-common-component/sirius-ui/SiriusModal';
import Button from '@lingxi-common-component/sirius-ui/Button';
import Modal from '@web-common/components/UI/Modal/SiriusModal';

import { LoginApi, apis, apiHolder as api, getIn18Text } from 'api';

const loginApi = api.api.requireLogicalApi(apis.loginApiImpl) as LoginApi;

interface EmailUnBlockingModalProp {
  visible: boolean;
  onClose?: () => void;
  onSuccess?: () => void;
  onFail?: (errMsg: string) => void;
  onCancel?: () => void;
}

const EmailUnBlockingModal: React.FC<EmailUnBlockingModalProp> = props => {
  const { visible, onClose, onSuccess, onCancel } = props;

  const [hasSendEmailToAdmin, setHasSendEmailToAdmin] = useState<boolean>(false);
  const [isSending, setIsSending] = useState<boolean>(false);

  const sendEmailToAdmin = () => {
    if (hasSendEmailToAdmin) return;
    setIsSending(true);
    loginApi
      .sendUnBlockingEmailToAdmin()
      .then(res => {
        if (res.success) {
          setHasSendEmailToAdmin(true);
          onSuccess && onSuccess();
        } else {
          Modal.error({
            content: res.errMsg,
            maskClosable: false,
            hideCancel: true,
            okText: '知道了',
          });
        }
      })
      .finally(() => {
        setIsSending(false);
      });
  };

  if (!visible) {
    return null;
  }

  return (
    <SiriusModal
      width={640}
      onCancel={() => {
        onClose && onClose();
      }}
      visible={visible}
      footer={null}
      maskClosable={false}
    >
      <div className={Styles.mainWrapper}>
        <div className={Styles.title}>{getIn18Text('ACCOUNT_SPAM_TITLE')}</div>
        <div className={Styles.descWrapper}>
          <p>
            {getIn18Text('SPAM_EMAIL_DESC_1')}
            <span className={Styles.innerError}>{getIn18Text('SPAM_CONTACT_ADMIN')}</span>
            {getIn18Text('SPAM_ADMIN_UNLOCK')}
          </p>
        </div>
        <div className={Styles.imgWrapper}>
          <div className={Styles.adminUnBlockingImg}></div>
        </div>
        <div className={Styles.descWrapper}>
          <p>{getIn18Text('SPAM_ADMIN_STEPS')}</p>
        </div>
        <div className={Styles.btns}>
          <div style={{ display: 'flex' }}>
            <Button
              onClick={() => {
                onCancel && onCancel();
              }}
            >
              {getIn18Text('QUXIAO')}
            </Button>
            <Button
              btnType="primary"
              loading={isSending}
              onClick={() => {
                sendEmailToAdmin();
              }}
            >
              {hasSendEmailToAdmin ? getIn18Text('SPAM_EMAIL_SENT') : getIn18Text('SPAM_SENDTO_ADMIN')}
            </Button>
          </div>
        </div>
        <div className={Styles.tips}>{getIn18Text('SPAM_EMAIL_TIP')}</div>
      </div>
    </SiriusModal>
  );
};
export default EmailUnBlockingModal;
