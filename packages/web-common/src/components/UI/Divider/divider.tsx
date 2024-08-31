/**
 * restProps 参考 https://3x.ant.design/components/divider-cn/
 */
import * as React from 'react';
import { Divider as AntdDivider } from 'antd';
import './divider.scss';

export interface DividerProps {
  /**
   * 分割线颜色
   */
  color?: string;
  /**
   * 分割线样式类
   */
  className?: string;
  /**
   * 分割线上下margin，默认是15
   */
  margin?: number;
  children?: React.ReactNode;
}

const Divider: React.FC<DividerProps> = props => {
  const { color = '#E1E3E8', className, margin = 15, children, ...restProps } = props;
  const classes = React.useMemo(() => {
    let res = 'lx-divider';
    if (className) {
      res += className;
    }
    return res;
  }, [className]);
  return (
    <AntdDivider className={classes} {...restProps} style={{ borderTopColor: color, margin: `${margin}px 0` }}>
      {children}
    </AntdDivider>
  );
};

export default Divider;
