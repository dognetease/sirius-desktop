/*
 * @Author: your name
 * @Date: 2021-09-14 15:47:22
 * @LastEditTime: 2022-01-28 13:40:04
 * @LastEditors: your name
 * @Description: 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 * @FilePath: /dev-wlj/packages/@web-common/components/UI/Icons/svgs/ZipSvg.tsx
 */
import React, { useState, useEffect } from 'react';

const ZipIcon: React.FC<any> = (props: any) => {
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
        d="M9.33301 6.66663H11.9997V9.06641H14.6661V11.4664H11.9997V12.6667H14.6661V15.0667H11.9997V16.2667V16.2667V16.2669H14.6661V18.6669H11.9994V18.6667H9.33301V16.2667V16.2667V13.8667H11.9994V12.6667H9.33301V10.2667H11.9994V9.06663H9.33301V6.66663Z"
        fill="white"
      />
      <path d="M16.667 4V0L22.0003 5.33333H18.0003C17.2639 5.33333 16.667 4.73638 16.667 4Z" fill="white" fillOpacity="0.5" />
      <defs>
        <linearGradient id={id} x1="12" y1="0" x2="12" y2="24" gradientUnits="userSpaceOnUse">
          <stop stopColor="#E7B785" />
          <stop offset="1" stopColor="#C99864" />
        </linearGradient>
      </defs>
    </svg>
  );
};

export default ZipIcon;
