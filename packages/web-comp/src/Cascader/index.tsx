import * as React from 'react';
import { useState, useMemo, useEffect } from 'react';
import type {
  BaseOptionType,
  DefaultOptionType,
  MultipleCascaderProps as RcMultipleCascaderProps,
  SingleCascaderProps as RcSingleCascaderProps,
  ShowSearchType,
} from 'rc-cascader';
import RcCascader from 'rc-cascader';
import classnames from 'classnames';
import { omit } from 'lodash';
import { Loading, NotFound, Clear, Search, DownArrow, UpArrow, TongyongJianTouYou } from './icons';
import { TongyongGuanbiXian } from '@sirius/icons';
import './style/index.scss';

const { SHOW_CHILD, SHOW_PARENT } = RcCascader;

type SingleCascaderProps = Omit<RcSingleCascaderProps, 'checkable' | 'options'> & {
  multiple?: false;
};

type MultipleCascaderProps = Omit<RcMultipleCascaderProps, 'checkable' | 'options'> & {
  multiple: true;
};

type UnionCascaderProps = SingleCascaderProps | MultipleCascaderProps;

export type SizeType = 'mini' | 'small' | 'default' | 'large' | undefined;

export type CascaderProps<DataNodeType> = UnionCascaderProps & {
  multiple?: boolean;
  size?: SizeType;
  disabled?: boolean;
  bordered?: boolean;
  suffixIcon?: React.ReactNode;
  options?: DataNodeType[];
  popupClassName?: string;
  /**
   * 内容是否在加载中 [beta]
   */
  fetching?: boolean;
};

const prefixCls = 'sirius-cascader-select';
const cascaderPrefixCls = 'sirius-cascader';

export interface CascaderRef {
  focus: () => void;
  blur: () => void;
}

const Component = (props: CascaderProps<any>, ref: React.Ref<CascaderRef>) => {
  const { fetching, suffixIcon, showSearch, onFocus, onBlur, onDropdownVisibleChange, multiple, className, popupClassName, bordered, size, ...rest } = props;

  const [downArrow, setDownArrow] = useState<boolean>(true);
  const [focus, setFocus] = useState<boolean>(false);
  const [optOpen, setOptOpen] = useState<boolean>(false);
  const restProps = omit(rest);

  const handleOnFocus = (event: React.FocusEvent<HTMLElement, Element>) => {
    setFocus(!onFocus);
    onFocus && onFocus(event);
  };

  const handleBlur = (event: React.FocusEvent<HTMLElement, Element>) => {
    setFocus(false);
    onBlur && onBlur(event);
  };

  useEffect(() => {
    setDownArrow(!optOpen);
  }, [optOpen]);

  const handleOnDropdownVisibleChange = (open: boolean) => {
    setOptOpen(open);
    onDropdownVisibleChange && onDropdownVisibleChange(open);
  };

  const highlightKeyword = (str: string, lowerKeyword: string, prefixCls?: string) => {
    const cells = str
      .toLowerCase()
      .split(lowerKeyword) // @ts-ignore
      .reduce((list, cur, index) => (index === 0 ? [cur] : [...list, lowerKeyword, cur]), []);
    const fillCells: React.ReactNode[] = [];
    let start = 0;

    // @ts-ignore
    cells.forEach((cell, index) => {
      const end = start + cell.length;
      let originWorld: React.ReactNode = str.slice(start, end);
      start = end;

      if (index % 2 === 1) {
        originWorld = (
          <span className={`${prefixCls}-menu-item-keyword`} key={`seperator-${index}`}>
            {originWorld}
          </span>
        );
      }

      fillCells.push(originWorld);
    });

    return fillCells;
  };

  const defaultSearchRender: ShowSearchType['render'] = (inputValue, path, prefixCls, fieldNames) => {
    const optionList: React.ReactNode[] = [];
    const lower = inputValue.toLowerCase();

    path.forEach((node, index) => {
      if (index !== 0) {
        optionList.push(' / ');
      }

      let label = (node as any)[fieldNames.label!];
      const type = typeof label;
      if (type === 'string' || type === 'number') {
        label = highlightKeyword(String(label), lower, prefixCls);
      }

      optionList.push(label);
    });
    return optionList;
  };

  const notFound = useMemo(() => {
    if (fetching)
      return (
        <div className={`${cascaderPrefixCls}-menu-loading`}>
          <Loading />
        </div>
      );
    else return <NotFound />;
  }, []);

  const renderSuffixIcon = useMemo(() => {
    if (suffixIcon) return suffixIcon;
    else return showSearch && focus ? <Search /> : downArrow ? <DownArrow /> : <UpArrow />;
  }, [showSearch, focus, downArrow]);

  const mergedShowSearch = useMemo(() => {
    if (!showSearch) {
      return showSearch;
    }

    let searchConfig: ShowSearchType = {
      render: defaultSearchRender,
    };

    if (typeof showSearch === 'object') {
      searchConfig = {
        ...searchConfig,
        ...showSearch,
      };
    }

    return searchConfig;
  }, [showSearch]);

  return (
    <RcCascader
      ref={ref}
      prefixCls={prefixCls}
      className={classnames(className, cascaderPrefixCls, {
        [`${prefixCls}-mn`]: size === 'mini',
        [`${prefixCls}-sm`]: size === 'small',
        [`${prefixCls}-lg`]: size === 'large',
        [`${prefixCls}-borderless`]: !bordered,
      })}
      {...(restProps as any)}
      inputIcon={renderSuffixIcon}
      clearIcon={<Clear />}
      removeIcon={<TongyongGuanbiXian className={`${cascaderPrefixCls}-removeIcon`} />}
      expandTrigger="hover"
      onFocus={handleOnFocus}
      onBlur={handleBlur}
      onDropdownVisibleChange={handleOnDropdownVisibleChange}
      expandIcon={<TongyongJianTouYou />}
      dropdownPrefixCls={cascaderPrefixCls}
      dropdownClassName={classnames(popupClassName, `${cascaderPrefixCls}-dropdown`, {
        [`${cascaderPrefixCls}-single`]: !multiple,
        [`${cascaderPrefixCls}-multiple`]: multiple,
      })}
      showSearch={mergedShowSearch}
      checkable={multiple}
      notFoundContent={notFound}
    />
  );
};

const Cascader = React.forwardRef(Component) as unknown as (<OptionType extends BaseOptionType | DefaultOptionType = DefaultOptionType>(
  props: React.PropsWithChildren<CascaderProps<OptionType>> & { ref?: React.Ref<CascaderRef> }
) => React.ReactElement) & {
  displayName: string;
  SHOW_PARENT: typeof SHOW_PARENT;
  SHOW_CHILD: typeof SHOW_CHILD;
  defaultProps: { bordered: boolean };
};

Cascader.defaultProps = {
  bordered: true,
};

Cascader.SHOW_PARENT = SHOW_PARENT;
Cascader.SHOW_CHILD = SHOW_CHILD;

export default Cascader;
