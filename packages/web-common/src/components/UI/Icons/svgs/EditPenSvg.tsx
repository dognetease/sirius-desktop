import React from 'react';

const EditPenIcon: React.FC<any> = (props: any) => {
  const strokeColor = props.stroke || '#A8AAAD';
  const attribute = { ...props };
  delete attribute.stroke;
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" {...attribute}>
      <path d="M2 14.5H14" stroke={strokeColor} stroke-width="1.2" />
      <path
        fill-rule="evenodd"
        clip-rule="evenodd"
        d="M9.75579 3.05459L10.4987 2.31161L12.688 4.501L11.9451 5.24395L9.75579 3.05459ZM9.05456 3.75585L3.40133 9.40942L3.27254 11.7276L5.59055 11.5988L11.2438 5.94521L9.05456 3.75585ZM11.1567 1.27258C10.7933 0.909142 10.2041 0.909141 9.84068 1.27258L2.47999 8.63371C2.3181 8.7956 2.22158 9.01149 2.20888 9.24008L2.0372 12.3306L2 13.0002L2.66956 12.963L5.7599 12.7913C5.98851 12.7786 6.20441 12.682 6.36631 12.5201L13.727 5.15899C14.0904 4.79559 14.0904 4.20641 13.727 3.84301L11.1567 1.27258Z"
        fill={strokeColor}
      />
    </svg>
  );
};

export default EditPenIcon;
