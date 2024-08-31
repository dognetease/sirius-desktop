import React from 'react';

const OriginalIcon: React.FC<any> = (props: any) => {
  const attribute = { ...props };
  const stroke = attribute.stroke || '#3C3F47';
  delete attribute.stroke;
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" {...attribute}>
      <rect x="3" y="4.5" width="18" height="15" rx="1" stroke={stroke} strokeWidth="1.5" />
      <path
        d="M10.25 10C10.25 10.9665 9.4665 11.75 8.5 11.75C7.5335 11.75 6.75 10.9665 6.75 10C6.75 9.0335 7.5335 8.25 8.5 8.25C9.4665 8.25 10.25 9.0335 10.25 10Z"
        stroke={stroke}
        strokeWidth="1.5"
      />
      <path d="M9 19.5L16.0857 12.8231C16.2783 12.6416 16.5789 12.6416 16.7715 12.8231L21 16.8077" stroke={stroke} strokeWidth="1.5" />
    </svg>
  );
};

export default OriginalIcon;
