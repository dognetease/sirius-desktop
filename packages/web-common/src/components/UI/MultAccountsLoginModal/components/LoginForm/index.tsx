import React, { useEffect, useState, useRef } from 'react';
import classnames from 'classnames';
import styles from './loginform.module.scss';
import { Button, Form, Input } from 'antd';
import IconCard from '@web-common/components/UI/IconCard/index';
import {
  BaseLoginInfo,
  AccountTypes,
  EmailAndPass,
  MultAccountsLoginInfo,
  apiHolder as api,
  apis,
  LoginApi,
  AccountApi,
  CloseMultAccountLoginFun,
  SubAccountBindInfo,
  MailApi,
} from 'api';
import SiriusMessage from '@web-common/components/UI/Message/SiriusMessage';
import { getEmailSuffix, sendAddAccountTrack } from '@web-common/components/util/webmail-util';
import ErrorIcon from '@web-common/components/UI/Icons/svgs/ErrorSvg';
import { getIn18Text } from 'api';
interface loginProps {
  visible: boolean;
  accountType: AccountTypes;
  loginInfo: MultAccountsLoginInfo;
  closeModal: CloseMultAccountLoginFun;
  sendFormData: (baseInfo: EmailAndPass, visible?: 'set' | 'verify', mobile?: string) => void;
  children?: React.ReactNode;
  getTipInfoByEmail: (email: string, isReBind: boolean) => { tipCode: string; tipTxt: string; showReBind: boolean } | undefined;
  changeToRebind: (val: boolean) => void;
  isReBind: boolean;
}
// 绑定标题
const bindNameMap = {
  NeteaseQiYeMail: getIn18Text('BANGDINGWANGYIQIYEYOUXIANG'),
  QQMail: getIn18Text('BANGDINGQQYOUXIANG'),
  '163Mail': getIn18Text('BANGDING163YOUXIANG'),
  TencentQiye: getIn18Text('BANGDINGTENGXUNQIYYXZH'),
  MicrosoftGlobal: getIn18Text('BANGDINGMICROSOFT365YXZH'),
  Gmail: getIn18Text('BANGDINGGMAILYXZH'),
  Microsoft: getIn18Text('BANGDINGMICROSOFT365YXZH'),
  Outlook: getIn18Text('BANGDINGOUTLOOKYXZH'),
  Others: getIn18Text('BANGDINGOTHERSYOUXIANG'),
};
// 重新绑定标题
const rebindNameMap = {
  NeteaseQiYeMail: getIn18Text('CHONGXINYANZHENGWANGYIQIYEYOUXIANG'),
  QQMail: getIn18Text('CHONGXINYANZHENGQQYOUXIANG'),
  '163Mail': getIn18Text('CHONGXINYANZHENG163YOUXIANG'),
  TencentQiye: getIn18Text('CXBANGDINGTENGXUNQIYYXZH'),
  MicrosoftGlobal: getIn18Text('CXBANGDINGMICROSOFT365YXZH'),
  Gmail: getIn18Text('CXBANGDINGGMAILYXZH'),
  Microsoft: getIn18Text('CXBANGDINGMICROSOFT365YXZH'),
  Outlook: getIn18Text('CXBANGDINGOUTLOOKYXZH'),
  Others: getIn18Text('CHONGXINYANZHENGOTHERSYOUXIANG'),
};
const codeMap = {
  QQMail: 'https://service.mail.qq.com/detail/0/75',
  '163Mail': 'https://help.mail.163.com/faqDetail.do?code=d7a5dc8471cd0c0e8b4b8f4f8e49998b374173cfe9171305fa1ce630d7f67ac2a5feb28b66796d3b',
  TencentQiye: 'https://open.work.weixin.qq.com/help2/pc/19886?person_id=1',
  Gmail: 'https://support.google.com/accounts/answer/185833?visit_id=637011925839380259-3739600675&rd=1#ts=3141880',
};

const mailApi = api.api.requireLogicalApi(apis.mailApiImpl) as MailApi;
const loginApi = api.api.requireLogicalApi(apis.loginApiImpl) as LoginApi;
const accountApi = api.api.requireLogicalApi(apis.accountApiImpl) as AccountApi;

const LoginForm = (props: loginProps) => {
  const { sendFormData, accountType = 'Others', closeModal, loginInfo, visible, getTipInfoByEmail, changeToRebind, isReBind } = props;
  const [form] = Form.useForm();
  const inputRef = useRef(null);
  const inputPwRef = useRef(null);
  const passName =
    getIn18Text('QINGSHURU') +
    (['163Mail', 'QQMail', 'Gmail'].includes(accountType)
      ? getIn18Text('SHOUQUANMA')
      : ['Outlook'].includes(accountType)
      ? getIn18Text('MIMA')
      : getIn18Text('MIMASHOUQUANMA'));

  const [formData, setFormData] = useState<EmailAndPass>({ agentEmail: '', password: '' });
  const [errMsg, setErrMsg] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [btnDisabled, setBtnDisabled] = useState<boolean>(true);
  const [curFocus, setCurFocus] = useState<string>('');
  const [hideEmailTip, setHideEmailTip] = useState<boolean>(false);
  const [hidePasswordTip, setHidePasswordTip] = useState<boolean>(false);
  const [codeDescMap, setCodeDescMap] = useState(codeMap);

  const [tipTxt, setTipTxt] = useState('');
  const [showReBind, setShowReBind] = useState<boolean>(false);

  useEffect(() => {
    if (!tipTxt) {
      setShowReBind(false);
    }
    inputChange();
  }, [tipTxt]);

  const setTipInfo = (tipTxt: string, showReBind: boolean) => {
    setTipTxt(tipTxt);
    setShowReBind(showReBind);
  };

  const getTipInfo = () => {
    const agentEmail = form.getFieldValue('agentEmail') || '';
    const tipInfo = getTipInfoByEmail(agentEmail, isReBind);
    return tipInfo;
  };

  const handleEmailChanged = () => {
    const tipInfo = getTipInfo();
    if (tipInfo && tipInfo.tipTxt) {
      setTipInfo(tipInfo.tipTxt, tipInfo.showReBind);
      return;
    }

    inputChange();
  };

  const [hasChangeToRebind, setHasChangeToRebind] = useState<boolean>(false);

  const handleChangeToReBind = () => {
    if (!isReBind) {
      setHasChangeToRebind(true);
      changeToRebind(true);
      setTipTxt('');
    }
  };

  const getAuthCodeByMail = () => {
    window.open(codeDescMap[accountType as 'QQMail' | '163Mail']);
  };

  const getSetFormInfo = () => {
    const baseInfo: EmailAndPass = form.getFieldsValue(true);
    setFormData(baseInfo);
    sendFormData(baseInfo, 'set');
  };

  const renderOtherSet = () => {
    if (accountType === 'NeteaseQiYeMail') return '';
    return (
      <div className={classnames(styles.otherset)}>
        <span className={classnames(styles.btn)} onClick={getSetFormInfo}>
          {getIn18Text('GAOJISHEZHI')}
        </span>
        {['Others', 'Outlook'].includes(accountType) ? (
          ''
        ) : (
          <>
            <span className={classnames(styles.partline)}></span>
            <span className={classnames(styles.btn)} onClick={getAuthCodeByMail}>
              {getIn18Text('HUOQUSHOUQUANMA')}
            </span>
          </>
        )}
      </div>
    );
  };
  const bindNeteaseQiYeMail = (baseInfo: BaseLoginInfo) => {
    let params;
    const loginAccountType = hasChangeToRebind ? accountType : loginInfo.accountType;
    if (isReBind) {
      params = {
        accountType: loginAccountType === 'NeteaseQiYeMail' ? 'qyEmail' : 'personalEmail',
        agentEmail: baseInfo.agentEmail,
        password: baseInfo.password,
      };
    }
    console.log('bindNeteaseQiYeMail===params', params);
    const promise = !isReBind ? loginApi.bindSubAccount(baseInfo) : accountApi.editSubAccount(params);
    promise
      .then(res => {
        if (!res.success) {
          res.errMsg && setErrMsg(res.errMsg);
          //手机号验证，errCode为600时，errMsg为手机号。
          if (res.errCode === 600) {
            // changeVerifyCodeVisible(true)
            sendFormData(baseInfo, 'verify', res.errMsg);
            return;
          }
          sendAddAccountTrack(loginInfo.way, accountType, 'fail', res.errMsg);
          return;
        }
        SiriusMessage.success({
          content: '绑定成功！',
        });
        setErrMsg('');
        sendAddAccountTrack(loginInfo.way, accountType, 'success');
        closeModal({ refresh: true, email: baseInfo.agentEmail });
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const bindThirdMail = async (baseInfo: BaseLoginInfo) => {
    let mailDomain;
    switch (baseInfo.accountType) {
      case '163Mail':
        mailDomain = '163.com';
        break;
      case 'QQMail':
        mailDomain = 'qq.com';
        break;
      default:
        mailDomain = getEmailSuffix(baseInfo.agentEmail)[1];
    }
    let clientConfig = await loginApi.getMailClientConfig(mailDomain);
    // 腾讯企业邮 本地配置
    // if (baseInfo.accountType === 'TencentQiye') {
    //   clientConfig = {
    //     smtp:{
    //       host:'smtp.exmail.qq.com',
    //       port: 465,
    //       sslPort: 1
    //     }, imap: {
    //       host: 'imap.exmail.qq.com',
    //       port: 993,
    //       sslPort:1
    //     }
    //   }
    // } else {
    //  clientConfig = await loginApi.getMailClientConfig(mailDomain);
    // }
    if (!clientConfig) {
      setErrMsg(getIn18Text('NINDEIMAPFUWU'));
      setLoading(false);
      return;
    }
    const { host: sendHost, port: sendPort, sslPort: sendSsl } = clientConfig.smtp;
    const { host: receiveHost, port: receivePort, sslPort: receiveSsl } = clientConfig.imap;
    const accountInfo = {
      ...baseInfo,
      sendHost,
      sendPort: sendSsl ? sendSsl : sendPort,
      sendSsl: sendSsl ? 1 : 0,
      receiveHost,
      receivePort: receiveSsl ? receiveSsl : receivePort,
      receiveSsl: receiveSsl ? 1 : 0,
      receiveProtocol: 0,
      agentNickname: getEmailSuffix(baseInfo.agentEmail)[0] || 'nickName',
    };
    console.log('bindThirdMail===accountInfo', accountInfo);

    let params;
    if (isReBind) {
      params = {
        ...accountInfo,
        accountType: loginInfo.accountType === 'NeteaseQiYeMail' ? 'qyEmail' : 'personalEmail',
        agentNickname: loginInfo.agentNickname || 'nickName',
      };
    }
    console.log('bindThirdMail=====params', params);
    const promise = !isReBind ? loginApi.bindSubAccount(accountInfo as SubAccountBindInfo) : accountApi.editSubAccount(params);

    promise
      .then(res => {
        if (!res.success) {
          res.errMsg && setErrMsg(res.errMsg || String(res.errCode));
          sendAddAccountTrack(loginInfo.way, accountType, 'fail', res.errMsg);
          return;
        }
        SiriusMessage.success({
          content: '绑定成功！',
        });
        sendAddAccountTrack(loginInfo.way, accountType, 'success');
        setErrMsg('');
        closeModal({ refresh: true, email: baseInfo.agentEmail });
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const onFinish = (values: any) => {
    setErrMsg('');
    const tipInfo = getTipInfo();
    if (tipInfo && tipInfo.tipTxt) {
      setTipInfo(tipInfo.tipTxt, tipInfo.showReBind);
      return;
    }
    console.log('Success:', values);
    sendFormData(values as EmailAndPass);
    values.accountType = accountType;
    setTipTxt('');
    setLoading(true);
    if (accountType === 'NeteaseQiYeMail') {
      bindNeteaseQiYeMail(values);
    } else {
      bindThirdMail(values);
    }
  };
  const onFinishFailed = (errorInfo: any) => {
    console.log('Failed:', errorInfo);
  };

  const inputChange = () => {
    if (!!form.getFieldValue('agentEmail') && !!form.getFieldValue('password')) {
      if (!tipTxt) {
        setBtnDisabled(false);
      } else {
        setBtnDisabled(true);
      }
    } else {
      !btnDisabled && setBtnDisabled(true);
    }
    setHideEmailTip(!!form.getFieldValue('agentEmail'));
    setHidePasswordTip(!!form.getFieldValue('password'));
  };

  useEffect(() => {
    mailApi.getAuthCodeDesc().then(res => {
      if (res?.length) {
        const newAuthMap = { ...codeDescMap };
        res.forEach(desc => {
          switch (desc.desc) {
            case '163':
            case '126':
              newAuthMap['163Mail'] = desc.url;
              break;
            case 'qq':
              newAuthMap['QQMail'] = desc.url;
              break;
            case 'qq_qiye':
              newAuthMap['TencentQiye'] = desc.url;
              break;
            case 'gmail':
              newAuthMap['Gmail'] = desc.url;
              break;
          }
        });
        setCodeDescMap(newAuthMap);
      }
    });
  }, []);

  useEffect(() => {
    if (visible) {
      if (isReBind) {
        form.setFieldsValue({
          agentEmail: loginInfo.agentEmail,
        });
        form.setFieldsValue({
          password: loginInfo.password,
        });
      } else {
        if (formData.agentEmail || formData.password) {
          form.setFieldsValue(formData);
        }
      }
      inputChange();
    }
  }, [visible]);

  return visible ? (
    <div className={classnames(styles.container, 'ant-allow-dark')}>
      {(!isReBind || (isReBind && hasChangeToRebind)) && (
        <div
          className={classnames(styles.back)}
          onClick={() => {
            if (isReBind && hasChangeToRebind) {
              setHasChangeToRebind(false);
              closeModal({ refresh: false, norebind: true });
            } else {
              closeModal({ refresh: false });
            }
          }}
        >
          <IconCard type="backIcon" className="dark-invert" />
          <span style={{ marginLeft: '4px' }}>{getIn18Text('FANHUI')}</span>
        </div>
      )}
      <div className={classnames(styles.header)}>
        {!isReBind ? bindNameMap[accountType] : ''}
        {isReBind ? rebindNameMap[accountType] : ''}
      </div>
      <div className={classnames(styles.form)}>
        <Form<BaseLoginInfo> form={form} name="basic" onFinish={onFinish} onFinishFailed={onFinishFailed} autoComplete="off">
          <Form.Item className={classnames(styles.formItemWrapper)}>
            <Form.Item name="agentEmail" rules={[{ required: true, message: `${getIn18Text('QINGSHURUYOUXIANG13')}` }]} style={{ marginBottom: '16px' }}>
              <Input
                ref={inputRef}
                className={classnames(styles.input)}
                allowClear
                onChange={inputChange}
                onFocus={() => {
                  setTipTxt('');
                  setErrMsg('');
                  setCurFocus('ae');
                }}
                onBlur={() => {
                  handleEmailChanged();
                  setCurFocus('');
                }}
                disabled={isReBind}
              />
            </Form.Item>
            <p
              onClick={() => inputRef.current?.focus()}
              className={classnames(styles.inputTip, curFocus === 'ae' ? styles.inputTipActive : '', hideEmailTip ? styles.inputTipHide : '')}
            >
              {isReBind ? '' : getIn18Text('QINGSHURUYOUXIANG13')}
            </p>
          </Form.Item>
          <Form.Item className={classnames(styles.formItemWrapper)}>
            <Form.Item name="password" rules={[{ required: true, message: passName }]} style={{ marginBottom: '16px' }}>
              <Input.Password
                ref={inputPwRef}
                autoComplete="new-password"
                onChange={inputChange}
                className={classnames(styles.input)}
                onFocus={() => {
                  setCurFocus('pw');
                  setErrMsg('');
                }}
                onBlur={() => setCurFocus('')}
              />
            </Form.Item>
            <p
              onClick={() => inputPwRef.current?.focus()}
              className={classnames(styles.inputTip, curFocus === 'pw' ? styles.inputTipActive : '', hidePasswordTip ? styles.inputTipHide : '')}
            >
              {passName}
            </p>
          </Form.Item>
          {renderOtherSet()}
          <div className={classnames(styles.buttons)}>
            <Form.Item style={{ marginBottom: errMsg ? '20px' : '36px' }}>
              <Button type="primary" htmlType="submit" disabled={btnDisabled} loading={loading}>
                <span className={classnames(styles.text)}>{getIn18Text('QUEREN')}</span>
              </Button>
            </Form.Item>
          </div>
        </Form>
        <div>
          {(errMsg !== '' || tipTxt) && (
            <div className={styles.warn}>
              <ErrorIcon width={14} height={14} className={styles.uWarningIcon} />
              <div className={classnames(styles.errMsg)}>
                {errMsg || tipTxt || ''}&nbsp;
                {errMsg && !['NeteaseQiYeMail', 'Gmail', 'Outlook', 'Others'].includes(accountType) && (
                  <span className={classnames(styles.errBtn)} onClick={getAuthCodeByMail}>
                    {getIn18Text('HUOQUSHOUQUANMA')}
                  </span>
                )}
                {tipTxt && showReBind && (
                  <span className={classnames(styles.errBtn)} onClick={handleChangeToReBind}>
                    {getIn18Text('recheck')}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  ) : (
    <></>
  );
};
export default LoginForm;
