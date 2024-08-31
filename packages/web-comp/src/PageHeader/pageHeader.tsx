import * as React from 'react';
import variables from '../styles/export.module.scss';
import TongyongJiantouZuo from './tongyong_jiantou_zuo';
import classNames from 'classnames';
import './pageHeader.scss';

export interface PageHeaderProps {
  /**
   * 是否显示返回按钮
   */
  backIcon?: React.ReactNode | boolean;
  /**
   * 自定义标题文字
   */
  title: string;
  /**
   * 自定义的二级标题文字（说明文案）
   */
  subTitle?: string;
  /**
   * 标题和二级标题中间的图标
   */
  titleExtraIcon?: React.ReactNode;
  /**
   * 操作区，位于 title 行的行尾
   */
  extra?: React.ReactNode;
  /**
   * 背景是否透明
   */
  bgTransparent?: boolean;
  /**
   * 类名
   */
  className?: string;
  /**
   * 返回按钮的点击事件
   */
  onBack?: () => void;
}

export const PageHeader: React.FC<PageHeaderProps> = props => {
  const { className, backIcon, title, subTitle, titleExtraIcon, extra, bgTransparent, onBack } = props;

  const classes = React.useMemo(
    () =>
      classNames(`${variables.classPrefix}-page-header`, className, {
        ['bg-transparent']: bgTransparent,
        ['has-back-icon']: backIcon,
      }),
    [className, bgTransparent, backIcon]
  );

  const backClick = () => {
    onBack && onBack();
  };

  return (
    <div className={classes}>
      <div className="page-header-left">
        {backIcon && (
          <p className="page-header-back-icon" onClick={backClick}>
            {backIcon === true ? <TongyongJiantouZuo /> : backIcon}
          </p>
        )}
        <p className="page-header-title">{title}</p>
        {titleExtraIcon && <div className="page-header-title-extra">{titleExtraIcon}</div>}
        {subTitle && <p className="page-header-subTitle">{subTitle}</p>}
      </div>
      <div className="page-header-right">{extra && <p className="page-header-extra">{extra}</p>}</div>
    </div>
  );
};

PageHeader.defaultProps = {
  backIcon: true,
  bgTransparent: false,
  className: '',
};

export default PageHeader;
