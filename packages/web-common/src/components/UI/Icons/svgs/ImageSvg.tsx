/*
 * @Author: your name
 * @Date: 2021-09-14 15:47:22
 * @LastEditTime: 2022-01-28 13:37:52
 * @LastEditors: your name
 * @Description: 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 * @FilePath: /dev-wlj/packages/@/components/UI/Icons/svgs/ImageSvg.tsx
 */
import React, { useState, useEffect } from 'react';

const ImageIcon: React.FC<any> = (props: any) => {
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
        fillRule="evenodd"
        clipRule="evenodd"
        d="M6 8.66667C6 8.29848 6.29848 8 6.66667 8H17.3333C17.7015 8 18 8.29848 18 8.66667V18C18 18.3682 17.7015 18.6667 17.3333 18.6667H6.66667C6.29848 18.6667 6 18.3682 6 18V8.66667ZM7.33333 15.3333V17.3333H16.6667V16.3333L11.4184 11.7645C11.1436 11.5253 10.7278 11.551 10.4845 11.8221L7.33333 15.3333ZM15.6667 11.3333C16.219 11.3333 16.6667 10.8856 16.6667 10.3333C16.6667 9.78105 16.219 9.33333 15.6667 9.33333C15.1144 9.33333 14.6667 9.78105 14.6667 10.3333C14.6667 10.8856 15.1144 11.3333 15.6667 11.3333Z"
        fill="white"
      />
      <path d="M16.667 4V0L22.0003 5.33333H18.0003C17.2639 5.33333 16.667 4.73638 16.667 4Z" fill="white" fillOpacity="0.5" />
      <defs>
        <linearGradient id={id} x1="12" y1="0" x2="12" y2="24" gradientUnits="userSpaceOnUse">
          <stop stopColor="#63C6FE" />
          <stop offset="1" stopColor="#26B0FE" />
        </linearGradient>
      </defs>
    </svg>
  );
};

export default ImageIcon;
