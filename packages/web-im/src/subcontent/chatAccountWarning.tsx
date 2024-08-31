import React, { useMemo } from 'react';
import classnames from 'classnames/bind';
import ExclamationCircleOutlined from '@ant-design/icons/ExclamationCircleOutlined';
import lodashGet from 'lodash/get';
import styles from './chatAccountWarning.module.scss';
import { useYunxinAccount } from '../common/hooks/useYunxinAccount';
import { getIn18Text } from 'api';
const realStyle = classnames.bind(styles);
export const ChatAccountWarning: React.FC<{
  to: string;
}> = props => {
  const { to } = props;
  const userInfo = useYunxinAccount(to, 'p2p');
  return useMemo(() => {
    if (lodashGet(userInfo, 'status', 0) !== 0) {
      return (
        <p className={realStyle('warning')} data-test-id="im_session_content_userdisable">
          <ExclamationCircleOutlined />
          <span className={realStyle('text')}>{getIn18Text('GAIZHANGHAOYITING')}</span>
        </p>
      );
    }
    return null;
  }, [userInfo]);
};
