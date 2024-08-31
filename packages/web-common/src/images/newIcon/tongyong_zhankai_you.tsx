import React from 'react';

const TongyongZhankaiYou: React.FC<any> = (props: any) => {
  const attribute = { ...props };
  const stroke = attribute.stroke || '#3F465C';
  delete attribute.stroke;
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M6.5754 4.20748C6.25106 3.92948 5.75 4.15993 5.75 4.58711L5.75 11.4129C5.75 11.8401 6.25106 12.0705 6.5754 11.7925L10.5571 8.37963C10.7899 8.18008 10.7899 7.81992 10.5571 7.62037L6.5754 4.20748Z"
        fill={stroke}
      />
    </svg>
  );
};

export default TongyongZhankaiYou;
