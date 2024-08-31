import React, { CSSProperties } from 'react';

const VideoPlayBtn: React.FC<{
  style?: CSSProperties;
}> = props => {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M1.7729 1.95787C2.04013 1.02903 3.01127 0.512073 3.93106 0.808933C6.38599 1.60125 8.57941 2.9756 10.3487 4.76936C11.0086 5.43843 11.0086 6.5022 10.3487 7.17127C8.52883 9.0163 6.26024 10.4176 3.7199 11.1982C2.77371 11.489 1.79265 10.9246 1.56842 9.96051C1.29885 8.80145 1.15633 7.59362 1.15633 6.35251C1.15633 4.82783 1.37142 3.35338 1.7729 1.95787Z"
        fill="white"
      />
    </svg>
  );
};

export default VideoPlayBtn;
