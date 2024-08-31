import React, { useState, useEffect } from 'react';
import { apiHolder as api, apis, LoginApi, CloseMultAccountLoginFun, EmailAndPass, MultAccountsLoginInfo } from 'api';
import classnames from 'classnames';
import styles from './verifycode.module.scss';
import { Button, Checkbox, Form, Input } from 'antd';
import SiriusMessage from '@web-common/components/UI/Message/SiriusMessage';
import ErrorIcon from '@web-common/components/UI/Icons/svgs/ErrorSvg';
import IconCard from '@web-common/components/UI/IconCard/index';
import { sendAddAccountTrack } from '@web-common/components/util/webmail-util';
import { getIn18Text } from 'api';
const resendCodeWaitSpan = 60;
const LoginForm: React.FC<{
  // goBack: () => void;
  // closeAllModal: CloseMultAccountLoginFun;
  loginInfo: MultAccountsLoginInfo;
  closeModal: CloseMultAccountLoginFun;
  mobile: string;
  formData: EmailAndPass;
}> = props => {
  const { mobile, formData, closeModal, loginInfo } = props;
  const [isCorpMail, setIsCorpMail] = useState<boolean>(false);
  const [code, setCode] = useState<string>('');
  // const [isValidate, setValidate] = useState<boolean>(false);
  const [time, setTime] = useState<number>(resendCodeWaitSpan);
  const [isSendingPhoneCode, setIsSendingPhoneCode] = useState<boolean>(false);
  const [warning, setWarning] = useState<string>('');
  const [ok, setOk] = useState<string>('');
  const valRef = React.useRef<any>(null);
  // const [needPersist, setNeedPersist] = useState<boolean>(true);
  // 验证码登录中
  const [isLoginingWithCode, setIsLoginingWithCode] = useState<boolean>(false);
  const loginApi = api.api.requireLogicalApi(apis.loginApiImpl) as LoginApi;
  const onGetCode = () => {
    setWarning('');
    // setOk('验证码已发送');
    // if (isSendingPhoneCode) {
    //   return;
    // }
    // setIsSendingPhoneCode(true);
    loginApi
      .sendBindAccountVerifyCode()
      .then(r => {
        console.log(r);
        if (r.success) {
          startCountDown();
        } else {
          setWarning(r.errMsg || '');
        }
      })
      .catch(err => {
        console.error('onGetCode error', err);
      })
      .finally(() => {
        // setIsSendingPhoneCode(false);
      });
  };
  const onLoginWithCode = () => {
    if (getIsEmptyString(code)) {
      setWarning(getInputEmptyErrorMsg(getIn18Text('YANZHENGMA')));
    } else {
      setIsLoginingWithCode(true);
      loginApi
        .bindAccountLoginWithCode(code)
        .then(value => {
          if (value.success) {
            SiriusMessage.success({
              content: '绑定成功！',
            });
            sendAddAccountTrack(loginInfo.way, 'NeteaseQiYeMail', 'success');
            closeModal({ refresh: true, email: formData.agentEmail });
          } else if (value.errMsg) {
            // 有错误提示
            sendAddAccountTrack(loginInfo.way, 'NeteaseQiYeMail', 'fail', value.errMsg);
            setWarning(value.errMsg);
          }
        })
        .finally(() => {
          setIsLoginingWithCode(false);
        });
    }
  };

  const keyDownHandler: React.KeyboardEventHandler = (e: React.KeyboardEvent<HTMLDivElement>) => {
    switch (e.key) {
      case 'Enter':
        e.preventDefault();
        onLoginWithCode();
        break;
      default:
        console.log('press for login');
    }
  };

  function startCountDown() {
    setTime(prev => {
      setTimeout(() => {
        if (prev > 0) {
          if (prev > 5) {
            setOk('');
          }
          startCountDown();
        } else {
          setTime(resendCodeWaitSpan);
        }
      }, 1000);
      return prev > 0 ? prev - 1 : 0;
    });
  }
  const getInputEmptyErrorMsg = (propName: string): string => {
    if (!propName || !propName.length) return '';
    return `请输入${propName}`;
  };
  const getIsEmptyString = (str: string): boolean => {
    if (!str || !str.length || !str.trim()) {
      return true;
    }
    return false;
  };

  useEffect(() => {
    valRef.current!.focus({
      cursor: 'start',
    });
    onGetCode();
  }, []);
  return (
    <div className={styles.loginContent}>
      <div className={styles.mailWrap}>
        <div className={styles.uBack}>
          <div
            className={classnames(styles.title)}
            onClick={() => {
              closeModal({ refresh: false });
            }}
          >
            <IconCard type="backIcon" />
            <span style={{ marginLeft: '4px' }}>{getIn18Text('FANHUI')}</span>
          </div>
        </div>
        <div className={styles.uTitle}>{getIn18Text('SHOUJIDUANXINYAN')}</div>
        <div className={styles.uPhone}>
          {getIn18Text('YANZHENGMAYITONG')}
          <span className="blue">{mobile}</span>
        </div>
        <div className={classnames(styles.uInput, styles.uCode)}>
          <Input
            allowClear
            // corpMail验证码位数不固定，但为了输入方便，不会超过10位 onFocus={onFocusInput}
            maxLength={isCorpMail ? 10 : 6}
            placeholder={`请输入${isCorpMail ? '' : 6}位验证码`}
            value={code}
            onChange={e => {
              setCode(e.target.value);
            }}
            onKeyDown={keyDownHandler}
            ref={valRef}
          />
          <div className={styles.uCodeText}>
            {time < resendCodeWaitSpan ? (
              `${time}s后重试`
            ) : (
              <span className="blue" onClick={onGetCode}>
                {getIn18Text('HUOQUYANZHENGMA')}
              </span>
            )}
          </div>
        </div>
        <div className={styles.button}>
          <Button type="primary" className={styles.uPrimaryBtn} onClick={onLoginWithCode} block loading={isLoginingWithCode}>
            {getIn18Text('QUEDING')}
          </Button>
        </div>
        <div className={styles.uWarning} hidden={!warning}>
          <ErrorIcon width={14} height={14} className={styles.uWarningIcon} />
          <span className={styles.uWarningText}>{warning}</span>
        </div>
      </div>
    </div>
  );
};
export default LoginForm;
