import { inWindow } from 'api';
import React from 'react';

// eslint-disable-next-line react/prop-types
export default ({ children }) => (inWindow() ? <div>{children}</div> : null);
