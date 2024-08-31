import { useRandomIds } from '../../../hooks/useRandomIds';
import React from 'react';

interface Props {
  width?: number;
  height?: number;
}

export const DailyReportIconSvg: React.FC<Props> = (props: Props) => {
  const ids = useRandomIds(8);
  const attribute = { width: 20, height: 20, ...props };
  return (
    <svg viewBox="0 0 18 19" fill="none" xmlns="http://www.w3.org/2000/svg" {...attribute}>
      <g opacity="0.8" filter={`url(#${ids[0]})`}>
        <rect x="3.27246" y="6.81641" width="11.4545" height="9.77455" rx="2" fill="#B4C6FF" />
      </g>
      <g filter={`url(#${ids[1]})`}>
        <rect x="2" y="1.9541" width="14" height="12.7273" rx="2" fill={`url(#${ids[5]})`} />
      </g>
      <g filter={`url(#${ids[2]})`}>
        <rect x="5.81738" y="1" width="1.27273" height="2.54545" rx="0.636364" fill={`url(#${ids[6]})`} />
      </g>
      <g filter={`url(#${ids[3]})`}>
        <rect x="10.9092" y="1" width="1.27273" height="2.54545" rx="0.636364" fill={`url(#${ids[7]})`} />
      </g>
      <g filter={`url(#${ids[4]})`}>
        <path d="M8.76341 5.95996V12H9.78391V4.88086H8.76341L7.75266 5.61816V6.70215L8.76341 5.95996Z" fill="white" />
      </g>
      <defs>
        <filter id={ids[0]} x="-16.7275" y="-13.1836" width="51.4541" height="49.7744" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
          <feFlood flood-opacity="0" result="BackgroundImageFix" />
          <feGaussianBlur in="BackgroundImage" stdDeviation="10" />
          <feComposite in2="SourceAlpha" operator="in" result="effect1_backgroundBlur_548_13281" />
          <feBlend mode="normal" in="SourceGraphic" in2="effect1_backgroundBlur_548_13281" result="shape" />
        </filter>
        <filter id={ids[1]} x="0" y="1.9541" width="18" height="16.7271" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
          <feFlood flood-opacity="0" result="BackgroundImageFix" />
          <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
          <feOffset dy="2" />
          <feGaussianBlur stdDeviation="1" />
          <feComposite in2="hardAlpha" operator="out" />
          <feColorMatrix type="matrix" values="0 0 0 0 0.921569 0 0 0 0 0.941176 0 0 0 0 1 0 0 0 0.51 0" />
          <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_548_13281" />
          <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_548_13281" result="shape" />
        </filter>
        <filter id={ids[2]} x="3.81738" y="0" width="5.27246" height="6.54541" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
          <feFlood flood-opacity="0" result="BackgroundImageFix" />
          <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
          <feOffset dy="1" />
          <feGaussianBlur stdDeviation="1" />
          <feComposite in2="hardAlpha" operator="out" />
          <feColorMatrix type="matrix" values="0 0 0 0 0.395833 0 0 0 0 0.565755 0 0 0 0 1 0 0 0 1 0" />
          <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_548_13281" />
          <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_548_13281" result="shape" />
        </filter>
        <filter id={ids[3]} x="8.90918" y="0" width="5.27246" height="6.54541" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
          <feFlood flood-opacity="0" result="BackgroundImageFix" />
          <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
          <feOffset dy="1" />
          <feGaussianBlur stdDeviation="1" />
          <feComposite in2="hardAlpha" operator="out" />
          <feColorMatrix type="matrix" values="0 0 0 0 0.395833 0 0 0 0 0.565755 0 0 0 0 1 0 0 0 1 0" />
          <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_548_13281" />
          <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_548_13281" result="shape" />
        </filter>
        <filter id={ids[4]} x="7.75293" y="4.38086" width="2.03125" height="7.61914" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
          <feFlood flood-opacity="0" result="BackgroundImageFix" />
          <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
          <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
          <feOffset dy="-1" />
          <feGaussianBlur stdDeviation="0.25" />
          <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
          <feColorMatrix type="matrix" values="0 0 0 0 0.845833 0 0 0 0 0.889228 0 0 0 0 1 0 0 0 1 0" />
          <feBlend mode="normal" in2="shape" result="effect1_innerShadow_548_13281" />
        </filter>
        <linearGradient id={ids[5]} x1="9" y1="1.9541" x2="9" y2="14.6814" gradientUnits="userSpaceOnUse">
          <stop stop-color="#9AB7FF" />
          <stop offset="1" stop-color="#5686FF" />
        </linearGradient>
        <linearGradient id={ids[6]} x1="6.45375" y1="1" x2="6.45375" y2="3.54545" gradientUnits="userSpaceOnUse">
          <stop stop-color="#95B3FF" />
          <stop offset="1" stop-color="#ECF1FF" />
        </linearGradient>
        <linearGradient id={ids[7]} x1="11.5455" y1="1" x2="11.5455" y2="3.54545" gradientUnits="userSpaceOnUse">
          <stop stop-color="#95B3FF" />
          <stop offset="1" stop-color="#ECF1FF" />
        </linearGradient>
      </defs>
    </svg>
  );
};
