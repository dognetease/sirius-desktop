import React from 'react';

export interface Props {
  className?: string;
  stroke?: string;
}

const Create: React.FC<Props> = (props: Props) => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M1.8335 7.99992C1.8335 4.59416 4.59441 1.83325 8.00016 1.83325C11.4059 1.83325 14.1668 4.59416 14.1668 7.99992C14.1668 11.4057 11.4059 14.1666 8.00016 14.1666C4.59441 14.1666 1.8335 11.4057 1.8335 7.99992Z"
      stroke="white"
    />
    <path d="M8 5.08325L8 10.9166" stroke="white" strokeLinejoin="round" />
    <path d="M5.0835 8H10.9168" stroke="white" strokeLinejoin="round" />
  </svg>
);

export default Create;
