import React, { FC, useRef, useState, useEffect } from 'react';
// import { Tooltip } from 'antd';
// import Tooltip from '@web-common/components/UI/Tooltip';
import Tooltip from '@lingxi-common-component/sirius-ui/Tooltip';

// 使用方式和div一致
export const OverflowShowTooltips: FC<
  {
    value: string;
    childText?: string;
  } & React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>
> = props => {
  const { style, value, children, childText } = props;
  const [show, setShow] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref != null && ref.current != null && ref.current.scrollWidth > ref.current.offsetWidth) {
      setShow(true);
    }
  }, [ref, value]);

  const node = childText ? (
    <div
      ref={ref}
      {...props}
      dangerouslySetInnerHTML={{
        __html: childText,
      }}
    ></div>
  ) : (
    <div ref={ref} {...props}>
      {value}
    </div>
  );

  if (show) {
    return <Tooltip title={value}>{node}</Tooltip>;
  }

  return <>{node}</>;
};
