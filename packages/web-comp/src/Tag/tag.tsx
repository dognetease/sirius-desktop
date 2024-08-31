import * as React from 'react';
import TongyongGuanbiXian from './tongyong_guanbi_xian';
import { Tag as AntdTag } from 'antd';
import ConfigProvider from '../configProvider';
import './antd.scss';
import './tag.scss';

export interface TagProps {
  /**
   * UI提供的固定六个颜色
   * label-1-1: 背景颜色为label-1-1，文字颜色为label-1-3，描边颜色为label-1-2
   * label-2-1: 背景颜色为label-2-1，文字颜色为label-2-3，描边颜色为label-2-2
   * label-3-1: 背景颜色为label-3-1，文字颜色为label-3-3，描边颜色为label-3-2
   * label-4-1: 背景颜色为label-4-1，文字颜色为label-4-3，描边颜色为label-4-2
   * label-5-1: 背景颜色为label-5-1，文字颜色为label-5-3，描边颜色为label-5-2
   * label-1-1: 背景颜色为label-6-1，文字颜色为label-6-3，描边颜色为label-6-2
   */
  type?: 'label-1-1' | 'label-2-1' | 'label-3-1' | 'label-4-1' | 'label-5-1' | 'label-6-1' | 'warning-6' | 'error-6' | 'success-6' | 'brand-6' | 'label-6-1-2';
  /**
   * 背景颜色
   */
  bgColor?: string;
  /**
   * 文字颜色
   */
  fontColor?: string;
  /**
   * 描边颜色
   */
  borderColor?: string;
  /**
   * 标签高度，默认是20
   */
  height?: number;
  /**
   * 宽度，默认是根据内容的长度 + 左右 padding 6px
   */
  width?: number;
  /**
   * 圆角， 默认是2
   */
  borderRadius?: number;
  /**
   * 隐藏描边
   */
  hideBorder?: boolean;
  /**
   * 标签是否可以关闭
   */
  closable?: boolean;
  /**
   * 关闭回调
   */
  onClose?: () => void;
  /**
   * 目标元素
   */
  children: React.ReactNode;
}

const Tag: React.FC<TagProps> = props => {
  const { type, bgColor, fontColor, borderColor, height = 20, width, borderRadius = 2, hideBorder, closable, onClose, children } = props;
  const classNames = React.useMemo(() => {
    let classes = 'lx-tag-ui';
    switch (type) {
      case 'label-1-1':
        classes += ' label-1-1';
        break;
      case 'label-2-1':
        classes += ' label-2-1';
        break;
      case 'label-3-1':
        classes += ' label-3-1';
        break;
      case 'label-4-1':
        classes += ' label-4-1';
        break;
      case 'label-5-1':
        classes += ' label-5-1';
        break;
      case 'label-6-1':
        classes += ' label-6-1';
        break;
      case 'label-6-1-2':
        classes += ' label-6-1-2';
        break;
      case 'warning-6':
        classes += ' warning-6';
        break;
      case 'error-6':
        classes += ' error-6';
        break;
      case 'success-6':
        classes += ' success-6';
        break;
      case 'brand-6':
        classes += ' brand-6';
        break;
    }
    if (hideBorder) {
      classes += ' hide-border';
    }
    return classes;
  }, [type]);
  return (
    <ConfigProvider>
      <AntdTag
        closable={!!closable}
        closeIcon={<TongyongGuanbiXian />}
        onClose={onClose ? onClose : () => {}}
        className={classNames}
        style={{ height: height, width: width, borderRadius: borderRadius, backgroundColor: bgColor, borderColor: borderColor, color: fontColor }}
      >
        {children}
      </AntdTag>
    </ConfigProvider>
  );
};

export default Tag;
