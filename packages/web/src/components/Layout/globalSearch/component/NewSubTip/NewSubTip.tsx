import { api, getIn18Text } from 'api';
// import Button from '@web-common/components/UI/Button';
import Button from '@lingxi-common-component/sirius-ui/Button';
import { Alert } from 'antd';
import React, { useContext, useEffect, useState } from 'react';
import { navigate } from 'gatsby';
import styles from './newsubtip.module.scss';
import { SubKeyWordContext } from '../../keywordsSubscribe/subcontext';
import { useNewSubEnable } from '../../hook/useNewSubEnableHook';

const storeApi = api.getDataStoreApi();

export const NEW_SUB_TIP_KEY = 'GLOBAL_SEARCH_NEW_SUB_TIP';

const NewSubTip: React.FC<{}> = () => {
  const [visible, setVisible] = useState(false);
  const [hasAuth, hasList] = useNewSubEnable(!storeApi.getSync(NEW_SUB_TIP_KEY).data);
  const handleClose = () => {
    storeApi.putSync(NEW_SUB_TIP_KEY, 'true');
    setVisible(false);
  };

  const handleCheck = () => {
    navigate('#wmData?page=keywords');
    handleClose();
  };

  useEffect(() => {
    const { data } = storeApi.getSync(NEW_SUB_TIP_KEY);
    if (hasAuth && !data && !hasList) {
      setVisible(true);
    }
    return () => {};
  }, [hasList, hasAuth]);

  if (!visible) {
    return null;
  }
  return (
    <Alert
      message={
        <div className={styles.message}>
          <span className={styles.title}>获取推荐客户</span>
          <span className={styles.text}>设置潜在客户企业画像，外贸通将每日自动推荐相关客户，帮您扩大潜客范围。</span>
          <Button className={styles.btn} btnType="primary" inline onClick={handleCheck}>
            {getIn18Text('QUCHAKAN')}
          </Button>
        </div>
      }
      type="info"
      showIcon
      closable
      className={styles.alert}
      onClose={handleClose}
    />
  );
};

export default NewSubTip;
