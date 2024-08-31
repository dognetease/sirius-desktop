import React from 'react';

export interface Props {
  className?: string;
  stroke?: string;
}
const ResetSearch: React.FC<Props> = (props: Props) => {
  const attribute = { ...props };
  delete attribute.stroke;
  const strokeColor = props.stroke || '#386ee7';
  return (
    <svg width="13" height="12" viewBox="0 0 13 12" fill="none" xmlns="http://www.w3.org/2000/svg" {...attribute}>
      <path
        d="M2.6543 4.71205C2.80499 4.14516 3.05279 3.61784 3.37879 3.14898C4.28186 1.85018 5.78507 1 7.48685 1C10.2483 1 12.4868 3.23858 12.4868 6C12.4868 8.76142 10.2483 11 7.48685 11C6.36124 11 5.32251 10.6281 4.48685 10.0004C4.36461 9.90855 4.24672 9.81126 4.13353 9.70886"
        stroke={strokeColor}
      />
      <path d="M2.02963 7.30747L1.12107 3.91668L4.51186 4.82524L2.02963 7.30747Z" fill={strokeColor} />
    </svg>
  );
};

export default ResetSearch;
