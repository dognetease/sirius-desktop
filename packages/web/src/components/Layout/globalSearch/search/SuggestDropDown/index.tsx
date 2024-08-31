import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { usePopper, PopperProps } from 'react-popper';
import OutsideClickHandler from 'react-outside-click-handler';
import style from './index.module.scss';
import { useDebounce } from 'react-use';
import { apiHolder, apis, EdmCustomsApi, ResSuggest, SuggestType } from 'api';
import { SearchGlobalIcon } from '@web-common/components/UI/Icons/svgs/SearchSvg';
import classNames from 'classnames';
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react';
import { globalSearchDataTracker } from '../../tracker';
import { SuggestOrigin } from 'api';
import { useMemoizedFn } from 'ahooks';

const edmCustomsApi = apiHolder.api.requireLogicalApi(apis.edmCustomsApiImpl) as EdmCustomsApi;

const missCount = (count: number) => {
  try {
    const countChars = (count + '').split('');
    const len = countChars.length;
    const res = new Array(len).fill(0);
    res[0] = countChars[0];
    res[1] = countChars[1];
    return res.join('');
  } catch (error) {
    return count;
  }
};

interface SuggestDropDownProps {
  keyword?: string;
  onSelect: (param: string, country?: string, type?: 'import' | 'export') => void;
  target?: Element | null;
  blurTarget?: Element | null;
  open?: boolean;
  changeOpen?(open: boolean): void;
  type: SuggestOrigin;
  sugguestType?: SuggestType;
  desc?: string;
  hideCount?: boolean;
  title?: React.ReactNode;
  layout?: 'bottom-same-width' | 'form-bottom-end';
}

type PopperOptionType = Parameters<typeof usePopper>[2];

const formPopperOption: PopperOptionType = {
  placement: 'bottom-end',
  modifiers: [
    {
      name: 'offset',
      options: {
        offset: [0, 12],
      },
    },
    {
      name: 'preventOverflow',
      options: {
        mainAxis: false,
      },
    },
  ],
};

const defaultPopperOption: PopperOptionType = {
  placement: 'bottom',
  modifiers: [
    {
      name: 'preventOverflow',
      options: {
        mainAxis: false, // true by default
      },
    },
    {
      name: 'offset',
      options: {
        offset: [0, 12],
      },
    },
    {
      name: 'sameWidth',
      enabled: true,
      fn: ({ state }) => {
        state.styles.popper.width = `${state.rects.reference.width}px`;
      },
      effect: ({ state }) => {
        state.elements.popper.style.width = `${state.elements.reference.getBoundingClientRect().width}px`;
      },
      phase: 'beforeWrite',
      requires: ['computeStyles'],
    },
  ],
};

const SuggestDropDown: React.FC<SuggestDropDownProps> = ({
  keyword,
  onSelect,
  target,
  blurTarget,
  open,
  changeOpen,
  sugguestType,
  type,
  hideCount,
  title,
  desc = '公司',
  layout = 'bottom-same-width',
}) => {
  const popperOption = useMemo<PopperOptionType>(() => {
    if (layout === 'form-bottom-end') {
      return formPopperOption;
    } else {
      return defaultPopperOption;
    }
  }, [layout]);

  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(null);
  const { styles, attributes } = usePopper(target, popperElement, popperOption);

  const [suggestList, setSuggestList] = useState<ResSuggest[]>([]);

  const doGetSuggest = useMemoizedFn(() => {
    edmCustomsApi
      .doGetSuggest(
        {
          text: keyword ?? '',
          type: sugguestType ?? 0,
        },
        type
      )
      .then(setSuggestList)
      .catch(() => {
        setSuggestList([]);
      });
  });

  const doGetTradeSuggest = useMemoizedFn(() => {
    edmCustomsApi
      .companyComplete({
        companyName: keyword ?? '',
      })
      .then(res => {
        setSuggestList(
          res.map(item => {
            return {
              keyword: item.companyName,
              country: item.country,
              count: 0,
              highlight: '',
              type: item.type,
            };
          })
        );
      })
      .catch(() => {
        setSuggestList([]);
      });
  });

  const doGetRcmdSuggestion = useMemoizedFn(() => {
    edmCustomsApi
      .getRcmdSuggestion({
        keyword: keyword ?? '',
      })
      .then(res => {
        setSuggestList(
          res.map(item => {
            return {
              keyword: item.keyword,
              country: item.desc,
              count: 0,
              highlight: '',
            };
          })
        );
      })
      .catch(() => {
        setSuggestList([]);
      });
  });

  const handleSuggesFun = useMemoizedFn(() => {
    switch (type) {
      case 'tradeAnalysis':
        doGetTradeSuggest();
        return;
      case 'smartrcmd':
        doGetRcmdSuggestion();
        return;
      default:
        doGetSuggest();
        return;
    }
  });

  useDebounce(
    () => {
      if (!open) {
        setSuggestList([]);
      } else if (keyword && sugguestType !== undefined) {
        handleSuggesFun();
      }
    },
    500,
    [keyword, sugguestType, open, handleSuggesFun]
  );

  if (!open || (suggestList.length === 0 && type !== 'tradeAnalysis')) {
    return <span></span>;
  }

  return (
    <OutsideClickHandler
      onOutsideClick={e => {
        const outClickTarget = blurTarget || target;
        if (outClickTarget && outClickTarget.contains(e.target as HTMLElement)) {
          return;
        }
        changeOpen?.(false);
      }}
    >
      <div
        className={classNames(style.popper, {
          [style.popperForm]: layout === 'form-bottom-end',
        })}
        ref={setPopperElement}
        style={{
          ...styles.popper,
        }}
        {...attributes.popper}
      >
        <div
          className={classNames(style.title, {
            [style.titleEmpty]: title === null,
          })}
        >
          {title === undefined ? '相关内容' : type === 'tradeAnalysis' && suggestList.length === 0 ? '没有匹配的公司，换个公司名试试' : title}
        </div>
        <OverlayScrollbarsComponent
          className={classNames(style.body, {
            [style.bodyForm]: layout === 'form-bottom-end',
          })}
          options={{
            scrollbars: { autoHide: 'leave', autoHideDelay: 0 },
            overflowBehavior: {
              x: 'hidden',
              y: 'scroll',
            },
          }}
        >
          {suggestList.map(suggest => {
            const count = missCount(suggest.count);
            return (
              <div className={classNames(style.item)} key={suggest.keyword + (suggest.country ?? '')}>
                <SearchGlobalIcon />
                <span
                  className={style.name}
                  data-link
                  dangerouslySetInnerHTML={{
                    __html: suggest.highlight || suggest.keyword,
                  }}
                  onClick={() => {
                    onSelect(suggest.keyword, suggest.country, suggest.type ?? 'import');
                    globalSearchDataTracker.trackSuggestClick({
                      from: type,
                      searchType: sugguestType,
                    });
                  }}
                ></span>
                {type === 'tradeAnalysis' ? suggest.country : ''}
                {suggest.count > 0 && !hideCount && (
                  <span className={style.desc}>{type === 'customs' ? `近5年，超过${count}条${desc}数据` : `超过${count}相关公司`}</span>
                )}
              </div>
            );
          })}
        </OverlayScrollbarsComponent>
      </div>
    </OutsideClickHandler>
  );
};
export default SuggestDropDown;
