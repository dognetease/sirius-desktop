/**
 * 面包屑组件
 * author: lujiajian@office.163.com
 */
import React from 'react';
import IBreadcrumb, { IBreadcrumbProps } from './breadcrumb';
import IBreadcrumbItem, { IBreadcrumbItemProps } from './breadcrumbItem';
import IBreadcrumbSeparator, { IBreadcrumbSeparatorProps } from './breadcrumbSeparator';
import './antd.scss';

export type IBreadcrumbComponent = React.FC<IBreadcrumbProps> & {
  Item: React.FC<IBreadcrumbItemProps>;
  Separator: React.FC<IBreadcrumbSeparatorProps>;
};

const Breadcrumb = IBreadcrumb as IBreadcrumbComponent;
Breadcrumb.Item = IBreadcrumbItem;
Breadcrumb.Separator = IBreadcrumbSeparator;

export type BreadcrumbProps = IBreadcrumbProps;
export type BreadcrumbItemProps = IBreadcrumbItemProps;
export default Breadcrumb;
