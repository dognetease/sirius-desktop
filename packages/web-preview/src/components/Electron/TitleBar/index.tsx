import React, { useEffect, useState, useCallback } from 'react';
import './index.scss';
import debounce from 'lodash/debounce';
import { inWindow, apiHolder } from 'api';
import { isImageWindow, isMainWindow } from '@web-common/utils/constant';

const electronLib = inWindow() ? window.electronLib : {};
const { isMac } = apiHolder.env;

// console.log('location', window.location, location.href);

interface titleBar {
  isLogin: boolean;
  show?: boolean;
  showClose?: boolean;
  showMin?: boolean;
  showMax?: boolean;
}

const TitleBar: React.FC<titleBar> = props => {
  const { isLogin, show = true, showClose = true, showMin = true, showMax = true } = props;
  const [isMax, setMax] = useState(false);

  /**
   * 双击titlebar放大
   */
  const onResizeListener = useCallback(
    debounce(
      async () => {
        const { isMaximized } = await electronLib.windowManage.getWinInfo();
        console.log('setMaxIcon', isMaximized);
        setMax(isMaximized);
      },
      500,
      { leading: true, trailing: false }
    ),
    []
  );
  const min = () => {
    showMin && electronLib && electronLib.windowManage.minimize();
  };

  const max = () => {
    if (showMax) {
      setMax(!isMax);
      electronLib && electronLib.windowManage.toggleMaximize();
    }
  };

  const close = () => {
    showClose && electronLib && electronLib.windowManage.close();
  };

  // 写信页，读信页 留下左边距 用于回到页签功能
  const style = window?.location?.pathname?.includes('writeMail') || window?.location?.pathname?.includes('readMail') ? { paddingLeft: '60px' } : {};
  // todo 区分外贸
  const mailBoxClass = window?.location?.hash?.includes('mailbox') ? ' is-mail-box' : '';

  const renderTitleBar = () => {
    if (isMac) {
      return null;
    }
    return (
      <div className={'title-bar' + mailBoxClass}>
        <div className={`btn-group-win ${isImageWindow() && 'image-window-btn'}`} style={style}>
          {showMin && (
            <div className="browser-btn min-btn" onClick={min}>
              <i className="min"> </i>
            </div>
          )}
          {showMax && (
            <div className="browser-btn max-btn" onClick={max}>
              <i className={isMax ? 'un-max' : 'max'} />
            </div>
          )}
          {showClose && (
            <div className="browser-btn close-btn" onClick={close}>
              <i className="close" />
            </div>
          )}
        </div>
      </div>
    );
  };
  const themeClass = isLogin || isMainWindow() || window?.location?.pathname?.includes('password_reset') ? '' : 'gray-theme';
  const mainClass = isMainWindow() ? '' : 'un-main';

  if (!show) {
    return null;
  }
  useEffect(() => {
    if (showMax) {
      window.onresize = onResizeListener;
      electronLib.windowManage.getWinInfo().then(({ isMaximized }) => {
        setMax(isMaximized);
      });
    }
    return () => {
      window.onresize = null;
    };
  }, []);
  /**
   * 在window 客户端，演示模式打开后，全屏情况下会显示当前【窗口操作bar】。
   * 为了隐藏当前元素，新增id属性、 用于演示模式打开和关闭时控制元素隐藏和显示。
   */
  return (
    <div id="global-window-operate-bar" className={`title-bar-wrap ${themeClass} ${mainClass}`}>
      {renderTitleBar()}
    </div>
  );
};

export default TitleBar;
