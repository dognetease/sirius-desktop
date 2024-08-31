import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Input, Radio, RadioChangeEvent } from 'antd';
import { api, apis, DataTrackerApi, RegisterApi, SystemApi } from 'api';
import styles from './register.module.scss';
import MobileValidate from '../Login/validate/mobile';
import ErrorIcon from '@web-common/components/UI/Icons/svgs/ErrorSvg';
import { useActions, useAppSelector } from '@web-common/state/createStore';
import { actions as LoginActions } from '@web-common/state/reducer/loginReducer';
import LoadingIcon from './../component/loading-icons';
import debounce from 'lodash/debounce';
import { getIn18Text } from 'api';

const trackApi: DataTrackerApi = api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;
const systemApi = api.getSystemApi() as SystemApi;

export interface RegisterProp {}
// todo 没有翻译
interface CreateTeamProp {
  visible: boolean;
}

export const CreateTeam: React.FC<CreateTeamProp> = props => {
  const { visible } = props;
  // 团队名称
  const [teamName, setTeamName] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [hasCorpDomain, setHasCorpDomain] = useState<string>('1');
  // 姓名
  const [accountName, setAccountName] = useState<string>('');
  const [isCustomHost, setIsCustomHost] = useState<boolean>(false);
  // 个人邮箱地址
  const [emailAccountName, setEmailAccountName] = useState<string>('');
  // 团队域名
  const [emailCorpName, setEmailCorpName] = useState<string>('');
  const [corpDomain, setCorpDomain] = useState<string>('');
  const [isRegistering, setIsRegistering] = useState<boolean>(false);
  const { mobile, code } = useAppSelector(state => state.loginReducer.registerInfo);
  const { setRegisterInfo, setRegisterResultDialogVisible, setServiceList } = useActions(LoginActions);
  const emailAccountInputRef = useRef<Input>(null);
  const emailCorpNameInputRef = useRef<Input>(null);
  const errorDivRef = useRef<HTMLDivElement>(null);
  const [isComposition, setIsComposition] = useState<boolean>(false);

  const getDomainInfoDebounce = useCallback(
    debounce(
      (accountName: string, teamName: string) => {
        if (!accountName && !teamName) {
          setEmailAccountName('');
          setEmailCorpName('');
          return;
        }
        registerApi
          .getMailDomainInfo({
            adminName: accountName,
            corpName: teamName,
            mobile,
          })
          .then(res => {
            return res.data;
          })
          .then(res => {
            setEmailAccountName(res?.adminAccount!);
            setEmailCorpName(res?.domainPrefix!);
          });
      },
      500,
      { trailing: true }
    ),
    []
  );

  useEffect(() => {
    registerApi.getRegisterDemandList().then(demandList => {
      if (demandList && demandList.length) {
        setServiceList(demandList);
      }
    });
  }, []);

  useEffect(() => {
    setTimeout(() => {
      if (error && errorDivRef.current) {
        errorDivRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }, 16);
  }, [error]);

  const handleCustomHost = () => {
    setIsCustomHost(!isCustomHost);
    focusInput(emailAccountInputRef);
  };

  const focusInput = (inputRef: React.RefObject<Input>) => {
    setIsCustomHost(true);
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 16);
  };

  const handleHasCorpDomainChanged = (ev: RadioChangeEvent) => {
    setError('');
    const value = ev.target.value;
    setHasCorpDomain(value);
  };

  const getHasSelfCorpDomain = () => {
    return hasCorpDomain === '1';
  };

  useEffect(() => {
    console.log(`isComposition`, isComposition);
    if (isComposition) {
      return;
    }
    getDomainInfo();
  }, [teamName, accountName, isComposition]);

  const getDomainInfo = () => {
    if (isCustomHost) return;
    if (!teamName || !teamName.trim()) {
      setEmailCorpName('');
    }
    if (!accountName || !accountName.trim()) {
      setEmailAccountName('');
    }

    getDomainInfoDebounce(accountName, teamName);
  };

  const delaySetError = (errMsg: string) => {
    setTimeout(() => {
      setError(errMsg);
    }, 30);
  };

  const trackRegisterPageAction = () => {
    try {
      trackApi.track('pc_register_improve_team_information_page_action', {
        domainname: getHasSelfCorpDomain() ? getIn18Text('SHI') : getIn18Text('FOU'),
        teamname: teamName,
        personalname: accountName,
        Modification: isCustomHost ? getIn18Text('SHI') : getIn18Text('FOU'),
        action: getIn18Text('ZHUCE'),
      });
    } catch (ex) {
      console.error(ex);
    }
  };

  const submit = async () => {
    if (isRegistering) return;
    if (!teamName) {
      setError(getIn18Text('QINGWANSHANNINDE1'));
      return;
    }
    if (!accountName) {
      setError(getIn18Text('QINGWANSHANNINDE'));
      return;
    }
    if (!emailAccountName) {
      delaySetError(getIn18Text('REG_NO_USERMAIL_TIP'));
      focusInput(emailAccountInputRef);
      return;
    }
    if (!emailCorpName) {
      delaySetError(getIn18Text('QINGWANSHANNINDE3'));
      focusInput(emailCorpNameInputRef);
      return;
    }
    const hasSelfDomain = getHasSelfCorpDomain();
    if (hasSelfDomain && !corpDomain) {
      setError(getIn18Text('REG_NO_CORPMAIL_TIP'));
      return;
    }
    setIsRegistering(true);

    let submitResult = await registerApi.doSubmit({
      mobile,
      corpName: teamName, // 团队名称
      adminName: accountName, // 姓名
      domainPrefix: emailCorpName, // 团队域名
      adminAccount: emailAccountName,
      selfDomain: hasSelfDomain ? corpDomain : '',
      code: code,
    });
    setIsRegistering(false);
    if (!submitResult.success) {
      const errorMsg = submitResult.message || getIn18Text('SERVER_ERR_COMMON_TIP');
      let code = submitResult.code;
      if (code) {
        if (code === 6130) {
          setIsCustomHost(true);
          focusInput(emailCorpNameInputRef);
          // foucus会清除掉errorMsg
          delaySetError(errorMsg);
          return;
        }
      }
      setError(errorMsg);
      return;
    } else {
      setRegisterInfo({
        sid: submitResult.sid,
        domainPrefix: emailCorpName,
        adminAccount: emailAccountName,
        registerTime: new Date().getTime(),
      });
      setRegisterResultDialogVisible(true);
      trackRegisterPageAction();
    }
  };

  useEffect(() => {
    trackApi.track('pc_register_improve_team_information_page');
  }, []);

  return (
    <div className={styles.createTeamWrap} hidden={!visible}>
      <div className={styles.title}>{getIn18Text('TIANXIEZILIAO')}</div>
      <div className={`${styles.group}`} style={{ marginTop: '40px' }}>
        <Radio.Group value={hasCorpDomain} size="small" onChange={handleHasCorpDomainChanged}>
          <Radio value="0">{getIn18Text('MEIYOUQIYEYU')}</Radio>
          <Radio value="1">{getIn18Text('YOUQIYEYUMING')}</Radio>
        </Radio.Group>
      </div>
      <div className={styles.group}>
        <Input
          allowClear
          className={styles.teamName}
          maxLength={15}
          placeholder={getIn18Text('QINGSHURUNINDE')}
          value={teamName}
          onBlur={getDomainInfo}
          onFocus={() => setError('')}
          onChange={e => {
            setTeamName(e.target.value);
          }}
          onCompositionStart={() => {
            setIsComposition(true);
          }}
          onCompositionEnd={() => {
            setIsComposition(false);
          }}
        />
      </div>
      <div className={`${styles.group} ${styles.small}`}>
        <Input
          allowClear
          className={styles.teamName}
          maxLength={10}
          placeholder={getIn18Text('QINGSHURUNINDE12')}
          value={accountName}
          onFocus={() => setError('')}
          onBlur={getDomainInfo}
          onChange={e => {
            setAccountName(e.target.value);
          }}
          onCompositionStart={() => {
            setIsComposition(true);
          }}
          onCompositionEnd={() => {
            setIsComposition(false);
          }}
        />
      </div>
      <div className={styles.group} style={{ marginTop: '24px', marginBottom: '0' }}>
        <div className={styles.label} style={{ marginBottom: 0 }}>
          <span className={styles.labelText}>{getIn18Text('YOUXIANGDEZHI')}</span>
          <div className={styles.emailAddress}>
            {!isCustomHost && (
              <span>
                {emailAccountName}@{emailCorpName}.ntesmail.com
              </span>
            )}
            <a hidden={isCustomHost} className={styles.customHost} href="javascript:void(0)" onClick={handleCustomHost}>
              {isCustomHost ? getIn18Text('ZIDONGSHENGCHENG') : getIn18Text('ZIDINGYI')}
            </a>
          </div>
        </div>
      </div>
      {isCustomHost && (
        <div className={styles.group} style={{ marginTop: '3px' }}>
          <div className={styles.domainPrefixWrap}>
            <Input
              allowClear
              maxLength={10}
              ref={emailAccountInputRef}
              placeholder={getIn18Text('GERENYOUXIANGDE11')}
              value={emailAccountName}
              onFocus={() => setError('')}
              onChange={e => {
                setError('');
                setEmailAccountName(e.target.value);
              }}
            />
            <div className={styles.atText}>@</div>
            <Input
              allowClear
              maxLength={10}
              ref={emailCorpNameInputRef}
              placeholder={getIn18Text('REG_CORPMAIL_PLACEHOLDER')}
              value={emailCorpName}
              onFocus={() => setError('')}
              onChange={e => {
                setError('');
                setEmailCorpName(e.target.value);
              }}
            />
            <div className={styles.domainSuffixTxt}>.ntesmail.com</div>
          </div>
        </div>
      )}
      {!isCustomHost && <div className={`${styles.tip} ${styles.smallTip}`}>{getIn18Text('GERENYOUXIANGDE12')}</div>}
      {/* 没有企业域名时展示 */}
      {hasCorpDomain === '0' && <div className={`${styles.tip} ${styles.smallTip}`}>注：使用赠送域名仅能在域内进行发信，自有域名可对外发信</div>}
      {getHasSelfCorpDomain() && (
        <div className={`${styles.group} ${styles.small}`}>
          <Input
            allowClear
            maxLength={64}
            placeholder={getIn18Text('REG_CORPDOMAIN_PLACEHOLDER')}
            value={corpDomain}
            onFocus={() => setError('')}
            onChange={e => {
              setCorpDomain(e.target.value);
            }}
          />
        </div>
      )}
      <div className={`${styles.submitBtn}`} onClick={submit}>
        {getIn18Text('LIJIZHUCE')}
        {isRegistering ? <LoadingIcon className={styles.loadingIcon} /> : null}
      </div>
      <div className={styles.tip}>
        {getHasSelfCorpDomain() ? (
          <>
            {getIn18Text('REGISTER_HAS_DOMAIN_TIP_PREFIX')}
            <span style={{ color: '#262A33' }}>{getIn18Text('REGISTER_HAS_DOMAIN_STRONG_TIP')}</span>
            {getIn18Text('REGISTER_HAS_DOMAIN_TIP_POSTFIX')}
          </>
        ) : (
          getIn18Text('REGISTER_NO_DOMAIN_TIP')
        )}
      </div>
      <div className={styles.errorWrap} style={{ visibility: error ? 'visible' : 'hidden' }} ref={errorDivRef}>
        <ErrorIcon width={14} height={14} className={styles.errorIcon} />
        <span className={styles.errorText}>{error}</span>
      </div>
    </div>
  );
};

const registerApi = api.requireLogicalApi(apis.registerApiImpl) as RegisterApi;

const Register: React.FC<RegisterProp> = () => {
  const { registerInfo } = useAppSelector(state => state.loginReducer);
  const { setRegisterInfo } = useActions(LoginActions);
  const [visibleCreateTeam, setVisibleCreateTeam] = useState<boolean>(true);
  const { isValidate, visible } = registerInfo;

  const goBack = () => {
    if (isValidate) {
      trackApi.track('pc_register_improve_team_information_page_action', {
        action: '返回',
      });
    }
    setRegisterInfo({
      visible: false,
      isValidate: false,
      corpName: '',
      domainPrefix: '',
      adminName: '',
      adminAccount: '',
      mobile: '',
      code: '',
      sid: '',
    });
    setVisibleCreateTeam(true);
  };

  return (
    <div className={styles.registerContainer} hidden={!visible}>
      <div className={styles.registerWrap} style={{ height: isValidate ? '100%' : 'auto' }}>
        <div className={styles.backWrap} style={{ top: isValidate ? '80px' : '32px' }} onClick={goBack}>
          <div className={styles.backIcon}>
            <i />
          </div>
          {!isValidate && (
            <span key="back" className={styles.back}>
              {getIn18Text('FANHUI')}
            </span>
          )}
        </div>
        {!isValidate ? (
          <>
            <div className={styles.wrap}>
              <div className={styles.title}>{getIn18Text(systemApi.isWebWmEntry() || systemApi.inEdm() ? 'HUANYINGSHIYONGWM' : 'HUANYINGSHIYONGWANG')}</div>
              <div className={styles.content}>
                <MobileValidate from="register" />
              </div>
            </div>
          </>
        ) : (
          <CreateTeam visible={visibleCreateTeam} />
        )}
      </div>
    </div>
  );
};
export default Register;
