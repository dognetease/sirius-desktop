import React from 'react';

const Shrink: React.FC<any> = (props: any) => {
  const attribute = { ...props };
  const stroke = attribute.stroke || '#3C3F47';
  delete attribute.stroke;
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" {...attribute} xmlns="http://www.w3.org/2000/svg">
      <path
        d="M2.25 11.9999C2.25 6.6152 6.6152 2.25 11.9999 2.25V2.25C17.3847 2.25 21.7499 6.6152 21.7499 11.9999V11.9999C21.7499 17.3847 17.3847 21.7499 11.9999 21.7499V21.7499C6.6152 21.7499 2.25 17.3847 2.25 11.9999V11.9999Z"
        stroke={stroke}
        strokeWidth="1.8"
      />
      <path d="M7.73438 12H16.2656" stroke={stroke} strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
};

export default Shrink;
