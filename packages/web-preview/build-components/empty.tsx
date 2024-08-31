import React from 'react';

const Empty: React.FC = () => <div>{process.env.NODE_ENV === 'development' ? 'empty' : ''}</div>;

export default Empty;
