import React from 'react';

import { Button } from 'antd';

import { ReactComponent as ImageEmpty } from '../../svg/empty.svg';
import { ReactComponent as ImageNoNetwork } from '../../svg/no-network.svg';
import styles from './no-uni-empty.module.scss';
interface NoUniEmptyProps {
  errorType: 'noInstallApp' | 'timeout';
  onClick: () => void;
}
const errorDesc = {
  noInstallApp: '数据异常，请联系您的专属客户成功经理进行反馈',
  timeout: '网络异常，请点击刷新重试',
};
export const NoUniEmpty: React.FC<NoUniEmptyProps> = props => {
  return (
    <div className={styles['container']}>
      <div>
        {props.errorType === 'noInstallApp' ? <ImageEmpty /> : null}
        {props.errorType === 'timeout' ? <ImageNoNetwork /> : null}
        <div className={styles['text']}>{errorDesc[props.errorType] || errorDesc['timeout']}</div>
        {props.errorType === 'timeout' ? (
          <Button className={styles['btn']} type="primary" onClick={props.onClick}>
            刷新
          </Button>
        ) : null}
      </div>
    </div>
  );
};
