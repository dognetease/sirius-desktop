import React from 'react';
import { useRandomIds } from '../../../hooks/useRandomIds';

interface Props {
  width?: number;
  height?: number;
}

export const WeeklyReportIconSvg: React.FC<Props> = (props: Props) => {
  const ids = useRandomIds(7);
  const attribute = { width: 20, height: 20, ...props };
  return (
    <svg viewBox="0 0 18 19" fill="none" xmlns="http://www.w3.org/2000/svg" {...attribute}>
      <rect opacity="0.8" x="3.25" y="6.81982" width="11.45" height="9.77" rx="2" fill="#9ADFC1" />
      <g filter={`url(#${ids[0]})`}>
        <rect x="2" y="1.9502" width="14" height="12.7273" rx="2" fill={`url(#${ids[4]})`} />
      </g>
      <g filter={`url(#${ids[1]})`}>
        <rect x="6" y="0.875" width="1.27273" height="2.54545" rx="0.636364" fill={`url(#${ids[5]})`} />
      </g>
      <g filter={`url(#${ids[2]})`}>
        <rect x="11.0908" y="0.875" width="1.27273" height="2.54545" rx="0.636364" fill={`url(#${ids[6]})`} />
      </g>
      <g filter={`url(#${ids[3]})`}>
        <path d="M7.33274 6.67041H8.35325V5.64014H10.2429L7.83567 11.7388H8.97337L11.3855 5.64014V4.61963H7.33274V6.67041Z" fill="white" />
      </g>
      <defs>
        <filter id={ids[0]} x="0" y="1.9502" width="18" height="16.7271" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
          <feFlood flood-opacity="0" result="BackgroundImageFix" />
          <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
          <feOffset dy="2" />
          <feGaussianBlur stdDeviation="1" />
          <feComposite in2="hardAlpha" operator="out" />
          <feColorMatrix type="matrix" values="0 0 0 0 0.752014 0 0 0 0 0.991667 0 0 0 0 0.888958 0 0 0 0.38 0" />
          <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_548_13295" />
          <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_548_13295" result="shape" />
        </filter>
        <filter id={ids[1]} x="5" y="0.875" width="3.27246" height="4.54541" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
          <feFlood flood-opacity="0" result="BackgroundImageFix" />
          <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
          <feOffset dy="1" />
          <feGaussianBlur stdDeviation="0.5" />
          <feComposite in2="hardAlpha" operator="out" />
          <feColorMatrix type="matrix" values="0 0 0 0 0.234931 0 0 0 0 0.829167 0 0 0 0 0.572707 0 0 0 0.6 0" />
          <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_548_13295" />
          <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_548_13295" result="shape" />
        </filter>
        <filter id={ids[2]} x="10.0908" y="0.875" width="3.27246" height="4.54541" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
          <feFlood flood-opacity="0" result="BackgroundImageFix" />
          <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
          <feOffset dy="1" />
          <feGaussianBlur stdDeviation="0.5" />
          <feComposite in2="hardAlpha" operator="out" />
          <feColorMatrix type="matrix" values="0 0 0 0 0.234931 0 0 0 0 0.829167 0 0 0 0 0.572707 0 0 0 0.6 0" />
          <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_548_13295" />
          <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_548_13295" result="shape" />
        </filter>
        <filter id={ids[3]} x="7.33301" y="4.11963" width="4.05273" height="7.61914" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
          <feFlood flood-opacity="0" result="BackgroundImageFix" />
          <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
          <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
          <feOffset dy="-1" />
          <feGaussianBlur stdDeviation="0.25" />
          <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
          <feColorMatrix type="matrix" values="0 0 0 0 0.210084 0 0 0 0 0.749491 0 0 0 0 0.517488 0 0 0 0.2 0" />
          <feBlend mode="normal" in2="shape" result="effect1_innerShadow_548_13295" />
        </filter>
        <linearGradient id={ids[4]} x1="9" y1="1.9502" x2="9" y2="14.6775" gradientUnits="userSpaceOnUse">
          <stop stop-color="#99DCBF" />
          <stop offset="1" stop-color="#36BF84" />
        </linearGradient>
        <linearGradient id={ids[5]} x1="6.63636" y1="0.875" x2="6.63636" y2="3.42045" gradientUnits="userSpaceOnUse">
          <stop stop-color="#56C897" />
          <stop offset="1" stop-color="#B3FADB" />
        </linearGradient>
        <linearGradient id={ids[6]} x1="11.7272" y1="0.875" x2="11.7272" y2="3.42045" gradientUnits="userSpaceOnUse">
          <stop stop-color="#56C897" />
          <stop offset="1" stop-color="#B3FADB" />
        </linearGradient>
      </defs>
    </svg>
  );
};
