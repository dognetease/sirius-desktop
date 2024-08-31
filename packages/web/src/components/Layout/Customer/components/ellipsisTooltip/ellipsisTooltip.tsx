import React, { useState, useEffect, useRef } from 'react';
import classnames from 'classnames';
import { Tooltip } from 'antd';
import debounce from 'lodash/debounce';
import style from './ellipsisTooltip.module.scss';

interface EllipsisTooltipProps {
  className?: string;
  textColor?: string;
  children: React.ReactText | React.ReactElement;
  overlayClassName?: string;
}

const EllipsisTooltip: React.FC<EllipsisTooltipProps> = props => {
  const { className, children, textColor, overlayClassName } = props;
  const [tooltipVisible, setTooltipVisible] = useState<boolean>(false);

  const parentRef = useRef<HTMLSpanElement>(null);
  const mirrorRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    let timeout: NodeJS.Timeout | null = null;
    let resizeObserver: ResizeObserver | null = null;

    timeout = setTimeout(() => {
      if (parentRef.current && mirrorRef.current) {
        resizeObserver = new ResizeObserver(
          debounce(() => {
            if (parentRef.current && mirrorRef.current) {
              const parentWidth = (parentRef.current as HTMLSpanElement).getBoundingClientRect().width;
              const mirrorWidth = (mirrorRef.current as HTMLSpanElement).getBoundingClientRect().width;

              setTooltipVisible(parentWidth < mirrorWidth);
            }
          }, 300)
        );

        resizeObserver.observe(parentRef.current);
      }
    });

    return () => {
      timeout && clearTimeout(timeout);
      resizeObserver && resizeObserver.disconnect();
    };
  }, [children]);

  const renderContent = () => {
    if (React.isValidElement(children)) {
      return React.cloneElement(children, {
        className: classnames(style.baseColor, textColor),
      });
    }
    return children;
  };
  return (
    <span className={classnames(style.ellipsisTooltip, className)} ref={parentRef}>
      {tooltipVisible ? (
        <Tooltip overlayClassName={overlayClassName} title={renderContent()}>
          <span className={classnames(style.ellipsisTooltipContent, 'sirius-no-drag')}>{children}</span>
        </Tooltip>
      ) : (
        <span className={classnames(style.ellipsisTooltipContent, 'sirius-no-drag')}>{children}</span>
      )}
      <span className={style.ellipsisTooltipMirror} ref={mirrorRef}>
        {children}
      </span>
    </span>
  );
};

EllipsisTooltip.defaultProps = {};

export default EllipsisTooltip;
