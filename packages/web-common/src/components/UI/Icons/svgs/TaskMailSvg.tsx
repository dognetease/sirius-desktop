import React from 'react';

const TaskIcon: React.FC<any> = (props: any) => {
  const attribute = { ...props };
  delete attribute.stroke;
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M2 3.2421L3.17647 4.33301L5.33333 2.33301" stroke="#6BA9FF" />
      <path d="M6.6665 3.66699H13.9998" stroke="#6BA9FF" />
      <path d="M6.6665 8L13.9998 8" stroke="#6BA9FF" />
      <path d="M6.6665 12.333L13.9998 12.333" stroke="#6BA9FF" />
      <circle cx="3.50016" cy="7.99967" r="1.16667" stroke="#6BA9FF" />
      <circle cx="3.50016" cy="12.3337" r="1.16667" stroke="#6BA9FF" />
    </svg>
  );
};

export default TaskIcon;
