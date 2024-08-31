import React from 'react';
import { Checkbox } from 'antd';
import type { CheckboxValueType } from 'antd/es/checkbox/Group';
import { SiriusHtmlModal } from '@web-common/components/UI/Modal/SiriusModal';
import { useActions, useAppSelector } from '@web-common/state/createStore';
import { useEffect, useRef, useState } from 'react';
import styles from './registerResultDialog.module.scss';
import { ReactComponent as RegisterSuccessIcon } from './../../../icons/register-success.svg';
import SiriusMessage from '@web-common/components/UI/Message/SiriusMessage';
import { api, apis, RegisterApi, LoginApi, DataTrackerApi, SystemApi } from 'api';
const registerApi = api.requireLogicalApi(apis.registerApiImpl) as RegisterApi;
const loginApi = api.requireLogicalApi(apis.loginApiImpl) as LoginApi;
import LoadingIcon from '@web-account/component/loading-icons';
import { actions as LoginActions } from '@web-common/state/reducer/loginReducer';
import { getIn18Text } from 'api';
const DEFAULT_COUNT_NUM = 3;

const trackApi: DataTrackerApi = api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;
const systemApi = api.getSystemApi() as SystemApi;

const isWebWmEntry = systemApi.isWebWmEntry();

const RegisterResultDialog: React.FC = _ => {
  const { serviceList } = useAppSelector(state => state.loginReducer);
  const { sid, registerTime } = useAppSelector(state => state.loginReducer.registerInfo);
  const { registerResultDialogVisible, goLoginNoConfirm } = useAppSelector(state => state.loginReducer);
  const [countNumber, setCountNumber] = useState<number>(0);
  const [isStartCounting, setIsStartCounting] = useState<boolean>(false);
  const [isEntering, setIsEntering] = useState<boolean>(false);
  const timerRef = useRef<number>(0);
  const timerRef2 = useRef<number>(0);
  const [checkedDemands, setCheckedDemands] = useState<Array<string>>([]);
  const { registerInfo } = useAppSelector(state => state.loginReducer);
  const { setGoLoginNoConfirm, setRegisterSuccess } = useActions(LoginActions);
  const serviceListOptions = serviceList.map(serviceItem => {
    return {
      label: serviceItem.name,
      value: serviceItem.id,
    };
  });
  const handleCheckedServiceListChanged = (checkedValues: CheckboxValueType[]) => {
    setCheckedDemands(checkedValues as string[]);
  };
  const registerNoConfirmText = getIn18Text('ZHUCE') + getIn18Text('CHENGGONG');
  const toLogin = () => {
    const { mobile, code, domainPrefix, adminAccount } = registerInfo;
    loginApi
      .doMobileCodeLogin({
        mobile,
        code,
        domain: domainPrefix + '.ntesmail.com',
        account_name: adminAccount,
      })
      .then(({ pass, errmsg, errCode }) => {
        setGoLoginNoConfirm(false);
        console.log('[login web] pass', pass, 'errmsg', errmsg, 'errCode', errCode);
        const target = isWebWmEntry ? '/#mailbox?page=mailbox' : '/';
        window.location.assign(target);
        if (pass) {
          if (isWebWmEntry) {
            setRegisterSuccess(true);
            SiriusMessage.success({
              content: registerNoConfirmText,
            });
          }
          window.location.assign(target);
          return;
        } else if (errCode === 'ERR.LOGIN.USERNOTEXIST') {
          SiriusMessage.error({ content: getIn18Text('WANGLUOQINGQIUCHAO11') });
        } else {
          SiriusMessage.error({ content: errmsg });
        }
        window.location.assign('/login/');
      })
      .catch(e => {
        SiriusMessage.error({ content: getIn18Text('WANGLUOQINGQIUCHAO11') });
        console.log('[login web]', e);
      });
  };
  const getIsDisable = () => {
    if (countNumber > 0) {
      return true;
    }
    if (isEntering) {
      return true;
    }
    return false;
  };
  const handleEnterMail = () => {
    let isDisable = getIsDisable();
    if (isDisable) return;
    setIsEntering(true);
    const nowTs = new Date().getTime();
    const shouldTimeout = registerTime ? nowTs - registerTime < 4000 : true;
    if (shouldTimeout) {
      startCountNum();
      setTimeout(() => {
        enterEmail();
      }, DEFAULT_COUNT_NUM * 1000);
    } else {
      enterEmail();
    }
  };

  const getServiceNamesByServiceIds = (ids: Array<number | string>) => {
    if (!ids || !ids.length) return [];
    let map: { [key: number | string]: string } = {};
    serviceList.forEach(item => {
      map[item.id] = item.name;
    });
    return ids.map(id => {
      return map[id];
    });
  };

  const trackCreateResultPage = () => {
    try {
      let trackForeigntradeNames = getServiceNamesByServiceIds(checkedDemands) || [];
      trackApi.track('register_create_page', {
        foreigntrade_leads: trackForeigntradeNames.join(','),
        aciton: getIn18Text('JINRUYOUXIANG'),
      });
    } catch (ex) {
      console.error(ex);
    }
  };

  const enterEmail = async () => {
    try {
      // 外贸新web端，简化注册流程，不需要下面这一步
      if (!isWebWmEntry) {
        let sendInfo = {
          sid: sid,
          userDemand: checkedDemands && checkedDemands.length ? checkedDemands.join(',') : '',
        };
        let appendResult = await registerApi.addRegisterAppendDemand(sendInfo);
        if (!appendResult.success) {
          SiriusMessage.error({ content: appendResult.message || '服务器错误，请重试' });
          setIsEntering(false);
          return;
        }
      }
      trackCreateResultPage();
      toLogin();
    } catch (ex) {
      console.error(ex);
      setIsEntering(false);
    }
  };
  const startCountNum = () => {
    setIsStartCounting(true);
    setCountNumber(DEFAULT_COUNT_NUM);
  };
  useEffect(() => {
    if (!isStartCounting) return;
    function clearTimer() {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = 0;
      }
    }
    if (!timerRef.current) {
      timerRef.current = setInterval(() => {
        setCountNumber((oldNum: number) => {
          if (oldNum === 1) {
            setCountNumber(0);
            clearTimer();
            return 0;
          } else {
            return oldNum - 1;
          }
        });
      }, 1000) as unknown as number;
    }
    return () => {
      clearTimer();
    };
  }, [isStartCounting]);
  // 无二次确认，直接进入邮箱
  useEffect(() => {
    const clearTimeout = () => {
      if (timerRef2.current) {
        window.clearTimeout(timerRef2.current);
        timerRef.current = 0;
      }
    };
    if (!registerResultDialogVisible && goLoginNoConfirm) {
      console.log('无二次确认，直接进入邮箱', new Date().toLocaleString());
      clearTimeout();
      timerRef2.current = window.setTimeout(() => {
        console.log('无二次确认，直接进入邮箱 timeout', new Date().toLocaleString());
        enterEmail();
      }, 5 * 1000);
    }
    return () => {
      clearTimeout();
    };
  }, [goLoginNoConfirm, registerResultDialogVisible]);

  return (
    <SiriusHtmlModal visible={registerResultDialogVisible} width={516} closable={false}>
      <div className={styles.wrapper}>
        <div className={styles.registerResult}>
          <div>
            <RegisterSuccessIcon />
          </div>
          <div className={styles.registerResultText}>{getIn18Text('CHUANGJIANCHENGGONG')}</div>
        </div>
        <div className={styles.otherServices}>
          <div className={styles.otherServicesLabel}>{getIn18Text('CHUMIANFEIQIYE')}</div>
          <Checkbox.Group className={styles.otherServicesList} options={serviceListOptions} onChange={handleCheckedServiceListChanged}></Checkbox.Group>
        </div>
        <div className={`${styles.enterEmailBtn} ${countNumber > 0 ? 'disabled' : ''}`} onClick={handleEnterMail}>
          {countNumber > 0 ? (
            `正在开启您的专属邮箱（${countNumber}s）`
          ) : isEntering ? (
            <>
              <span>{getIn18Text('ZHENGZAIKAIQININ')}</span>
              <LoadingIcon className={styles.loadingIcon} />
            </>
          ) : (
            getIn18Text('JINRUYOUXIANG')
          )}
        </div>
      </div>
    </SiriusHtmlModal>
  );
};
export default RegisterResultDialog;
