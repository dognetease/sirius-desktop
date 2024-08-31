import React from 'react';

export interface Props {
  className?: string;
  stroke?: string;
}

const BackArrow: React.FC<Props> = (props: Props) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M8.70711 11.2929L9.41421 12L8.70711 11.2929ZM16.7071 19.2929L9.41421 12L8 13.4142L15.2929 20.7071L16.7071 19.2929ZM9.41421 12L16.7071 4.70711L15.2929 3.29289L8 10.5858L9.41421 12ZM9.41421 12L9.41421 12L8 10.5858C7.21895 11.3668 7.21895 12.6332 8 13.4142L9.41421 12Z"
      fill="#262A33"
    />
  </svg>
);

export default BackArrow;
