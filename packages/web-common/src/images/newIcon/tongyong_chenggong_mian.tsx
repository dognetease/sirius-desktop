import React from 'react';

const TongyongChenggongMian: React.FC<any> = (props: any) => {
  const attribute = { ...props };
  const fill = attribute.fill || '#3F465C';
  delete attribute.fill;
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" {...attribute}>
      <circle cx="8" cy="8" r="7" fill={fill} />
      <path d="M5.29999 8L7.42131 10.1213C7.42131 10.1213 9.74021 7.80242 11.3104 6.23223" stroke="white" stroke-linecap="round" stroke-linejoin="round" />
    </svg>
  );
};

export default TongyongChenggongMian;
