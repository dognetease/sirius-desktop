import React, { useMemo, useState } from 'react';
import { usePopper, PopperProps } from 'react-popper';
import OutsideClickHandler from 'react-outside-click-handler';
import style from './index.module.scss';
import SearchHistoryItem from './SearchHistoryItem';
import { GlobalSearchSubKeywordType } from 'api';
import { getIn18Text } from 'api';
import { FilterParam } from '../search';
import { CountryFilterProp } from '../search';
import { ItemProp } from './SearchHistoryItem';

type HistoryDropQueryType = string | string[];

interface HistoryDropDownProps<T extends HistoryDropQueryType = string> {
  searchList: Array<{
    query: T;
    searchType: string;
    filterParams?: FilterParam;
    country?: CountryFilterProp[];
    language?: CountryFilterProp[];
    time?: CountryFilterProp[];
  }>;
  onDelete: (searchType: string) => void;
  onClick: (param: T, data?: ItemProp) => void;
  target?: Element | null;
  blurTarget?: Element | null;
  open?: boolean;
  subBtnVisible?: boolean;
  changeOpen?(open: boolean): void;
  searchType: string;
  renderFooter?(): React.ReactNode;
  hideSearchIcon?: boolean;
  itemLayout?: 'inline' | 'vertical';
  subType?: GlobalSearchSubKeywordType;
  autoDetectSubType?: boolean;
  renderExtra?(extra?: string[]): React.ReactNode;
}

const HistoryDropDown: <T extends HistoryDropQueryType>(
  props: HistoryDropDownProps<T> & {
    children?: React.ReactNode;
  }
) => React.ReactElement | null = ({
  searchList,
  onDelete,
  onClick,
  target,
  blurTarget,
  open,
  changeOpen,
  subBtnVisible,
  searchType,
  renderFooter = null,
  hideSearchIcon = false,
  itemLayout = 'vertical',
  subType = 'product',
  autoDetectSubType,
  renderExtra,
}) => {
  const modifiers = useMemo<PopperProps<any>['modifiers']>(
    () => [
      {
        name: 'preventOverflow',
        options: {
          mainAxis: false, // true by default
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
      {
        name: 'offset',
        options: {
          offset: [0, 12],
        },
      },
    ],
    []
  );

  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(null);
  const { styles, attributes } = usePopper(target, popperElement, {
    placement: 'bottom',
    modifiers,
  });

  if (!open) {
    return null;
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
        className={style.popper}
        ref={setPopperElement}
        style={{
          ...styles.popper,
        }}
        {...attributes.popper}
      >
        <div className={style.title}>
          <span>{getIn18Text('SOUSUOLISHIJILU')}</span>
          <span
            data-link
            onClick={() => {
              onDelete(searchType);
            }}
          >
            {getIn18Text('QINGCHULISHIJILU')}
          </span>
        </div>
        {searchList.map((hist, index) =>
          hist.searchType === searchType ? (
            <SearchHistoryItem<typeof hist.query>
              autoDetectSubType={autoDetectSubType}
              subType={subType}
              hideSearchIcon={hideSearchIcon}
              itemLayout={itemLayout}
              subBtnVisible={subBtnVisible}
              name={hist.query}
              renderExtra={renderExtra}
              key={typeof hist.query === 'string' ? hist.query : hist.query[0] || index}
              onClick={(name, data) => {
                onClick(name, data);
              }}
              country={hist.country}
              filterParams={hist.filterParams}
              data={hist}
            />
          ) : null
        )}
        {renderFooter && renderFooter()}
      </div>
    </OutsideClickHandler>
  );
};
export default HistoryDropDown;
