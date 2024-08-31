import * as React from 'react';

const Success = (props: any) => (
  <svg width={20} height={20} fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z" fill="#0FD683" />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M8.973 12.693a.499.499 0 0 0 .363-.147l4.03-4.03a.5.5 0 0 0 0-.707l-.353-.354a.5.5 0 0 0-.707 0l-3.34 3.341-1.272-1.271a.5.5 0 0 0-.707 0l-.354.353a.5.5 0 0 0 0 .707l1.962 1.962a.499.499 0 0 0 .378.146Z"
      fill="#fff"
    />
  </svg>
);

export default Success;
