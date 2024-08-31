import React from 'react';

const RotateLeft: React.FC<any> = (props: any) => {
  const attribute = { ...props };
  const stroke = attribute.stroke || '#3C3F47';
  delete attribute.stroke;
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...attribute}>
      <mask id="path-1-inside-1" fill="white">
        <rect x="1.5" y="10.5" width="15" height="12" rx="1.5" />
      </mask>
      <rect x="1.5" y="10.5" width="15" height="12" rx="1.5" stroke={stroke} strokeWidth="3.6" mask="url(#path-1-inside-1)" />
      <path d="M10.5 1.5L7.5 4.5L10.5 7.5" stroke={stroke} strokeWidth="1.8" />
      <path d="M7.5 4.50005C18 3 21 7.50005 21 16.5001" stroke={stroke} strokeWidth="1.8" />
    </svg>
  );
};

export default RotateLeft;
