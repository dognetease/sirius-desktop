import classnames from 'classnames';
import React from 'react';
import styles from './syncloading.module.scss';

const SyncLoading: React.FC<{
  sync?(): Promise<any>;
}> = ({ sync }) => {
  const [syncing, setSyncing] = React.useState<boolean>(false);
  const handleSync = async () => {
    if (syncing) {
      return;
    }
    setSyncing(!0);
    if (sync) {
      await sync();
    }
    setSyncing(false);
  };
  return (
    <i
      onClick={handleSync}
      className={classnames(`${styles.syncIcon} syncLoading-syncIcon`, {
        'sirius-spin': syncing,
      })}
    />
  );
};

export default SyncLoading;
