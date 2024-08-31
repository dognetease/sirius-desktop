import { PageProps } from 'gatsby';
import React, { PropsWithChildren } from 'react';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/es/locale/zh_CN';
import { L2cCrmSidebarMenuExtra } from '@web-common/conf/waimao/l2c-crm-constant';
import BaseMainLayout from './baseLayout';

const MailLayoutLocale: React.FC<
  PropsWithChildren<{
    l2cCrmSidebarMenuExtra?: React.MutableRefObject<L2cCrmSidebarMenuExtra>;
  }>
> = ({ children, l2cCrmSidebarMenuExtra }) => (
  <ConfigProvider locale={zhCN}>
    <BaseMainLayout l2cCrmSidebarMenuExtra={l2cCrmSidebarMenuExtra}>{children}</BaseMainLayout>
  </ConfigProvider>
);

export default MailLayoutLocale;
