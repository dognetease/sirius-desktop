import React from 'react';
import { Breadcrumb } from 'antd';
import ConfigProvider from '../configProvider';

export interface IBreadcrumbSeparatorProps {
  children?: React.ReactNode;
}

export const BreadcrumbSeparator: React.FC<IBreadcrumbSeparatorProps> = props => {
  const { children, ...restProps } = props;
  // @ts-ignore
  return <ConfigProvider>{children ? <Breadcrumb.Separator {...restProps}>{children}</Breadcrumb.Separator> : <Breadcrumb.Separator {...restProps} />}</ConfigProvider>;
};

BreadcrumbSeparator.defaultProps = {};

export default BreadcrumbSeparator;
