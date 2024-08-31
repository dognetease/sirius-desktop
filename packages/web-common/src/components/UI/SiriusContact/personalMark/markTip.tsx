import React from 'react';
import { Popover } from 'antd';
import styles from './markTip.module.scss';
import IconCard from '@web-common/components/UI/IconCard';
import SiriusCheckbox from '../Checkbox';
import { getIn18Text } from 'api';

interface PersonaMarkCheckboxProps {
  testId?: string;
  value?: boolean;
  onChange?(value: boolean): void;
  style?: React.CSSProperties;
}

export const PersonaMarkCheckbox: React.FC<PersonaMarkCheckboxProps> = props => {
  const { value: checked, onChange, style, testId } = props;
  const tipContent = (
    <div className={styles.personalMarkTipContent}>
      <div className={styles.image}></div>
      <div className={styles.txt}>{getIn18Text('markTipContent')}</div>
    </div>
  );
  return (
    <div className={styles.personaMarkCheckboxWrap} style={style}>
      <div
        className={styles.personalMarkCheckbox}
        data-test-id={testId}
        data-test-check={checked}
        onClick={() => {
          onChange && onChange(!checked);
        }}
      >
        <SiriusCheckbox checked={checked} />
      </div>
      <div className={styles.personalMarkTip}>{getIn18Text('markTip')}</div>
      <Popover overlayClassName={styles.personalMarkTipContentWrap} content={tipContent} placement="bottom" arrowPointAtCenter>
        <IconCard className={`dark-invert ${styles.personalMarkedTipIcon}`} style={{ width: 16, height: 16, marginLeft: 4 }} type="tongyong_cuowutishi_xian" />
      </Popover>
    </div>
  );
};
