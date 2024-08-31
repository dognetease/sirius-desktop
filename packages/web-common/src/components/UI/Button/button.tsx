import * as React from 'react';
import TongyongJiazai from './tongyong_jiazai';
import variables from '@web-common/styles/export.module.scss';
import classNames from 'classnames';
import './style.scss';

export type ButtonType = 'primary' | 'default' | 'minorWhite' | 'minorGray' | 'minorLine' | 'danger' | 'link' | 'dashedLine';
export type Size = 'mini' | 'small' | 'default' | 'large';

interface LoadingProps {
  btnType?: ButtonType;
  size?: Size;
  hasChildren: boolean;
}

const Loading: React.FC<LoadingProps> = props => {
  const { btnType = 'default', size = 'default', hasChildren } = props;
  const scale = React.useMemo(() => {
    if (size === 'mini') {
      return 0.75;
    } else if (size === 'small') {
      return 0.8;
    } else if (size === 'large') {
      return 0.95;
    } else {
      return 0.95;
    }
  }, [size]);
  const stroke = React.useMemo(() => {
    if (btnType === 'primary') {
      return '#FFFFFF';
    } else if (btnType === 'minorLine') {
      return variables.fill5;
    } else if (btnType === 'default') {
      return variables.brand3;
    } else if (btnType === 'danger') {
      return variables.error4;
    } else if (btnType === 'dashedLine') {
      return variables.fill5;
    } else if (btnType === 'link') {
      return variables.brand3;
    } else if (btnType === 'minorWhite') {
      return variables.text1;
    } else if (btnType === 'minorGray') {
      return variables.text1;
    } else {
      return variables.brand6;
    }
  }, [btnType]);
  return (
    <span className="loading-icon" style={{ marginRight: hasChildren ? '3px' : '0' }}>
      <TongyongJiazai stroke={stroke} style={{ transform: 'scale(' + scale + ')' }} />
    </span>
  );
};

interface BaseButtonProps {
  /**用户自定义 css class */
  className?: string;
  /**设置 Button 的禁用 */
  disabled?: boolean;
  /**设置 Button 的类型 */
  btnType?: ButtonType;
  /**link 类型按钮的跳转链接 */
  href?: string;
  /**默认是false，button 的 display 为 flex，设置为 true 后，display 为 inline-flex */
  inline?: boolean;
  /**设置按钮大小 */
  size?: Size;
  /**设置按钮载入状态 */
  loading?: boolean;
  children: React.ReactNode;
}
type NativeButtonProps = BaseButtonProps & React.ButtonHTMLAttributes<HTMLButtonElement>;
type AnchorButtonProps = BaseButtonProps & React.AnchorHTMLAttributes<HTMLAnchorElement>;
export type ButtonProps = Partial<NativeButtonProps & AnchorButtonProps>;

/**
 * 页面中最常用的的按钮元素，适合于完成特定的交互，支持 HTML button 和 a 链接 的所有属性
 */
const Button: React.FC<ButtonProps> = props => {
  const { btnType, className, disabled, children, href, inline, size, loading, ...restProps } = props;

  const classes = React.useMemo(
    () =>
      classNames(`${variables.classPrefix}-btn`, className, {
        [`${variables.classPrefix}-btn-${btnType}`]: btnType,
        disabled: btnType === 'link' && disabled,
        inline: inline,
        [`${variables.classPrefix}-btn-size-${size}`]: size,
        [`${variables.classPrefix}-btn-loading`]: loading,
      }),
    [className, btnType, disabled, inline, size]
  );
  return (
    <>
      {btnType === 'link' && href ? (
        <a className={classes} href={href} {...restProps}>
          {loading && <Loading btnType={btnType} size={size} hasChildren={!!children} />}
          {children}
        </a>
      ) : (
        <button className={classes} disabled={disabled} {...restProps}>
          {loading && <Loading btnType={btnType} size={size} hasChildren={!!children} />}
          {children}
        </button>
      )}
    </>
  );
};

Button.defaultProps = {
  disabled: false,
  btnType: 'default',
  inline: false,
  size: 'default',
  loading: false,
};

export default Button;
