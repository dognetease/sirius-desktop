import React from 'react';

export interface Props {
  className?: string;
  stroke?: string;
  opcacity?: number;
}

const ArrowRight: React.FC<Props> = (props: Props) => {
  const strokeColor = props.stroke || '#262A33';
  const strokeOpacity = props.opcacity || 0.5;
  const attribute = { ...props };
  delete attribute.stroke;
  delete attribute.opcacity;
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" {...attribute}>
      <path d="M5.5 3L10.5 8L5.5 13" stroke={strokeColor} strokeOpacity={strokeOpacity} strokeLinejoin="round" />
    </svg>
  );
};

export default ArrowRight;
