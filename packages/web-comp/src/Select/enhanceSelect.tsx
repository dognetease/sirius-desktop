import React, { useState, useEffect, useMemo } from 'react';
import { Select } from 'antd';
import cls from 'classnames';
import type { SelectProps } from 'antd/lib/select';
import { RefSelectProps, SelectValue, OptionProps as IOptionProps } from 'antd/lib/select';
import { omit } from 'lodash';
import { prefixCls } from './type';
import { Loading, NotFound, Search, DownArrow, UpArrow, Close } from './icons';
import ConfigProvider from '../configProvider';
import './antd.scss';
import './enhanceSelect.scss';

export type OptionProps = IOptionProps;

const { Option, OptGroup } = Select;

export type SizeType = 'small' | 'large' | undefined;

export interface EnhanceSelectProps<T> extends SelectProps<T> {
  value?: T;
  showArrow?: boolean;
  suffixIcon?: React.ReactNode;
  /**
   * antd select 多选默认为 true，这里改为需要则开启
   */
  showSearch?: boolean;
  size?: SizeType;
  className?: string;
  /**
   * 内容是否在加载中
   */
  fetching?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
}

interface EnhanceOptionProps<T> extends Pick<EnhanceSelectProps<T>, 'value'> {
  children: React.ReactElement;
  value?: any;
  disabled?: boolean;
  name?: string | React.ReactElement;
}

const Component = <T extends SelectValue = SelectValue>(props: EnhanceSelectProps<T>, ref: React.Ref<RefSelectProps> | undefined) => {
  const { showSearch, onFocus, onBlur, showArrow, suffixIcon, size, className, fetching, dropdownClassName, onClick, onDropdownVisibleChange } = props;
  const [focus, setFocus] = useState<boolean>(false);
  const [downArrow, setDownArrow] = useState<boolean>(true);

  const handleOnFocus = () => {
    setFocus(!onFocus);
    onFocus && onFocus();
  };

  const handleBlur = () => {
    setFocus(false);
    onBlur && onBlur();
  };

  const notFound = useMemo(() => {
    if (fetching)
      return (
        <div className={`${prefixCls}-loading`}>
          <Loading />
        </div>
      );
    else return <NotFound />;
  }, []);

  const renderSuffixIcon = useMemo(() => {
    if (suffixIcon) return suffixIcon;
    else return showSearch && focus ? <Search /> : downArrow ? <DownArrow /> : <UpArrow />;
  }, [showSearch, focus, downArrow]);

  useEffect(() => {
    setDownArrow(!focus);
  }, [focus]);

  const handleOnDropdownVisibleChange = (open: boolean) => {
    onDropdownVisibleChange && onDropdownVisibleChange(open);
  };

  return (
    <ConfigProvider>
      <Select<T>
        ref={ref}
        dropdownClassName={cls(dropdownClassName, `${prefixCls}`)}
        className={cls(className, `${prefixCls}`, `${prefixCls}-${size}`)}
        showArrow={showArrow}
        suffixIcon={renderSuffixIcon}
        clearIcon={<Close />}
        onFocus={handleOnFocus}
        onBlur={handleBlur}
        onClick={event => {
          onFocus && onFocus();
          onClick && onClick(event);
        }}
        showSearch={showSearch}
        notFoundContent={notFound}
        onDropdownVisibleChange={handleOnDropdownVisibleChange}
        {...omit(props, [
          'className',
          'showArrow',
          'suffixIcon',
          'onFocus',
          'onBlur',
          'showSearch',
          'size',
          'notFoundContent',
          'clearIcon',
          'dropdownClassName',
          'onClick',
          'onDropdownVisibleChange',
          'fetching',
        ])}
      >
        {renderEnhanceOption(props as EnhanceOptionProps<unknown>)}
      </Select>
    </ConfigProvider>
  );
};

const renderEnhanceOption = <T,>(props: EnhanceOptionProps<T>) => {
  return (
    <>
      {React.Children.map(props.children, child => {
        if (!React.isValidElement(child)) {
          return null;
        }
        // 增加对OptGroup的支持
        if (child.type === EnhanceSelect.OptGroup) {
          const optGroupChildElment = child as React.FunctionComponentElement<{ children: React.ReactElement }>;
          return React.cloneElement(
            <EnhanceSelect.OptGroup {...optGroupChildElment.props}>
              {renderEnhanceOption({
                ...props,
                children: optGroupChildElment.props.children,
              })}
            </EnhanceSelect.OptGroup>
          );
        }
        const childElement = child as React.FunctionComponentElement<EnhanceOptionProps<T>>;
        const {
          props: { value, children, ...rest },
        } = childElement;
        const title = typeof children === 'string' ? children : '';
        /**
         * 将 Select optionFilterProp 设置为 name 即可实现搜索效果
         */
        return React.cloneElement(
          <Option name={children} title={title} value={value} {...rest}>
            {childElement}
          </Option>
        );
      })}
    </>
  );
};

const SelectRef = React.forwardRef(Component) as <T>(props: EnhanceSelectProps<T> & { ref?: React.LegacyRef<T> }) => React.ReactElement;

type SelectType = typeof SelectRef;

const IOptGroup = (props: any) => {
  return (
    <ConfigProvider>
      <OptGroup {...props} />
    </ConfigProvider>
  );
};

interface SelectInterface extends SelectType {
  defaultProps: { showSearch: boolean; size: string; showArrow: boolean };
  OptGroup: typeof IOptGroup;
}

const EnhanceSelect = SelectRef as SelectInterface;

EnhanceSelect.defaultProps = {
  showSearch: false,
  size: 'small',
  showArrow: true,
};

EnhanceSelect.OptGroup = IOptGroup;

export default EnhanceSelect;
