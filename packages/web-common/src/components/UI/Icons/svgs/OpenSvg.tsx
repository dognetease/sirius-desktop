import React, { useState, useEffect } from 'react';

const OpenIcon: React.FC<any> = (props: any) => {
  const attribute = { ...props };
  delete attribute.stroke;
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" {...attribute}>
      <path
        d="M13.1172 14H2.88278C2.37846 14 1.95306 13.6245 1.8905 13.124L1.0843 6.67442C1.03954 6.31631 1.31877 6 1.67967 6H14.3203C14.6812 6 14.9605 6.31631 14.9157 6.67442L14.1095 13.124C14.0469 13.6245 13.6215 14 13.1172 14Z"
        stroke="#3C3F47"
      />
      <path
        d="M2 6V3C2 2.44772 2.44772 2 3 2H5.58579C5.851 2 6.10536 2.10536 6.29289 2.29289L6.70711 2.70711C6.89464 2.89464 7.149 3 7.41421 3H13C13.5523 3 14 3.44772 14 4V6"
        stroke="#3C3F47"
      />
    </svg>
  );
};

export default OpenIcon;
