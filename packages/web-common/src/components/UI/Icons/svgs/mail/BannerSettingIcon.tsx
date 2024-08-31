import React from 'react';

export interface Props {
  className?: string;
  stroke?: string;
  width?: number;
  height?: number;
}
const BannerSettingIcon: React.FC<Props> = (props: Props) => {
  const attribute = { ...props };
  delete attribute.stroke;
  // const strokeColor = props.stroke || '#939CAD';
  return (
    <svg width="144" height="88" viewBox="0 0 144 88" fill="none" xmlns="http://www.w3.org/2000/svg" {...attribute}>
      <path d="M0 2C0 0.895429 0.895431 0 2 0H142C143.105 0 144 0.895431 144 2V86C144 87.1046 143.105 88 142 88H2C0.895431 88 0 87.1046 0 86V2Z" fill="white" />
      <rect x="4" y="7" width="24" height="2" rx="1" fill="#F0F3F5" />
      <rect x="4" y="15" width="24" height="2" rx="1" fill="#F0F3F5" />
      <rect x="4" y="23" width="24" height="2" rx="1" fill="#F0F3F5" />
      <rect x="4" y="31" width="24" height="2" rx="1" fill="#F0F3F5" />
      <rect x="4" y="39" width="24" height="2" rx="1" fill="#F0F3F5" />
      <rect x="4" y="47" width="24" height="2" rx="1" fill="#F0F3F5" />
      <rect x="4" y="55" width="24" height="2" rx="1" fill="#F0F3F5" />
      <rect x="4" y="63" width="24" height="2" rx="1" fill="#F0F3F5" />
      <rect x="4" y="71" width="24" height="2" rx="1" fill="#F0F3F5" />
      <rect x="4" y="79" width="24" height="2" rx="1" fill="#F0F3F5" />
      <rect x="32" y="7" width="108" height="2" rx="1" fill="#F0F3F5" />
      <rect x="32" y="15" width="108" height="2" rx="1" fill="#F0F3F5" />
      <rect x="32" y="23" width="108" height="2" rx="1" fill="#F0F3F5" />
      <rect x="32" y="31" width="108" height="2" rx="1" fill="#F0F3F5" />
      <rect x="32" y="39" width="108" height="2" rx="1" fill="#F0F3F5" />
      <rect x="32" y="47" width="108" height="2" rx="1" fill="#F0F3F5" />
      <rect x="32" y="55" width="108" height="2" rx="1" fill="#F0F3F5" />
      <rect x="32" y="63" width="108" height="2" rx="1" fill="#F0F3F5" />
      <rect x="32" y="71" width="108" height="2" rx="1" fill="#F0F3F5" />
      <rect x="32" y="79" width="108" height="2" rx="1" fill="#F0F3F5" />
    </svg>
  );
};

export default BannerSettingIcon;
