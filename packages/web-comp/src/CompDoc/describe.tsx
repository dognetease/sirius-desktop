import React from 'react';
import ReactMarkdown from 'react-markdown';

export interface DescribeProps {
  describe: string;
}

export const Describe: React.FC<DescribeProps> = props => {
  const { describe } = props;

  return (
    <div style={{ padding: '15px' }}>
      <ReactMarkdown>{describe}</ReactMarkdown>
    </div>
  );
};

export default Describe;
