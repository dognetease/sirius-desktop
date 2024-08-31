import React from 'react';
import { Breadcrumb } from 'antd';

export interface IBreadcrumbSeparatorProps {
  children?: React.ReactNode;
}

export const BreadcrumbSeparator: React.FC<IBreadcrumbSeparatorProps> = props => {
  const { children, ...restProps } = props;
  return <>{children ? <Breadcrumb.Separator {...restProps}>{children}</Breadcrumb.Separator> : <Breadcrumb.Separator {...restProps} />}</>;
};

BreadcrumbSeparator.defaultProps = {};

export default BreadcrumbSeparator;
