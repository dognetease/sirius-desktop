import React from 'react';

export interface Props {
  className?: string;
  stroke?: string;
}
const ArrowDown: React.FC<Props> = (props: Props) => {
  const attribute = { ...props };
  delete attribute.stroke;
  const strokeColor = props.stroke || '#386EE7';
  return (
    <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg" {...attribute}>
      <path d="M1.34766 1.24219L5.34766 5.24219L9.34766 1.24219" stroke={strokeColor} strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  );
};

export default ArrowDown;
