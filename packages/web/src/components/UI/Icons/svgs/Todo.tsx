import * as React from 'react';

const Todo = (props: any) => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <rect x="0.75" y="0.75" width="14.5" height="14.5" rx="7.25" fill="white" />
    <rect x="0.75" y="0.75" width="14.5" height="14.5" rx="7.25" stroke="#C9CBD6" stroke-width="1.5" />
    <rect x="4" y="4" width="8" height="8" rx="4" fill="#C9CBD6" />
  </svg>
);

export default Todo;