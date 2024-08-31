import { getIn18Text } from 'api';
import React, { FC, PropsWithChildren, useState } from 'react';
import { ReactComponent as PauseIcon } from '@/images/icons/edm/yingxiao/pause-icon.svg';
import { ReactComponent as RunIcon } from '@/images/icons/edm/yingxiao/run-icon.svg';

import styles from './SwitchButton.module.scss';

export const SwitchButton: FC<{
  checked: boolean;
  onChange: (value: boolean) => void;
}> = ({ checked, onChange }) => {
  const [open, setOpen] = useState(checked);

  return (
    <div className={checked ? styles.wrap : styles.wrap2} onClick={() => onChange(!checked)}>
      {checked ? (
        <div className={styles.button}>
          <div className={styles.content}>
            <RunIcon className={styles.icon} />
            {getIn18Text('YUNXINGZHONG')}
          </div>
        </div>
      ) : (
        <>
          <PauseIcon className={styles.icon} />
          {getIn18Text('YITINGZHI')}
        </>
      )}
    </div>
  );
};
