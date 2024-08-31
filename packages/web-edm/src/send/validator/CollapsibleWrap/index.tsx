import React, { FC, useState } from 'react';
import { ReactComponent as TongyongJiantouXia } from '@web-common/images/newIcon/tongyong_jiantou_xia.svg';
import { ReactComponent as TongyongJiantouShang } from '@web-common/images/newIcon/tongyong_jiantou_shang1.svg';
import commonStyles from '../validator.module.scss';
import styles from './CollapsibleWrap.module.scss';

export const CollapsibleWrap: FC<{
  UI?: Array<JSX.Element>;
}> = ({ UI }) => {
  const [show, setShow] = useState(false);

  if (UI == null) {
    return null;
  }

  let showUI = show ? UI : UI.slice(0, 3);
  return (
    <>
      {showUI}
      {UI.length > 3 && (
        <div className={styles.wrap} onClick={() => setShow(!show)}>
          {show ? (
            <>
              收起
              <TongyongJiantouShang className={styles.icon + ' ' + commonStyles.openIcon} />
            </>
          ) : (
            <>
              查看全部
              <TongyongJiantouXia className={styles.icon + ' ' + commonStyles.openIcon} />
            </>
          )}
        </div>
      )}
    </>
  );
};
