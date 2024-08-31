/*
 * @Author: your name
 * @Date: 2021-09-14 15:47:22
 * @LastEditTime: 2022-01-28 13:39:54
 * @LastEditors: your name
 * @Description: 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 * @FilePath: /dev-wlj/packages/@web-common/components/UI/Icons/svgs/XlsSvg.tsx
 */
import React, { useState, useEffect } from 'react';

const XlsIcon: React.FC<any> = (props: any) => {
  const [id, setId] = useState(`${Math.random()}`);
  useEffect(() => {
    const id = `${Math.random()}`;
    setId(id);
  }, []);
  const attribute = { ...props };
  delete attribute.stroke;
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...attribute}>
      <path
        d="M4.66667 0H16.6667L22 5.33333V21.3333C22 22.8061 20.8061 24 19.3333 24H4.66667C3.19391 24 2 22.8061 2 21.3333V2.66667C2 1.19391 3.19391 0 4.66667 0Z"
        fill={`url(#${id})`}
      />
      <path
        d="M13.8365 18L11.9965 14.6934L10.1698 18H8.0498L10.9965 13.1334L8.23647 8.50671H10.3431L11.9965 11.5734L13.6631 8.50671H15.7565L12.9965 13.1334L15.9565 18H13.8365Z"
        fill="white"
      />
      <path d="M16.667 4V0L22.0003 5.33333H18.0003C17.2639 5.33333 16.667 4.73638 16.667 4Z" fill="white" fillOpacity="0.5" />
      <defs>
        <linearGradient id={id} x1="12" y1="0" x2="12" y2="24" gradientUnits="userSpaceOnUse">
          <stop stopColor="#2BC491" />
          <stop offset="1" stopColor="#1EA87A" />
        </linearGradient>
      </defs>
    </svg>
    // <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...attribute}>
    //   <path d="M4.66667 0H16.6667L22 5.33333V21.3333C22 22.8061 20.8061 24 19.3333 24H4.66667C3.19391 24 2 22.8061 2 21.3333V2.66667C2 1.19391 3.19391 0 4.66667 0Z" fill={`url(#${id})`}/>
    //   <path d="M16.667 4V0L22.0003 5.33333H18.0003C17.2639 5.33333 16.667 4.73638 16.667 4Z" fill="white" fill-opacity="0.5"/>
    //   <path fill-rule="evenodd" clip-rule="evenodd" d="M7.33333 9.33333V17.3333H16.6667V9.33333H7.33333ZM6.66667 8C6.29848 8 6 8.29848 6 8.66667V18C6 18.3682 6.29848 18.6667 6.66667 18.6667H17.3333C17.7015 18.6667 18 18.3682 18 18V8.66667C18 8.29848 17.7015 8 17.3333 8H6.66667Z" fill="white"/>
    //   <rect x="6" y="12" width="12" height="1.33333" fill="white"/>
    //   <rect x="11.333" y="8" width="10.6667" height="1.33333" transform="rotate(90 11.333 8)" fill="white"/>
    //   <defs>
    //     <linearGradient id={id} x1="12" y1="0" x2="12" y2="24" gradientUnits="userSpaceOnUse">
    //       <stop stop-color="#60CD93"/>
    //       <stop offset="1" stop-color="#57BC7E"/>
    //     </linearGradient>
    //   </defs>
    // </svg>
  );
};

export default XlsIcon;
