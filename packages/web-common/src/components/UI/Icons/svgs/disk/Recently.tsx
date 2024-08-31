import React from 'react';

export interface Props {
  className?: string;
  stroke?: string;
}

const Recently: React.FC<Props> = (props: Props) => {
  const strokeColor = props.stroke || '#262A33';
  const attribute = { ...props };
  delete attribute.stroke;
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" {...attribute}>
      <path
        d="M1.8335 7.99992C1.8335 4.59416 4.59441 1.83325 8.00016 1.83325C11.4059 1.83325 14.1668 4.59416 14.1668 7.99992C14.1668 11.4057 11.4059 14.1666 8.00016 14.1666C4.59441 14.1666 1.8335 11.4057 1.8335 7.99992Z"
        stroke={strokeColor}
        strokeOpacity="0.5"
      />
      <path fillRule="evenodd" clipRule="evenodd" d="M7.50049 3.5V8.5H8.00049H8.50049H12.0005V7.5H8.50049V3.5H7.50049Z" fill={strokeColor} fillOpacity="0.5" />
    </svg>
  );
};

export default Recently;
