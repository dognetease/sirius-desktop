import React, { useState } from 'react';
import { navigate } from '@reach/router';
import { apiHolder, apis, DataTrackerApi, getIn18Text, inWindow } from 'api';

import { ReactComponent as TrumpetIcon } from '../../../images/trumpet2.svg';
import { ReactComponent as CloseIcon } from '../../../images/close2.svg';
import styles from './style.module.scss';

// const trackApi = apiHolder.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;

const LOCAL_STORAGE_KEY = 'siteLeadTipClick';

export function BuyDomainTip() {
  const [visible, setVisible] = useState(inWindow() && !window.localStorage.getItem(LOCAL_STORAGE_KEY));

  //查看详情, 跳到帮助中心
  const goDetails = () => {
    window.location.hash = '#/unitable-crm/lead/list?groupType=SITE_INQUIRY';
  };

  const handleClose = () => {
    setVisible(false);
    inWindow() && window.localStorage.setItem(LOCAL_STORAGE_KEY, 'true');
  };

  return visible ? (
    <div className={styles.tip}>
      <span>
        <TrumpetIcon style={{ marginRight: '6px' }} />
        通知：站点询盘的查看位置更新到了「客户与业务-线索表」
      </span>
      <span>
        <a onClick={goDetails}>{getIn18Text('CHAKANXIANGQING')}</a>
        <CloseIcon onClick={handleClose} style={{ marginLeft: '16px', cursor: 'pointer' }} />
      </span>
    </div>
  ) : null;
}
