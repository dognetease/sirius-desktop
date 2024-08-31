import React from 'react';

export interface Props {
  className?: string;
  stroke?: string;
}

const Search: React.FC<Props> = (props: Props) => {
  const strokeColor = props.stroke || '#262A33';
  const attribute = { ...props };
  delete attribute.stroke;
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" {...attribute}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M7 11.5C9.48528 11.5 11.5 9.48528 11.5 7C11.5 4.51472 9.48528 2.5 7 2.5C4.51472 2.5 2.5 4.51472 2.5 7C2.5 9.48528 4.51472 11.5 7 11.5Z"
        stroke={strokeColor}
        strokeOpacity="0.3"
      />
      <path d="M10.5 10.5L13.6433 13.6433" stroke={strokeColor} strokeOpacity="0.3" strokeLinejoin="round" />
    </svg>
  );
};

export default Search;
