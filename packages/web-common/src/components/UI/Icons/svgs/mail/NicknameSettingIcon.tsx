import React from 'react';

export interface Props {
  className?: string;
  stroke?: string;
}
const NicknameSettingIcon: React.FC<Props> = (props: Props) => {
  const attribute = { ...props };
  delete attribute.stroke;
  const strokeColor = props.stroke || '#7D8085';
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" {...attribute}>
      <path
        d="M7.6 1.23094C7.84752 1.08803 8.15248 1.08803 8.4 1.23094L13.6622 4.26906C13.9097 4.41197 14.0622 4.67607 14.0622 4.96188V11.0381C14.0622 11.3239 13.9097 11.588 13.6622 11.7309L8.4 14.7691C8.15248 14.912 7.84752 14.912 7.6 14.7691L2.33782 11.7309C2.0903 11.588 1.93782 11.3239 1.93782 11.0381V4.96188C1.93782 4.67607 2.0903 4.41197 2.33782 4.26906L7.6 1.23094Z"
        stroke={strokeColor}
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="8" cy="8" r="2" stroke={strokeColor} strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
};

export default NicknameSettingIcon;
