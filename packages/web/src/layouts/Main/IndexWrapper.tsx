import React from 'react';
import { apiHolder } from 'api';
import SiriusLayout from '@/layouts';
// @ts-ignore
import '../../styles/global.scss';

const buildFor = apiHolder.env.forElectron;
const systemApi = apiHolder.api.getSystemApi();
/**
 * 外层包装，根据在web和electron中的不同，electron会额外套一层带有title-bar的容器
 * @param children
 * @param rest 其余额外的需要title-bar容器支持的属性
 *
 * @constructor
 */
const IndexPageWrapper: React.FC<any> = ({ children, ...rest }) => {
  if (buildFor && systemApi.isElectron()) {
    return <SiriusLayout.ContainerLayout {...rest}>{children}</SiriusLayout.ContainerLayout>;
  }
  return children;
};

export default IndexPageWrapper;
