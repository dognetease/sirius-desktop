/*
 * @Author: your name
 * @Date: 2021-09-14 15:47:22
 * @LastEditTime: 2022-01-28 13:39:03
 * @LastEditors: your name
 * @Description: 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 * @FilePath: /dev-wlj/packages/@/components/UI/Icons/svgs/PPTSvg.tsx
 */
import React, { useState, useEffect } from 'react';

const PPTIcon: React.FC<any> = (props: any) => {
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
        d="M12.2669 14.4267H10.4402V18H8.58691V8.50671H12.2669C13.2269 8.50671 13.9869 8.79116 14.5469 9.36005C15.1158 9.92005 15.4002 10.6223 15.4002 11.4667C15.4002 12.3023 15.1158 13.0045 14.5469 13.5734C13.978 14.1423 13.218 14.4267 12.2669 14.4267ZM12.1736 10.16H10.4402V12.76H12.1736C12.5914 12.76 12.9247 12.6445 13.1736 12.4134C13.4225 12.1823 13.5469 11.8667 13.5469 11.4667C13.5469 11.0756 13.4225 10.76 13.1736 10.52C12.9247 10.28 12.5914 10.16 12.1736 10.16Z"
        fill="white"
      />
      <path d="M16.667 4V0L22.0003 5.33333H18.0003C17.2639 5.33333 16.667 4.73638 16.667 4Z" fill="white" fillOpacity="0.5" />
      <defs>
        <linearGradient id={id} x1="12" y1="0" x2="12" y2="24" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FF9A70" />
          <stop offset="1" stopColor="#FF7033" />
        </linearGradient>
      </defs>
    </svg>
  );
};

export default PPTIcon;
