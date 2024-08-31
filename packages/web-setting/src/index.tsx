import React, { useEffect, useState } from 'react';
import { apiHolder, EventApi, inWindow, SystemApi, conf, environment } from 'api';
import classNames from 'classnames';
import { useAppDispatch, useAppSelector } from '@web-common/state/createStore';
import { actions } from '@web-common/state/reducer/hollowOutGuideReducer';
import PageContentLayout from '@/layouts/Main/pageContentLayout';
import SideContentLayout from '@/layouts/Main/sideContentLayout';
import { FIR_SIDE } from '@web-common/utils/constant';
import { ReactComponent as Setting } from '@/images/icons/account-setting.svg';
import { ReactComponent as MailSetting } from '@/images/icons/mail-setting.svg';
import { ReactComponent as Keyboard } from '@/images/icons/keyboard.svg';
import { ReactComponent as IconAccount } from '@/images/icons/mail/icon-account.svg';
import MailConfig from './Mail';
import AccountConfig from './Account';
import KeyboardConfig from './Keyboard/keyboard';
import SystemConfig from './System/system';
import SiriusMessage from '@web-common/components/UI/Message/SiriusMessage';
import styles from './index.module.scss';
import About from './About/about';
import Notification from './Notification/index';
import ProductVersion from './ProductVersion/productVersion';
// import CompPreview from './comp-preview/index';
// import MailCards from '@web-mail/test/pages/mailCards';
import { getIn18Text } from 'api';

type tabType = 'mail' | 'account' | 'keyboard' | 'system' | 'vipComb' | 'about' | 'compPreview' | 'mailcardDebug' | 'notification';
const systemApi = apiHolder.api.getSystemApi() as SystemApi;
const eventApi = apiHolder.api.getEventApi() as EventApi;
const showBlockingMsg = () => {
  SiriusMessage.warn({ content: getIn18Text('QINGQIEHUANZHIQI') }).then();
};
const ConfigSetting: React.FC<any> = ({ active }) => {
  const [currentTab, setCurrentTab] = useState<tabType>('account');
  const [isBlock, setBlock] = useState<boolean>(false);
  const defaultTab = inWindow() ? history?.state?.currentTab : '';
  const { changeRemind } = actions;
  const mailSettingRemind = useAppSelector(state => state.hollowOutGuideReducer.avatarRemind.mailSettingRemind.isShow);
  const dispatch = useAppDispatch();
  //是否从webmail跳转过来的
  const isWebmail = inWindow() && conf('profile') ? conf('profile').toString().includes('webmail') : false;
  const handleSetting = (type: tabType) => {
    type === 'mail' && dispatch(changeRemind('avatarRemind.mailSettingRemind'));
    const currentUser = systemApi.getCurrentUser();
    if (isBlock || !currentUser) {
      showBlockingMsg();
    } else {
      setCurrentTab(type);
    }
  };
  useEffect(() => {
    if (active && defaultTab) {
      setCurrentTab(defaultTab);
    }
  }, [active, defaultTab]);
  useEffect(() => {
    const eventId = eventApi.registerSysEventObserver('loginBlock', {
      func: ev => {
        setBlock(ev.eventData);
      },
    });
    // 来信分类配置携带参数
    // const type = getParameterByName('type') || '';
    // if (['classifiedSetting', 'classifiedFolderSetting'].includes(type)) {
    //   setCurrentTab('mail');
    // }
    return () => {
      eventApi.unregisterSysEventObserver('loginBlock', eventId);
    };
  }, []);
  if (!active) {
    return null;
  }
  return (
    /** 页面内容外出包裹PageContentLayout组件 */
    <PageContentLayout from="im" allowDark>
      <SideContentLayout borderRight minWidth={FIR_SIDE} maxWidth={220} className={styles.configSettingWrap} defaultWidth={220}>
        <div className={styles.mailAndAccount}>
          <div className={styles.selectTab}>
            <div
              className={classNames(styles.tabItem, {
                [styles.tabItemSelect]: currentTab === 'account',
              })}
              //  style={{background: currentTab === "account" ? "rgba(38, 42, 51, 0.1)" : "#f6f6f6"}}
              onClick={() => {
                handleSetting('account');
              }}
            >
              <span className={styles.icon}>
                {/* <IconCard type="account" /> */}
                <IconAccount />
              </span>
              <span>{getIn18Text('ZHANGHAOYUANQUAN')}</span>
            </div>

            <div
              className={classNames(styles.tabItem, {
                [styles.tabItemSelect]: currentTab === 'mail',
              })}
              onClick={() => {
                handleSetting('mail');
              }}
            >
              <span className={styles.icon}>
                <MailSetting />
              </span>
              <span>{getIn18Text('YOUXIANGSHEZHI')}</span>
              <i className={styles.itemRemind} hidden={!mailSettingRemind} />
            </div>

            <div
              className={classNames(styles.tabItem, {
                [styles.tabItemSelect]: currentTab === 'notification',
              })}
              onClick={() => {
                handleSetting('notification');
              }}
            >
              <span className={styles.icon}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M9 14C9 14.5523 8.55228 15 8 15C7.44772 15 7 14.5523 7 14" stroke="#6F7485" />
                  <path d="M2 13H14" stroke="#6F7485" stroke-linecap="round" />
                  <path d="M3.5 7.5C3.5 5.01472 5.51472 3 8 3C10.4853 3 12.5 5.01472 12.5 7.5V13H3.5V7.5Z" stroke="#6F7485" />
                  <path d="M8 2.73515L8 2" stroke="#6F7485" stroke-linecap="round" />
                </svg>
              </span>
              <span>{getIn18Text('TONGZHI')}</span>
            </div>

            <div
              className={classNames(styles.tabItem, {
                [styles.tabItemSelect]: currentTab === 'keyboard',
              })}
              onClick={() => {
                handleSetting('keyboard');
              }}
            >
              <span className={styles.icon}>
                <Keyboard />
              </span>
              <span>{getIn18Text('KUAIJIEJIAN')}</span>
            </div>

            <div
              className={classNames(styles.tabItem, {
                [styles.tabItemSelect]: currentTab === 'system',
              })}
              onClick={() => {
                handleSetting('system');
              }}
            >
              <span className={styles.icon}>
                <Setting />
              </span>
              <span>{getIn18Text('XITONGSHEZHI')}</span>
            </div>

            {!process.env.BUILD_ISELECTRON && !process.env.BUILD_ISEDM && (
              <div
                className={classNames(styles.tabItem, {
                  [styles.tabItemSelect]: currentTab === 'vipComb',
                })}
                onClick={() => {
                  handleSetting('vipComb');
                }}
              >
                <span className={styles.icon}>
                  <Setting />
                </span>
                <span>{getIn18Text('FUWUTAOCAN')}</span>
              </div>
            )}
            {!systemApi.isElectron() && (
              <div
                className={classNames(styles.tabItem, {
                  [styles.tabItemSelect]: currentTab === 'about',
                })}
                onClick={() => {
                  handleSetting('about');
                }}
              >
                <span className={styles.icon}>
                  <Setting />
                </span>
                <span>{getIn18Text('GUANYU')}</span>
              </div>
            )}
            {/* {environment !== 'prod' && (
              <div
                className={classNames(styles.tabItem, {
                  [styles.tabItemSelect]: currentTab === 'compPreview',
                })}
                onClick={() => {
                  handleSetting('compPreview');
                }}
              >
                <span className={styles.icon}>
                  <Setting />
                </span>
                <span>组件预览</span>
              </div>
            )} */}
            {/* {environment !== 'prod' && (
              <div
                className={classNames(styles.tabItem, {
                  [styles.tabItemSelect]: currentTab === 'mailcardDebug',
                })}
                onClick={() => {
                  handleSetting('mailcardDebug');
                }}
              >
                <span className={styles.icon}>
                  <Setting />
                </span>
                <span>邮件卡片调试</span>
              </div>
            )} */}
          </div>
        </div>
      </SideContentLayout>
      <div style={{ position: 'relative', height: '100%' }} className={styles.configMenuWrap}>
        {systemApi.getCurrentUser() && <MailConfig isVisible={currentTab === 'mail'} />}
        <AccountConfig isVisible={currentTab === 'account' || !systemApi.getCurrentUser()} />
        {systemApi.getCurrentUser() && <KeyboardConfig isVisible={currentTab === 'keyboard'} />}
        {systemApi.getCurrentUser() && <SystemConfig isVisible={currentTab === 'system'} />}
        {!systemApi.isElectron() && <ProductVersion isVisible={currentTab === 'vipComb'} />}
        {/* {environment !== 'prod' && <CompPreview isVisible={currentTab === 'compPreview'} />}
        {environment !== 'prod' && <MailCards isVisible={currentTab === 'mailcardDebug'} />} */}
        {!systemApi.isElectron() && <About isVisible={currentTab === 'about'} />}
        {currentTab === 'notification' && <Notification />}
      </div>
    </PageContentLayout>
  );
};
export default ConfigSetting;
