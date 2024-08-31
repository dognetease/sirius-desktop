/*
 * @Author: your name
 * @Date: 2022-03-21 17:43:11
 * @LastEditTime: 2022-03-21 17:56:50
 * @LastEditors: your name
 * @Description: 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 * @FilePath: /dev-wlj/packages/web-common/src/components/UI/Icons/svgs/AllipseGroup.tsx
 */
import React, { useState, useEffect } from 'react';

const MinEditor: React.FC<any> = (props: any) => {
  const attribute = { ...props };
  const stroke = attribute.stroke || '#7D8085';
  delete attribute.stroke;
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" {...attribute}>
      <rect width="16" height="16" transform="matrix(-1 0 0 1 16 0)" fill="none" />
      <path d="M15 6.5L9.50001 6.5L9.5 0.999999" stroke={stroke} fill="none" strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M1 9.5L6.49999 9.5L6.49999 15" stroke={stroke} fill="none" strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  );
};

export default MinEditor;
