import React, { useState, useEffect } from 'react';
import classnames from 'classnames';
import './index.scss';
import styles from './setform.module.scss';
import { Button, Checkbox, Form, Input, Spin } from 'antd';
import { apiHolder as api, apis, LoginApi, AccountApi, AccountTypes, EmailAndPass, CloseMultAccountLoginFun, MultAccountsLoginInfo } from 'api';
import SiriusMessage from '@web-common/components/UI/Message/SiriusMessage';
import { getEmailSuffix, sendAddAccountTrack } from '@web-common/components/util/webmail-util';
import IconCard from '@web-common/components/UI/IconCard/index';
import ErrorIcon from '@web-common/components/UI/Icons/svgs/ErrorSvg';
import { getIn18Text } from 'api';

const loginApi = api.api.requireLogicalApi(apis.loginApiImpl) as LoginApi;
const accountApi = api.api.requireLogicalApi(apis.accountApiImpl) as AccountApi;

interface PortModal {
  sendSsl: number;
  sendPort: number;
  receiveSsl: number;
  receivePort: number;
}

const SetForm: React.FC<{
  formData: EmailAndPass;
  accountType: AccountTypes;

  closeModal: CloseMultAccountLoginFun;

  loginInfo: MultAccountsLoginInfo;

  getTipInfoByEmail: (email: string, isReBind: boolean) => { tipCode: string; tipTxt: string; showReBind: boolean } | undefined;
  changeToRebind: (val: boolean) => void;
  isReBind: boolean;
}> = props => {
  const { accountType, formData, loginInfo, closeModal, getTipInfoByEmail, changeToRebind, isReBind } = props;
  const [loading, setLoading] = useState<boolean>(false);
  const [form] = Form.useForm();

  const [errMsg, setErrMsg] = useState<string>('');
  const [port, setPort] = useState<PortModal>();
  const passName = ['Others', 'Outlook'].includes(accountType) ? getIn18Text('MIMA') : getIn18Text('SHOUQUANMA');

  const getTipInfo = () => {
    const agentEmail = form.getFieldValue('agentEmail') || '';
    const tipInfo = getTipInfoByEmail(agentEmail, isReBind);
    return tipInfo;
  };

  const [tipTxt, setTipTxt] = useState('');
  const [showReBind, setShowReBind] = useState<boolean>(false);

  const setTipInfo = (tipTxt: string, showReBind: boolean) => {
    setTipTxt(tipTxt);
    setShowReBind(showReBind);
  };
  const onFinish = (values: any) => {
    console.log('Success:', values);
    setErrMsg('');
    const tipInfo = getTipInfo();
    if (tipInfo && tipInfo.tipTxt) {
      setTipInfo(tipInfo.tipTxt, tipInfo.showReBind);
      return;
    }
    setLoading(true);
    values.sendSsl = values.sendSsl ? 1 : 0;
    values.receiveSsl = values.receiveSsl ? 1 : 0;
    values.receiveProtocol = 0;
    values.agentNickname = values.agentEmail.substring(0, values.agentEmail.indexOf('@')) || 'nickName';
    let params;
    if (isReBind) {
      const loginAccountType = hasChangeToRebind ? accountType : loginInfo.accountType;
      params = {
        ...values,
        accountType: loginAccountType === 'NeteaseQiYeMail' ? 'qyEmail' : 'personalEmail',
        agentNickname: loginInfo.agentNickname || 'nickName',
      };
    }
    console.log('bindThirdMail=====params', params);

    const promise = !isReBind ? loginApi.bindSubAccount({ ...values, accountType }) : accountApi.editSubAccount(params);

    promise
      .then(res => {
        console.log('bindNeteaseQiYeMail===res', res);
        // 失败时 会显示失败原因 todo
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
        closeModal({ refresh: true, email: values.agentEmail });
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const onFinishFailed = (errorInfo: any) => {
    console.log('Failed:', errorInfo);
  };

  const getMailClientConfigFormLocal = async () => {
    const { type: loginInfoType, agentEmail: loginInfoAgentEmail } = loginInfo;
    // 重新绑定时
    if (loginInfoType === 'rebind' && loginInfoAgentEmail) {
      if ('TencentQiye' === accountType) {
        setQiyeQQConfig();
        return;
      }
      // 再尝试本地获取
      const localAccounts = await accountApi.getSubAccounts();
      if (!localAccounts?.length) return;
      const findOne = localAccounts.find(item => item.agentEmail === loginInfoAgentEmail);
      if (!findOne) return;
      const { mainSendReceiveInfo } = findOne;
      if (mainSendReceiveInfo) {
        const { sendHost, sendPort, sendSsl, receiveHost, receivePort, receiveSsl } = mainSendReceiveInfo;
        setPort({
          sendSsl,
          sendPort,
          receiveSsl,
          receivePort,
        });
        form.setFieldsValue({
          sendHost,
          receiveHost,
          sendPort: sendSsl ? sendSsl : sendPort,
          receivePort: receiveSsl ? receiveSsl : receivePort,
          sendSsl: !!sendSsl,
          receiveSsl: !!receiveSsl,
        });
      }
    }
  };
  const setQiyeQQConfig = () => {
    setPort({
      sendSsl: 1,
      sendPort: 465,
      receiveSsl: 1,
      receivePort: 993,
    });
    form.setFieldsValue({
      sendHost: 'smtp.exmail.qq.com',
      receiveHost: 'imap.exmail.qq.com',
      sendPort: 465,
      receivePort: 993,
      sendSsl: true,
      receiveSsl: true,
    });
  };

  // 获取配置
  const getMailClientConfig = async (mailDomain: string) => {
    // 远端
    try {
      const clientConfig = await loginApi.getMailClientConfig(mailDomain);
      if (clientConfig) {
        const { host: sendHost, port: sendPort, sslPort: sendSsl } = clientConfig.smtp;
        const { host: receiveHost, port: receivePort, sslPort: receiveSsl } = clientConfig.imap;
        setPort({
          sendSsl,
          sendPort,
          receiveSsl,
          receivePort,
        });
        form.setFieldsValue({
          sendHost,
          receiveHost,
          sendPort: sendSsl ? sendSsl : sendPort,
          receivePort: receiveSsl ? receiveSsl : receivePort,
          sendSsl: !!sendSsl,
          receiveSsl: !!receiveSsl,
        });
        return;
      }
      getMailClientConfigFormLocal();
    } catch (error) {
      console.log('远端获取配置失败', error);
      getMailClientConfigFormLocal();
    }
  };

  const changeSsl = (checked: boolean, ssl: 'receiveSsl' | 'sendSsl') => {
    if (ssl === 'receiveSsl') {
      form.setFieldsValue({
        receivePort: checked ? port?.receiveSsl : port?.receivePort,
      });
    } else {
      form.setFieldsValue({
        sendPort: checked ? port?.sendSsl : port?.sendPort,
      });
    }
  };

  useEffect(() => {
    form.setFieldsValue({
      agentEmail: formData.agentEmail,
      password: formData.password,
    });
    handleEmailChanged();
    if (accountType === '163Mail' || accountType === 'QQMail') {
      const mailDomain: string = accountType === '163Mail' ? '163.com' : 'qq.com';
      getMailClientConfig(mailDomain);
    }
    if (['Others', 'Gmail', 'Outlook'].includes(accountType) && !!formData.agentEmail) {
      const mailDomain: string = getEmailSuffix(formData.agentEmail)[1];
      if (!!mailDomain) {
        getMailClientConfig(mailDomain);
      }
    }
    // 腾讯企业邮 临时配置，后续接接口
    if ('TencentQiye' === accountType) {
      // if (formData.agentEmail) {
      // const mailDomain: string = getEmailSuffix(formData.agentEmail)[1];
      // if (!!mailDomain) {
      setQiyeQQConfig();
      // }
      // }
    }
  }, []);

  const handleEmailChanged = () => {
    const tipInfo = getTipInfo();
    if (tipInfo && tipInfo.tipTxt) {
      setTipInfo(tipInfo.tipTxt, tipInfo.showReBind);
    }
  };

  const [hasChangeToRebind, setHasChangeToRebind] = useState<boolean>(false);

  const handleChangeToReBind = () => {
    changeToRebind(true);
    setTipTxt('');
    setShowReBind(false);
    setHasChangeToRebind(true);
  };

  return (
    <Spin spinning={loading} tip="验证中，请稍后..." wrapperClassName="setform-span-container">
      <div className={classnames(styles.container, 'ant-allow-dark')} style={{ opacity: loading ? 0 : 1 }}>
        <div
          className={classnames(styles.title)}
          onClick={() => {
            const agentEmail = form.getFieldValue('agentEmail') || '';
            const password = form.getFieldValue('password') || '';
            if (isReBind && hasChangeToRebind) {
              setHasChangeToRebind(false);
              closeModal({ refresh: false, norebind: true, agentEmail, password });
            } else {
              closeModal({ refresh: false, agentEmail, password });
            }
          }}
        >
          <IconCard type="backIcon" />
          <span style={{ marginLeft: '4px' }}>{`${isReBind ? getIn18Text('recheck') + ' - ' : ''}` + getIn18Text('GAOJISHEZHI')}</span>
        </div>
        <div className={classnames(styles.form)}>
          <Form form={form} name="set" layout="vertical" onFinish={onFinish} onFinishFailed={onFinishFailed} autoComplete="off">
            <Form.Item name="agentEmail" label={getIn18Text('YOUXIANGZHANGHAO')} rules={[{ required: true, message: `${getIn18Text('QINGSHURUYOUXIANG13')}` }]}>
              <Input onBlur={handleEmailChanged} placeholder={isReBind ? '' : '请输入' + getIn18Text('QINGSHURUYOUXIANG13')} allowClear disabled={isReBind} />
            </Form.Item>
            <Form.Item name="password" label={passName} rules={[{ required: true, message: `请输入${passName}` }]}>
              <Input.Password placeholder={'请输入' + passName} />
            </Form.Item>

            <Form.Item style={{ marginBottom: 0 }}>
              <Input.Group compact>
                <Form.Item
                  label={getIn18Text('IMAPFUWUQI')}
                  name="receiveHost"
                  className={classnames(styles.host)}
                  rules={[{ required: true, message: `请输入${getIn18Text('IMAPFUWUQI')}` }]}
                >
                  <Input placeholder={'请输入' + getIn18Text('IMAPFUWUQI')} allowClear />
                </Form.Item>
                <Form.Item name="receivePort" label={getIn18Text('DUANKOU')} className={classnames(styles.port)}>
                  <Input placeholder={getIn18Text('XUANTIAN')} />
                </Form.Item>
              </Input.Group>
            </Form.Item>
            <Form.Item name="receiveSsl" valuePropName="checked">
              <Checkbox
                onChange={e => {
                  changeSsl(e.target.checked, 'receiveSsl');
                }}
              >
                使用ssl
              </Checkbox>
            </Form.Item>
            <Form.Item style={{ marginBottom: 0 }}>
              <Input.Group compact>
                <Form.Item
                  label={getIn18Text('SMTPFUWUQI')}
                  name="sendHost"
                  rules={[{ required: true, message: `请输入${getIn18Text('SMTPFUWUQI')}` }]}
                  className={classnames(styles.host)}
                >
                  <Input placeholder={'请输入' + getIn18Text('SMTPFUWUQI')} allowClear />
                </Form.Item>

                <Form.Item name="sendPort" label={getIn18Text('DUANKOU')} className={classnames(styles.port)}>
                  <Input placeholder={getIn18Text('XUANTIAN')} />
                </Form.Item>
              </Input.Group>
            </Form.Item>
            <Form.Item name="sendSsl" valuePropName="checked" style={{ marginBottom: errMsg ? '12px' : '24px' }}>
              <Checkbox
                onChange={e => {
                  changeSsl(e.target.checked, 'sendSsl');
                }}
              >
                使用ssl
              </Checkbox>
            </Form.Item>

            {(errMsg !== '' || tipTxt) && (
              <div className={styles.warn}>
                <ErrorIcon width={14} height={14} className={styles.uWarningIcon} />
                <div className={classnames(styles.errMsg)}>{errMsg || tipTxt}</div>
                {tipTxt && showReBind && (
                  <span className={classnames(styles.errBtn)} onClick={handleChangeToReBind}>
                    {getIn18Text('recheck')}
                  </span>
                )}
              </div>
            )}

            <div className={classnames(styles.buttons)}>
              <Button
                onClick={() => {
                  closeModal({ refresh: false });
                }}
              >
                {getIn18Text('QUXIAO')}
              </Button>
              <Button type="primary" htmlType="submit" disabled={!!tipTxt}>
                {getIn18Text('QUEREN')}
              </Button>
            </div>
          </Form>

          {/* <div>
            {errMsg !== '' &&
              <div className={classnames(styles.errMsg)}>{errMsg}</div>}
          </div> */}
        </div>
      </div>
    </Spin>
  );
};
export default SetForm;
