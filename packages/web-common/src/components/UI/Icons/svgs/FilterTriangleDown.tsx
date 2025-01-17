import React from 'react';

const FilterTriangleDown: React.FC<any> = (props: any) => {
  const attribute = { ...props };
  const pathFill = attribute.pathFill || '#6F7485';
  return (
    <svg width="8" height="6" viewBox="0 0 8 6" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M0.207482 1.57539C-0.0705204 1.25106 0.159934 0.749999 0.587111 0.749999L7.41289 0.75C7.84007 0.75 8.07052 1.25106 7.79252 1.5754L4.37963 5.5571C4.18008 5.78991 3.81992 5.78991 3.62037 5.5571L0.207482 1.57539Z"
        fill={pathFill}
      />
    </svg>
  );
};

export default FilterTriangleDown;
