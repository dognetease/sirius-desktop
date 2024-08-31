import classnames from 'classnames';
import React, { useCallback, useEffect, useState } from 'react';
// import style from './customsSearch.module.scss';
import { EdmCustomsApi, apiHolder, apis, getIn18Text } from 'api';
import styles from './customsupdatetime.module.scss';

const edmCustomsApi = apiHolder.api.requireLogicalApi(apis.edmCustomsApiImpl) as EdmCustomsApi;

export interface CustomsUpdateTimeProps extends React.HTMLAttributes<HTMLSpanElement> {
  initLayout?: boolean;
  showOption?: boolean;
}

const CustomsUpdateTime: React.FC<CustomsUpdateTimeProps> = ({ initLayout, showOption, className, ...props }) => {
  const [updateTime, setUpdateTime] = useState<string>('');
  const updateFn = useCallback(() => {
    edmCustomsApi.customsUpdateTime().then(res => {
      setUpdateTime(res);
    });
  }, []);
  const enable = !showOption && !initLayout;
  useEffect(() => {
    if (enable) {
      updateFn();
    }
  }, [updateFn, enable]);

  if (enable && updateTime) {
    return (
      <span className={classnames(styles.container, className)} {...props}>
        {getIn18Text('ZUIXINSHUJUGENGXINSHIJIAN\uFF1A')}
        {updateTime}
      </span>
    );
  }
  return null;
};

export default CustomsUpdateTime;
