import React from 'react';

export interface Props {
  className?: string;
  stroke?: string;
  opcacity?: number;
}

const ArrowRight: React.FC<Props> = (props: Props) => {
  const strokeColor = props.stroke || '#3C3F47';
  const strokeOpacity = props.opcacity || 1;
  const attribute = { ...props };
  delete attribute.stroke;
  delete attribute.opcacity;
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" {...attribute}>
      <path d="M10.5 13L5.5 8L10.5 3" stroke={strokeColor} strokeOpacity={strokeOpacity} stroke-linejoin="round" />
    </svg>
  );
};

export default ArrowRight;
