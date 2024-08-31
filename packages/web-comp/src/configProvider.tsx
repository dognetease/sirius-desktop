import * as React from 'react';
import { ConfigProvider as AntdConfigProvider } from 'antd';

export interface ConfigProviderProps {
  children?: React.ReactNode;
}

const ConfigProvider: React.FC<ConfigProviderProps> = props => {
  return <>{!!(process.env.BUILD_ENV === 'ui') ? <AntdConfigProvider prefixCls="lx-ant">{props.children}</AntdConfigProvider> : <>{props.children}</>}</>;
};

export default ConfigProvider;
