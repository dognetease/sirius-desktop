import React, { useEffect } from 'react';
import { message } from 'antd';

// antd的通用配置都放到这里
export const AntdConfig: React.FC<{}> = () => {
  // 配置消息提示高度
  useEffect(() => {
    message.config({
      top: 88,
      rtl: false,
    });
  }, []);
  return null;
};
