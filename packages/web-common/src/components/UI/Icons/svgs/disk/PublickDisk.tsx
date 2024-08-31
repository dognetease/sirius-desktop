import React from 'react';

export interface Props {
  className?: string;
  stroke?: string;
}

const PublickDisk: React.FC<Props> = (props: Props) => {
  const strokeColor = props.stroke || '#7D8085';
  const attribute = { ...props };
  delete attribute.stroke;
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" {...attribute}>
      <path d="M16 0H0V16H16V0Z" fill="white" fillOpacity="0.01" />
      <path d="M9 11H12" stroke={strokeColor} strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M9 8H12" stroke={strokeColor} strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M9 5H12" stroke={strokeColor} strokeWidth="1.2" strokeLinejoin="round" />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M7.8 1.39999C7.0268 1.39999 6.4 2.0268 6.4 2.79999V5.39999H2.8C2.0268 5.39999 1.4 6.0268 1.4 6.79999V13.4H0.5V14.6H1.4V14.6H2H6.4H7H7.6H14H14.6V14.6H15.5V13.4H14.6V2.79999C14.6 2.02679 13.9732 1.39999 13.2 1.39999H7.8ZM13.4 13.4V2.79999C13.4 2.68954 13.3105 2.59999 13.2 2.59999H7.8C7.68954 2.59999 7.6 2.68954 7.6 2.79999V5.39999V5.99999V13.4H13.4ZM6.4 13.4V10.6H4V9.39999H6.4V6.59999H2.8C2.68954 6.59999 2.6 6.68954 2.6 6.79999V13.4H6.4Z"
        fill={strokeColor}
      />
    </svg>
  );
};

export default PublickDisk;
