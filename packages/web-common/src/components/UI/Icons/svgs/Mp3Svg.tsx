/*
 * @Author: your name
 * @Date: 2021-09-14 15:47:22
 * @LastEditTime: 2022-01-28 13:38:38
 * @LastEditors: your name
 * @Description: 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 * @FilePath: /dev-wlj/packages/@/components/UI/Icons/svgs/Mp3Svg.tsx
 */
import React, { useState, useEffect } from 'react';

const Mp3Icon: React.FC<any> = (props: any) => {
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
        d="M11.333 12.8374V10V8H13.333H16.6663L16.6663 10L13.333 10V15.6667V16H13.3147C13.1489 17.5 11.8772 18.6667 10.333 18.6667C8.67615 18.6667 7.33301 17.3235 7.33301 15.6667C7.33301 14.0098 8.67615 12.6667 10.333 12.6667C10.6836 12.6667 11.0202 12.7268 11.333 12.8374Z"
        fill="white"
      />
      <path d="M16.667 4V0L22.0003 5.33333H18.0003C17.2639 5.33333 16.667 4.73638 16.667 4Z" fill="white" fillOpacity="0.5" />
      <defs>
        <linearGradient id={id} x1="12" y1="0" x2="12" y2="24" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FF9D75" />
          <stop offset="1" stopColor="#FF7033" />
        </linearGradient>
      </defs>
    </svg>
  );
};

export default Mp3Icon;
