import React from 'react';

export interface Props {
  className?: string;
  // stroke?: string
}

const DownTriangle: React.FC<Props> = (props: Props) => {
  // const strokeColor = props.stroke || '#262A33';
  const attribute = { ...props };
  delete attribute.stroke;
  return (
    <svg width="8" height="8" viewBox="0 0 8 8" fill="none" xmlns="http://www.w3.org/2000/svg" {...attribute}>
      <path
        d="M4.39043 6.51196L7.35012 2.81235C7.61203 2.48497 7.37894 2 6.95969 2L1.04031 2C0.62106 2 0.387974 2.48497 0.649879 2.81235L3.60957 6.51196C3.80973 6.76216 4.19027 6.76216 4.39043 6.51196Z"
        fill="#262A33"
        fillOpacity="0.5"
      />
    </svg>
  );
};

export default DownTriangle;
