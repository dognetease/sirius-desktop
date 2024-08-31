import React, { useState } from 'react';
import styles from './index.module.scss';
import { Popover } from 'antd';
import { apiHolder as api, apis, MailApi, DataTrackerApi } from 'api';
import useMsgCallback from '@web-common/hooks/useMsgCallback';
import { ReactComponent as IconQuestion } from '@/images/icons/mail/question.svg';
import { useGetProductAuth } from '@web-common/hooks/useGetProductAuth';
import SiriusMessage from '@web-common/components/UI/Message/SiriusMessage';
import { getIn18Text } from 'api';
const mailApi = api.api.requireLogicalApi(apis.mailApiImpl) as MailApi;
const trackApi = api.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;
const Header = () => {
  const [visible, setVisible] = useState<boolean>(false);
  const {
    productVersionInfo: { productVersionId },
  } = useGetProductAuth();
  const isNotSirius = productVersionId !== 'sirius';
  // 接受写信页窗口准备好的消息
  useMsgCallback('writePageDataExchange', e => {
    const { eventStrData } = e;
    if (eventStrData && (eventStrData === 'writePageWindowCreated' || eventStrData === 'writeTabCreated')) {
      setVisible(false);
    }
  });
  // 点击写信按钮
  const handleWriteBtnClick = () => {
    if (isNotSirius) {
      SiriusMessage.error({
        content: getIn18Text('QINGXIANSHENGJIDAO'),
      });
      return;
    }
    // 唤起写信页
    mailApi.doWriteMailToContact();
  };
  const popoverContent = (
    <div className={styles.popContentWrap}>
      <div className={styles.steps}>
        <span>1</span>
        <span>{getIn18Text('JINRUYOUXIANGMO')}</span>
      </div>
      <div className={styles.steps}>
        <span>2</span>
        <span>{getIn18Text('DIANJITIANJIA\u201C')}</span>
      </div>
      <div className={styles.imgInfo}></div>
      <div className={styles.steps}>
        <span>3</span>
        <span>{getIn18Text('BIANJIYOUJIANNEI')}</span>
      </div>
      <div className={styles.btn} onClick={handleWriteBtnClick}>
        {getIn18Text('QUSHISHI')}
      </div>
    </div>
  );
  return (
    <div className={styles.header}>
      <div>{getIn18Text('XUNZHANG')}</div>
      <div className={styles.headerRight}>
        {getIn18Text('RUHEBANFAXUN')}
        <Popover
          overlayClassName="header-popover-container"
          content={popoverContent}
          placement="bottomRight"
          trigger="click"
          onVisibleChange={v => {
            setVisible(v);
            if (v) {
              trackApi.track('pcContact_click_contactsDetailPage_medalWall_howToAwardMedals​');
            }
          }}
          visible={visible}
          arrowPointAtCenter
          autoAdjustOverflow
          destroyTooltipOnHide
        >
          <IconQuestion />
        </Popover>
      </div>
    </div>
  );
};
export default Header;
