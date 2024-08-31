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

const UpTriangle: React.FC<Props> = (props: Props) => {
  // const strokeColor = props.stroke || '#262A33';
  const attribute = { ...props };
  const fill = attribute.fill || '#262A33';
  const fillOpacity = attribute.fillOpacity || '0.5';
  delete attribute.stroke;
  return (
    <svg width="8" height="8" viewBox="0 0 8 8" fill="none" xmlns="http://www.w3.org/2000/svg" {...attribute}>
      <path
        d="M3.60957 1.48804L0.649877 5.18765C0.387972 5.51503 0.621059 6 1.04031 6L6.95969 6C7.37894 6 7.61203 5.51503 7.35012 5.18765L4.39043 1.48804C4.19027 1.23784 3.80973 1.23784 3.60957 1.48804Z"
        fill={fill}
        fillOpacity={fillOpacity}
      />
    </svg>
  );
};

export default UpTriangle;
