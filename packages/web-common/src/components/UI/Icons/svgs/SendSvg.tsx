import React from 'react';

const SendIcon: React.FC<any> = (props: any) => {
  const attribute = { ...props };
  delete attribute.stroke;
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" {...attribute}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M13.5612 7.54923L3.06419 2.51066C2.6661 2.31958 2.23384 2.70062 2.37348 3.11954L3.89489 7.68377C3.96331 7.88903 3.96331 8.11095 3.89489 8.31622L2.37348 12.8805C2.23384 13.2994 2.66609 13.6804 3.06418 13.4893L13.5612 8.45076C13.9394 8.26923 13.9394 7.73076 13.5612 7.54923ZM6.0003 8.29999H9.0003V7.69999H6.0003V8.29999Z"
        fill="white"
      />
    </svg>
  );
};

export default SendIcon;
