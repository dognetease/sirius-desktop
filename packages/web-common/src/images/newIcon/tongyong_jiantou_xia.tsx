import React from 'react';

const TongyongJiantouXia: React.FC<any> = (props: any) => {
  const attribute = { ...props };
  const stroke = attribute.stroke || '#3F465C';
  delete attribute.stroke;
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 6L8 10L12 6" stroke={stroke} stroke-linecap="round" stroke-linejoin="round" />
    </svg>
  );
};

export default TongyongJiantouXia;
