import React, { useState } from 'react';
import classnames from 'classnames';
import { Tooltip } from 'antd';
import styles from './locationinput.module.scss';
import { CloseCircleIcon } from '@web-common/components/UI/Icons/icons';
import { getIn18Text } from 'api';
export interface LocationInputProps extends React.HTMLAttributes<HTMLSpanElement> {
  value?: string;
  // onChange?(value: string): void;
  onCancel?(): void;
  onUpdate?(): void;
  disabled?: boolean;
}
const LocationInput: React.FC<LocationInputProps> = ({
  value,
  // onChange,
  onCancel,
  onUpdate,
  style,
  className,
  disabled,
  ...rest
}) => {
  const [closeHover, setCloseHover] = useState<boolean>(false);
  return (
    <span
      className={classnames('ant-input-affix-wrapper', className, {
        'ant-input-affix-wrapper-disabled': disabled,
      })}
      style={{ maxWidth: 406, ...style }}
      {...rest}
    >
      <span
        className={classnames('ant-input', styles.input, {
          'ant-input-disabled': disabled,
        })}
      >
        <Tooltip title={getIn18Text('XIUGAIHUIYISHI')} visible={disabled ? false : undefined}>
          <span
            className={classnames('sirius-ellipsis-text', styles.inputValue, {
              [styles.inputValueDisabled]: disabled,
            })}
            style={{ width: '100%', cursor: disabled ? 'not-allowed' : 'pointer' }}
            onClick={() => !disabled && onUpdate && onUpdate()}
          >
            {value}
          </span>
        </Tooltip>
      </span>
      <span className="ant-input-suffix">
        <Tooltip title={getIn18Text('QUXIAOHUIYISHI')} visible={disabled ? false : undefined}>
          <CloseCircleIcon
            disabled={disabled}
            onMouseEnter={() => setCloseHover(!0)}
            onMouseLeave={() => setCloseHover(false)}
            enhance={closeHover}
            className={styles.close}
            onClick={disabled ? undefined : onCancel}
          />
        </Tooltip>
      </span>
    </span>
  );
};
export default LocationInput;
