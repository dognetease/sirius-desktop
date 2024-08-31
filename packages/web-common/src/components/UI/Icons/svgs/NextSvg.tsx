import React, { useState, useEffect } from 'react';

const NextIcon: React.FC<any> = (props: any) => {
  const attribute = { ...props };
  const stroke = attribute.stroke || '#3C3F47';
  delete attribute.stroke;
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" {...attribute}>
      <path d="M9 13L14 8L9 3" stroke={stroke} strokeLinejoin="round" />
      <path d="M14 8H2" stroke={stroke} />
    </svg>
  );
};

export default NextIcon;
