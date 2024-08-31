import React from 'react';
import './index.scss';

interface SiriusCheckboxProps {
  checked?: boolean;
  disabled?: boolean;
  styles?: React.CSSProperties;
}

const SiriusCheckbox: React.FC<SiriusCheckboxProps> = ({ disabled = false, checked = false, styles }) => {
  const checkedClass = checked ? 'checked' : '';
  const checkClassName = disabled ? 'disabled' : checkedClass;
  return <div className={`sirius-checkbox ${checkClassName}`} style={styles} />;
};
export default SiriusCheckbox;
