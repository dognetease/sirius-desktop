import React, { useState } from 'react';
import Styles from './mobile-modal.module.scss';
import SiriusModal from '@lingxi-common-component/sirius-ui/SiriusModal';
import Input from '@lingxi-common-component/sirius-ui/Input';
import Button from '@lingxi-common-component/sirius-ui/Button';

import { LoginApi, apis, apiHolder as api, getIn18Text } from 'api';

const loginApi = api.api.requireLogicalApi(apis.loginApiImpl) as LoginApi;
interface MobileUnBlockingModalProp {
  mobile: string;
  visible: boolean;
  onClose?: () => void;
  onSuccess?: () => void;
  onFail?: (errMsg: string) => void;
  onCancel?: () => void;
}

const MobileUnBlockingModal: React.FC<MobileUnBlockingModalProp> = props => {
  const { mobile, visible, onClose, onSuccess, onFail, onCancel } = props;
  const [mobileCode, setMobileCode] = useState<string>('');
  const resendCodeWaitSpan = 60;
  const [time, setTime] = useState<number>(resendCodeWaitSpan);
  const [errorMsg, setErrorMsg] = useState<string>('');

  function startCountDown() {
    setTime(prev => {
      setTimeout(() => {
        if (prev > 0) {
          startCountDown();
        } else {
          setTime(resendCodeWaitSpan);
        }
      }, 1000);
      return prev > 0 ? prev - 1 : 0;
    });
  }
  const onGetMobileCode = () => {
    if (time < resendCodeWaitSpan) {
      return;
    }
    setErrorMsg('');
    loginApi.sendSelfUnBlockingCode().then(res => {
      if (res.success) {
        startCountDown();
      } else {
        setErrorMsg(res.errMsg!);
      }
    });
  };

  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const onSelefUnBlocking = () => {
    if (!mobileCode) {
      setErrorMsg(getIn18Text('QINGSHURUYANZHENG'));
      return;
    }
    setErrorMsg('');
    setIsProcessing(true);
    loginApi
      .selfUnBlockingWithCode(mobileCode)
      .then(res => {
        if (res.success) {
          onSuccess && onSuccess();
        } else {
          onFail && onFail(res.errMsg || '');
        }
      })
      .finally(() => {
        setIsProcessing(false);
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
          <p>{getIn18Text('SPAM_MOBILE_DESC')}</p>
          <p>1、{getIn18Text('SPAM_MOBILE_STEP1')}</p>
          <p>2、{getIn18Text('SPAM_MOBILE_STEP2')}</p>
          <p>3、{getIn18Text('SPAM_MOBILE_STEP3')}</p>
        </div>
        <div className={Styles.mobileCode}>
          <div className={Styles.line}>
            <div className={Styles.label}>{getIn18Text('SHOUJIHAO')}：</div>
            <div className={Styles.val}>{mobile}</div>
          </div>
          <div className={Styles.line}>
            <div className={Styles.label}>{getIn18Text('SPAM_PHOPNE_CODE_LABEL')}：</div>
            <div className={Styles.input}>
              <Input
                allowClear
                placeholder={getIn18Text('QINGSHURUYANZHENG')}
                value={mobileCode}
                onChange={val => {
                  if (val && val.target) {
                    setMobileCode(val.target.value);
                  }
                }}
              />
            </div>
            <div className={Styles.btn}>
              <Button btnType="primary" onClick={onGetMobileCode} disabled={time < resendCodeWaitSpan}>
                {time < resendCodeWaitSpan ? `${time}s` : getIn18Text('HUOQUYANZHENGMA')}
              </Button>
            </div>
          </div>
          <div className={Styles.line}>
            <div className={Styles.error}>{errorMsg}</div>
          </div>
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
              loading={isProcessing}
              onClick={() => {
                onSelefUnBlocking();
              }}
            >
              {getIn18Text('QUEDING')}
            </Button>
          </div>
        </div>
        <div className={Styles.tips}>{getIn18Text('SPAM_PHONE_CODE_TIP')}</div>
      </div>
    </SiriusModal>
  );
};
export default MobileUnBlockingModal;
