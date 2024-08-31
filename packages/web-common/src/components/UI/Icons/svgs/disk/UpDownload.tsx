import React from 'react';

export interface Props {
  className?: string;
  stroke?: string;
}

export const BoldUpload: React.FC<Props> = (props: Props) => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2 10V13C2 13.5523 2.44772 14 3 14H13C13.5523 14 14 13.5523 14 13V10" stroke="#3C3F47" strokeWidth="1.5" />
    <path d="M7.99992 12L7.99988 3M7.99988 3L3.83325 7.00004M7.99988 3L12.1666 7.00004" stroke="#3C3F47" strokeWidth="1.5" />
  </svg>
);

export const BoldDownload: React.FC<Props> = (props: Props) => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2 10V13C2 13.5523 2.44772 14 3 14H13C13.5523 14 14 13.5523 14 13V10" stroke="#3C3F47" strokeWidth="1.6" />
    <path d="M7.99984 1.99996L7.99988 11M7.99988 11L12.1665 6.99996M7.99988 11L3.83317 6.99996" stroke="#3C3F47" strokeWidth="1.6" />
  </svg>
);

export const Upload: React.FC<Props> = (props: Props) => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M16 0H0V16H16V0Z" fill="white" fillOpacity="0.01" />
    <mask id="mask0" mask-type="alpha" maskUnits="userSpaceOnUse" x="0" y="0" width="16" height="16">
      <path d="M16 0H0V16H16V0Z" fill="#AD5757" />
    </mask>
    <g mask="url(#mask0)">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M7.64645 2.64645C7.84171 2.45118 8.15829 2.45118 8.35355 2.64645L11.3536 5.64645L11.7071 6L11 6.70711L10.6464 6.35355L8.49719 4.2043V9.5H7.49719V4.20991L5.35355 6.35355L5 6.70711L4.29289 6L4.64645 5.64645L7.64645 2.64645ZM13.5 8.5V9V12C13.5 12.8284 12.8284 13.5 12 13.5H4C3.17157 13.5 2.5 12.8284 2.5 12V9.00184V8.50184H3.5V9.00184V12C3.5 12.2761 3.72386 12.5 4 12.5H12C12.2761 12.5 12.5 12.2761 12.5 12V9V8.5H13.5Z"
        fill="#262A33"
        fillOpacity="0.9"
      />
    </g>
  </svg>
);
