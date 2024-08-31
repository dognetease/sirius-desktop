/*
 * @Author: wangzhijie02
 * @Date: 2021-11-24 16:14:47
 * @LastEditTime: 2021-11-24 16:14:47
 * @LastEditors: your name
 * @Description:
 */
declare module '*.svg' {
  import React = require('react');

  export const ReactComponent: React.FC<React.SVGProps<SVGSVGElement>>;

  const src: string;

  export default src;
}

declare module '*.module.scss';
