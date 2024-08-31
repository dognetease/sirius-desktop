import React from 'react';

export interface Props {
  className?: string;
  stroke?: string;
}

const Info: React.FC<Props> = (props: Props) => {
  const strokeColor = props.stroke || '#262A33';
  const attribute = { ...props };
  delete attribute.stroke;
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" {...attribute}>
      <path
        d="M14.6667 8C14.6667 11.6819 11.682 14.6667 8.00008 14.6667V14.6667C4.31818 14.6667 1.33342 11.6819 1.33342 8V8C1.33342 4.3181 4.31818 1.33333 8.00008 1.33333V1.33333C11.682 1.33333 14.6667 4.3181 14.6667 8V8Z"
        stroke={strokeColor}
      />
      <path d="M8 12L8 6.16664" stroke={strokeColor} strokeLinejoin="round" />
      <path d="M8 4.99998L8 3.99998" stroke={strokeColor} strokeLinejoin="round" />
    </svg>
  );
};

export default Info;
