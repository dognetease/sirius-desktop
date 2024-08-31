import React from 'react';

interface MailTagIconProp {
  strokeColor?: string;
  checked?: boolean;
  className?: string;
}

interface MailTagCheckedIconProp {
  strokeColor?: string;
  className?: string;
}

export const MailTagIcon: React.FC<MailTagIconProp> = props => {
  const { strokeColor = '#AA90F4', className, checked = false } = props;
  return (
    <svg width="12" height="14" viewBox="0 0 12 14" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path
        d="M11 11.727C11 12.3165 10.3842 12.7036 9.85302 12.4479L6.34698 10.7602C6.1277 10.6547 5.8723 10.6547 5.65302 10.7602L2.14699 12.4479C1.61585 12.7036 1 12.3165 1 11.7271L1 1.8C1 1.35817 1.35817 1 1.8 1L10.2 0.999999C10.6418 0.999999 11 1.35817 11 1.8L11 11.727Z"
        stroke={strokeColor}
        fill={checked ? strokeColor : undefined}
        strokeWidth="1.2"
      />
    </svg>
  );
};

export const AddTagIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M11.4813 5.06895H6.51586V0.517326C6.51586 0.232586 6.2833 0 5.99859 0C5.71388 0 5.48132 0.232586 5.48132 0.517326V5.06895H0.517266C0.232558 5.06895 0 5.30154 0 5.58628C0 5.87102 0.232558 6.10361 0.517266 6.10361H5.48273V11.4827C5.48273 11.7674 5.71529 12 6 12C6.28471 12 6.51727 11.7674 6.51727 11.4827V6.10361H11.4827C11.7674 6.10361 12 5.87102 12 5.58628C11.9986 5.30154 11.766 5.06895 11.4813 5.06895Z"
      fill="#939498"
    />
  </svg>
);

export const TagCheckedIcon: React.FC<MailTagCheckedIconProp> = props => {
  const { strokeColor = '#fff', className } = props;
  return (
    <svg width="14" height="11" viewBox="0 0 14 11" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M13 1L5 9L1 5" stroke={strokeColor} strokeWidth="2.42424" strokeLinejoin="round" />
    </svg>
  );
};

export const TagCheckedIconInMenu: React.FC<{ className?: string }> = props => {
  const { className } = props;
  return (
    <svg width="12" height="8" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M1 3.4L4.75 7L11 1" stroke="#386EE7" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
};
