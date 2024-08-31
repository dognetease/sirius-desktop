import classNames from 'classnames';
import React from 'react';
import { globalSearchDataTracker } from '../../tracker';
import styles from './rcmdrow.module.scss';
import { getIn18Text } from 'api';
interface RcmdRowProps extends React.HTMLAttributes<HTMLDivElement> {
  onChoseRcmd: (param: string) => void;
  visible: boolean;
  rcmdList?: string[];
  from?: 'global_search' | 'customs';
}

const RcmdRow: React.FC<RcmdRowProps> = ({ onChoseRcmd, visible, rcmdList, className, from = 'global_search', ...rest }) => {
  if (!visible) {
    return null;
  }
  return (
    <div className={classNames(styles.container, className)} {...rest}>
      <span className={styles.tip}>{getIn18Text('NINSHIBUSHIXIANGZHAO')}：</span>
      <div className={styles.list}>
        {rcmdList?.map(rcmd => (
          <div
            key={rcmd}
            onClick={() => {
              onChoseRcmd(rcmd);
            }}
            className={styles.item}
          >
            {rcmd}
          </div>
        ))}
      </div>
    </div>
  );
};

export default RcmdRow;
