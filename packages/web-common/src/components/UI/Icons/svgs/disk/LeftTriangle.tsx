/*
 * @Author: your name
 * @Date: 2021-09-14 15:47:22
 * @LastEditTime: 2022-03-17 17:13:41
 * @LastEditors: Please set LastEditors
 * @Description: 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 * @FilePath: /dev-wlj/packages/web/src/components/UI/Icons/svgs/disk/UpTriangle.tsx
 */
import React from 'react';

export interface Props {
  className?: string;
  stroke?: string;
  fill?: string;
  fillOpacity: string;
}

const LeftTriangle: React.FC<Props> = (props: Props) => {
  const attribute = { ...props };
  const fill = attribute.fill || '#7088FF';
  // const fillOpacity = attribute.fillOpacity || '0.5';
  delete attribute.stroke;
  return (
    <svg width="12" height="29" viewBox="0 0 12 29" fill="none" xmlns="http://www.w3.org/2000/svg" {...attribute}>
      <path
        d="M2.64737 13.3661L8.5201 8.28034C9.50711 7.42559 10.0742 6.18429 10.0742 4.87861L10.0742 24.1214C10.0742 22.8157 9.50711 21.5744 8.5201 20.7197L2.64737 15.6339C1.95665 15.0358 1.95665 13.9642 2.64737 13.3661Z"
        fill="white"
        stroke="#EBEDF2"
      />
      <path
        d="M10.5777 4.82524C10.5777 6.27249 9.95056 7.64874 8.85843 8.59836L2.95963 13.7274C2.50118 14.1261 2.50117 14.838 2.9596 15.2367L8.8586 20.3664C9.95063 21.316 10.5777 22.6922 10.5777 24.1394L10.5777 28.4863L11.5777 28.4863L11.5777 0.5L10.5777 0.5L10.5777 4.82524Z"
        fill="white"
      />
    </svg>
  );
};

export default LeftTriangle;
