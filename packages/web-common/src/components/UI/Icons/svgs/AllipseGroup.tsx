/*
 * @Author: your name
 * @Date: 2022-03-21 17:43:11
 * @LastEditTime: 2022-03-21 17:56:50
 * @LastEditors: your name
 * @Description: 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 * @FilePath: /dev-wlj/packages/web-common/src/components/UI/Icons/svgs/AllipseGroup.tsx
 */
import React, { useState, useEffect } from 'react';

const AllipseGroup: React.FC<any> = (props: any) => {
  const attribute = { ...props };
  const stroke = attribute.stroke || '#7D8085';
  delete attribute.stroke;
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" {...attribute}>
      <g opacity="0.4">
        <circle cx="5" cy="2" r="1.5" fill={stroke} />
        <circle cx="5" cy="8" r="1.5" fill={stroke} />
        <circle cx="5" cy="14" r="1.5" fill={stroke} />
        <circle cx="11" cy="2" r="1.5" fill={stroke} />
        <circle cx="11" cy="8" r="1.5" fill={stroke} />
        <circle cx="11" cy="14" r="1.5" fill={stroke} />
      </g>
    </svg>
  );
};

export default AllipseGroup;
