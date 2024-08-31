/**
 * 文字提示
 * author: lujiajian@office.163.com
 * color: 背景颜色 (不可用，背景色固定写死的)
 * defaultOpen: 默认是否显隐（不可用，项目的antd 的版本是 4.16.13，defaultOpen 是 4.23.0 后的属性）
 */
import React, { useMemo } from 'react';
import { Popover } from 'antd';
import { TooltipProps as ITooltipProps } from 'antd/lib/tooltip';
import ConfigProvider from '../configProvider';
import './antd.scss';
import variables from '../styles/export.module.scss';
import './tooltip.scss';

export type TooltipProps = ITooltipProps;

export const Tooltip: React.FC<TooltipProps> = props => {
  const { placement, title, overlayClassName, children, ...restProps } = props;

  const popClassName = useMemo(() => {
    let res = `${overlayClassName} ${variables.classPrefix}-tooltip tooltip${placement}`;
    return res;
  }, [placement]);

  const ContentTitle = () => {
    return (
      <p className="content-box">
        {/* @ts-ignore */}
        <span className="content-title">{title}</span>
      </p>
    );
  };
  return (
    <ConfigProvider>
      <Popover content={<ContentTitle />} placement={placement} overlayClassName={popClassName} autoAdjustOverflow={false} {...restProps}>
        {children}
      </Popover>
    </ConfigProvider>
  );
};

Tooltip.defaultProps = {
  placement: 'top',
  overlayClassName: '',
};

export default Tooltip;
