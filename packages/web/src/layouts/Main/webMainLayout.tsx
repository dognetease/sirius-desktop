import { PageProps } from 'gatsby';
import React from 'react';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/es/locale/zh_CN';
import WebToolbar from './webToolbar';
import BaseMainLayout from './baseLayout';

const WebMainLayout: React.FC<{}> = ({ children }) => (
  <ConfigProvider locale={zhCN}>
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ position: 'relative' }}>
        <BaseMainLayout>{children}</BaseMainLayout>
      </div>
    </div>
  </ConfigProvider>
);

export default WebMainLayout;
