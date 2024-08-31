import React, { useEffect } from 'react';
import classnames from 'classnames';
import { DrawerProps } from 'antd';
// import Drawer from '@web-common/components/UI/SiriusDrawer';
import Drawer from '@lingxi-common-component/sirius-ui/SiriusDrawer';
import { apiHolder } from 'api';
import CloseIcon from '@web-common/components/UI/Icons/svgs/CloseMailSvg';
import style from './drawer.module.scss';

const { isMac } = apiHolder.env;
const systemApi = apiHolder.api.getSystemApi();
const isWindows = systemApi.isElectron() && !isMac;

const CustomerDrawer: React.FC<DrawerProps> = props => {
  const { className, ...restProps } = props;

  useEffect(() => {
    // 修改侧弹框底部滚动条展示问题
    let dom = document.querySelectorAll('.os-scrollbar');
    if (props.visible) {
      dom.forEach(ele => {
        ele.setAttribute('style', 'display: none');
      });
    } else {
      dom.forEach(ele => {
        ele.setAttribute('style', 'display: block');
      });
    }
  }, [props.visible]);

  return (
    <Drawer
      className={classnames(className, {
        [style.customerDrawer]: true,
        [style.isWindows]: isWindows,
      })}
      {...restProps}
    />
  );
};

CustomerDrawer.defaultProps = {
  closeIcon: <CloseIcon />,
  contentWrapperStyle: { width: '68.125%', minWidth: 872 },
  maskStyle: { background: 'transparent' },
  bodyStyle: { padding: 0 },
  getContainer: false,
  zIndex: 10,
};

export default CustomerDrawer;
