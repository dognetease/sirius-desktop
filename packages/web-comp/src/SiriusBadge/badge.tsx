import * as React from 'react';
import { Badge as AntdBadge } from 'antd';
import { BadgeProps } from 'antd/lib/badge';
import ConfigProvider from '../configProvider';
import variables from '../styles/export.module.scss';
import classNames from 'classnames';
import './antd.scss';
import './style.scss';

export interface IBadgeProps extends BadgeProps {
  /**自定义小圆点的颜色 */
  color?: string;
  /**展示的数字，大于 overflowCount 时显示为 ${overflowCount}+，为 0 时隐藏 */
  count?: React.ReactNode;
  /**不展示数字，只有一个小红点 */
  dot?: boolean;
  /**设置状态点的位置偏移	 */
  offset?: [number, number];
  /**展示封顶的数字值	 */
  overflowCount?: number;
  /**当数值为 0 时，是否展示 Badge */
  showZero?: boolean;
  /**设置状态点的大小 default 宽高8px small 宽高6px */
  dotSize?: 'default' | 'small';
  /**设置文本徽标 */
  intro?: string;
  /**用户自定义 css class */
  className?: string;
  children?: React.ReactNode;
}

export const Badge: React.FC<IBadgeProps> = props => {
  const { dot, intro, count, dotSize, color, children, className, ...restProps } = props;
  const classes = React.useMemo(
    () =>
      classNames(
        `${variables.classPrefix}-badge`,
        className,
        { [`${variables.classPrefix}-badge-single-number`]: typeof count === 'number' && count >= 0 && count <= 9 },
        { [`${variables.classPrefix}-badge-not-number`]: intro },
        { [`${variables.classPrefix}-badge-dot-sm`]: dotSize === 'small' }
      ),
    [className, intro, dotSize, count]
  );
  const currentCount = React.useMemo(() => {
    if (intro) {
      return (
        <span className={`${variables.classPrefix}-badge-intro`}>
          <span className="text">{intro}</span>
        </span>
      );
    }
    return count;
  }, [intro, count]);
  const currentColor = React.useMemo(() => {
    if (color) {
      return color;
    }
    if (dot && !children) {
      return variables.error6;
    }
    return undefined;
  }, [color, children]);
  return (
    // @ts-ignore
    <ConfigProvider>
      <AntdBadge dot={dot} color={currentColor} className={classes} count={currentCount} {...restProps}>
        {children}
      </AntdBadge>
    </ConfigProvider>
  );
};

Badge.defaultProps = {
  intro: '',
  dotSize: 'default',
  dot: false,
  overflowCount: 99,
  showZero: false,
};

export default Badge;
