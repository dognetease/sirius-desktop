import React, { FC, useState, useEffect } from 'react';
import classnames from 'classnames';

import styles from './EdmTabs.module.scss';

export const EdmTabs: FC<{
  activeKey: string;
  onChange: (activeKey: string) => void;
  tabConf: Array<{
    title: string;
    key: string;
  }>;
}> = ({ activeKey, onChange, tabConf }) => {
  const [curKey, setCurKey] = useState(activeKey);

  useEffect(() => {
    setCurKey(activeKey);
  }, [activeKey]);

  return (
    <div className={styles.wrap}>
      {tabConf.map(conf => (
        <div key={conf.key} onClick={() => onChange(conf.key)} className={classnames(styles.item, curKey === conf.key ? styles.active : '')}>
          {conf.title}
        </div>
      ))}
    </div>
  );
};
