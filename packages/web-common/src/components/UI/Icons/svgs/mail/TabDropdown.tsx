import React from 'react';

export interface Props {
  className?: string;
  stroke?: string;
}
const TabDropdown: React.FC<Props> = (props: Props) => {
  const attribute = { ...props };
  delete attribute.stroke;
  const strokeColor = props.stroke || 'white';
  return (
    <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg" {...attribute}>
      <path d="M9 1L5 5L1 1" stroke={strokeColor} strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  );
};

export default TabDropdown;
