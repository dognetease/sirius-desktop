import React from 'react';

const UploadIcon: React.FC<any> = (props: any) => {
  const attribute = { ...props };
  delete attribute.stroke;
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" {...attribute}>
      <path d="M8 15C11.866 15 15 11.866 15 8C15 4.13401 11.866 1 8 1C4.13401 1 1 4.13401 1 8C1 11.866 4.13401 15 8 15Z" fill="#386EE7" />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M8.58378 6.1756L10.8043 8.39612L11.5963 7.60416L8.73567 4.74357C8.32952 4.33743 7.67103 4.33743 7.26489 4.74357L4.4043 7.60416L5.19626 8.39612L7.41711 6.17527L7.41711 11.5667H8.58378V6.1756Z"
        fill="white"
      />
    </svg>
  );
};

export default UploadIcon;
