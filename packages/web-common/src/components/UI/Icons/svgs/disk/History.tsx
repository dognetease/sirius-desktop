import React from 'react';

export interface Props {
  className?: string;
  stroke?: string;
}

const History: React.FC<Props> = (props: Props) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      fill-rule="evenodd"
      clip-rule="evenodd"
      d="M18.5 12C18.5 15.3137 15.8137 18 12.5 18C10.9704 18 9.57443 17.4276 8.51469 16.4853L7.45256 17.5474C8.78499 18.7605 10.5561 19.5 12.5 19.5C16.6421 19.5 20 16.1421 20 12C20 7.85786 16.6421 4.5 12.5 4.5C8.35786 4.5 5 7.85786 5 12H6.5C6.5 8.68629 9.18629 6 12.5 6C15.8137 6 18.5 8.68629 18.5 12Z"
      fill="#394259"
    />
    <path d="M8.5 12L5.7498 15L3 12L8.5 12Z" fill="#394259" />
    <path d="M12 8.5V13H15" stroke="#394259" stroke-width="1.5" />
  </svg>
);

export default History;
