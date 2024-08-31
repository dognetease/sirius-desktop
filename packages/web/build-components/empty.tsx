import React from 'react';

const Empty: React.FC = () => (
  <div style={{ display: process.env.NODE_ENV === 'development' ? 'block' : 'none' }}>{process.env.NODE_ENV === 'development' ? 'empty' : ''}</div>
);

export default Empty;
