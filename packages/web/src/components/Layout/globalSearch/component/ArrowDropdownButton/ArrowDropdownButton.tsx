import React, { FC, ReactElement, CSSProperties, useCallback, MouseEvent, useRef } from 'react';
import classnames from 'classnames';
import Dropdown from '@web-common/components/UI/Dropdown';
import DownTriangle from '@web-common/components/UI/Icons/svgs/disk/DownTriangle';
import styles from './index.module.scss';

type ArrowDropdownButtonType = 'primary' | 'link' | 'default';
const ArrowDropdownButton: FC<{
  style?: CSSProperties;
  overlay: ReactElement;
  buttonName: string;
  onClick: (e: MouseEvent) => void;
  disabled?: boolean;
  btnType?: ArrowDropdownButtonType;
}> = ({ overlay, buttonName, style, onClick, disabled, btnType = 'primary' }) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const onWrapperClick = useCallback((e: MouseEvent) => {
    e.stopPropagation();
  }, []);
  return (
    <div
      onClick={onWrapperClick}
      className={classnames(styles.wrapper, {
        [styles.link]: btnType === 'link',
        [styles.default]: btnType === 'default',
      })}
      ref={wrapperRef}
      style={style}
    >
      <Dropdown.Button
        disabled={disabled}
        onClick={onClick}
        trigger={['click']}
        type="primary"
        icon={
          <span
            className={classnames(styles.downTriangle, {
              [styles.white]: btnType === 'primary',
              [styles.brand]: btnType === 'default',
            })}
          >
            <DownTriangle />
          </span>
        }
        overlay={overlay}
        getPopupContainer={trriger => wrapperRef.current || trriger}
      >
        {buttonName}
      </Dropdown.Button>
    </div>
  );
};

export default ArrowDropdownButton;
