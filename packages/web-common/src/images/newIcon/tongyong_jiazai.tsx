import React from 'react';

const TongyongJiazai: React.FC<any> = (props: any) => {
  const attribute = { ...props };
  const stroke = attribute.stroke || '#4C6AFF';
  delete attribute.stroke;
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" {...attribute}>
      <path
        opacity="0.27"
        d="M13.9256 7.99985C13.9256 4.72706 11.2725 2.07393 7.99971 2.07393C4.72691 2.07393 2.07378 4.72706 2.07378 7.99986C2.07378 11.2727 4.72691 13.9258 7.99971 13.9258C11.2725 13.9258 13.9256 11.2727 13.9256 7.99985Z"
        stroke={stroke}
        stroke-width="2"
      />
      <path
        d="M2.07422 8.00073C2.07422 4.72793 4.72735 2.07481 8.00014 2.07481C9.99533 2.07481 11.7602 3.06083 12.8341 4.57216"
        stroke={stroke}
        stroke-width="2"
        stroke-linecap="round"
      />
    </svg>
  );
};

export default TongyongJiazai;
