import React, { useMemo } from 'react';
import styles from './modal.module.scss';
import IconCard from '@web-common/components/UI/IconCard';
import classnames from 'classnames';
import { getIn18Text } from 'api';

interface Props {
  hidden?: boolean;
  onClose?(success?: boolean): void;
  status?: 'success' | 'error' | 'progress';
  message?: string;
  type: 'import' | 'export';
}

export const ImportStatus = ({ hidden, status = 'progress', onClose, type, message }: Props) => {
  const txt = useMemo(() => {
    let str = '';
    if (status === 'progress') {
      str = type === 'import' ? getIn18Text('importingContact') : getIn18Text('exportingContact');
    } else if (status === 'success') {
      str = type === 'import' ? getIn18Text('DAORUCHENGGONG') : getIn18Text('YOUJIANDAOCHUCHENG');
    } else if (status === 'error') {
      str = type === 'import' ? getIn18Text('importFail') : getIn18Text('exportFail');
    }
    return str;
  }, [status, type]);

  const refresh = type === 'import' && status === 'success';

  const visibleClose = !(type === 'import' && status === 'progress');

  return (
    <div className={styles.importStatusWrap} hidden={hidden}>
      <div className={styles.titleWrap}>
        <div className={styles.titleLine}>
          <div className={styles.title}>{type === 'import' ? getIn18Text('importContacts') : getIn18Text('exportContact')}</div>
          {visibleClose && (
            <IconCard
              onClick={() => {
                onClose && onClose(refresh);
              }}
              className={styles.close}
              width={20}
              height={20}
              type="tongyong_guanbi_xian"
            />
          )}
        </div>
      </div>
      <div className={styles.content}>
        <div className={classnames(styles.statusIcon, styles[status])} />
        <div className={styles.txt}>{txt}</div>
        {message ? <div className={styles.txt2}>{message}</div> : null}
      </div>
      <div className={styles.statusFooterWrap}>
        <div
          className={classnames(styles.importStatusBtn, status === 'progress' && styles.disabled)}
          onClick={() => {
            status !== 'progress' && onClose && onClose(refresh);
          }}
        >
          {getIn18Text('QUEDING')}
        </div>
      </div>
    </div>
  );
};
