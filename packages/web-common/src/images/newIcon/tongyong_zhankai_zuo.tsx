import React from 'react';

const TongyongZhankaiZuo: React.FC<any> = (props: any) => {
  const attribute = { ...props };
  const stroke = attribute.stroke || '#3F465C';
  delete attribute.stroke;
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M9.4246 4.20748C9.74894 3.92948 10.25 4.15993 10.25 4.58711L10.25 11.4129C10.25 11.8401 9.74894 12.0705 9.4246 11.7925L5.4429 8.37963C5.21009 8.18008 5.21009 7.81992 5.4429 7.62037L9.4246 4.20748Z"
        fill={stroke}
      />
    </svg>
  );
};

export default TongyongZhankaiZuo;
