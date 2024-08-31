import React from 'react';
import { Button, ConfigProvider } from 'antd';
import { getIn18Text } from 'api';
import { ReactComponent as TranslateIcon } from '@/images/icons/customs/translate.svg';
import { ReactComponent as AlertClose } from '@/images/icons/edm/alert-close.svg';
import styles from './translate.module.scss';

interface Props {
  style?: React.CSSProperties | undefined;
  content: React.ReactNode;
  onClose: () => void;
  onTranslate: () => void;
}
const Translate = ({ style, onClose, onTranslate, content }: Props) => (
  <div className={styles.translateWrap} style={style}>
    <span style={{ width: 20, display: 'flex', alignItems: 'center' }}>
      {' '}
      <TranslateIcon />
    </span>
    <span>{content}</span>
    <ConfigProvider autoInsertSpaceInButton={false}>
      <Button onClick={() => onTranslate()} type="primary" size="small">
        {getIn18Text('FANYI')}
      </Button>
    </ConfigProvider>
    <span style={{ width: 10, display: 'flex', alignItems: 'center' }}>
      <AlertClose onClick={onClose} />
    </span>
  </div>
);
export default Translate;
