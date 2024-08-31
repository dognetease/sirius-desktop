import React from 'react';

export interface Props {
  className?: string;
  stroke?: string;
}

const Export: React.FC<Props> = (props: Props) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M17 7.3125V5.5C17 4.94772 16.5523 4.5 16 4.5H7.76923H6C5.44772 4.5 5 4.94772 5 5.5V12V18.5C5 19.0523 5.44772 19.5 6 19.5H14H16C16.5523 19.5 17 19.0523 17 18.5V17.1562"
      stroke="#262A33"
      strokeWidth="1.5"
    />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M16.9811 15.4311L19.9315 12.4807C20.2243 12.1878 20.2243 11.713 19.9315 11.4201L16.9811 8.46969L15.9204 9.53035L17.64 11.25H9V12.75H17.5409L15.9204 14.3705L16.9811 15.4311Z"
      fill="#262A33"
    />
  </svg>
);

export default Export;
