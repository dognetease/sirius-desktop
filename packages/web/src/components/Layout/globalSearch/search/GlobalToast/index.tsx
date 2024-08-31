import React from 'react';
import styles from './index.module.scss';
import { IToastItem } from '../search';
import SuccessIcon from '../../assets/success.svg';
import CloseIcon from '../../assets/close.svg';
import { getIn18Text } from 'api';
type TCallBack = (id: string) => void;
export function GlobalToast(props: { onRead: TCallBack; onCloseTip: TCallBack; toastList: IToastItem[] }) {
  const { onRead, onCloseTip, toastList } = props;
  return (
    <div className={styles.toast}>
      {toastList.map(each => (
        <span className={styles.toastEach} key={each.id}>
          <img src={SuccessIcon} alt="success-icon" width="18px" />
          <span className={styles.toastEachText}>
            {getIn18Text('YIWEININWAJUEDAO')}
            {each.newContactNum}
            {getIn18Text('GELIANXIREN')}
          </span>
          <span className={styles.toastEachRead} onClick={() => onRead(each.id)}>
            {getIn18Text('LIJICHAKAN')}
          </span>
          <img src={CloseIcon} alt="close-icon" width="16px" onClick={() => onCloseTip(each.id)} className={styles.toastEachClose} />
        </span>
      ))}
    </div>
  );
}
