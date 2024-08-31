import React from 'react';

export interface Props {
  className?: string;
  stroke?: string;
}
const TabMemuClose: React.FC<Props> = (props: Props) => {
  const attribute = { ...props };
  delete attribute.stroke;
  const strokeColor = props.stroke || '#7D8085';
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" {...attribute}>
      <path d="M4 4L8 8M8 8L4 12M8 8L12 4M8 8L12 12" stroke={strokeColor} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

export default TabMemuClose;
