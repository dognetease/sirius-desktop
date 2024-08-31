import React, { useRef, useState, useEffect } from 'react';
import { Input } from 'antd';
import { anonymousFunction, api, apiHolder, apis, DataTrackerApi, LoginApi } from 'api';
import styles from './mail.module.scss';
import SiriusRadio from '@web-common/components/UI/SiriusRadio';
import ErrorIcon from '@web-common/components/UI/Icons/svgs/ErrorSvg';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import { emailPattern, ProductProtocols } from '@web-common/utils/constant';
import { getIn18Text } from 'api';
export type MailValidateFrom = 'login' | 'account';
type submitFunc = (account: string, pwd: string, data?: any) => Promise<string>;
interface MailValidateProp extends Partial<MailValidateFormProp> {
  from: MailValidateFrom;
  defaultAccount?: string;
  onSuccess?: anonymousFunction;
  currentAccountNode?: string;
}
interface MailValidateFormProp {
  defaultAccount?: string;
  defaultPwd?: string;
  showProtocol?: boolean;
  onSubmit: submitFunc;
  submitTxt: string;
}
const loginApi = api.requireLogicalApi(apis.loginApiImpl) as LoginApi;
const trackApi: DataTrackerApi = apiHolder.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;
// eslint-disable-next-line max-len
const mailPattern =
  /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
export const MailValidateForm: React.FC<MailValidateFormProp> = props => {
  const { defaultAccount = '', defaultPwd = '', showProtocol = true, onSubmit, submitTxt } = props;
  const inputRef = useRef<any>(null);
  const [account, setAccount] = useState<string>(defaultAccount);
  const [pwd, setPwd] = useState<string>(defaultPwd);
  const [errorTxt, setErrorTxt] = useState<string>('');
  const [protocolChecked, setProtocolChecked] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const submit = async () => {
    if (loading) {
      return;
    }
    if (!account) {
      setErrorTxt(getIn18Text('QINGSHURUYOUXIANGZHANG'));
      return;
    }
    if (!pwd) {
      setErrorTxt(getIn18Text('QINGSHURUMIMA'));
      return;
    }
    if (!mailPattern.test(account)) {
      setErrorTxt(getIn18Text('YOUXIANGZHANGHAOGE'));
      return;
    }
    if (!protocolChecked) {
      const t = (
        <span className={styles.uProtocol} onClick={e => e.stopPropagation()}>
          <span>{getIn18Text('QINGXIANTONGYI')}</span>
          <a href={ProductProtocols.agreement} target="_blank" rel="noreferrer">
            {getIn18Text('FUWUTIAOKUAN')}
          </a>
          <span>{getIn18Text('HE')}</span>
          <a href={ProductProtocols.privacy} target="_blank" rel="noreferrer">
            {getIn18Text('YINSIZHENGCE')}
          </a>
        </span>
      );
      Modal.error({
        title: t,
        okText: getIn18Text('ZHIDAOLE'),
        centered: true,
        hideCancel: true,
      });
      return;
    }
    setLoading(true);
    const res = await loginApi.doPreLogin(account);
    if (typeof res === 'object' && res.errmsg) {
      setErrorTxt(res.errmsg);
      return;
    }
    if (typeof res === 'string') {
      setErrorTxt(res);
      return;
    }
    const errMsg = await onSubmit(account, pwd);
    setLoading(false);
    setErrorTxt(errMsg);
  };
  const onPreLogin = () => {
    if (account) {
      // const pattern = /^([a-zA-Z0-9][a-zA-Z0-9_\-.+#']*)@([a-zA-Z0-9_\-.]+\.[a-zA-Z]{2,})$/;
      const pattern = emailPattern;
      if (pattern.test(account)) {
        loginApi.doPreLogin(account);
      } else {
        setErrorTxt(getIn18Text('YOUXIANGZHANGHAOGE'));
      }
    }
  };
  useEffect(() => {
    inputRef?.current?.focus({
      cursor: 'end',
    });
  }, []);
  useEffect(() => {
    setAccount(defaultAccount);
  }, [defaultAccount]);
  return (
    <div className={styles.wrap}>
      <div className={styles.accountWrap}>
        <Input
          allowClear
          placeholder={getIn18Text('WANGYIQIYEYOU')}
          value={account}
          ref={inputRef}
          readOnly={!!defaultAccount}
          onChange={e => {
            setAccount(e.target.value);
          }}
          onFocus={() => {
            onPreLogin();
            setErrorTxt('');
          }}
          autoComplete="off"
          suffix={null}
        />
      </div>
      <div className={styles.pwdWrap}>
        <Input.Password
          allowClear
          placeholder={getIn18Text('QINGSHURUMIMA')}
          value={pwd}
          onFocus={() => {
            setErrorTxt('');
          }}
          onChange={e => {
            setPwd(e.target.value);
          }}
        />
      </div>
      <div
        hidden={!showProtocol}
        className={styles.protocolWrap}
        onClick={e => {
          setProtocolChecked(checked => !checked);
          e.stopPropagation();
        }}
      >
        <SiriusRadio checked={protocolChecked}>
          <span className={styles.uProtocol} onClick={e => e.stopPropagation()}>
            <span>{getIn18Text('WOYIYUEDUBING')}</span>
            <a href={ProductProtocols.agreement} target="_blank" rel="noreferrer">
              {getIn18Text('FUWUTIAOKUAN')}
            </a>
            <span>{getIn18Text('HE')}</span>
            <a href={ProductProtocols.privacy} target="_blank" rel="noreferrer">
              {getIn18Text('YINSIZHENGCE')}
            </a>
          </span>
        </SiriusRadio>
      </div>
      <div className={styles.submitBtn} onClick={submit}>
        {submitTxt + (loading ? getIn18Text('ZHONG...') : '')}
      </div>
      <div className={styles.errorWrap} hidden={!errorTxt}>
        <ErrorIcon width={14} height={14} className={styles.errorIcon} />
        <span className={styles.errorText}>{errorTxt}</span>
      </div>
    </div>
  );
};
const MailValidate: React.FC<MailValidateProp> = props => {
  const { from, onSuccess, defaultAccount, currentAccountNode } = props;
  const submitTxtMap = {
    login: getIn18Text('DENGLU'),
    account: getIn18Text('DENGLU'),
  };
  useEffect(() => {
    trackApi.track('pc_verify_email_account_page', { pageSource: from });
  }, []);
  const onSubmit = async (account: string, pwd: string) => {
    const { pass, errmsg } = await loginApi.doMobileValidateAccountLogin({
      account,
      password: pwd,
      currentAccountNode,
    });
    if (pass) {
      onSuccess && onSuccess();
      trackApi.track('pc_verify_email_account_page_result', { pageSource: from, actionresult: true });
    }
    trackApi.track('pc_verify_email_account_page_result', { pageSource: from, actionresult: errmsg });
    return errmsg;
  };
  const submitTxt = submitTxtMap[from];
  return <MailValidateForm defaultAccount={defaultAccount} onSubmit={onSubmit} submitTxt={submitTxt} />;
};
export default MailValidate;
