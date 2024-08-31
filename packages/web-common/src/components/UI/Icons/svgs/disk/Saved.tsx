import React from 'react';

export interface Props {
  className?: string;
  stroke?: string;
}

const Saved: React.FC<Props> = (props: Props) => {
  const { stroke } = props;
  const attribute = { ...props };
  delete attribute.stroke;
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" {...attribute}>
      <path
        d="M11.5 6C11.5 9.03757 9.03757 11.5 6 11.5C2.96243 11.5 0.5 9.03757 0.5 6C0.5 2.96243 2.96243 0.5 6 0.5C9.03757 0.5 11.5 2.96243 11.5 6Z"
        stroke={stroke || '#999999'}
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M8.84915 4.82243C8.92508 4.90265 8.92161 5.02924 8.8414 5.10517L5.63863 8.13703C5.54486 8.22579 5.41929 8.27303 5.29027 8.26809C5.16125 8.26315 5.03966 8.20643 4.95296 8.11076L3.68874 6.71564C3.61457 6.63379 3.6208 6.50731 3.70265 6.43313L4.11762 6.0571C4.19947 5.98293 4.32595 5.98916 4.40012 6.07101L5.33492 7.10261L8.18143 4.408C8.26165 4.33207 8.38823 4.33554 8.46417 4.41575L8.84915 4.82243Z"
        fill={stroke || '#409FFF'}
      />
    </svg>
  );
};

export default Saved;
