import React from 'react';

const TongyongGuanbiXian: React.FC<any> = (props: any) => {
  const attribute = { ...props };
  const stroke = attribute.stroke || '#3F465C';
  delete attribute.stroke;
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 4L12 12M12 4L4 12" stroke={stroke} stroke-linecap="round" />
    </svg>
  );
};

export default TongyongGuanbiXian;
