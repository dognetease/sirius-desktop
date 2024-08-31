import React from 'react';
import './index.scss';

interface SiriusRadioProps {
  checked?: boolean;
  disabled?: boolean;
}

const SiriusRadio: React.FC<SiriusRadioProps> = ({ disabled = false, checked = false, children }) => {
  const isChecked = checked ? 'checked' : 'normal';
  const checkClassName = disabled ? 'disabled' : isChecked;
  return (
    <div className="sirius-radio-wrap">
      <div className={`sirius-radio ${checkClassName}`} />
      {children && <div className="sirius-radio-name">{children}</div>}
    </div>
  );
};
export default SiriusRadio;
