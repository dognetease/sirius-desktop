import React from 'react';

interface Props {
  width?: number;
  height?: number;
  active?: boolean;
}

export const ManageIconSvg: React.FC<Props> = (props: Props) => {
  const attribute = { width: 20, height: 20, ...props };
  const defaultStroke = '#626E85';
  const activeStroke = '#326CFE';
  const stroke = props.active ? activeStroke : defaultStroke;
  return (
    <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" {...attribute}>
      <rect x="2" y="2" width="5" height="12" rx="0.8" stroke={stroke} stroke-width="1.2" />
      <rect x="9" y="2" width="5" height="5" rx="0.8" stroke={stroke} stroke-width="1.2" />
      <rect x="9" y="9" width="5" height="5" rx="0.8" stroke={stroke} stroke-width="1.2" />
    </svg>
  );
};
