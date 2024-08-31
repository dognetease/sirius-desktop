declare module '*.css';
declare module '*.less';
declare module '*.scss' {
  const classes: { readonly [key: string]: string };
  export default classes;
}
declare module '*.sass';
declare module '*.svg' {
  import React = require('react');
  export const ReactComponent: React.FC<React.SVGProps<SVGSVGElement>>;
  const src: string;
  export default src;
}
declare module '*.png';
declare module '*.jpg';
declare module '*.jpeg';
declare module '*.gif';
declare module '*.bmp';
declare module '*.tiff';
