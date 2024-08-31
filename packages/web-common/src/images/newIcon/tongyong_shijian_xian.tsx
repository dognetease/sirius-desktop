import React from 'react';

const TongyongShijianXian: React.FC<any> = (props: any) => {
  const attribute = { ...props };
  const stroke = attribute.stroke || '#3F465C';
  delete attribute.stroke;
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" {...attribute}>
      <path
        d="M1.5 8C1.5 4.41015 4.41015 1.5 8 1.5V1.5C11.5899 1.5 14.5 4.41015 14.5 8V8C14.5 11.5899 11.5899 14.5 8 14.5V14.5C4.41015 14.5 1.5 11.5899 1.5 8V8Z"
        stroke={stroke}
      />
      <path d="M7.5 4.5V8.5H10.5" stroke={stroke} stroke-linecap="round" stroke-linejoin="round" />
    </svg>
  );
};

export default TongyongShijianXian;
