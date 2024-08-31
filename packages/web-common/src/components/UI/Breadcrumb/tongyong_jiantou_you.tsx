import React from 'react';

const TongyongJianTouYou: React.FC<any> = (props: any) => {
  const attribute = { ...props };
  const fill = attribute.fill || '#3F465C';
  delete attribute.fill;
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M6 4L10 8L6 12" stroke={fill} stroke-linecap="round" stroke-linejoin="round" />
    </svg>
  );
};

export default TongyongJianTouYou;
