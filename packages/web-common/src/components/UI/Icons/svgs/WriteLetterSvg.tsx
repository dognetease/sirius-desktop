import React from 'react';

const WriteLetterIcon: React.FC<any> = (props: any) => {
  const strokeColor = props.stroke || '#262A33';
  const attribute = { ...props };
  delete attribute.stroke;
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" {...attribute}>
      <path d="M3 13H13" stroke={strokeColor} />
      <path
        d="M9.77145 2.6611C9.96671 2.46584 10.2833 2.46584 10.4786 2.6611L11.8928 4.07531C12.088 4.27058 12.088 4.58716 11.8928 4.78242L6.1998 10.4754C5.93319 10.742 5.57596 10.8984 5.19922 10.9135L3.57524 10.9786L3.64034 9.35465C3.65545 8.97792 3.81187 8.62068 4.07848 8.35408L9.77145 2.6611Z"
        stroke={strokeColor}
      />
    </svg>
  );
};

export default WriteLetterIcon;
