import React from 'react';
// import { ReactComponent as IconSvg } from '@/images/icons/addMember.svg';

const AddMember: React.FC<any> = (props: any) => {
  const attribute = { ...props };
  const stroke = attribute.stroke || '#262A33';
  delete attribute.stroke;
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" {...attribute}>
      <path d="M8 3L8 13" stroke={stroke} strokeOpacity="0.9" />
      <path d="M13 8H3" stroke={stroke} strokeOpacity="0.9" />
    </svg>
  );
};

export default AddMember;
