import React from 'react';

const UploadErrorIcon: React.FC<any> = (props: any) => {
  const attribute = { ...props };
  delete attribute.stroke;
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" {...attribute}>
      <path
        d="M8 15.4C12.0869 15.4 15.4 12.0869 15.4 8C15.4 3.91309 12.0869 0.6 8 0.6C3.91309 0.6 0.6 3.91309 0.6 8C0.6 12.0869 3.91309 15.4 8 15.4Z"
        fill="#F74F4F"
        stroke="white"
        strokeWidth="0.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path fillRule="evenodd" clipRule="evenodd" d="M5.11303 10.0622L10.0627 5.11254L10.8877 5.9375L5.93799 10.8872L5.11303 10.0622Z" fill="white" />
      <path fillRule="evenodd" clipRule="evenodd" d="M10.8879 10.0622L5.93824 5.11254L5.11328 5.9375L10.063 10.8872L10.8879 10.0622Z" fill="white" />
    </svg>
  );
};

export default UploadErrorIcon;
