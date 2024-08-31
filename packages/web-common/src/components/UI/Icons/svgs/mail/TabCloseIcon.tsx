import React from 'react';

export interface Props {
  className?: string;
  stroke?: string;
}
const TabCloseIcon: React.FC<Props> = (props: Props) => {
  const attribute = { ...props };
  delete attribute.stroke;
  const strokeColor = props.stroke || '#939CAD';
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" {...attribute}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M7 14C10.866 14 14 10.866 14 7C14 3.13401 10.866 0 7 0C3.13401 0 0 3.13401 0 7C0 10.866 3.13401 14 7 14ZM10.0003 4C9.76599 3.76569 9.38609 3.76569 9.15178 4L7.00021 6.15157L4.84875 4.00011C4.61444 3.76579 4.23454 3.76579 4.00022 4.00011C3.76591 4.23442 3.76591 4.61432 4.00022 4.84864L6.15168 7.0001L4 9.15179C3.76569 9.3861 3.76569 9.766 4 10.0003C4.23431 10.2346 4.61421 10.2346 4.84853 10.0003L7.00021 7.84863L9.152 10.0004C9.38631 10.2347 9.76621 10.2347 10.0005 10.0004C10.2348 9.76611 10.2348 9.38621 10.0005 9.15189L7.84874 7.0001L10.0003 4.84853C10.2346 4.61421 10.2346 4.23431 10.0003 4Z"
        fill={strokeColor}
      />
    </svg>
  );
};

export default TabCloseIcon;
