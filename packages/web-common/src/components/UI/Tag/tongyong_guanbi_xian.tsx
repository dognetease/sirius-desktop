import React from 'react';

const TongyongGuanbiXian: React.FC<any> = (props: any) => {
  const attribute = { ...props };
  const stroke = attribute.stroke || '#3F465C';
  delete attribute.stroke;
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 3L9 9M9 3L3 9" stroke={stroke} stroke-width="0.75" stroke-linecap="round" />
    </svg>
  );
};

export default TongyongGuanbiXian;
