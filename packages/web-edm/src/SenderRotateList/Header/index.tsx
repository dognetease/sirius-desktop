import React, { FC, MouseEvent } from 'react';
import { getIn18Text } from 'api';
// import Button from '@web-common/components/UI/Button';
import Button from '@lingxi-common-component/sirius-ui/Button';
import { ReactComponent as OpIcon } from '@/images/icons/edm/yingxiao/op-icon.svg';
import { ReactComponent as BetterOpIcon } from '@/images/icons/edm/yingxiao/better-op.svg';
import { navigate } from '@reach/router';
import { RefreshSvg } from '@web-common/components/UI/Icons/svgs/ReadListSvgs';
import { PermissionCheckPage, PrivilegeCheck, usePermissionCheck } from '@/components/UI/PrivilegeEnhance';

import styles from './Header.module.scss';
import { useOpenHelpCenter } from '@web-common/utils/utils';

export const Header: FC<{
  sendEdmCount?: number;
  orgAvailableSendCount?: number;
  forceUpdate: () => void;
}> = ({ sendEdmCount, orgAvailableSendCount, forceUpdate }) => {
  const openHelpCenter = useOpenHelpCenter();

  const toSendMail = () => {
    navigate('#edm?page=write&channel=senderRotate');
  };
  const onKnowledgeCenterClick = (e: MouseEvent) => {
    openHelpCenter('/d/1689922995721711617.html');
    e.preventDefault();
  };

  return (
    <div className={styles.headerInfo}>
      <div className={styles.headerInfoLeft}>
        {/* <img src="" alt="ai" /> */}
        <div className={styles.headerInfoLeftInfo}>
          <div className={styles.slog}>
            <div className={styles.slogTitle}>{getIn18Text('DUOYUMINGYINGXIAO')}</div>
            {/* <div className={styles.switch}></div> */}
            {/* <Switch size="small" className={styles.slogSwitch} disabled={loading} checked={open} onChange={switchChange} /> */}
            {sendEdmCount != null && orgAvailableSendCount != null && (
              <div className={styles.slogTime}>
                {getIn18Text('GONG')}
                <span className={styles.slogCount}>{sendEdmCount}</span>
                {getIn18Text('CIFAXINRENWU，SHENG')}
                <span className={styles.slogCount}>{orgAvailableSendCount}</span>
                {getIn18Text('FENG')}
                <a
                  target="_blank"
                  onClick={() => {
                    forceUpdate();
                  }}
                  style={{
                    marginLeft: 8,
                    display: 'inline-flex',
                    alignItems: 'center',
                  }}
                >
                  <RefreshSvg />
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className={styles.headerInfoRight}>
        <a className={styles.slogBtnWrap} onClick={onKnowledgeCenterClick} href="">
          <OpIcon />
          <span className={styles.slogBtnWrapTitle}>{getIn18Text('CAOZUOSHOUCE')}</span>
        </a>
        {/* <a className={styles.slogBtnWrap} href="https://waimao.163.com/knowledgeCenter#/d/1663094862923243522.html">
          <BetterOpIcon />
          <span className={styles.slogBtnWrapTitle}>最佳实践</span>
        </a> */}
        <PrivilegeCheck accessLabel="OP" resourceLabel="EDM">
          <Button
            style={{
              marginLeft: 8,
            }}
            btnType="primary"
            onClick={() => {
              toSendMail();
            }}
          >
            {getIn18Text('XINJIANRENWU')}
          </Button>
        </PrivilegeCheck>
      </div>
    </div>
  );
};
