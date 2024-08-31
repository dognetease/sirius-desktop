import React, { useCallback, useEffect, useState } from 'react';
import { apiHolder, inWindow } from 'api';
import Loadable from '@loadable/component';
import debounce from 'lodash/debounce';
import Launch from '@web-account/Launch/launch';
import MailBindModal from '@web-account/Login/modal/bindAccount';
import { getBodyFixHeight, ELECTRON_TITLE_FIX_HEIGHT, SIDE_BAR_WIDTH, isTabWindow, isMainWindow as needRootDragHeight } from '@web-common/utils/constant';
import { ClassifyContentModal } from '@web-common/components/CustomMailClassify/classify-content-modal';
import { useAppSelector } from '@web-common/state/createStore';
import ReducerCompontent from './reducerComponent';
import styles from './index.module.scss';
import LoginModal from '@web-account/Login/modal/loginModal';
import { getIn18Text } from 'api';

const TitleBar = Loadable(() => import('@web/components/Electron/TitleBar'));
const systemApi = apiHolder.api.getSystemApi();
const isElectron = systemApi.isElectron();
const ContainerWrap: React.FC<any> = ({ children, isLogin, showMin, showMax, showClose, show }) => {
  const { mailBindModalInfo, loginModalData } = useAppSelector(state => state.loginReducer);
  const [visibleLaunch, setVisibleLaunch] = useState<boolean>(systemApi.isMainPage());
  const fixHeight = getBodyFixHeight();
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
    isElectron &&
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
  }, [isElectron]);
  return (
    <>
      <div className={styles.siriusContainer}>
        <div className={`${styles.rootWrap} ${isLogin && styles.whiteBg}`} style={{ top: fixHeight }}>
          {children}
        </div>
        {isElectron && inWindow() && <div className={`${needRootDragHeight() ? styles.rootDragEle : ''} ${isTabWindow() ? styles.resourceTab : ''}`} />}
        {isElectron && inWindow() ? <TitleBar isLogin={isLogin} showMin={showMin} showClose={showClose} showMax={showMax} show={show} /> : null}
        <ReducerCompontent />
        {visibleLaunch && <Launch onLaunch={onLaunch} />}
        <MailBindModal title={getIn18Text('YANZHENGNINDEWANG')} visible={mailBindModalInfo.visible} defaultAccount={mailBindModalInfo.account} from="account" />
        {loginModalData.visible && <LoginModal />}
        {/* 来信分类弹窗 */}
        <ClassifyContentModal />
      </div>
    </>
  );
};
export default ContainerWrap;
