import React from 'react';
import { message } from 'antd';
import CopyToClipboard from 'react-copy-to-clipboard';
import styles from './style.module.scss';
import { getTransText } from '@/components/util/translate';

function CopyBox(props: { text?: string }) {
  const { text } = props;

  return (
    <div className={styles.copy}>
      <div className={styles.text}>{text}</div>

      <CopyToClipboard text={text || ''} onCopy={() => text && message.success(getTransText('FUZHICHENGGONG'))}>
        <div className={styles.btn}>{getTransText('FUZHI')}</div>
      </CopyToClipboard>
    </div>
  );
}

export default CopyBox;
