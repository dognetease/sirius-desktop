/*
 * @Author: your name
 * @Date: 2021-09-14 15:47:22
 * @LastEditTime: 2022-01-28 13:39:37
 * @LastEditors: your name
 * @Description: 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 * @FilePath: /dev-wlj/packages/@/components/UI/Icons/svgs/TxtSvg.tsx
 */
import React, { useState, useEffect } from 'react';

const TxtIcon: React.FC<any> = (props: any) => {
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
      <path d="M12.9251 10.16V18H11.0718V10.16H8.5918V8.50671H15.4051V10.16H12.9251Z" fill="white" />
      <path d="M16.667 4V0L22.0003 5.33333H18.0003C17.2639 5.33333 16.667 4.73638 16.667 4Z" fill="white" fillOpacity="0.5" />
      <defs>
        <linearGradient id={id} x1="12" y1="0" x2="12" y2="24" gradientUnits="userSpaceOnUse">
          <stop stopColor="#858793" />
          <stop offset="1" stopColor="#686A79" />
        </linearGradient>
      </defs>
    </svg>
  );
};

export default TxtIcon;
