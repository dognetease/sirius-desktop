import React from 'react';

export interface Props {
  className?: string;
  stroke?: string;
}

const UploadBtn: React.FC<Props> = (props: Props) => {
  const strokeColor = props.stroke || '#fff';
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M16 0H0V16H16V0Z" fill="white" fillOpacity="0.01" />
      <g mask="url(#mask0)">
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M7.9986 2.5C8.12703 2.49964 8.25557 2.54846 8.35355 2.64645L11.3536 5.64645C11.5488 5.84171 11.5488 6.15829 11.3536 6.35355C11.1583 6.54882 10.8417 6.54882 10.6464 6.35355L8.49719 4.2043V9.5C8.49719 9.77614 8.27333 10 7.99719 10C7.72105 10 7.49719 9.77614 7.49719 9.5V4.20991L5.35355 6.35355C5.15829 6.54882 4.84171 6.54882 4.64645 6.35355C4.45118 6.15829 4.45118 5.84171 4.64645 5.64645L7.61347 2.67942C7.70519 2.56976 7.84304 2.5 7.99719 2.5C7.99766 2.5 7.99813 2.5 7.9986 2.5ZM13 8.5C13.2761 8.5 13.5 8.72386 13.5 9V13C13.5 13.2761 13.2761 13.5 13 13.5H3C2.72386 13.5 2.5 13.2761 2.5 13V9.00184C2.5 8.7257 2.72386 8.50184 3 8.50184C3.27614 8.50184 3.5 8.7257 3.5 9.00184V12.5H12.5V9C12.5 8.72386 12.7239 8.5 13 8.5Z"
          fill={strokeColor}
        />
      </g>
    </svg>
  );
};

export default UploadBtn;
