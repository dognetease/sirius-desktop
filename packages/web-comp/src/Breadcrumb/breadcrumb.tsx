import React, { useMemo } from 'react';
import { Breadcrumb as AntdBreadcrumb } from 'antd';
import { BreadcrumbProps } from 'antd/lib/breadcrumb';
import ConfigProvider from '../configProvider';
import TongyongJianTouYou from './tongyong_jiantou_you';
import variables from '../styles/export.module.scss';
import classNames from 'classnames';

export interface IBreadcrumbProps extends BreadcrumbProps {
  children: React.ReactNode;
  arrowSeparator?: boolean; // 是否采用箭头分隔符
}

export const Breadcrumb: React.FC<IBreadcrumbProps> = props => {
  const { children, arrowSeparator, className, ...restProps } = props;
  const classes = useMemo(
    () => classNames(`${variables.classPrefix}-breadcrumb`, className, { [`${variables.classPrefix}-breadcrumb-arrow-separator`]: arrowSeparator }),
    [className, arrowSeparator]
  );
  return (
    // @ts-ignore
    <ConfigProvider>
      <AntdBreadcrumb className={classes} separator={arrowSeparator ? <TongyongJianTouYou fill={'#C9CBD6'} /> : '/'} {...restProps}>
        {children}
      </AntdBreadcrumb>
    </ConfigProvider>
  );
};

Breadcrumb.defaultProps = {};

export default Breadcrumb;
