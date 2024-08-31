import React from 'react';
import { message } from 'antd';
import CopyToClipboard from 'react-copy-to-clipboard';
import styles from './style.module.scss';
import { getIn18Text } from 'api';

function CopyBox(props: { text?: string }) {
  const { text } = props;

  return (
    <div className={styles.copy}>
      <div className={styles.text}>{text}</div>

      <CopyToClipboard text={text || ''} onCopy={() => text && message.success(getIn18Text('FUZHICHENGGONG'))}>
        <div className={styles.btn}>{getIn18Text('FUZHI')}</div>
      </CopyToClipboard>
    </div>
  );
}

export default CopyBox;
