import React, { useState, useMemo, useEffect } from 'react';
import { apiHolder, apis, DataTrackerApi, AccountApi, getIn18Text, isEdm } from 'api';
// import IconCard from '@web-common/components/UI/IconCard/index';
import { useNiceModal } from '@web-common/components/UI/NiceModal/NiceModal';
import { isMainAccount } from '../../util';
import useState2RM from '../../hooks/useState2ReduxMock';
import { FLOLDER } from '../../common/constant';
import { useGetProductAuth } from '@web-common/hooks/useGetProductAuth';
import styles from './index.module.scss';

const accountApi = apiHolder.api.requireLogicalApi(apis.accountApiImpl) as AccountApi;
const trackApi = apiHolder.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;

const PaidGuideTip: React.FC = () => {
  const [selectedKeys] = useState2RM('selectedKeys', 'doUpdateSelectedKey');
  const [mailSearching] = useState2RM('mailSearching', 'doUpdateMailSearching');
  const [visibleAdmin, setVisibleAdmin] = useState<boolean>(false); // 是否是管理员账号
  const paidGuideModal = useNiceModal('paidGuide');
  const {
    productVersionInfo: { productVersionId },
  } = useGetProductAuth();

  const paidGuideTab = useMemo(
    () => !isEdm() && selectedKeys.id == FLOLDER.SENT && !mailSearching && isMainAccount(selectedKeys.accountId) && productVersionId === 'free',
    [selectedKeys, mailSearching, productVersionId]
  );

  useEffect(() => {
    accountApi.doGetAccountIsAdmin().then(res => setVisibleAdmin(res));
  }, []);

  useEffect(() => {
    if (paidGuideTab) {
      trackApi.track('pcMail_show_outbox_free', { type: visibleAdmin ? '管理员' : '成员' });
    }
  }, [paidGuideTab]);

  const tipClick = () => {
    trackApi.track('pcMail_click_outbox_free', { type: visibleAdmin ? '管理员' : '成员' });
    paidGuideModal.show({ errType: '1', origin: '发件箱' });
  };

  if (!paidGuideTab) {
    return <></>;
  }

  return (
    <div className={styles.paidTip} onClick={tipClick}>
      <p className={styles.tipTitle}>{getIn18Text('MEIRIKEWAIFAYJFS')}：100</p>
      <p className={styles.linkBtn}>
        {getIn18Text('TIGAOFAXINSHANGX')}
        {/* <IconCard type="tongyong_jiantou_you" fill="#4C6AFF" /> */}
      </p>
    </div>
  );
};

export default PaidGuideTip;
