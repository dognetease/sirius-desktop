import React, { useState, useEffect } from 'react';

const SaveIcon: React.FC<any> = (props: any) => {
  const attribute = { ...props };
  delete attribute.stroke;
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" {...attribute}>
      <path d="M16 0H0V16H16V0Z" fill="white" fillOpacity="0.01" />
      <path
        d="M13.1 2H2.9C2.40295 2 2 2.40294 2 2.9V13.1C2 13.5971 2.40295 14 2.9 14H13.1C13.5971 14 14 13.5971 14 13.1V2.9C14 2.40294 13.5971 2 13.1 2Z"
        stroke="#3C3F47"
        strokeLinejoin="round"
      />
      <path d="M11.0008 2V7.39999H5.30078V2H11.0008Z" stroke="#3C3F47" strokeLinejoin="round" />
      <path d="M8.90039 4.1001V5.3001" stroke="#3C3F47" strokeLinecap="round" />
      <path d="M4.39844 2H11.8989" stroke="#3C3F47" strokeLinecap="round" />
    </svg>
  );
};

export default SaveIcon;
