import React from 'react';

export interface Props {
  className?: string;
  stroke?: string;
}

const RecycleBin: React.FC<Props> = (props: Props) => {
  const strokeColor = props.stroke || '#262A33';
  const attribute = { ...props };
  delete attribute.stroke;
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" {...attribute}>
      <path
        fill-rule="evenodd"
        clip-rule="evenodd"
        d="M15 4.10039H1V2.90039H15V4.10039ZM3.6 5.00045V13.2005C3.6 13.3109 3.68954 13.4005 3.8 13.4005H12.2C12.3105 13.4005 12.4 13.3109 12.4 13.2005V5.00045H13.6V13.2005C13.6 13.9736 12.9732 14.6005 12.2 14.6005H3.8C3.0268 14.6005 2.4 13.9736 2.4 13.2005V5.00045H3.6ZM7.4 6.00045V11.0005H8.6V6.00045H7.4Z"
        fill={strokeColor}
      />
      <path
        d="M5 3.5L5.46213 1.65149C5.48439 1.56246 5.56438 1.5 5.65616 1.5H10.3438C10.4356 1.5 10.5156 1.56246 10.5379 1.65149L11 3.5"
        stroke={strokeColor}
        strokeOpacity="0.9"
      />
    </svg>
  );
};

export default RecycleBin;
