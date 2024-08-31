/* eslint-disable jsx-a11y/iframe-has-title */
import React, { useState, useEffect, useRef, useMemo, useReducer } from 'react';
import { api, platform, apiHolder, apis, WhatsAppApi, getIn18Text } from 'api';
import classNames from 'classnames';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import { EdmPageProps } from '@web-edm/pageProps';
import { ELECTRON_TITLE_FIX_HEIGHT } from '@web-common/utils/constant';
import { TongyongShuomingMian } from '@sirius/icons';
import { ReactComponent as RefreshIcon } from '@/images/icons/common/sync.svg';
import { InstallTips } from '../components/sideCustomerCard/installTips';
import IntroExtension from '../components/introExtension';
import { WACustomerSidebar } from '../components/sideCustomerCard/WACustomerSidebar';
import { whatsAppTracker } from '@/components/Layout/SNS/tracker';
import style from './index.module.scss';
import { handleSyncMessage } from './background';
import { getTransText } from '@/components/util/translate';

interface SnsInfo {
  snsId: string;
  snsName: string;
  avatar?: string;
}
const WA_WEBSITE = 'https://web.whatsapp.com';
const inElectron = api.getSystemApi().isElectron();
// const isWindows = inElectron && !platform.isMac();

const whatsAppApi = apiHolder.api.requireLogicalApi(apis.whatsAppApiImpl) as unknown as WhatsAppApi;
const isWebWmEntry = api.getSystemApi().isWebWmEntry();

const initialPersonalJob = {
  jobId: '',
  receiverList: [],
};

const personalJobReducer = (state: any, action: any) => {
  switch (action.type) {
    case 'reset':
      return initialPersonalJob;
    default:
      return {
        ...state,
        [action.field]: action.payload,
      };
  }
};
export const PersonalWhatsapp: React.FC<EdmPageProps> = props => {
  const [extensionInstalled, setExtensionInstalled] = useState(false);
  const [extensionOpened, setExtensionOpened] = useState(false);
  const [showSideBar, setShowSideBar] = useState<boolean>(true);
  const [initialTab, setInitialTab] = useState<boolean>(false);
  const [loginSns, setLoginSns] = useState<SnsInfo>();
  const [chatSns, setChatSns] = useState<SnsInfo>();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [sidebarRect, setSidebarRect] = useState<DOMRect | null>(null);
  const [proxyWarningVisible, setProxyWarningVisible] = useState<boolean>(false);
  const [proxyChecking, setProxyChecking] = useState<boolean>(false);
  const iframeContainerRef = useRef<HTMLDivElement>(null);
  const lastLoginIdRef = useRef<string>();
  const [personalJob, dispatchPersonalJob] = useReducer(personalJobReducer, initialPersonalJob);
  // const [enabledExtension, setEnabledExtension] = useState(false);

  const checkIsProxy = () =>
    new Promise((resolve, reject) => {
      const img = new Image();
      img.src = `https://www.google.com/favicon.ico?t=${Date.now()}`;
      img.onload = resolve;
      img.onerror = reject;
      setTimeout(reject, 3000);
    });

  const handleProxyCheck = () => {
    setProxyChecking(true);
    checkIsProxy()
      .then(() => {
        setProxyWarningVisible(false);
        whatsAppTracker.trackProxyCheck(1);
      })
      .catch(() => {
        setProxyWarningVisible(true);
        whatsAppTracker.trackProxyCheck(0);
      })
      .finally(() => {
        setProxyChecking(false);
      });
  };

  useEffect(() => {
    handleProxyCheck();
    // 插件传的消息
    const handleMessage = (e: MessageEvent) => {
      if (e.origin !== window.location?.origin && e.origin !== 'https://web.whatsapp.com') {
        console.warn('unexpected message, origin:', e.origin);
        return;
      }
      const { data } = e.data;
      console.log('__extension_message', data);
      switch (e.data.type) {
        case 'loginUserInfo':
          setLoginSns({
            ...data,
            snsName: data.nickname,
          });
          if (data.snsId) {
            lastLoginIdRef.current = data.snsId;
          } else {
            // 退出登录，清除上一次聊天
            setChatSns(undefined);
          }
          break;
        case 'chatUserInfo':
          setChatSns({
            ...data,
            snsName: data.nickname,
          });
          break;
        case 'syncMessage':
          if (inElectron) {
            // web通过插件background.js提交，electron下插件background.js失效
            handleSyncMessage(data);
          }
          // 显示消息同步的信息
          break;
        case 'whatsAppCreateJob':
          if (inElectron) {
            dispatchPersonalJob({ type: 'reset' });
            whatsAppApi.personalJobCreate(data).then(res => {
              dispatchPersonalJob({
                field: 'jobId',
                payload: res.jobId,
              });
            });
          }
          break;
        case 'whatsAppUpdateJob':
          if (inElectron) {
            dispatchPersonalJob({
              field: 'receiverList',
              payload: data,
            });
          }
          break;
        case 'toggleSidebar':
          whatsAppTracker.trackPersonalTab(data.show ? 'individual_wa_login' : 'individual_wa_send');
          setShowSideBar(data.show);
          break;
        // 调整 sidebar 位置
        case 'adjustSidebar':
          console.log('adjustSidebar', data.rect);
          if (props.qs.tab === 'job' && !initialTab) {
            iframeRef.current?.contentWindow?.postMessage(
              {
                type: 'toggleTab',
                data: {
                  tab: 'b',
                },
              },
              '*'
            );
          }
          if (props.qs.phoneList && !initialTab) {
            iframeRef.current?.contentWindow?.postMessage(
              {
                type: 'updatePhoneList',
                data: {
                  phoneList: props.qs.phoneList.split(','),
                },
              },
              '*'
            );
          }
          setInitialTab(true);
          setSidebarRect(data.rect);
          break;
        default:
          break;
      }
    };
    window.addEventListener('message', handleMessage);

    let $stateInput: HTMLInputElement;
    const handleExtensionOpened = () => {
      setExtensionOpened($stateInput.value === 'opened');
    };

    let timer: number;
    let tryTimes = 0;

    function checkStateInput() {
      $stateInput = document.getElementById('extension_hidden_value') as HTMLInputElement;
      setExtensionInstalled(Boolean($stateInput));
      console.log('__extension_install_state', $stateInput?.value, tryTimes);
      tryTimes += 1;
      if ($stateInput !== null) {
        $stateInput?.addEventListener('ValueChanged', handleExtensionOpened);
        setExtensionOpened($stateInput.value === 'opened');
      } else if (tryTimes <= 10) {
        // web刷新页面，可能插入的代码未开始执行
        timer = window.setTimeout(checkStateInput, tryTimes * 1e3);
      }
    }
    checkStateInput();

    return () => {
      if (timer) {
        clearTimeout(timer);
      }
      window.removeEventListener('message', handleMessage);
      $stateInput?.removeEventListener('ValueChanged', handleExtensionOpened);
    };
  }, []);

  useEffect(() => {
    if (personalJob.jobId && personalJob.receiverList.length > 0) {
      const taskUpdateInfoList = personalJob.receiverList.map((item: any) => {
        item.jobId = personalJob.jobId;
        return item;
      });
      whatsAppApi.personalJobUpdate({ taskUpdateInfoList });
    }
  }, [personalJob]);

  useEffect(() => {
    if (!initialTab) {
      return;
    }
    if (props.qs.tab === 'job') {
      iframeRef.current?.contentWindow?.postMessage(
        {
          type: 'toggleTab',
          data: {
            tab: 'b',
          },
        },
        '*'
      );
    }
    if (props.qs.phoneList) {
      iframeRef.current?.contentWindow?.postMessage(
        {
          type: 'updatePhoneList',
          data: {
            phoneList: props.qs.phoneList.split(','),
          },
        },
        '*'
      );
    }
    if (props.qs.chatWhatsApp) {
      iframeRef.current?.contentWindow?.postMessage(
        {
          type: 'openChat',
          data: {
            chatWhatsApp: props.qs.chatWhatsApp,
          },
        },
        '*'
      );
    }
  }, [props.qs, initialTab]);

  const sidebarStyle: React.CSSProperties = useMemo(() => {
    const styleObj = {};
    const paddingLeft = 24;
    const paddingTop = 24;
    const isLogOut = !loginSns?.snsId && lastLoginIdRef.current;
    if (sidebarRect && sidebarRect.width > 0 && !isLogOut) {
      Object.assign(styleObj, {
        position: 'fixed',
        right: Math.max(sidebarRect.right + paddingLeft, paddingLeft), // 为了避免计算左侧Tab栏，使用相对右定位
        top: Math.max(sidebarRect.top + (inElectron ? ELECTRON_TITLE_FIX_HEIGHT : 0) + paddingTop, paddingTop), // 为了避免计算顶部任务栏，使用相对底定位
        width: sidebarRect.width + 15 + 'px', // 按钮外放，加回15px
        height: sidebarRect.height + 'px',
      });
    }
    if (isLogOut) {
      lastLoginIdRef.current = undefined;
    }
    return styleObj;
  }, [sidebarRect, loginSns?.snsId]);

  const handleRefresh = () => {
    // 调用插件清除service_worker
    const $button = document.getElementById('clear_service_worker');
    $button?.click();
    iframeRef.current && (iframeRef.current.src = WA_WEBSITE);
  };

  const handleBindCompanyChange = ({ whatsappId, companyId }: { whatsappId: string; companyId: string }) => {
    iframeRef.current?.contentWindow?.postMessage(
      {
        type: 'bindInfo',
        data: { whatsappId, companyId },
      },
      '*'
    );
  };
  const isLogin = (inElectron || (extensionInstalled && extensionOpened)) && loginSns?.snsId && chatSns?.snsId;

  if (!extensionInstalled && !inElectron) {
    return <IntroExtension />;
  }
  return (
    <div className={style.page}>
      <h3 className={style.pageTitle}>
        {getTransText('WhatsAppXIAOXILIEBIAO')}
        {extensionOpened && (
          <span onClick={handleRefresh} style={{ marginLeft: 4 }}>
            <RefreshIcon />
          </span>
        )}
      </h3>
      <div className={style.offlineTip}>
        <TongyongShuomingMian style={{ color: '#4C6AFF', width: 16, height: 16, verticalAlign: -2, marginRight: 4 }} />
        WhatsApp个人营销功能已经搬家至WhatsApp群发（群发功能请联系销售了解），个人营销功能将于近期下线，给各位用户带来的不便敬请谅解。
      </div>
      <div className={style.content}>
        <div className={style.iframeContainer} ref={iframeContainerRef}>
          {extensionInstalled || inElectron ? (
            <iframe ref={iframeRef} allow="microphone;camera;midi;encrypted-media;" src={WA_WEBSITE} width="100%" height="100%" />
          ) : null}
          <Modal
            wrapClassName={style.proxyWarningModal}
            visible={proxyWarningVisible}
            width={430}
            getContainer={() => iframeContainerRef.current as HTMLElement}
            title={getIn18Text('XITONGJIANCE\uFF1AIP DEZHIYICHANG')}
            onOk={handleProxyCheck}
            okText={getIn18Text('ZAICIJIANCE')}
            keyboard={false}
            maskClosable={false}
            closable={false}
            maskStyle={{ position: 'absolute', left: 0, top: 0 }}
            okButtonProps={{ loading: proxyChecking }}
            cancelButtonProps={{ style: { display: 'none' } }}
          >
            {getIn18Text('WANGLUOLIANJIEYICHANG\uFF0CQINGNINZAIHEFADEHAIWAIWANGLUOLIANJIEHUANJINGXIAFANGWENCIFUWU')}
          </Modal>
        </div>
        <div className={classNames(style.sidebarContainer, showSideBar ? style.showSidebar : style.hideSidebar, !isLogin && style.showSidebarTips)} style={sidebarStyle}>
          <div style={{ width: '100%', height: '100%' }}>
            {isLogin ? (
              <WACustomerSidebar snsInfo={chatSns} onBindCompanyChange={handleBindCompanyChange} />
            ) : (
              <InstallTips showSteps={!inElectron} installed={extensionInstalled} opened={extensionOpened} logined={Boolean(loginSns?.snsId)} snsId={loginSns?.snsId} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersonalWhatsapp;
