import React from 'react';

export interface Props {
  className?: string;
  // stroke?: string
}

const CloseCircle: React.FC<Props> = (props: Props) => {
  // const strokeColor = props.stroke || '#262A33';
  const attribute = { ...props };
  delete attribute.stroke;
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" {...attribute}>
      <circle cx="8" cy="8" r="8" fill="black" fillOpacity="0.16" />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M7.99848 8.70642L5.20711 11.4978L4.5 10.7907L7.29137 7.99931L4.50112 5.20906L5.20823 4.50195L7.99848 7.2922L10.7907 4.5L11.4978 5.20711L8.70558 7.99931L11.4989 10.7926L10.7918 11.4997L7.99848 8.70642Z"
        fill="white"
      />
    </svg>
  );
};

export default CloseCircle;
