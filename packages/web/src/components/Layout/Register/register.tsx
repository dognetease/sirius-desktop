import { getIn18Text } from 'api';
import React, { useEffect, useState } from 'react';
import { message as Message, Input } from 'antd';
import { anonymousFunction, api, apis, DataTrackerApi, RegisterApi } from 'api';
// import { LeftOutlined } from '@ant-design/icons/LeftOutlined';
import styles from './register.module.scss';
import MobileValidate from '@/components/Layout/Login/validate/mobile';
import ErrorIcon from '@web-common/components/UI/Icons/svgs/ErrorSvg';
import { useActions, useAppSelector } from '@web-common/state/createStore';
import { actions as LoginActions } from '@web-common/state/reducer/loginReducer';

const trackApi: DataTrackerApi = api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;

export interface RegisterProp {}

interface CreateTeamProp {
  onSure: (domainPrefix: string, corpName: string) => void;
  visible: boolean;
}

interface CreateAccountProp {
  onSure: (adminName: string, adminAccount: string) => void;
  onPre: anonymousFunction;
  domainPrefix: string;
  visible: boolean;
}

export const CreateTeam: React.FC<CreateTeamProp> = props => {
  const { visible, onSure } = props;
  const [name, setName] = useState<string>('');
  const [domainPrefix, setDomainPrefix] = useState<string>('');
  const [error, setError] = useState<string>('');

  const submit = () => {
    if (!name) {
      setError(getIn18Text('QINGWANSHANNINDE1'));
      return;
    }
    if (!domainPrefix) {
      setError(getIn18Text('QINGWANSHANNINDEYUMING'));
      return;
    }
    onSure(domainPrefix, name);
  };
  useEffect(() => {
    trackApi.track('pc_register_improve_team_information_page');
  }, []);
  return (
    <div className={styles.createTeamWrap} hidden={!visible}>
      <div className={styles.title}>{getIn18Text('CHUANGJIANTUANDUI')}</div>
      <div className={styles.subTitle}>{getIn18Text('WANSHANNINDETUAN')}</div>
      <div className={styles.group}>
        <div className={styles.label}>
          <b>*</b>
          <span>{getIn18Text('TUANDUIMINGCHENG')}</span>
        </div>
        <Input
          allowClear
          className={styles.teamName}
          maxLength={20}
          placeholder={getIn18Text('QINGSHURUNINDE')}
          value={name}
          onFocus={() => setError('')}
          onChange={e => {
            setName(e.target.value);
          }}
        />
      </div>
      <div className={styles.group}>
        <div className={styles.label}>
          <b>*</b>
          <span>{getIn18Text('SHEZHININTUANDUI')}</span>
        </div>
        <div className={styles.domainPrefixWrap}>
          <div className={styles.prefixTxt}>@</div>
          <Input
            allowClear
            className={styles.domainPrefix}
            maxLength={20}
            placeholder={getIn18Text('LIRUexa')}
            value={domainPrefix}
            onFocus={() => setError('')}
            onChange={e => {
              setDomainPrefix(e.target.value);
            }}
          />
          <div className={styles.domainSuffixTxt}>.ntesmail.com</div>
        </div>
      </div>
      <div className={styles.submitBtn} onClick={submit}>
        {getIn18Text('XIAYIBU')}
      </div>
      <div className={styles.tip}>{getIn18Text('ZHU：CHUANGJIANCHENG')}</div>
      <div className={styles.errorWrap} hidden={!error}>
        <ErrorIcon width={14} height={14} className={styles.errorIcon} />
        <span className={styles.errorText}>{error}</span>
      </div>
    </div>
  );
};

export const CreateAccount: React.FC<CreateAccountProp> = props => {
  const { visible, domainPrefix, onSure, onPre } = props;
  const [adminName, setAdminName] = useState<string>('');
  const [adminAccount, setAdminAccount] = useState<string>('');
  const [error, setError] = useState<string>('');

  const submit = () => {
    if (!adminAccount) {
      setError(getIn18Text('QINGWANSHANNINDEZHANGHAO'));
      return;
    }
    if (!adminName) {
      setError(getIn18Text('QINGWANSHANNINDE'));
      return;
    }
    onSure(adminName, adminAccount);
  };
  useEffect(() => {
    trackApi.track('pc_register_improve_personal_information_page', { domainPrefix });
  }, []);
  return (
    <div className={styles.createAccountWrap} hidden={!visible}>
      <div className={styles.title}>{getIn18Text('WANSHANNINDEGE')}</div>
      <div className={styles.subTitle}>{getIn18Text('WEILEFANGBIANDA')}</div>
      <div className={styles.nameWrap}>
        <Input
          allowClear
          className={styles.nameInput}
          maxLength={20}
          placeholder={getIn18Text('QINGSHURUNIDE')}
          value={adminName}
          onFocus={() => setError('')}
          onChange={e => {
            setAdminName(e.target.value);
          }}
        />
      </div>
      <div className={styles.mailWrap}>
        <Input
          allowClear
          className={styles.mailInput}
          maxLength={20}
          placeholder={getIn18Text('YOUXIANGZHANGHAO，')}
          value={adminAccount}
          onFocus={() => setError('')}
          onChange={e => {
            setAdminAccount(e.target.value);
          }}
        />
        <div className={styles.mailSuffixTxt}>{`@${domainPrefix}.ntesmail.com`}</div>
      </div>
      <div className={styles.submitBtn} onClick={submit}>
        {getIn18Text('XIAYIBU')}
      </div>
      <div
        className={styles.preBtn}
        onClick={() => {
          setError('');
          onPre();
        }}
      >
        {getIn18Text('SHANGYIBU')}
      </div>
      <div className={styles.errorWrap} hidden={!error}>
        <ErrorIcon width={14} height={14} className={styles.errorIcon} />
        <span className={styles.errorText}>{error}</span>
      </div>
    </div>
  );
};

const registerApi = api.requireLogicalApi(apis.registerApiImpl) as RegisterApi;

const Register: React.FC<RegisterProp> = () => {
  const { registerInfo } = useAppSelector(state => state.loginReducer);
  const { setVisibleSuccessModal, setRegisterInfo } = useActions(LoginActions);
  const [visibleCreateTeam, setVisibleCreateTeam] = useState<boolean>(true);
  const [visibleCreateAccount, setVisibleCreateAccount] = useState<boolean>(false);
  const { mobile, code, isValidate, visible } = registerInfo;

  const goBack = () => {
    setRegisterInfo({
      visible: false,
      isValidate: false,
      corpName: '',
      domainPrefix: '',
      adminName: '',
      adminAccount: '',
      mobile: '',
      code: '',
    });
    setVisibleCreateTeam(true);
    setVisibleCreateAccount(false);
  };

  const createTeam = (domainPrefix: string, corpName: string) => {
    registerApi
      .doCheckDomain({
        mobile,
        code,
        domainPrefix,
        corpName,
      })
      .then(({ success, message }) => {
        if (success) {
          setRegisterInfo({ corpName, domainPrefix });
          setVisibleCreateTeam(false);
          setVisibleCreateAccount(true);
          trackApi.track('pc_register_improve_team_information_page_aciton', { domainPrefix, actionResult: 'true' });
        } else {
          message && Message.info(message);
          trackApi.track('pc_register_improve_team_information_page_aciton', { domainPrefix, actionResult: 'error', result: message });
        }
      });
  };

  const createAccount = (adminName: string, adminAccount: string) => {
    registerApi.doSubmit({ ...registerInfo, adminName, adminAccount }).then(({ success, message }) => {
      if (success) {
        setRegisterInfo({ adminName, adminAccount });
        setVisibleSuccessModal(true);
        trackApi.track('pc_register_improve_personal_information_page_action', { actionResult: 'true' });
      } else {
        message && Message.info(message);
        trackApi.track('pc_register_improve_personal_information_page_action', { actionResult: 'error', result: message });
      }
    });
  };

  return (
    <div className={styles.registerContainer} hidden={!visible}>
      <div className={styles.registerWrap}>
        <div className={styles.backWrap} onClick={goBack}>
          <div className={styles.backIcon}>
            <i />
          </div>
          <span key="back" className={styles.back}>
            {getIn18Text('FANHUI')}
          </span>
        </div>
        {!isValidate ? (
          <>
            <div className={styles.wrap}>
              <div className={styles.title}>{getIn18Text('HUANYINGSHIYONGWM')}</div>
              <div className={styles.content}>
                <MobileValidate from="register" />
              </div>
            </div>
          </>
        ) : (
          <>
            <CreateTeam visible={visibleCreateTeam} onSure={createTeam} />
            <CreateAccount
              onPre={() => {
                setVisibleCreateTeam(true);
                setVisibleCreateAccount(false);
              }}
              visible={visibleCreateAccount}
              domainPrefix={registerInfo.domainPrefix}
              onSure={createAccount}
            />
          </>
        )}
      </div>
    </div>
  );
};
export default Register;
