import React, { ComponentType } from 'react';
import classname from 'classnames';
import styles from './main.module.scss';

export interface TabContentLayoutProps {
  className?: string;
  component?: ComponentType<any>;
  ref?: any;
  minWidth?: number;
  maxWidth?: number;
  style?: React.CSSProperties;
  borderRight?: boolean;
  SideContentLayout: boolean;
}

const TabContentLayout: React.FC<TabContentLayoutProps> = React.forwardRef((props, ref) => {
  const { children, className, component, style, ...rest } = props;

  const componentProps = {
    className: classname([styles.mailTabContentLayoutWarpper, className || '']),
    children,
    ref,
  };

  return (
    <div
      style={{
        width: '100%',
        height: 48,
        ...style,
      }}
      {...rest}
    >
      {React.createElement(component || 'div', componentProps)}
    </div>
  );
});

export default TabContentLayout;
