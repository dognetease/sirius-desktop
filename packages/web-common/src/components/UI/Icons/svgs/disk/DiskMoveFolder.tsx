import React from 'react';

export interface Props {
  className?: string;
  stroke?: string;
}

const DiskMoveFolder: React.FC<Props> = (props: Props) => {
  const strokeColor = props.stroke || '#3C3F47';
  const attribute = { ...props };
  delete attribute.stroke;
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M14 5.5C14 4.94772 13.5523 4.5 13 4.5H7.91421C7.51639 4.5 7.13486 4.34196 6.85355 4.06066L5.93934 3.14645C5.84557 3.05268 5.71839 3 5.58579 3H3.00001C2.44772 3 2.00001 3.44771 2.00001 4V12C2.00001 12.5523 2.44772 13 3.00001 13H13C13.5523 13 14 12.5523 14 12V5.5Z"
        stroke={strokeColor}
        strokeLinecap="round"
      />
      <path d="M4.5 7.5L8.5 7.5" stroke={strokeColor} />
    </svg>
  );
};

export default DiskMoveFolder;