import React, { CSSProperties } from 'react';

const VideoPlayBtn: React.FC<{
  style?: CSSProperties;
}> = props => {
  const { style = {} } = props;

  return (
    <div style={{ ...style }}>
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="20" fill="#3F465C" fillOpacity="0.5" />
        <path
          d="M17.5069 13.3631C16.9394 12.8766 16.0625 13.2799 16.0625 14.0274L16.0625 25.9726C16.0625 26.7201 16.9394 27.1234 17.5069 26.6369L24.4749 20.6643C24.8823 20.3151 24.8823 19.6849 24.4749 19.3356L17.5069 13.3631Z"
          fill="white"
        />
      </svg>
    </div>
  );
};

export default VideoPlayBtn;
