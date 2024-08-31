import { getTransText } from '@/components/util/translate';
import { Tooltip } from 'antd';
import React, { CSSProperties } from 'react';
import styles from './TopButton.module.scss';

const NormalIcon = () => {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g clip-path="url(#clip0_2938_126371)">
        <path d="M4 2.5H12" stroke="#3F465C" stroke-linecap="round" />
        <path d="M5.75 3V7.5L3.75 10H12.25L10.25 7.5V3" stroke="#3F465C" stroke-linejoin="round" />
        <path d="M8 10V14.5" stroke="#3F465C" stroke-linecap="round" />
      </g>
      <defs>
        <clipPath id="clip0_2938_126371">
          <rect width="16" height="16" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
};

const HighlightIcon = () => {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g clip-path="url(#clip0_2940_126428)">
        <path d="M4 2.5H12" stroke="#FFB54C" stroke-linecap="round" />
        <path d="M8 10V14.5" stroke="#FFB54C" stroke-linecap="round" />
        <path d="M5.75 7.4998V2.50777H10.25V7.4998L12.25 9.9998H3.75L5.75 7.4998Z" fill="#FFB54C" stroke="#FFB54C" stroke-linejoin="round" />
      </g>
      <defs>
        <clipPath id="clip0_2940_126428">
          <rect width="16" height="16" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
};

export interface TopButtonProps {
  active: boolean;
  clickData?: unknown;
  className?: string;
  handleClick?: (clickData?: any) => void;
  containerStyles?: CSSProperties;
}

const TopButton: React.FC<TopButtonProps> = props => {
  const { containerStyles = {}, className = '' } = props;

  const handleButtonClick = () => {
    props.handleClick && props.handleClick(props.clickData);
  };

  return (
    <Tooltip overlayClassName={styles.topButtonTooltip} placement="topLeft" title={props.active ? getTransText('QUXIAOZHIDING') : getTransText('ZHIDING')}>
      <div className={`${styles.topButton} ${className}`} style={{ ...containerStyles }} onClick={handleButtonClick}>
        {props.active ? <HighlightIcon /> : <NormalIcon />}
      </div>
    </Tooltip>
  );
};

export default TopButton;
