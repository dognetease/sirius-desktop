import React from 'react';

export interface Props {
  className?: string;
  stroke?: string;
}

const Export: React.FC<Props> = (props: Props) => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M2.5 12.5L12.5 12.5C13.0523 12.5 13.5 12.0523 13.5 11.5V5.48744C13.5 4.93516 13.0523 4.48744 12.5 4.48744L8.41176 4.48745C8.14799 4.48745 7.89491 4.38324 7.70762 4.19752L6.79237 3.28993C6.60509 3.10421 6.35201 3 6.08825 3H4C3.44772 3 3 3.44772 3 4V6.00001"
      stroke="#262A33"
    />
    <path d="M2.5 9L9 9L7 7" stroke="#262A33" strokeLinejoin="round" />
  </svg>
);

export default Export;
