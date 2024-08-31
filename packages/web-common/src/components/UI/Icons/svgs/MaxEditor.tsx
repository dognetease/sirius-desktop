/*
 * @Author: your name
 * @Date: 2022-03-21 17:43:11
 * @LastEditTime: 2022-03-21 17:56:50
 * @LastEditors: your name
 * @Description: 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 * @FilePath: /dev-wlj/packages/web-common/src/components/UI/Icons/svgs/AllipseGroup.tsx
 */
import React, { useState, useEffect } from 'react';

const MaxEditor: React.FC<any> = (props: any) => {
  const attribute = { ...props };
  const stroke = attribute.stroke || '#7D8085';
  delete attribute.stroke;
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" {...attribute}>
      <path d="M7.33333 14.0001H2V8.66675" stroke={stroke} strokeWidth="1.2" fill="none" strokeLinejoin="round" />
      <path d="M8.66675 2H14.0001V7.33333" stroke={stroke} strokeWidth="1.2" fill="none" strokeLinejoin="round" />
    </svg>
  );
};

export default MaxEditor;
