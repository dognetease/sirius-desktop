import React, { useEffect, useRef } from 'react';

interface ClickOutsideProps {
  onClickOutside: () => void;
  [propName: string]: any;
}

const ClickOutside: React.FC<ClickOutsideProps> = props => {
  const { children, onClickOutside, ...restProps } = props;
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const clickHandler = event => {
      if (!ref.current?.contains(event.target)) {
        onClickOutside();
      }
    };

    window.addEventListener('click', clickHandler);

    return () => window.removeEventListener('click', clickHandler);
  }, [onClickOutside]);

  return (
    <div ref={ref} {...restProps}>
      {children}
    </div>
  );
};

export default ClickOutside;
