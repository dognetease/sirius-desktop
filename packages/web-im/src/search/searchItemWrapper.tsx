import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import lodashGet from 'lodash/get';
import classnames from 'classnames/bind';
import style from './empty.module.scss';

const realStyle = classnames.bind(style);

interface CategoryListRef {
  trigger(item): void;
  node: HTMLDivElement | null;
  key: string;
}

type HocStaticProps<T> = {
  // 数据key值
  dataKeyName: string;
  keywordAlias?: string;
  // 被选中的状态吗
  checkedClassname: string;
  title: string;
  triggerMethod(item: T): void;
  // 跳转到更多
  goMore(): void;
  wrapperClassName?: string;
  mixedProps: Record<string, any>;
  supportVirtualized?: boolean;
  itemIdName?: string;
};
interface Props<T> {
  list: T[];
  showTitle: boolean;
  keyword: string;
  maxCount: number;
  enterConfirmFlag?: boolean;
  checkedIndex: number;
  prefixCount: number;
  updateCheckNumber(count: number): void;
  supportVirtualized?: boolean;
  children: (list: T[]) => React.ReactNode | null;
}

export function hocWrapper<T>(
  Component: React.ReactComponentElement,
  // 静态属性
  staticProps: HocStaticProps<T>
) {
  const { title, wrapperClassName = '', checkedClassname, triggerMethod, mixedProps, keywordAlias = 'keyword', itemIdName = 'id' } = staticProps;
  return (props: Props<T>) => {
    const { showTitle, keyword, maxCount, list, checkedIndex, updateCheckNumber, enterConfirmFlag = false, children, prefixCount } = props;

    const ref = useRef<CategoryListRef[]>([]);
    // 键盘enter之后触发打开
    const enterConfirm = useCallback(
      (index: number) => {
        if (typeof lodashGet(ref.current, `[${index}].trigger`, undefined) === 'function' && !!list[index]) {
          ref.current[index].trigger(list[index]);
        }
      },
      [list.length]
    );

    useEffect(() => {
      enterConfirmFlag && enterConfirm(checkedIndex);
    }, [enterConfirmFlag]);

    // 当前选中Item自动滚动到可视范围
    useEffect(() => {
      if (checkedIndex === -1 || !lodashGet(ref.current, `[${checkedIndex}].trigger`, null)) {
        return;
      }
      const { node } = ref.current[checkedIndex];
      if ('scrollIntoViewIfNeeded' in document.body) {
        // @ts-ignore
        node?.scrollIntoViewIfNeeded(false);
      } else {
        node?.scrollIntoView(false);
      }
    }, [checkedIndex]);
    const [lastY, setLastY] = useState(0);
    // 设置一个变量保证mouseenter可以延迟触发 避免enter被动触发
    const enableTrigger = useRef(false);
    useEffect(() => {
      const $t = setTimeout(() => {
        enableTrigger.current = true;
      }, 1000);
      return () => {
        $t && clearTimeout($t);
      };
    }, []);
    const _onmouseenter = (e: React.MouseEvent<HTMLDivElement>, index: number) => {
      if (lastY === e.nativeEvent.y || !enableTrigger.current) {
        return;
      }
      setLastY(e.nativeEvent.y);
      updateCheckNumber(index + prefixCount);
    };

    if (!list || !list.length) {
      return null;
    }

    return (
      <div>
        {showTitle ? <span className="select-title">{title}</span> : null}

        {list.slice(0, maxCount).map((item, index) => {
          // return <Component keyword={keyword} {...staticProps}></Component>;
          const childProps = {
            [staticProps.dataKeyName]: item,
            [keywordAlias]: keyword,
            customClassnames: checkedIndex === index ? realStyle('checked') : '',
            ...mixedProps,
          };
          return (
            <div
              key={lodashGet(item, itemIdName, '')}
              onClick={() => {
                triggerMethod(item);
              }}
              onMouseEnter={e => {
                _onmouseenter(e, index);
              }}
              ref={node => {
                ref.current[index] = {
                  trigger: triggerMethod,
                  node,
                  key: lodashGet(item, itemIdName, '') as string,
                };
              }}
              className={[wrapperClassName, checkedIndex === index ? checkedClassname : ''].join(' ')}
            >
              <Component {...childProps} />
            </div>
          );
        })}

        {typeof children === 'function' && children(list)}
      </div>
    );
  };
}

interface BottomlineProps {
  trigger(): void;
}
export const BottomlineWatch: React.FC<BottomlineProps> = props => {
  const { trigger } = props;
  // 观察是否滚动到底部
  const intersectionLine = useRef<HTMLParagraphElement>(null);
  const intersection = useRef<IntersectionObserver | null>(null);
  useEffect(() => {
    intersection.current = new IntersectionObserver(entries => {
      const entry = entries[0];
      if (entry.intersectionRatio <= 0) {
        return;
      }
      trigger();
    });
    intersection.current!.observe(intersectionLine.current);
    return () => {
      intersection.current!.unobserve(intersectionLine.current);
      intersection.current!.disconnect();
    };
  }, []);
  return <p ref={intersectionLine} />;
};
