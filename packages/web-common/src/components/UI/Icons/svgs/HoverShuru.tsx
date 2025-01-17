import React from 'react';
import './svg.scss';
export interface Props {
  className?: string;
  stroke?: string;
}
const HoverShuru: React.FC<Props> = (props: Props) => {
  const attribute = { ...props };
  const { stroke } = attribute;
  delete attribute.stroke;
  return (
    <svg className="hover-shuru" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M2 14.7639H14" stroke="#8D92A1" stroke-linecap="round" />
      <path
        d="M10.1446 1.8166L2.94951 9.01214C2.86252 9.09912 2.81066 9.21512 2.80384 9.33795L2.63574 12.3639L5.66145 12.1958C5.78428 12.1889 5.90029 12.1371 5.98728 12.0501L13.1824 4.8545C13.3777 4.65924 13.3777 4.34267 13.1824 4.14741L10.8517 1.8166C10.6565 1.62132 10.3399 1.62132 10.1446 1.8166Z"
        stroke="#8D92A1"
        stroke-linejoin="round"
      />
      <path d="M9 3L12.2706 6.2707" stroke="#8D92A1" />
    </svg>
  );
};

export default HoverShuru;
