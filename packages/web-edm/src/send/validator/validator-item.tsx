import React, { FC, useState, useEffect } from 'react';
import { ReactComponent as TongyongJiantouXia } from '@web-common/images/newIcon/tongyong_jiantou_xia.svg';
import { ReactComponent as TongyongJiantouShang } from '@web-common/images/newIcon/tongyong_jiantou_shang1.svg';

import styles from './ValidatorItem.module.scss';
import commonStyles from './validator.module.scss';

export const ValidatorItem: FC<{
  checkResult?: () => JSX.Element;
  needOpen?: boolean;
  renderFailedInfo?: string | number;
  checkTitle: string;
  onOpen: () => void;
  defaultOpen: boolean;
}> = ({ checkResult, needOpen = false, renderFailedInfo, checkTitle, onOpen, defaultOpen }) => {
  const [open, setOpen] = useState(false);

  const renderOpenIcon = () => {
    if (!needOpen) {
      return <div className={styles.rightBtn}></div>;
    }

    return (
      <div className={styles.rightBtn}>
        {open ? <TongyongJiantouShang className={commonStyles.openIcon} /> : <TongyongJiantouXia className={commonStyles.openIcon} />}
      </div>
    );
  };

  useEffect(() => {
    if (!defaultOpen) {
      setOpen(false);
    }
  }, [defaultOpen]);

  useEffect(() => {
    if (open) {
      onOpen();
    }
  }, [open]);

  return (
    <div className={styles.wrap}>
      <div
        className={styles.header}
        onClick={() => {
          if (needOpen) {
            setOpen(!open);
          }
        }}
      >
        <div className={styles.leftInfo}>{checkTitle}</div>
        <div className={styles.right}>
          {renderFailedInfo != null && <div className={styles.rightNumber}>{renderFailedInfo}</div>}
          {renderOpenIcon()}
        </div>
      </div>
      {open && <div className={styles.bottom}>{checkResult && checkResult()}</div>}
    </div>
  );
};
