import React, { CSSProperties, useEffect, useRef, useState } from 'react';

export interface CourseScrollArrowProps {
  handleClick?: () => void;
  direction?: 'left' | 'right';
  style?: CSSProperties;
}

const CourseScrollArrow: React.FC<CourseScrollArrowProps> = props => {
  const { handleClick = () => {}, direction = 'left', style = {} } = props;

  const containerRef = useRef<HTMLDivElement>(null);

  const [highLight, setHighLight] = useState(false);
  const handleMouseEnter = () => {
    setHighLight(true);
  };
  const handleMouseLeave = () => {
    setHighLight(false);
  };
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.addEventListener('mouseenter', handleMouseEnter);
      containerRef.current.addEventListener('mouseleave', handleMouseLeave);
    }

    return () => {
      if (containerRef.current) {
        containerRef.current.removeEventListener('mouseenter', handleMouseEnter);
        containerRef.current.removeEventListener('mouseleave', handleMouseLeave);
      }
    };
  }, [containerRef]);

  return (
    <div onClick={handleClick} style={{ ...style }} ref={containerRef}>
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <g opacity={highLight ? '1' : '0.6'}>
          <path
            d={direction === 'left' ? 'M12.5 5L7.5 10L12.5 15' : 'M7.5 5L12.5 10L7.5 15'}
            stroke="white"
            stroke-width="1.25"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </g>
      </svg>
    </div>
  );
};

export default CourseScrollArrow;
