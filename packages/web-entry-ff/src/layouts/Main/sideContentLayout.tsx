import React, { ComponentType } from 'react';
import { ResizableBox, ResizeCallbackData, ResizableBoxProps } from 'react-resizable';
import styles from './main.module.scss';
import classname from 'classnames';
import 'react-resizable/css/styles.css';
import { apiHolder, api } from 'api';

const { isMac } = apiHolder.env;
const systemApi = api.getSystemApi();

export interface SideContentLayoutProps extends Partial<ResizableBoxProps> {
  defaultWidth?: number;
  className?: string;
  component?: ComponentType<any>;
  defaultheight?: string;
  ref?: any;
  minWidth?: number;
  maxWidth?: number;
  style?: React.CSSProperties;
  borderRight?: boolean;
  fixedWidth?: number;
}

const SideContentLayout: React.FC<SideContentLayoutProps> = React.forwardRef((props, ref) => {
  const {
    defaultWidth = 200,
    defaultheight = '100%',
    children,
    minConstraints = [100, 0],
    maxConstraints = [500, Infinity],
    onResize,
    onResizeStart,
    onResizeStop,
    className,
    component,
    minWidth,
    maxWidth,
    style,
    borderRight,
    fixedWidth,
    ...rest
  } = props;
  if (minWidth !== undefined) {
    minConstraints[0] = minWidth;
  }
  if (maxWidth !== undefined) {
    maxConstraints[0] = maxWidth;
  }
  // const [height, setHeight] = React.useState<numebr>(window.innerHeight)
  const [width, setWidth] = React.useState<number>(defaultWidth);
  const handleResize = (_: any, data: ResizeCallbackData) => {
    const {
      size: {
        width,
        // height
      },
    } = data;
    setWidth(width);
    // setHeight(height)
    if (onResize) {
      onResize(_, data);
    }
  };
  const componentProps = {
    className: classname([styles.sideContentLayoutWarpper, className || ''], {
      [styles.borderRight]: borderRight,
    }),
    children,
    ref,
  };

  const handleOnResizeStop = (e, data) => {
    onResizeStop && onResizeStop(e, data);
  };

  const handleOnResizeStart = (e, data) => {
    onResizeStart && onResizeStart(e, data);
  };

  if (fixedWidth) {
    return (
      <div
        style={{
          ...style,
          width: fixedWidth,
          height: '100%',
          backgroundColor: '#F9FAFC',
        }}
      >
        {React.createElement(component || 'div', componentProps)}
      </div>
    );
  }

  return (
    <div
      style={{
        ...style,
        width,
        height: defaultheight,
      }}
    >
      <ResizableBox
        // className={isMac && isElectron ? 'sirius-middle-grid-bg' : 'sirius-middle-grid'}
        className={`sirius-middle-grid ${systemApi.isWebWmEntry() && 'sirius-middle-grid-web'}`}
        maxConstraints={maxConstraints}
        onResize={handleResize}
        width={defaultWidth}
        height={Infinity}
        minConstraints={minConstraints}
        onResizeStart={handleOnResizeStart}
        onResizeStop={handleOnResizeStop}
        axis="x"
        {...rest}
      >
        {React.createElement(component || 'div', componentProps)}
      </ResizableBox>
    </div>
  );
});

export default SideContentLayout;
