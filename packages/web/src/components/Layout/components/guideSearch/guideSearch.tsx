import React from 'react';
// import Button from '@web-common/components/UI/Button';
import Button from '@lingxi-common-component/sirius-ui/Button';
import { ConfigProvider } from 'antd';
import { ReactComponent as AlertClose } from '@/images/icons/edm/alert-close.svg';
import styles from '../translate/translate.module.scss';

interface Props {
  style?: React.CSSProperties | undefined;
  content: React.ReactNode;
  onClose: () => void;
  onGuideSearch: () => void;
  icon?: React.ReactNode;
  btnText?: string;
}
const GuideSearch = ({ style, onClose, onGuideSearch, content, icon, btnText }: Props) => (
  <div className={styles.translateWrap} style={style}>
    {icon && <span style={{ width: 20, display: 'flex', alignItems: 'center' }}> {icon}</span>}
    <span style={{ color: '#545A6E' }}>{content}</span>
    <ConfigProvider autoInsertSpaceInButton={false}>
      <Button onClick={() => onGuideSearch()} btnType="primary" size="mini">
        {btnText}
      </Button>
    </ConfigProvider>
    <span style={{ width: 10, display: 'flex', alignItems: 'center' }}>
      <AlertClose onClick={onClose} />
    </span>
  </div>
);
export default GuideSearch;
