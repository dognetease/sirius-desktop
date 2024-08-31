import React from 'react';

const InfoTips: React.FC<any> = (props: any) => {
  const attribute = { ...props };
  const strokeColor = props.stroke || '#262A33';
  delete attribute.stroke;
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M7 13.125C10.3827 13.125 13.125 10.3827 13.125 7C13.125 3.61726 10.3827 0.875 7 0.875C3.61726 0.875 0.875 3.61726 0.875 7C0.875 10.3827 3.61726 13.125 7 13.125Z"
        fill="#F74F4F"
      />
      <path fill-rule="evenodd" clip-rule="evenodd" d="M6.48972 8.02083L6.48972 3.9375L7.51056 3.9375L7.51056 8.02083L6.48972 8.02083Z" fill="white" />
      <path fill-rule="evenodd" clip-rule="evenodd" d="M6.48973 10.0625L6.48973 9.04163L7.51056 9.04163L7.51056 10.0625L6.48973 10.0625Z" fill="white" />
    </svg>
  );
};

export default InfoTips;
