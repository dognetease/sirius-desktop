import React, { useState } from 'react';
import { Input } from 'antd';
import classnames from 'classnames';
import { omit } from 'lodash';
import { InputProps, TextAreaProps, GroupProps, PasswordProps, SearchProps } from 'antd/lib/input';
import { TextAreaRef } from 'antd/lib/input/TextArea';
// import { InputProps, TextAreaRef, TextAreaProps, GroupProps, PasswordProps, SearchProps } from './types';
import './input.scss';

const { TextArea, Group, Password, Search } = Input;
export const prefixCls = 'sirius-input';
export type SizeType = 'mini' | 'small' | 'default' | 'middle' | 'large';

export interface IProps extends Omit<InputProps, 'size'> {
  className?: string;
  /**
   * 开启自定义前缀后缀
   */
  openFix?: boolean;
  /**
   * 控件大小
   * @default default
   */
  size?: SizeType;
  /**
   * 带标签的 input，设置后置标签
   */
  addonAfter?: React.ReactNode;
  /**
   * 带标签的 input，设置前置标签
   */
  addonBefore?: React.ReactNode;
  /**
   * 是否有边框
   * @default true
   * @version 4.5.0
   */
  bordered?: boolean;
  /**
   * 输入框默认内容
   */
  defaultValue?: string;
  /**
   * 是否禁用状态，默认为 false
   * @default false
   */
  disabled?: boolean;
  /**
   * 输入框的 id
   */
  id?: string;
  /**
   * 最大长度
   */
  maxLength?: number;
  /**
   * 是否展示字数
   * @default false
   * @version 4.18.0
   * @param info.value - 4.23.0
   */
  showCount?: boolean | { formatter: (info: { value: string; count: number; maxLength?: number }) => React.ReactNode };
  /**
   * 设置校验状态
   * @version 4.19.0
   */
  status?: 'error' | 'warning';
  /**
   * 带有前缀图标的 input
   */
  prefix?: React.ReactNode;
  /**
   * 带有后缀图标的 input
   */
  suffix?: React.ReactNode;
  /**
   * 声明 input 类型，同原生 input 标签的 type 属性
   * @default text
   */
  type?: string;
  /**
   * 输入框内容
   */
  value?: string;
  /**
   * 输入框内容变化时的回调
   * @param e 事件对象
   */
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  /**
   * 按下回车的回调
   * @param e 事件对象
   */
  onPressEnter?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

type FixProps = {
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
};

const Component = (props: IProps, ref: React.LegacyRef<Input> | undefined) => {
  const { className, size, suffix, prefix, openFix, ...rest } = props;
  const restProps = omit(rest);

  const renderSuffix = React.useMemo(() => {
    if (openFix) return <>{suffix}</>;
    else return suffix && <div className={`${prefixCls}-suffix`}>{suffix}</div>;
  }, [openFix, suffix]);

  const renderPrefix = React.useMemo(() => {
    if (openFix) return <>{prefix}</>;
    else return prefix && <div className={`${prefixCls}-prefix`}>{prefix}</div>;
  }, [openFix, prefix]);

  const fixProps = React.useMemo(() => {
    const props: FixProps = {};
    if (suffix) {
      props['suffix'] = renderSuffix;
    }
    if (prefix) {
      props['prefix'] = renderPrefix;
    }
    return props;
  }, [suffix, prefix, renderSuffix, renderPrefix]);

  const inputProps = Object.keys(fixProps).length ? { ...restProps, ...fixProps } : restProps;
  return <Input ref={ref} {...inputProps} className={classnames(className, `${prefixCls}`, `${prefixCls}-${size}`)} />;
};

const ITextArea = React.forwardRef((props: TextAreaProps, ref: React.ForwardedRef<TextAreaRef>) => {
  const { onChange, maxLength, className, disabled } = props;
  const [max, setMax] = useState<boolean>(false);

  return (
    <span className={classnames(prefixCls)}>
      <TextArea
        {...props}
        className={classnames(className, {
          [`${prefixCls}-max-count`]: max,
          [`${prefixCls}-disable`]: disabled,
        })}
        onChange={e => {
          const val = e.currentTarget.value;
          onChange && onChange(e);
          if (!maxLength) return;
          if (val?.length >= maxLength) {
            setMax(true);
          } else {
            setMax(false);
          }
        }}
        ref={ref}
      />
    </span>
  );
});

const InputRef = React.forwardRef(Component) as <T>(props: IProps & { ref?: React.LegacyRef<T> }) => React.ReactElement;

type InputType = typeof InputRef;

interface InputInterface extends InputType {
  defaultProps: { size: string; openFix: boolean };
  TextArea: typeof ITextArea;
  Group: React.FC<GroupProps>;
  Password: React.ForwardRefExoticComponent<PasswordProps & React.RefAttributes<any>>;
  Search: React.ForwardRefExoticComponent<SearchProps & React.RefAttributes<any>>;
}

const InputComponent = InputRef as InputInterface;

InputComponent.TextArea = ITextArea;
InputComponent.Group = Group;
InputComponent.Password = Password;
InputComponent.Search = Search;
InputComponent.defaultProps = {
  size: 'default',
  openFix: true,
};

export default InputComponent;
