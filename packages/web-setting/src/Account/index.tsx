import React, { useEffect, useState } from 'react';
import { Button, Spin } from 'antd';
import { navigate } from 'gatsby';
import classnames from 'classnames';
import {
  AccountApi,
  AccountInfo,
  api,
  apis,
  ConfigSettingApi,
  deviceInfo,
  inWindow,
  LoginApi,
  LoginJumpConfig,
  SystemEvent,
  util,
  MailConfApi as MailConfApiType,
  conf,
  apiHolder,
  ProductAuthorityFeature,
  isElectron,
} from 'api';
// import { AccountApi, AccountInfo, api, apis, ConfigSettingApi, deviceInfo, inWindow, LoginApi, LoginJumpConfig, SystemEvent, util, MailConfApi as MailConfApiType, conf, ProductAuthorityFeature, isElectron } from 'api';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import styles from './index.module.scss';
import { ReactComponent as ArrowRightIcon } from '@/images/icons/arrow-right.svg';
import Login from '@web-account/Login';
import Toast from '@web-common/components/UI/Message/SiriusMessage';
import SiriusMessage from '@web-common/components/UI/Message/SiriusMessage';
import PasswordForm from '@web-common/components/UI/PasswordForm/password-form';
import { useActions, useAppDispatch, useAppSelector } from '@web-common/state/createStore';
import { actions as LoginActions, actions as LoginAction, doSwitchAccountAsync } from '@web-common/state/reducer/loginReducer';
import AccountList from './list';
import { comIsShowByAuth } from '@web-common/utils/utils';
import { getIn18Text } from 'api';
const eventApi = api.getEventApi();
const systemApi = api.getSystemApi();
const accountApi = api.requireLogicalApi(apis.accountApiImpl) as AccountApi;
const loginApi = api.requireLogicalApi(apis.loginApiImpl) as LoginApi;
const configSettingApi = api.requireLogicalApi(apis.configSettingApiImpl) as ConfigSettingApi;
const mailConfApi = api.requireLogicalApi(apis.mailConfApiImpl) as MailConfApiType;
const accountPwdAutoFilled = conf('accountPwdAutoFilled') as string;
const isEnLang = inWindow() && window.systemLang === 'en';

const sid = systemApi.getCurrentUser()?.sessionId;
const uid = systemApi.getCurrentUser()?.id;
const newHost = mailConfApi.getNewWebMailHost();
const hl = isEnLang ? 'en_US' : 'zh_CN';
const webMailSettingConfig = {
  encrypt: {
    url: newHost + '/qiyeurs/door',
  },
  safety: {
    url: `${newHost}/static/commonweb/index.html?hl=${hl}&ver=js6&fontface=none&style=7&lang=ch&skin=skyblue&color=003399&sid=${sid}&uid=${uid}&host=${newHost}#/loginother`,
    params: { subModName: 'mailLoginother', link: 'loginother' },
  },
  setting: {
    url: `${newHost}/static/commonweb/authcode.html?hl=${hl}&ver=js6&fontface=none&style=7&lang=ch&skin=skyblue&color=003399&sid=${sid}&uid=${uid}&host=${newHost}`,
    params: { subModName: 'authCode', link: 'option_authCode' },
  },
};
const sendLoginBlock = (isBlock: boolean) => {
  eventApi.sendSysEvent({
    eventName: 'loginBlock',
    eventData: isBlock,
    eventSeq: 0,
  });
};
const sendLogout = () => {
  setTimeout(() => {
    eventApi.sendSysEvent({
      eventName: 'logout',
      eventData: {
        jumpTo: 'login',
        clearCookies: false,
      },
    });
  }, 500);
};

const isWebWmEntry = apiHolder.api.getSystemApi().isWebWmEntry();

const DeviceModal: React.FC<{
  toggleVisible: (flag?: boolean) => void;
}> = props => {
  const { toggleVisible } = props;
  const [deviceList, setDeviceList] = useState<deviceInfo[]>([]);
  const [deviceListLoading, setDeviceListLoading] = useState(false);
  const isCorpMail = useAppSelector(state => state.loginReducer.loginInfo.isCorpMailMode);
  const getDeviceList = async () => {
    try {
      setDeviceListLoading(true);
      const res = await configSettingApi.doGetDeviceList();
      setDeviceList(res);
      setDeviceListLoading(false);
    } catch (error) {
      setDeviceList([]);
      setDeviceListLoading(false);
    }
  };
  useEffect(() => {
    getDeviceList();
  }, []);
  // const [deviceVisible, setDeviceVisible] = useState<boolean>( true);
  const deviceDelete = async (deviceId: string, deviceProduct?: string) => {
    await configSettingApi.doDeleteDevice(deviceId, deviceProduct);
    getDeviceList();
  };
  return (
    <Modal
      title={null}
      zIndex={104000}
      width={500}
      closable={false}
      visible
      onCancel={() => {
        // setDeviceVisible(false);
        toggleVisible(false);
      }}
      footer={null}
    >
      <div className={`${styles.deviceWrap} account-deviceWrap`}>
        <div className={`${styles.deviceWrapTitle} deviceWrapTitle`}>
          <span className={styles.name}>{getIn18Text('DENGLUSHEBEI')}</span>
          <span
            className={`dark-invert ${styles.closeIcon} closeIcon`}
            onClick={() => {
              toggleVisible(false);
            }}
          />
        </div>
        <div className={`${styles.deviceWrapContent} deviceWrapContent`}>
          <div className={styles.tip}>{isCorpMail ? getIn18Text('DENGLUSHEBEILIE') : getIn18Text('CHUYUANQUANKAO')}</div>
          <Spin spinning={deviceListLoading}>
            <div className={`${styles.list} list`}>
              {deviceList?.length > 0 ? (
                deviceList.map((item, index) => {
                  // corpMail 判断不了本机
                  const isOwner = isCorpMail ? false : index === 0;
                  const isPC = item.deviceType === 'PC';
                  const isApp = item.deviceType === 'APP';
                  const appIcon = isApp ? `${styles.deviceMobileIcon} deviceMobileIcon` : styles.deviceWebIcon;
                  const iconClass = isPC ? `${styles.devicePCIcon} devicePCIcon` : appIcon;
                  return (
                    <div className={`${styles.item} item`}>
                      <div className={classnames(styles.deviceIcon, 'deviceIcon', iconClass)} />
                      <div className={styles.deviceInfo}>
                        <div className={styles.name}>
                          <span className={styles.nameTxt}>{item.deviceName}</span>
                          {isOwner && <span className={styles.owner}>{getIn18Text('BENJI')}</span>}
                        </div>
                        <div className={styles.system}>
                          {getIn18Text('XITONG\uFF1A')}
                          {item.system}
                        </div>
                        <div className={styles.time}>
                          {getIn18Text('DENGLUSHIJIAN\uFF1A')}
                          {item.loginTime}
                        </div>
                      </div>
                      {!isOwner && (
                        <Button
                          type="default"
                          style={{
                            minWidth: 57,
                            height: 24,
                            borderRadius: 4,
                            padding: '0px 13px',
                            border: '1px solid #BDBDBD',
                          }}
                          onClick={() => {
                            deviceDelete(item.deviceId, item.dev_product);
                          }}
                        >
                          {getIn18Text('SHANCHU')}
                        </Button>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className={styles.deviceEmptyWrapper}>
                  <div className={styles.deviceEmptyImg} />
                  <div>{getIn18Text('ZANWUDENGLUSHE')}</div>
                </div>
              )}
            </div>
          </Spin>
        </div>
      </div>
    </Modal>
  );
};
const AccountConfig: React.FC<{
  isVisible?: boolean;
}> = props => {
  const { isVisible } = props;
  const [preAccount, setPreAccount] = useState<AccountInfo | undefined>();
  const [originLoginKey, setOriginLoginKey] = useState<string | undefined>();
  const [deviceVisible, setDeviceVisible] = useState<boolean>(false);
  const [visibleUpdatePwd, setVisibleUpdatePwd] = useState<boolean>(false);
  const [block, setBlock] = useState<boolean>(false);
  const { setSettingLoginInfo } = useActions(LoginActions);
  const {
    accountList: { current: currentAccount },
    settingLoginInfo: { currentTabName, loginVisible: visibleLogin, passResetVisible: visiblePsw, loginAccount },
  } = useAppSelector(state => state.loginReducer);
  const dispatch = useAppDispatch();
  const loginStateParam = (inWindow() && history?.state) || ({} as LoginJumpConfig);
  const { blocking: initBlockingState = false } = loginStateParam;
  const refreshPage = () => {
    systemApi.switchLoading(true);
    util.reload();
  };
  const back = () => {
    if (!systemApi.getCurrentUser()) {
      if (preAccount) {
        Modal.confirm({
          title: getIn18Text('QUERENFANHUI\uFF1F'),
          content: `${getIn18Text('NINZHENGZAIDENGLUXZH，FHJCXDLZQDZH：')}${preAccount.id}`,
          onOk: async () => {
            dispatch(doSwitchAccountAsync(preAccount.id));
          },
        });
      } else {
        sendLogout();
      }
    } else {
      navigate(-2);
    }
  };
  const toggleDeviceModalVisible = (flag?: boolean) => {
    if (flag !== undefined) {
      setDeviceVisible(flag);
    } else {
      setDeviceVisible(!deviceVisible);
    }
  };
  const resetAccount = () => {
    if (currentTabName) {
      if (!systemApi.getCurrentUser() && preAccount) {
        Modal.confirm({
          title: getIn18Text('QUERENFANHUI\uFF1F'),
          content: `${getIn18Text('NINZHENGZAIDENGLUXZH，FHJCXDLZQDZH：')}${preAccount.id}`,
          onOk: () => {
            dispatch(doSwitchAccountAsync(preAccount.id));
          },
        });
      } else {
        loginApi.refreshStatus();
        setSettingLoginInfo({ currentTabName: undefined, passResetVisible: false, loginVisible: false });
      }
    }
  };
  const clickResetPwd = () => {
    setSettingLoginInfo({ currentTabName: getIn18Text('XIUGAIMIMA'), passResetVisible: true });
    dispatch(LoginAction.doTogglePassPrepareForm(true));
  };
  const handlerResetPassword = () => {
    setSettingLoginInfo({ currentTabName: getIn18Text('XIUGAIMIMA'), passResetVisible: true });
    dispatch(LoginAction.doTogglePassPrepareForm(false));
  };
  const onResetPwdSuccess = async (pwd: string, redirectUrl?: string) => {
    const current = systemApi.getCurrentUser();
    if (redirectUrl === 'entry') {
      refreshPage();
    } else {
      const originKey = await systemApi.getLocalLoginToken(current?.id!, pwd);
      setSettingLoginInfo({ currentTabName: getIn18Text('DENGLUZHANGHAO'), loginVisible: true, passResetVisible: false, loginAccount: current?.id });
      setOriginLoginKey(originKey);
    }
  };
  const showBlockingMsg = () => {
    SiriusMessage.warn({ content: getIn18Text('QINGQIEHUANZHIQI') }).then();
  };
  const handleToMailSettingInLocal = async (
    name: string,
    urlType: {
      params?: {
        [k: string]: string;
      };
      url?: string;
    },
    openInElectron: boolean,
    haveJquery?: boolean
  ) => {
    const url: string | undefined = systemApi.isElectron()
      ? mailConfApi.getSettingUrl(name, urlType)
      : isCorpMail
      ? mailConfApi.getCorpSettingUrl(name, urlType.params)
      : await mailConfApi.getWebSettingUrlInLocal(name, urlType);
    if (url && url.length > 0) {
      systemApi.openNewWindow(url, openInElectron, undefined, undefined, haveJquery);
    } else {
      Toast.warn({
        content: getIn18Text('WUFADAKAIZHI'),
        duration: 3,
      });
    }
  };
  useEffect(() => {
    const loginStatusEventId = eventApi.registerSysEventObserver('loginBlock', {
      func: ev => {
        setBlock(ev?.eventData);
      },
    });
    return () => {
      eventApi.unregisterSysEventObserver('loginBlock', loginStatusEventId);
    };
  }, []);
  useEffect(() => {
    const id = systemApi.getCurrentUser()?.id;
    if (id) {
      accountApi.doGetAccountInfo([id]).then(list => {
        const [current] = list;
        if (current?.pwd && current.pwd !== accountPwdAutoFilled) {
          setVisibleUpdatePwd(true);
        }
      });
    }
  }, []);
  useEffect(() => {
    const eid = eventApi.registerSysEventObserver('accountAdded', {
      func: (ev: SystemEvent) => {
        if (ev.eventStrData === 'loginSucc') {
          // setSettingLoginInfo({ loginVisible: false, currentTabName: undefined, passResetVisible: false });
          refreshPage();
          sendLoginBlock(false);
        } else if (ev.eventStrData === 'loginStart') {
          setPreAccount(currentAccount);
          sendLoginBlock(true);
        } else if (ev.eventStrData === 'loginCurrentAccount') {
          SiriusMessage.warn({ content: getIn18Text('GAIZHANGHAOYIDENG') }).then();
        }
      },
    });
    return () => {
      eventApi!.unregisterSysEventObserver('accountAdded', eid);
    };
  });
  useEffect(() => {
    if (initBlockingState) {
      (async () => {
        const currentUser = systemApi.getCurrentUser();
        if (currentUser) {
          await accountApi.doDeleteAccountList([currentUser.id]);
        }
        sendLoginBlock(true);
        loginApi.reportLogoutToUser(loginStateParam);
        const res = await accountApi.doGetAccountList();
        const sharedAccount = await accountApi.getSharedAccountsInfoAsync();
        const isSharedAccountExpired = sharedAccount?.isSharedAccountExpired || false;
        let isLastAccount = true;
        let content = getIn18Text('DANGQIANZHANGHAOYI');
        if (res.localList.length > 1) {
          isLastAccount = false;
          content = (currentUser?.id || '') + getIn18Text('ZHANGHAODENGLUZHUANG');
        }
        if (isSharedAccountExpired) {
          isLastAccount = false;
          content = getIn18Text('SHARED_ACCOUNT_EXPIRED_TIP') || '';
        }
        Modal.error({
          title: getIn18Text('DANGQIANZHANGHAOZHUANG'),
          content,
          hideCancel: isSharedAccountExpired ? true : isLastAccount,
          maskClosable: false,
          closable: false,
          onOk: () => {
            if (isLastAccount) {
              sendLogout();
            } else {
              if (!isSharedAccountExpired) {
                setSettingLoginInfo({ loginVisible: true, passResetVisible: false, currentTabName: getIn18Text('DENGLUZHANGHAO'), loginAccount: currentUser?.id });
              }
              sendLoginBlock(true);
            }
          },
        });
      })();
    }
  }, [initBlockingState]);
  const isCorpMail = useAppSelector(state => state.loginReducer.loginInfo.isCorpMailMode);

  const visibleLoginResetPsw = visibleLogin || visiblePsw;
  return (
    <>
      <div className={classnames(styles.settingMenu, { [styles.settingMenuWeb]: !systemApi.isElectron(), [styles.webWmEntry]: isWebWmEntry })} hidden={!isVisible}>
        {/* 面包屑 */}
        <div className={styles.configTitle}>
          <div className={styles.breadWrap}>
            <span className={styles.breadItem} onClick={resetAccount}>
              {getIn18Text('ZHANGHAOYUANQUAN')}
            </span>
            <div className={styles.breadSeparator} />
            {currentTabName && (
              <>
                <ArrowRightIcon />
                <span className={classnames(styles.breadItem, styles.breadSecondItem)}>{currentTabName}</span>
              </>
            )}
          </div>
          {!isWebWmEntry && <div hidden={block} onClick={() => back()} className={`dark-invert ${styles.configTitleIcon}`} />}
        </div>
        {/* 一级页面 */}
        <div className={styles.accountTabWrap} hidden={visibleLoginResetPsw}>
          {/* 切换账号 */}
          {(process.env.BUILD_ISELECTRON || process.env.BUILD_ISEDM) && <AccountList block={block} />}
          {/* 登录设备 */}
          <div className={styles.configBottom}>
            <div className={styles.title}>
              <span className={styles.name}>{getIn18Text('DENGLUSHEBEI')}</span>
            </div>
            <div className={styles.desc}>
              {isCorpMail ? getIn18Text('DENGLUSHEBEILIE') : getIn18Text('DANGNINZAICILIE')}
              <span
                className={styles.operate}
                onClick={() => {
                  if (block) {
                    showBlockingMsg();
                  } else {
                    toggleDeviceModalVisible();
                  }
                }}
              >
                {getIn18Text('CHAKANQUANBUDENG')}
              </span>
            </div>
          </div>
          {/* 修改密码 */}
          {/* !isCorpMail && visibleUpdatePwd */}
          {!isCorpMail &&
            comIsShowByAuth(
              ProductAuthorityFeature.ORG_SETTING_UPDATE_PASSWORD_SHOW,
              <div className={styles.configBottom}>
                <div className={styles.title}>
                  {/* 修改密码 */}
                  <span className={styles.name}>{getIn18Text('XIUGAIMIMA')}</span>
                </div>
                <div className={styles.desc}>
                  {getIn18Text('JIANYININDINGQIXIUGAI')}。
                  <span
                    onClick={() => {
                      if (block) {
                        showBlockingMsg();
                      } else {
                        clickResetPwd();
                      }
                    }}
                    className={styles.operate}
                  >
                    {getIn18Text('QIANWANGXIUGAI')}
                  </span>
                </div>
              </div>
            )}
          {/* 密保平台 */}
          {!isCorpMail && (
            <div className={styles.configBottom}>
              <div className={styles.title}>
                <span className={styles.name}>{getIn18Text('MIBAOPINGTAI')}</span>
              </div>
              <div className={styles.desc}>
                {getIn18Text('KEYIZAICIKAI')}
                <span
                  className={styles.operate}
                  onClick={() => {
                    handleToMailSettingInLocal('', webMailSettingConfig.encrypt, true, true);
                  }}
                >
                  {getIn18Text('JINRUSHEZHI')}
                </span>
              </div>
            </div>
          )}
          {/* 安全提醒 */}
          <div className={styles.configBottom}>
            <div className={styles.title}>
              <span className={styles.name}>{getIn18Text('ANQUANTIXING')}</span>
            </div>
            <div className={styles.desc}>
              {getIn18Text('DANGZHANGHAOYIDE')}
              <span
                className={styles.operate}
                onClick={() => {
                  handleToMailSettingInLocal('options.LinkModule', webMailSettingConfig.safety, true, true);
                }}
              >
                {getIn18Text('JINRUSHEZHI')}
              </span>
            </div>
          </div>
          {/* 客户端设置 */}
          {!systemApi.isElectron() && (
            <div className={styles.configBottom}>
              <div className={styles.title}>
                <span className={styles.name}>{getIn18Text('KEHUDUANSHEZHI')}</span>
              </div>
              <div className={styles.desc}>
                {getIn18Text('WEIMEIGEKEHU')}
                <span
                  className={styles.operate}
                  onClick={() => {
                    handleToMailSettingInLocal('options.LinkModule', webMailSettingConfig.setting, true, true);
                  }}
                >
                  {getIn18Text('JINRUSHEZHI')}
                </span>
              </div>
            </div>
          )}
        </div>
        {/* 二级页面 */}
        {isVisible && (
          <div className={styles.accountContentWrap} hidden={!visibleLoginResetPsw}>
            {visiblePsw && (
              <div className={styles.resetPasswordWrap}>
                <PasswordForm from="setting" onSuccess={onResetPwdSuccess} />
              </div>
            )}
            {visibleLogin && (
              <div className={styles.loginWrap}>
                <Login handlerResetPassword={handlerResetPassword} type="addAccount" initAccount={loginAccount} originLoginKey={originLoginKey} noBorder />
              </div>
            )}
          </div>
        )}
        {/* 登录设备弹窗 */}
        <>{deviceVisible ? <DeviceModal toggleVisible={toggleDeviceModalVisible} /> : null}</>
      </div>
    </>
  );
};
export default AccountConfig;
