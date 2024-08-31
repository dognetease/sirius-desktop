import React from 'react';

interface Props {
  width?: number;
  height?: number;
  active?: boolean;
}

export const DetailIconSvg: React.FC<Props> = (props: Props) => {
  const attribute = { width: 20, height: 20, ...props };
  const defaultStroke = '#626E85';
  const activeStroke = '#326CFE';
  const stroke = props.active ? activeStroke : defaultStroke;
  return (
    <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" {...attribute}>
      <path d="M8 14H3.3C2.85817 14 2.5 13.6418 2.5 13.2V2.8C2.5 2.35817 2.85817 2 3.3 2H12.7C13.1418 2 13.5 2.35817 13.5 2.8V8" stroke={stroke} stroke-width="1.2" />
      <circle cx="11" cy="11" r="2" stroke={stroke} stroke-width="1.2" />
      <path d="M12 12L14 14" stroke={stroke} stroke-width="1.2" />
      <path d="M5 5H11" stroke={stroke} stroke-width="1.2" />
      <path d="M5 8H8" stroke={stroke} stroke-width="1.2" />
    </svg>
  );
};
