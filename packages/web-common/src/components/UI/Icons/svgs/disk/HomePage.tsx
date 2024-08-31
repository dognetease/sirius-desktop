import React from 'react';

export interface Props {
  className?: string;
  stroke?: string;
}

const HomePage: React.FC<Props> = (props: Props) => (
  // const attribute = Object.assign({}, props);
  // delete attribute.stroke;
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 5.33337V13.2C3 13.6419 3.35817 14 3.8 14H12.2C12.6418 14 13 13.6419 13 13.2V5.33337" stroke="#7D8085" strokeWidth="1.2" strokeLinejoin="round" />
    <path
      d="M9.6665 14L9.6665 11.4667C9.6665 11.0248 9.30833 10.6667 8.8665 10.6667L7.13317 10.6667C6.69134 10.6667 6.33317 11.0248 6.33317 11.4667L6.33317 14"
      stroke="#7D8085"
      strokeWidth="1.2"
      strokeLinejoin="round"
    />
    <path d="M1.3335 6.66667L7.80901 2.13381C7.92378 2.05347 8.07654 2.05347 8.19132 2.13381L14.6668 6.66667" stroke="#7D8085" strokeWidth="1.2" />
  </svg>
);
export default HomePage;
