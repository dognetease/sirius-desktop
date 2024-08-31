import { getIn18Text } from 'api';
import React, { ComponentType, useEffect } from 'react';
import { ResizableBox, ResizeCallbackData, ResizableBoxProps } from 'react-resizable';
import classname from 'classnames';
import 'react-resizable/css/styles.css';
import { apiHolder, DataTrackerApi, apis, api, isElectron } from 'api';
import { CollapsibleList } from '@web-common/components/UI/CollapsibleList';
import styles from './main.module.scss';
import { isShowWebLayout } from './util';

const systemApi = api.getSystemApi();
const trackApi: DataTrackerApi = apiHolder.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;
export interface SideContentLayoutProps extends Partial<ResizableBoxProps> {
  defaultWidth?: number | string;
  className?: string;
  component?: ComponentType<any>;
  defaultheight?: number | string;
  ref?: any;
  minWidth?: number;
  maxWidth?: number;
  style?: React.CSSProperties;
  borderRight?: boolean;
  fixedWidth?: number;
  needBtn?: boolean;
  resizeClassName?: string;
}

const SideContentLayout: React.FC<SideContentLayoutProps> = React.forwardRef((props, ref) => {
  const {
    defaultWidth = 200,
    defaultheight = '100%',
    children,
    minConstraints = [100, 0],
    maxConstraints = [500, Infinity],
    resizeClassName = '',
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
    needBtn = false,
    ...rest
  } = props;
  if (minWidth !== undefined) {
    minConstraints[0] = minWidth;
  }
  if (maxWidth !== undefined) {
    maxConstraints[0] = maxWidth;
  }

  const [height, setHeight] = React.useState<number | string>(defaultheight);
  const [width, setWidth] = React.useState<number | string>(defaultWidth);
  const handleResize = (_: any, data: ResizeCallbackData) => {
    const {
      size: { width, height },
    } = data;
    setWidth(width);
    setHeight(height);
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
  useEffect(() => {
    if (defaultWidth !== width) {
      setWidth(defaultWidth);
    }
  }, [defaultWidth]);
  const handleOnResizeStop = (e, data) => {
    onResizeStop && onResizeStop(e, data);
  };

  const handleOnResizeStart = (e, data) => {
    onResizeStart && onResizeStart(e, data);
  };

  useEffect(() => {
    rest.height && setHeight(rest.height);
  }, [rest.height]);

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
    <CollapsibleList
      title={getIn18Text('WENJIANJIA')}
      style={{
        width,
        height,
        ...style,
      }}
      onChange={(width: number, height: number) => {
        const context: any = {};
        const data: any = {
          size: {
            width,
            height,
          },
        };
        onResize && onResize(context, data);
      }}
      needBtn={needBtn}
      onOpen={() => {
        trackApi?.track('pcMail_click_open_sidebar_mailfolder');
      }}
      onClose={() => {
        trackApi?.track('pcMail_click_close_sidebar_mailfolder');
      }}
    >
      <ResizableBox
        // className={isMac && isElectron ? 'sirius-middle-grid-bg' : 'sirius-middle-grid'}
        // 实际拉伸变动层
        className={classname(['sirius-middle-grid', resizeClassName], {
          'sirius-middle-grid-web': systemApi.isWebWmEntry(),
        })}
        // className={`sirius-middle-grid ${isShowWebLayout() ? 'web-layout-border' : ''}`}
        maxConstraints={maxConstraints}
        onResize={handleResize}
        width={typeof defaultWidth === 'string' ? Infinity : defaultWidth}
        height={Infinity}
        minConstraints={minConstraints}
        onResizeStart={handleOnResizeStart}
        onResizeStop={handleOnResizeStop}
        axis="x"
        {...rest}
      >
        {React.createElement(component || 'div', componentProps)}
      </ResizableBox>
    </CollapsibleList>
  );
});

export default SideContentLayout;
