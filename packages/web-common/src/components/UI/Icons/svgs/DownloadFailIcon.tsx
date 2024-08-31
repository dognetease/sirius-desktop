import React from 'react';

const DownloadFailIcon: React.FC<any> = (props: any) => {
  const attribute = { ...props };
  delete attribute.stroke;
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" {...attribute}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M8 15C11.866 15 15 11.866 15 8C15 4.13401 11.866 1 8 1C4.13401 1 1 4.13401 1 8C1 11.866 4.13401 15 8 15ZM7.41673 9.16667L7.41673 4.5H8.5834V9.16667H7.41673ZM7.41673 10.3333V11.5H8.5834V10.3333H7.41673Z"
        fill="#F74F4F"
      />
    </svg>
  );
};

export default DownloadFailIcon;
