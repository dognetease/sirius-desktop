import React from 'react';

const LinkIcon: React.FC<any> = (props: any) => {
  const strokeColor = props.stroke || '#262A33';
  const attribute = { ...props };
  delete attribute.stroke;
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" {...attribute}>
      <path
        d="M10.3007 4.50789L5.41636 9.39226C5.09121 9.71742 5.09121 10.2446 5.41636 10.5698V10.5698C5.74152 10.8949 6.26871 10.8949 6.59387 10.5698L11.652 5.51159C12.3024 4.86127 12.3024 3.8069 11.652 3.15658V3.15658C11.0017 2.50626 9.94735 2.50626 9.29703 3.15658L3.75702 8.69659C2.78071 9.6729 2.78071 11.2558 3.75702 12.2321V12.2321C4.73333 13.2084 6.31625 13.2084 7.29256 12.2321L12.6588 6.86592"
        stroke={strokeColor}
        strokeOpacity="0.9"
      />
    </svg>
  );
};

export default LinkIcon;
