/*
 * @Author: your name
 * @Date: 2021-09-14 15:47:22
 * @LastEditTime: 2022-01-28 13:38:56
 * @LastEditors: your name
 * @Description: 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 * @FilePath: /dev-wlj/packages/@/components/UI/Icons/svgs/PdfSvg.tsx
 */
import React, { useState, useEffect } from 'react';

const PdfIcon: React.FC<any> = (props: any) => {
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
        d="M4.66667 0H16.6667L22 5.33333V21.3333C22 22.8061 20.8061 24 19.3333 24H4.66667C3.19391 24 2 22.8061 2 21.3333V2.66667C2 1.19391 3.19391 0 4.66667 0Z"
        fill={`url(#${id})`}
      />
      <g clipPath="url(#clip0)">
        <path
          d="M16.3333 16.2997C15.4333 16.2331 14.5667 15.8997 13.8667 15.2997C12.5 15.5997 11.2 16.0331 9.9 16.5664C8.86667 18.3997 7.9 19.3331 7.06667 19.3331C6.9 19.3331 6.7 19.2997 6.56667 19.1997C6.2 19.0331 6 18.6664 6 18.2997C6 17.9997 6.06667 17.1664 9.23333 15.7997C9.96667 14.4664 10.5333 13.0997 11 11.6664C10.6 10.8664 9.73333 8.89972 10.3333 7.89972C10.5333 7.53306 10.9333 7.33306 11.3667 7.36639C11.7 7.36639 12.0333 7.53306 12.2333 7.79972C12.6667 8.39972 12.6333 9.66639 12.0667 11.5331C12.6 12.5331 13.3 13.4331 14.1333 14.1997C14.8333 14.0664 15.5333 13.9664 16.2333 13.9664C17.8 13.9997 18.0333 14.7331 18 15.1664C18 16.2997 16.9 16.2997 16.3333 16.2997ZM7 18.3664L7.1 18.3331C7.56667 18.1664 7.93333 17.8331 8.2 17.3997C7.7 17.5997 7.3 17.9331 7 18.3664ZM11.4333 8.36639H11.3333C11.3 8.36639 11.2333 8.36639 11.2 8.39972C11.0667 8.96639 11.1667 9.56639 11.4 10.0997C11.6 9.53306 11.6 8.93306 11.4333 8.36639ZM11.6667 13.1997L11.6333 13.2664L11.6 13.2331C11.3 13.9997 10.9667 14.7664 10.6 15.4997L10.6667 15.4664V15.5331C11.4 15.2664 12.2 15.0331 12.9333 14.8664L12.9 14.8331H13C12.5 14.3331 12.0333 13.7664 11.6667 13.1997ZM16.2 14.9664C15.9 14.9664 15.6333 14.9664 15.3333 15.0331C15.6667 15.1997 16 15.2664 16.3333 15.2997C16.5667 15.3331 16.8 15.2997 17 15.2331C17 15.1331 16.8667 14.9664 16.2 14.9664Z"
          fill="white"
        />
      </g>
      <path d="M16.667 4V0L22.0003 5.33333H18.0003C17.2639 5.33333 16.667 4.73638 16.667 4Z" fill="white" fillOpacity="0.5" />
      <defs>
        <linearGradient id={id} x1="12" y1="0" x2="12" y2="20.1" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FA584D" />
          <stop offset="1" stopColor="#EB4339" />
        </linearGradient>
        <clipPath id={`${`${id}clip0`}`}>
          <rect width="12" height="12" fill="white" transform="translate(6 7.33337)" />
        </clipPath>
      </defs>
    </svg>
  );
};

export default PdfIcon;
