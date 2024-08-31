import { Drawer } from 'antd';
import { DrawerProps } from 'antd/lib/drawer';
import ConfigProvider from '../configProvider';
import classnames from 'classnames';
import React from 'react';
import './antd.scss';
import style from './index.module.scss';
import { ReactComponent as CloseIcon } from './icon/close.svg';

export const tuple = <T extends string[]>(...args: T) => args;
const SizeTypes = tuple('default', 'large');
type sizeType = (typeof SizeTypes)[number];

export interface SiriusDrawerProps extends DrawerProps {
  size?: sizeType;
  extra?: any;
  children: React.ReactNode;
  isWindows?: boolean;
}

/**
 * @description 对Drawer的简单封装，支持对Drawer的公共逻辑
 * @param props
 * @returns
 */
const SiriusDrawer: React.FC<SiriusDrawerProps> = props => {
  // const isWebWmEntry = systemApi.isWebWmEntry()
  let { className, size = 'default', placement = 'right', width, height, closable, isWindows, ...restProps } = props;

  if (placement === 'left' || placement === 'right') {
    const sizeWidth = size === 'large' ? 888 : 504;
    width = width || sizeWidth;
  } else {
    const sizeHeight = size === 'large' ? 888 : 504;
    height = height || sizeHeight;
  }

  return (
    // @ts-ignore
    <ConfigProvider>
      <Drawer
        className={classnames(
          style.siriusDrawerUi,
          {
            [style.siriusDrawerWindows]: isWindows,
            [style.siriusDrawerClosable]: closable,
          },
          className
          // { [style.isWebEntryWmCustomerStyle]: isWebWmEntry }
        )}
        closable={closable}
        {...restProps}
        {...{
          placement,
          width,
          height,
          closeIcon: <CloseIcon />,
        }}
      >
        {props.children}
      </Drawer>
    </ConfigProvider>
  );
};

export default SiriusDrawer;
