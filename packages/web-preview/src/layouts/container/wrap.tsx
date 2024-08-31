import React, { useCallback, useEffect, useState } from 'react';
import cn from 'classnames';
import { apiHolder, inWindow, locationHelper } from 'api';
// import Loadable from '@loadable/component';
import debounce from 'lodash/debounce';
import { getBodyFixHeight, ELECTRON_TITLE_FIX_HEIGHT, SIDE_BAR_WIDTH, isTabWindow, isMainWindow as needRootDragHeight } from '@web-common/utils/constant';
import styles from './index.module.scss';

import TitleBar from './../../components/Electron/TitleBar';
import { getIn18Text } from 'api';
const systemApi = apiHolder.api.getSystemApi();

const ContainerWrap: React.FC<any> = ({ children, isLogin, showMin, showMax, showClose, show }) => {
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
      // dispatch(getMenuSettingsAsync());
      // dispatch(getPrivilegeAsync());
      // dispatch(getBaseSelectAsync());
      // dispatch(getAreaSelectAsync());
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
  return (
    <>
      {/* 外贸crm 内嵌的uni iframe 展示情况下，需要调低Header拖拽区域高度（否则影响内部按钮点击） */}
      <div className={cn(styles.siriusContainer, 'wrap-component-class-flag')}>
        <div className={`${styles.rootWrap} ${isLogin && styles.whiteBg}`} style={{ top: fixHeight }}>
          {children}
        </div>
        {process.env.BUILD_ISELECTRON && inWindow() && <div className={`${needRootDragHeight() ? styles.rootDragEle : ''} ${isTabWindow() ? styles.resourceTab : ''}`} />}
        {process.env.BUILD_ISELECTRON && inWindow() ? <TitleBar isLogin={isLogin} showMin={showMin} showClose={showClose} showMax={showMax} show={show} /> : null}
        {/* {!process.env.BUILD_ISELECTRON && systemApi.isMainPage() && !systemApi.inEdm() && <WebToolbar />} */}
        {/* <ReducerCompontent /> */}
        {/* {visibleLaunch && <Launch onLaunch={onLaunch} />} */}
        {/* <MailBindModal
          title={getIn18Text('YANZHENGNINDEWANG')}
          visible={mailBindModalInfo.visible}
          defaultAccount={mailBindModalInfo.account}
          from="account"
        /> */}
        {/* 来信分类弹窗 */}
        {/* <ClassifyContentModal /> */}
      </div>
    </>
  );
};
export default ContainerWrap;
