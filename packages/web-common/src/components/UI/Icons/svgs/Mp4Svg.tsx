/*
 * @Author: your name
 * @Date: 2021-09-14 15:47:22
 * @LastEditTime: 2022-01-28 13:38:44
 * @LastEditors: your name
 * @Description: 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 * @FilePath: /dev-wlj/packages/@/components/UI/Icons/svgs/Mp4Svg.tsx
 */
import React, { useState, useEffect } from 'react';

const Mp4Icon: React.FC<any> = (props: any) => {
  const strokeColor = props.stroke || '#262A33';
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
        d="M4.66667 0H16.6667L22 5.33333V22C22 23.1046 21.1046 24 20 24H4.66667C3.19391 24 2 22.8061 2 21.3333V2.66667C2 1.19391 3.19391 0 4.66667 0Z"
        fill={`url(#${id})`}
      />
      <path
        d="M15.8062 12.7742C16.2109 13.0371 16.2109 13.6295 15.8062 13.8924L9.69679 17.8606C9.25328 18.1487 8.66699 17.8304 8.66699 17.3015L8.66699 9.36512C8.66699 8.83627 9.25328 8.51797 9.6968 8.80604L15.8062 12.7742Z"
        fill="white"
      />
      <path d="M16.667 4V0L22.0003 5.33333H18.0003C17.2639 5.33333 16.667 4.73638 16.667 4Z" fill="white" fillOpacity="0.5" />
      <defs>
        <linearGradient id={id} x1="12" y1="0" x2="12" y2="24" gradientUnits="userSpaceOnUse">
          <stop stopColor="#A7A9F9" />
          <stop offset="1" stopColor="#8283F7" />
        </linearGradient>
      </defs>
    </svg>
  );
};

export default Mp4Icon;
