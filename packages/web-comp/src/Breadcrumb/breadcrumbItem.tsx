import React, { useMemo } from 'react';
import { Breadcrumb } from 'antd';
import { BreadcrumbItemProps } from 'antd/lib/breadcrumb';
import ConfigProvider from '../configProvider';
import variables from '../styles/export.module.scss';
import classNames from 'classnames';
import './style.scss';

export interface IBreadcrumbItemProps extends BreadcrumbItemProps {
  children: React.ReactNode;
}

export const BreadcrumbItem: React.FC<IBreadcrumbItemProps> = props => {
  const { children, className, ...restProps } = props;
  const classes = useMemo(() => classNames(`${variables.classPrefix}-breadcrumb-item`, className), [className]);
  return (
    // @ts-ignore
    <ConfigProvider>
      <Breadcrumb.Item className={classes} {...restProps}>
        {children}
      </Breadcrumb.Item>
    </ConfigProvider>
  );
};

BreadcrumbItem.defaultProps = {};

export default BreadcrumbItem;
