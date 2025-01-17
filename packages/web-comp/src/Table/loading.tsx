import React from 'react';

const Loading: React.FC<any> = () => {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M12 3C7.02945 3 3 7.02945 3 12C3 16.9706 7.02945 21 12 21C16.9706 21 21.0001 16.9706 21.0001 12C21.0001 7.02945 16.9706 3 12 3Z"
        stroke="#B7C3FF"
        stroke-width="3"
      />
      <path d="M12 3C7.02945 3 3 7.02945 3 12C3 15.5708 5.07957 18.656 8.09369 20.1104" stroke="#4C6AFF" stroke-width="3" stroke-linecap="round" />
    </svg>
  );
};

export default Loading;
