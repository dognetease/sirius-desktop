import React from 'react';

const TransmitIcon = (props: any) => {
  const attribute = { ...props };
  delete attribute.stroke;
  const strokeColor = props.stroke || '#262A33';
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" {...attribute}>
      <path
        d="M2.5 5.5V5C2.22386 5 2 5.22386 2 5.5H2.5ZM2.5 10.5H2C2 10.7761 2.22386 11 2.5 11V10.5ZM8 10.5H8.5C8.5 10.2239 8.27614 10 8 10V10.5ZM8 13H7.5C7.5 13.1979 7.61673 13.3772 7.79772 13.4573C7.97871 13.5373 8.1899 13.5031 8.33634 13.37L8 13ZM13.5 8L13.8363 8.36997C13.9406 8.27521 14 8.14087 14 8C14 7.85913 13.9406 7.72479 13.8363 7.63003L13.5 8ZM8 3L8.33634 2.63003C8.1899 2.4969 7.97871 2.46268 7.79772 2.54274C7.61673 2.62281 7.5 2.80209 7.5 3H8ZM8 5.5V6C8.27614 6 8.5 5.77614 8.5 5.5H8ZM2 5.5V10.5H3V5.5H2ZM2.5 11H8V10H2.5V11ZM7.5 10.5V13H8.5V10.5H7.5ZM8.33634 13.37L13.8363 8.36997L13.1637 7.63003L7.66366 12.63L8.33634 13.37ZM13.8363 7.63003L8.33634 2.63003L7.66366 3.36997L13.1637 8.36997L13.8363 7.63003ZM7.5 3V5.5H8.5V3H7.5ZM8 5H2.5V6H8V5Z"
        fill={strokeColor}
      />
    </svg>
  );
};

export default TransmitIcon;