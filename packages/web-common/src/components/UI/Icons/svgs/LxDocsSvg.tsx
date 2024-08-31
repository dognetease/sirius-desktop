/*
 * @Author: your name
 * @Date: 2021-09-14 15:47:22
 * @LastEditTime: 2022-05-31 20:49:51
 * @LastEditors: wangzhijie02
 * @Description: 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 * @FilePath: /dev-wlj/packages/@/components/UI/Icons/svgs/LxDocsSvg.tsx
 */
import React, { useState, useEffect } from 'react';
// import { ReactComponent as DocIcon } from '../../../../images/icons/disk/lxdoc.svg';
// import { ReactComponent as XlsIcon } from '../../../../images/icons/disk/lxxls.svg';

// export const LxDocIcon = () => <DocIcon />;
// export const LxXlsIcon = () => <XlsIcon />;

export const LxDocIcon: React.FC<any> = (props: any) => {
  const [id, setId] = useState(`${Math.random()}`);
  useEffect(() => {
    const id = `${Math.random()}`;
    setId(id);
  }, []);
  const attribute = { ...props };
  delete attribute.stroke;
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" {...attribute}>
      <path
        d="M3.11127 0H11.1113L14.6668 3.55556V14.2222C14.6668 15.2041 13.8709 16 12.8891 16H3.11127C2.12943 16 1.3335 15.2041 1.3335 14.2222V1.77778C1.3335 0.795938 2.12944 0 3.11127 0Z"
        fill={`url(#${id})`}
      />
      <rect x="4" y="10.6667" width="5.33333" height="1.33333" fill="white" />
      <path d="M4 6.66675H12V8.00008H4V6.66675Z" fill="white" />
      <path d="M11.1113 2.66667V0L14.6669 3.55556H12.0002C11.5093 3.55556 11.1113 3.15759 11.1113 2.66667Z" fill="white" fillOpacity="0.5" />
      <defs>
        <linearGradient id={id} x1="8.00016" y1="0" x2="8.00016" y2="16" gradientUnits="userSpaceOnUse">
          <stop stopColor="#70A1F6" />
          <stop offset="1" stopColor="#4389FE" />
        </linearGradient>
      </defs>
    </svg>
  );
};

export const LxXlsIcon: React.FC<any> = (props: any) => {
  const [id, setId] = useState(`${Math.random()}`);
  useEffect(() => {
    const id = `${Math.random()}`;
    setId(id);
  }, []);
  const attribute = { ...props };
  delete attribute.stroke;
  return (
    // <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" {...attribute}>
    // <path d="M3.11127 0H11.1113L14.6668 3.55556V14.2222C14.6668 15.2041 13.8709 16 12.8891 16H3.11127C2.12943 16 1.3335 15.2041 1.3335 14.2222V1.77778C1.3335 0.795938 2.12944 0 3.11127 0Z" fill={`url(#${id})`}/>
    // <path d="M11.1118 2.66667V0L14.6674 3.55556H12.0007C11.5098 3.55556 11.1118 3.15759 11.1118 2.66667Z" fill="white" fillOpacity="0.5"/>
    // <mask id="path-3-inside-1" fill="white">
    // <rect x="4.00049" y="5.33325" width="8" height="7.11111" rx="0.444444"/>
    // </mask>
    // <rect x="4.00049" y="5.33325" width="8" height="7.11111" rx="0.444444" stroke="white" strokeWidth="1.77778" mask="url(#path-3-inside-1)"/>
    // <rect x="4.00049" y="8" width="8" height="0.888889" fill="white"/>
    // <rect x="7.55566" y="5.33325" width="7.11111" height="0.888888" transform="rotate(90 7.55566 5.33325)" fill="white"/>
    // <defs>
    // <linearGradient id={id} x1="8.00016" y1="0" x2="8.00016" y2="16" gradientUnits="userSpaceOnUse">
    // <stop stopColor="#60CD93"/>
    // <stop offset="1" stopColor="#57BC7E"/>
    // </linearGradient>
    // </defs>
    // </svg>
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...attribute}>
      <path
        d="M4.66667 0H16.6667L22 5.33333V21.3333C22 22.8061 20.8061 24 19.3333 24H4.66667C3.19391 24 2 22.8061 2 21.3333V2.66667C2 1.19391 3.19391 0 4.66667 0Z"
        fill={`url(#${id})`}
      />
      <path d="M16.667 4V0L22.0003 5.33333H18.0003C17.2639 5.33333 16.667 4.73638 16.667 4Z" fill="white" fillOpacity="0.5" />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M7.33333 9.33333V17.3333H16.6667V9.33333H7.33333ZM6.66667 8C6.29848 8 6 8.29848 6 8.66667V18C6 18.3682 6.29848 18.6667 6.66667 18.6667H17.3333C17.7015 18.6667 18 18.3682 18 18V8.66667C18 8.29848 17.7015 8 17.3333 8H6.66667Z"
        fill="white"
      />
      <rect x="6" y="12" width="12" height="1.33333" fill="white" />
      <rect x="11.333" y="8" width="10.6667" height="1.33333" transform="rotate(90 11.333 8)" fill="white" />
      <defs>
        <linearGradient id={id} x1="12" y1="0" x2="12" y2="24" gradientUnits="userSpaceOnUse">
          <stop stopColor="#60CD93" />
          <stop offset="1" stopColor="#57BC7E" />
        </linearGradient>
      </defs>
    </svg>
  );
};

export const LxUnitableIcon: React.FC<any> = (props: any) => {
  const [id, setId] = useState(`${Math.random()}`);
  useEffect(() => {
    const id = `${Math.random()}`;
    setId(id);
  }, []);
  const attribute = { ...props };
  delete attribute.stroke;
  return (
    // <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" {...attribute}>
    // <path d="M3.11127 0H11.1113L14.6668 3.55556V14.2222C14.6668 15.2041 13.8709 16 12.8891 16H3.11127C2.12943 16 1.3335 15.2041 1.3335 14.2222V1.77778C1.3335 0.795938 2.12944 0 3.11127 0Z" fill={`url(#${id})`}/>
    // <path d="M11.1118 2.66667V0L14.6674 3.55556H12.0007C11.5098 3.55556 11.1118 3.15759 11.1118 2.66667Z" fill="white" fillOpacity="0.5"/>
    // <mask id="path-3-inside-1" fill="white">
    // <rect x="4.00049" y="5.33325" width="8" height="7.11111" rx="0.444444"/>
    // </mask>
    // <rect x="4.00049" y="5.33325" width="8" height="7.11111" rx="0.444444" stroke="white" strokeWidth="1.77778" mask="url(#path-3-inside-1)"/>
    // <rect x="4.00049" y="8" width="8" height="0.888889" fill="white"/>
    // <rect x="7.55566" y="5.33325" width="7.11111" height="0.888888" transform="rotate(90 7.55566 5.33325)" fill="white"/>
    // <defs>
    // <linearGradient id={id} x1="8.00016" y1="0" x2="8.00016" y2="16" gradientUnits="userSpaceOnUse">
    // <stop stopColor="#60CD93"/>
    // <stop offset="1" stopColor="#57BC7E"/>
    // </linearGradient>
    // </defs>
    // </svg>
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...attribute}>
      <path
        d="M3.77778 0H16.6667L22 5.33333V22.2222C22 23.2041 21.2041 24 20.2222 24H3.77778C2.79594 24 2 23.2041 2 22.2222V1.77778C2 0.795938 2.79594 0 3.77778 0Z"
        fill={`url(#${id})`}
      />
      <rect x="5.6665" y="16" width="8" height="1.8" fill="white" />
      <rect x="5.6665" y="6" width="8" height="1.8" fill="white" />
      <path d="M5.6665 11H11.6665V12.8H5.6665V11Z" fill="white" />
      <path d="M16.667 4.44444V0L22.0003 5.33333H17.5559C17.065 5.33333 16.667 4.93536 16.667 4.44444Z" fill="white" fill-opacity="0.5" />
      <defs>
        <linearGradient id={id} x1="17.6665" y1="2.5" x2="1.6665" y2="24" gradientUnits="userSpaceOnUse">
          <stop stop-color="#FE9132" stop-opacity="0.88" />
          <stop offset="1" stop-color="#FE9132" />
        </linearGradient>
      </defs>
    </svg>
  );
};
