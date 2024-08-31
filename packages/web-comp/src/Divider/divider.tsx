/**
 * restProps 参考 https://3x.ant.design/components/divider-cn/
 */
import * as React from 'react';
import { Divider as AntdDivider } from 'antd';
import variables from '../styles/export.module.scss';
import ConfigProvider from '../configProvider';
import './antd.scss';
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
  /**
   * 水平还是垂直类型
   */
  type?: 'horizontal' | 'vertical';
  children?: React.ReactNode;
}

const Divider: React.FC<DividerProps> = props => {
  const { color = '#E1E3E8', className, margin = 15, type = 'horizontal', children, ...restProps } = props;
  const classes = React.useMemo(() => {
    let res = `${variables.classPrefix}-divider`;
    if (className) {
      res += className;
    }
    return res;
  }, [className]);
  return (
    <ConfigProvider>
      <AntdDivider className={classes} type={type} {...restProps} style={{ borderTopColor: color, margin: `${margin}px 0` }}>
        {children}
      </AntdDivider>
    </ConfigProvider>
  );
};

export default Divider;
