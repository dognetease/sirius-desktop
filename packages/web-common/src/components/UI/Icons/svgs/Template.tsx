import React, { useEffect, useState } from 'react';

const TemplateIcon = () => {
  // 多个 svg 中 linearGradient id 碰撞会导致失效. 这里用随机生成的 id 避免碰撞
  // https://stackoverflow.com/questions/57839033/problems-with-svg-fill-url
  const [id, setId] = useState('');
  useEffect(() => {
    const randomId = `TemplateIcon-${Math.random()}`;
    setId(randomId);
  }, []);
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="16" height="16" rx="2.19" fill={`url(#${id})`} />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        // eslint-disable-next-line max-len
        d="M7 4.5C7.27614 4.5 7.5 4.72386 7.5 5V7C7.5 7.27614 7.27614 7.5 7 7.5H5C4.72386 7.5 4.5 7.27614 4.5 7V5C4.5 4.72386 4.72386 4.5 5 4.5H7ZM7 8.5C7.27614 8.5 7.5 8.72386 7.5 9V11C7.5 11.2761 7.27614 11.5 7 11.5H5C4.72386 11.5 4.5 11.2761 4.5 11V9C4.5 8.72386 4.72386 8.5 5 8.5H7ZM11.5 5C11.5 4.72386 11.2761 4.5 11 4.5H9C8.72386 4.5 8.5 4.72386 8.5 5V7C8.5 7.27614 8.72386 7.5 9 7.5H11C11.2761 7.5 11.5 7.27614 11.5 7V5ZM11 8.5C11.2761 8.5 11.5 8.72386 11.5 9V11C11.5 11.2761 11.2761 11.5 11 11.5H9C8.72386 11.5 8.5 11.2761 8.5 11V9C8.5 8.72386 8.72386 8.5 9 8.5H11Z"
        fill="white"
      />
      <defs>
        <linearGradient id={id} x1="13.4124" y1="2.23505" x2="2.57268" y2="21.0036" gradientUnits="userSpaceOnUse">
          <stop stopColor="#A68CFF" />
          <stop offset="0.773493" stopColor="#9373FF" />
        </linearGradient>
      </defs>
    </svg>
  );
};
export default TemplateIcon;
