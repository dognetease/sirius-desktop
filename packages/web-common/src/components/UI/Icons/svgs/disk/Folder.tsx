/*
 * @Author: your name
 * @Date: 2021-09-14 15:47:22
 * @LastEditTime: 2022-01-28 13:41:03
 * @LastEditors: your name
 * @Description: 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 * @FilePath: /dev-wlj/packages/@web-common/components/UI/Icons/svgs/disk/Folder.tsx
 */
import React, { useState, useEffect } from 'react';

export interface Props {
  className?: string;
  stroke?: string;
}

const Folder: React.FC<Props> = (props: Props) => {
  const [id, setId] = useState(`${Math.random()}`);
  const [id2, setId2] = useState(`${Math.random()}`);
  useEffect(() => {
    const id = `${Math.random()}`;
    const id2 = `${Math.random()}`;
    setId(id);
    setId2(id2);
  }, []);
  const attribute = { ...props };
  delete attribute.stroke;
  // const strokeColor = props.stroke || '#262A33';
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...attribute}>
      <g opacity="0.85">
        <path
          d="M1.10352 4.09091C1.10352 3.48842 1.59193 3 2.19442 3H6.75513C7.06649 3 7.36301 3.13305 7.57002 3.36563L8.61833 4.54346C8.82533 4.77605 9.12186 4.90909 9.43322 4.90909H22.0816C22.6841 4.90909 23.1725 5.39751 23.1725 6V14.7508H1.10352V4.09091Z"
          fill="#3A76FC"
        />
        <g filter={`url(#${id})`}>
          <path
            d="M0.0911024 8.17522C0.041969 7.5414 0.543026 7 1.17875 7H22.8434C23.4709 7 23.9691 7.52818 23.9324 8.15466L23.2087 20.5183C23.1749 21.095 22.6973 21.5454 22.1196 21.5454H2.13717C1.56738 21.5454 1.09356 21.1069 1.04952 20.5388L0.0911024 8.17522Z"
            fill={`url(#${id2})`}
          />
        </g>
      </g>
      <defs>
        <filter id={id} x="0.0878906" y="7" width="23.8465" height="14.5454" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
          <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
          <feOffset dy="0.545455" />
          <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
          <feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.23 0" />
          <feBlend mode="normal" in2="shape" result="effect1_innerShadow" />
        </filter>
        <linearGradient id={id2} x1="34.159" y1="29.1109" x2="6.36817" y2="10.0559" gradientUnits="userSpaceOnUse">
          <stop offset="0.0221009" stopColor="#3071F2" />
          <stop offset="1" stopColor="#5991FF" />
        </linearGradient>
      </defs>
    </svg>
  );
};

export default Folder;
