import React from 'react';
import styles from './rcmdcompanytable.module.scss';
import { showVideoGuide } from '../../../../globalSearch/component/SearchGuide/SearchGuide';
import { smartCmdUrl } from '../../../../globalSearch/constants';
import { getIn18Text } from 'api';
import { ConfigActions } from '@web-common/state/reducer';
import { useAppDispatch } from '@web-common/state/createStore';

export interface Props {}

const RcmdEmpty: React.FC = () => {
  const dispatch = useAppDispatch();
  const onPlayVideo = (params: { videoId: string; source: string; scene: string }) => {
    const { videoId, source, scene } = params;
    dispatch(ConfigActions.showVideoDrawer({ videoId: videoId, source, scene }));
  };
  return (
    <div className={styles.empty}>
      <div className={styles.emptyImg}></div>
      <p className={styles.emptyText}>{getIn18Text('XITONGZHENGZAIWEININZAIQUANWANGFANWEINEISOUSUOQIANZAIKEHU')}</p>
      <p className={styles.emptyText}>{getIn18Text('QINGGUANZHUYOUJIANTIXING')}</p>
      <div className={styles.emptyTipsBtn} onClick={() => onPlayVideo({ videoId: 'V8', source: 'kehufaxian', scene: 'kehufaxian_7' })}></div>
    </div>
  );
};

export default RcmdEmpty;
