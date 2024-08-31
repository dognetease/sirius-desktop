import React, { useState, useEffect } from 'react';

const EmlIcon = (props: any) => {
  const attribute = { ...props };
  delete attribute.stroke;

  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...attribute}>
      <path
        d="M4.66667 0H16.6667L22 5.33333V21.3333C22 22.8061 20.8061 24 19.3333 24H4.66667C3.19391 24 2 22.8061 2 21.3333V2.66667C2 1.19391 3.19391 0 4.66667 0Z"
        fill="#6495ED"
      />
      <path d="M16.6667 4V0L22.0001 5.33333H18.0001C17.2637 5.33333 16.6667 4.73638 16.6667 4Z" fill="white" fillOpacity="0.5" />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M7 8C6.44772 8 6 8.44772 6 9V17C6 17.5523 6.44772 18 7 18H17C17.5523 18 18 17.5523 18 17V9C18 8.44772 17.5523 8 17 8H7ZM7.98167 9.2H16.0183C16.612 9.2 16.8451 9.96993 16.3512 10.2992L12.3328 12.9781C12.1313 13.1125 11.8687 13.1125 11.6672 12.9781L7.64884 10.2992C7.1549 9.96993 7.38802 9.2 7.98167 9.2Z"
        fill="white"
      />
      <defs>
        <linearGradient id="paint0_linear_28337_196164" x1="2" y1="24" x2="22" y2="-8.49366e-07" gradientUnits="userSpaceOnUse">
          <stop stopColor="#386EE7" />
          <stop offset="1" stopColor="#83A9FF" />
        </linearGradient>
      </defs>
    </svg>
  );
};

export default EmlIcon;
