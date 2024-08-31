import React from 'react';

const CirclePlus: React.FC<any> = (props: any) => {
  const strokeColor = props.stroke || '#7D8085';
  const attribute = { ...props };
  delete attribute.stroke;
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" {...attribute}>
      <path
        d="M1.5 7.99996C1.5 4.41013 4.41013 1.5 7.99996 1.5V1.5C11.5898 1.5 14.4999 4.41013 14.4999 7.99996V7.99996C14.4999 11.5898 11.5898 14.4999 7.99996 14.4999V14.4999C4.41013 14.4999 1.5 11.5898 1.5 7.99996V7.99996Z"
        stroke={strokeColor}
        stroke-width="1.2"
      />
      <path d="M8 5.15625L8 10.8437" stroke={strokeColor} stroke-width="1.2" stroke-linejoin="round" />
      <path d="M5.15625 8H10.8437" stroke={strokeColor} stroke-width="1.2" stroke-linejoin="round" />
    </svg>
  );
};

export default CirclePlus;
