import { Alert, AlertProps } from 'antd';
import React, { useEffect, useState } from 'react';
import styles from './cncompanyalert.module.scss';
import { api } from 'api';
import omit from 'lodash/omit';
import classNames from 'classnames';

const storeApi = api.getDataStoreApi();

interface ChinaCompanyAlertProps extends AlertProps {
  visible?: boolean;
  storeKey?: string;
}

const ChinaCompanyAlert: React.FC<ChinaCompanyAlertProps> = ({ visible, storeKey, ...props }) => {
  const [hasClosed, setHasClosed] = useState<boolean>(true);
  useEffect(() => {
    if (storeKey) {
      const { data } = storeApi.getSync(storeKey);
      setHasClosed(!!data);
    }
  }, [storeKey]);

  if (!visible || hasClosed) {
    return null;
  }
  return (
    <Alert
      className={classNames(styles.tableTip, props.className)}
      afterClose={() => {
        storeKey && storeApi.putSync(storeKey, 'true');
        props.afterClose?.();
      }}
      {...omit(props, ['className', 'afterClose'])}
    />
  );
};

export default ChinaCompanyAlert;
