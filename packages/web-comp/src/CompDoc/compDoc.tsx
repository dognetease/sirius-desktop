import React from 'react';
import './index.scss';

export interface CompDocProps {
  children: React.ReactNode;
}

export const ICompDoc: React.FC<CompDocProps> = props => {
  const { children } = props;
  return <div className="comp-doc-box">{children}</div>;
};

export default ICompDoc;
