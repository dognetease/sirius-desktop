import React, { useState, useEffect } from 'react';

const DoDownloadIcon: React.FC<any> = (props: any) => {
  const attribute = { ...props };
  delete attribute.stroke;
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" {...attribute}>
      <path d="M2 10V13C2 13.5523 2.44772 14 3 14H13C13.5523 14 14 13.5523 14 13V10" stroke="#3C3F47" />
      <path d="M7.99935 1.99996L7.99939 11M7.99939 11L12.166 6.99996M7.99939 11L3.83268 6.99996" stroke="#3C3F47" />
    </svg>
  );
};

export default DoDownloadIcon;
