import React from 'react';

const DownloadIcon: React.FC<any> = (props: any) => {
  const attribute = { ...props };
  delete attribute.stroke;
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" {...attribute}>
      <path d="M8 1C4.13401 1 1 4.13401 1 8C1 11.866 4.13401 15 8 15C11.866 15 15 11.866 15 8C15 4.13401 11.866 1 8 1Z" fill="#386EE7" />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M7.41622 9.8244L5.1957 7.60388L4.40374 8.39584L7.26433 11.2564C7.67048 11.6626 8.32897 11.6626 8.73511 11.2564L11.5957 8.39584L10.8037 7.60388L8.58289 9.82473L8.58289 4.43325L7.41622 4.43325L7.41622 9.8244Z"
        fill="white"
      />
    </svg>
  );
};

export default DownloadIcon;
