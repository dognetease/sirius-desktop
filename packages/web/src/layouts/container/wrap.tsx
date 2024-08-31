import React, { useCallback, useEffect, useState } from 'react';
import cn from 'classnames';
import { apiHolder, inWindow, locationHelper } from 'api';
// import Loadable from '@loadable/component';
import debounce from 'lodash/debounce';
import Launch from '@web-account/Launch/launch';
import MailBindModal from '@web-account/Login/modal/bindAccount';
import LoginModal from '@web-account/Login/modal/loginModal';
import { getBodyFixHeight, ELECTRON_TITLE_FIX_HEIGHT, SIDE_BAR_WIDTH, isTabWindow, isMainWindow as needRootDragHeight } from '@web-common/utils/constant';
import { ClassifyContentModal } from '@web-common/components/CustomMailClassify/classify-content-modal';
import { useAppDispatch, useAppSelector } from '@web-common/state/createStore';
import { getMenuSettingsAsync, getPrivilegeAsync } from '@web-common/state/reducer/privilegeReducer';
import { getAreaSelectAsync, getBaseSelectAsync } from '@web-common/state/reducer/customerReducer';
import PaidGuidemodule from '@web-mail/components/PaidGuideModal/index';
import ReducerCompontent from './reducerComponent';
import styles from './index.module.scss';

import TitleBar from '@/components/Electron/TitleBar';
import WebToolbar from '@/layouts/Main/webToolbar';
import { getIn18Text } from 'api';
import LockApp from './lock-app';

// const TitleBar = Loadable(() => import('@/components/Electron/TitleBar'));
// const WebToolbar = Loadable(() => import('@/layouts/Main/webToolbar'));
const systemApi = apiHolder.api.getSystemApi();
const eventApi = apiHolder.api.getEventApi();
const ContainerWrap: React.FC<any> = ({ children, isLogin, showMin, showMax, showClose, show, className = '', activeKey, pages = '' }) => {
  const dispatch = useAppDispatch();
  const { mailBindModalInfo, loginModalData } = useAppSelector(state => state.loginReducer);
  const [visibleLaunch, setVisibleLaunch] = useState<boolean>(systemApi.isMainPage());
  const fixHeight = getBodyFixHeight(false, true);
  const debounceToggleMax = useCallback(
    debounce(
      () => {
        console.log('debounceToggleMax');
        window.electronLib.windowManage.toggleMaximize();
      },
      500,
      { leading: true, trailing: false }
    ),
    []
  );
  const onLaunch = () => {
    setVisibleLaunch(false);
  };
  const eleDBCLick = (ele: any) => {
    const eleList = ele.path as HTMLElement[];
    const canMax = eleList.slice(0, 10).some(item => {
      try {
        const eleCSS = window.getComputedStyle(item) as any;
        const str = eleCSS.webkitAppRegion as string;
        return str.includes('no-drag');
      } catch (error) {
        return false;
      }
    });
    if (!canMax) {
      console.log('toggleMaximize');
      debounceToggleMax();
    }
  };
  useEffect(() => {
    if (process.env.BUILD_ISEDM && (systemApi.isMainPage() || locationHelper.testPathMatch('/writeMail') || locationHelper.testPathMatch('/readMail'))) {
      dispatch(getMenuSettingsAsync());
      dispatch(getPrivilegeAsync());
      dispatch(getBaseSelectAsync());
      dispatch(getAreaSelectAsync());
    }
  }, []);
  if (process.env.BUILD_ISELECTRON) {
    useEffect(() => {
      window.addEventListener(
        'dblclick',
        e => {
          if (systemApi.isMainWindow()) {
            const height = 60;
            if (e.clientY <= height) {
              eleDBCLick(e);
            } else if (e.clientY > height && e.clientX < SIDE_BAR_WIDTH) {
              eleDBCLick(e);
            }
          } else if (e.clientY <= ELECTRON_TITLE_FIX_HEIGHT) {
            eleDBCLick(e);
          }
        },
        false
      );
    }, []);
  }
  const [isLockApp, setIsLockApp] = useState<boolean>(systemApi.getIsLockApp());

  if (isLockApp) {
    systemApi.switchLoading(false);
  }

  useEffect(() => {
    const eventName = 'onAppLockChanged';
    const eventId = eventApi.registerSysEventObserver(eventName, {
      func: data => {
        if (data && data.eventData) {
          const isLockApp = data.eventData.isLockApp;
          setIsLockApp(isLockApp);
        }
      },
    });
    return () => {
      eventApi.unregisterSysEventObserver(eventName, eventId);
    };
  }, []);

  return (
    <>
      {/* 外贸crm 内嵌的uni iframe 展示情况下，需要调低Header拖拽区域高度（否则影响内部按钮点击） */}
      <div className={cn(styles.siriusContainer, 'wrap-component-class-flag', className)}>
        {process.env.BUILD_ISELECTRON && isLockApp && <LockApp></LockApp>}
        <div className={`${styles.rootWrap} ${isLogin && styles.whiteBg}`} style={{ top: fixHeight }}>
          {children}
        </div>
        {process.env.BUILD_ISELECTRON && inWindow() && <div className={`${needRootDragHeight() ? styles.rootDragEle : ''} ${isTabWindow() ? styles.resourceTab : ''}`} />}
        {process.env.BUILD_ISELECTRON && inWindow() ? (
          <TitleBar activeKey={activeKey} pages={pages} isLockApp={isLockApp} isLogin={isLogin} showMin={showMin} showClose={showClose} showMax={showMax} show={show} />
        ) : null}
        {!process.env.BUILD_ISELECTRON && systemApi.isMainPage() && !systemApi.inEdm() && <WebToolbar />}
        <ReducerCompontent />
        {visibleLaunch && !isLockApp && <Launch onLaunch={onLaunch} />}
        <MailBindModal title={getIn18Text('YANZHENGNINDEWANG')} visible={mailBindModalInfo.visible} defaultAccount={mailBindModalInfo.account} from="account" />
        {loginModalData.visible && <LoginModal />}
        {/* 来信分类弹窗 */}
        <ClassifyContentModal />
        {/* 免费版引导下单弹窗 */}
        <PaidGuidemodule />
      </div>
    </>
  );
};
export default ContainerWrap;
