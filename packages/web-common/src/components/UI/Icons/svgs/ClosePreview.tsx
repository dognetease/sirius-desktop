import React, { useState, useEffect } from 'react';

const CloseIcon: React.FC<any> = (props: any) => {
  const attribute = { ...props };
  delete attribute.stroke;
  return (
    <svg style={props.style} width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" {...attribute}>
      <path d="M3 13L8 8M8 8L3 3M8 8L13 13M8 8L13 3" stroke="#262A33" style={props.strokeStyle} strokeLinejoin="round" />
    </svg>
  );
};

export default CloseIcon;
