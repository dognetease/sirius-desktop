import React from 'react';
import { actions as mailActions } from '@web-common/state/reducer/mailReducer';
import { ReactComponent as EdmInfoBlueFill } from '@/images/icons/edm/info-blue-fill.svg';
import { useAppDispatch, useAppSelector } from '@web-common/state/createStore';
import { getIn18Text } from 'api';
import styles from './attUploading.module.scss';

interface AttUploadingProps {}

const AttUploading = React.forwardRef((props: AttUploadingProps) => {
  const currentMailId = useAppSelector(state => state.mailReducer.currentMail.cid);
  const dispatch = useAppDispatch();
  // 取消发送
  const cancelSend = () => {
    currentMailId && dispatch(mailActions.doRemWaittingMailId(currentMailId));
  };

  return (
    <div className={styles.attUploading}>
      <EdmInfoBlueFill />
      <span className={styles.uploadingText}>{getIn18Text('ZHENGZAISHANGCHUANFUJ，SCWCHJZDFS')}</span>
      <span className={styles.cancelSend} onClick={cancelSend}>
        {getIn18Text('QUXIAOFASONG')}
      </span>
    </div>
  );
});

export default AttUploading;
