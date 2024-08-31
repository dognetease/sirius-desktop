import { Tooltip } from 'antd';
import React, { useEffect, useState } from 'react';
import { ReactComponent as InfoIcon } from '@/images/icons/edm/keyword-info.svg';
import { EdmCustomsApi, api, apis } from 'api';

const customsService = api.requireLogicalApi(apis.edmCustomsApiImpl) as EdmCustomsApi;

import styles from './keywordstable.module.scss';

interface HsCodeDescProps {
  hscode: string;
}

export default (props: HsCodeDescProps) => {
  const { hscode } = props;
  const [hscodeDesc, setHscodeDesc] = useState<string>(hscode);

  useEffect(() => {
    customsService.doGetHscodeItem(hscode).then(item => {
      if (item) {
        setHscodeDesc(item.desc);
      }
    });
  }, [hscode]);

  return (
    <Tooltip title={`hscode包含[${hscodeDesc}]的企业`}>
      <span className={styles.iconWrapper}>
        <InfoIcon />
      </span>
    </Tooltip>
  );
};
