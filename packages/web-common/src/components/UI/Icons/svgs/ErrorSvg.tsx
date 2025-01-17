import React from 'react';

interface Props {
  width?: number;
  height?: number;
  className: string;
}

const ErrorIcon: React.FC<Props> = (props: Props) => {
  const attribute = { width: 20, height: 20, ...props };
  // @ts-ignore
  delete attribute.stroke;
  return (
    <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" {...attribute}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M10 18.75C14.8325 18.75 18.75 14.8325 18.75 10C18.75 5.16751 14.8325 1.25 10 1.25C5.16751 1.25 1.25 5.16751 1.25 10C1.25 14.8325 5.16751 18.75 10 18.75ZM9.27084 11.4583L9.27084 5.625H10.7292V11.4583H9.27084ZM9.27084 12.9167V14.375H10.7292V12.9167H9.27084Z"
        fill="#F74F4F"
      />
    </svg>
  );
};

export default ErrorIcon;
