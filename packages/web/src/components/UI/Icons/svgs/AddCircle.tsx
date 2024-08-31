import React from 'react';

const AddCircle: React.FC<any> = props => {
  const stroke = props.stroke ?? 'white';
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M2.1 7.99996C2.1 4.7415 4.7415 2.1 7.99996 2.1C11.2584 2.1 13.8999 4.7415 13.8999 7.99996C13.8999 11.2584 11.2584 13.8999 7.99996 13.8999C4.7415 13.8999 2.1 11.2584 2.1 7.99996Z"
        stroke={stroke}
        strokeWidth="1.2"
      />
      <path d="M8 5.15625L8 10.8437" stroke={stroke} strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M5.15625 8H10.8437" stroke={stroke} strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  );
};

export default AddCircle;
