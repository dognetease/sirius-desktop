/*
 * @Author: your name
 * @Date: 2021-09-14 15:47:22
 * @LastEditTime: 2022-01-28 13:37:47
 * @LastEditors: your name
 * @Description: 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 * @FilePath: /dev-wlj/packages/@/components/UI/Icons/svgs/HtmlSvg.tsx
 */
import React, { useState, useEffect } from 'react';

const HtmlIcon: React.FC<any> = (props: any) => {
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
        d="M6.66699 8L7.63644 18.6018L11.9864 20L16.3642 18.6018L17.3337 8H6.66699ZM15.2281 11.4259H10.1225L10.2364 12.7491H15.1142L14.7364 16.7241L12.017 17.4473V17.4554H11.9864L9.24477 16.7241L9.0781 14.6937H10.4031L10.5003 15.7143L11.9864 16.1027L13.4781 15.7143L13.6448 14.0482H9.00866L8.6531 10.1482H15.3503L15.2281 11.4259Z"
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

export default HtmlIcon;
