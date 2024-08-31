import React from 'react';

const InfoTips: React.FC<any> = (props: any) => {
  const attribute = { ...props };
  const strokeColor = props.stroke || '#262A33';
  delete attribute.stroke;
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" {...attribute}>
      <circle cx="8" cy="8" r="5.5" stroke={strokeColor} stroke-opacity="0.5" />
      <path d="M8 5V9" stroke={strokeColor} stroke-opacity="0.5" />
      <path d="M8 10L8 11" stroke={strokeColor} stroke-opacity="0.5" />
    </svg>
  );
};

export default InfoTips;
