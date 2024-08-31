import React from 'react';
import './index.scss';

interface SiriusCheckboxProps {
  checked?: boolean;
  disabled?: boolean;
}

const SiriusCheckbox: React.FC<SiriusCheckboxProps> = ({ disabled = false, checked = false }) => {
  const checkedClass = checked ? 'checked' : '';
  const checkClassName = disabled ? 'disabled' : checkedClass;
  return <div className={`sirius-checkbox ${checkClassName}`} />;
};
export default SiriusCheckbox;
