/**
 * 用于对子组件进行淡入淡出的组件
 */
import React, { useState, useEffect } from 'react';

type FadeInOutProps = {
  visiable?: boolean;
  unmountOnHide?: boolean;
};

const FadeInOut: React.FC<FadeInOutProps> = ({ visiable = false, children, unmountOnHide = false }) => {
  const [show, setShow] = useState(visiable);

  useEffect(() => {
    if (visiable) {
      setShow(true);
    } else {
      const timer = setTimeout(() => {
        if (unmountOnHide) {
          setShow(false);
        } else {
          setShow(true);
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [visiable, unmountOnHide]);

  return (
    <div
      style={{
        opacity: show ? 1 : 0,
        transition: 'opacity 0.3s ease-in',
      }}
    >
      {!unmountOnHide || show ? children : null}
    </div>
  );
};

export default FadeInOut;
