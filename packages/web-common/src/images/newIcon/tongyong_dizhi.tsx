import React from 'react';

const TongyongDizhi: React.FC<any> = (props: any) => {
  const attribute = { ...props };
  const stroke = attribute.stroke || '#3F465C';
  delete attribute.stroke;
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" {...attribute}>
      <path
        d="M4.06308 10.0216C2.33162 7.97435 2.4581 4.94178 4.35402 3.04587V3.04587C6.36764 1.03225 9.63236 1.03225 11.646 3.04587V3.04587C13.5419 4.94178 13.6684 7.97435 11.9369 10.0216L8.10076 14.5573C8.04805 14.6196 7.95195 14.6196 7.89923 14.5573L4.06308 10.0216Z"
        stroke={stroke}
      />
      <circle cx="8" cy="6.6001" r="2" stroke={stroke} />
    </svg>
  );
};

export default TongyongDizhi;
