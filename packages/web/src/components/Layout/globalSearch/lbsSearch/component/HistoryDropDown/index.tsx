import React, { useEffect, useMemo, useState } from 'react';
import { usePopper, PopperProps } from 'react-popper';
import OutsideClickHandler from 'react-outside-click-handler';
import { SearchGlobalIcon } from '@web-common/components/UI/Icons/svgs/SearchSvg';
import style from './index.module.scss';
import { api } from 'api';

const storeApi = api.getDataStoreApi();

interface HistoryDropDownProps {
  keyword?: string;
  onClick: (param: string) => void;
  target?: Element | null;
  blurTarget?: Element | null;
  open?: boolean;
  changeOpen?(open: boolean): void;
  historySaveKey: string;
}

const getHistoryList = (key: string) => {
  const { data } = storeApi.getSync(key);
  if (data) {
    try {
      return JSON.parse(data) as string[];
    } catch (error) {}
  }
  return [];
};

const putHistroyList = (param: { key: string; value: string; maxLen?: number }) => {
  const { key, value, maxLen = 5 } = param;
  const data = getHistoryList(key);
  if (!data.includes(value)) {
    const nextData = data.slice();
    nextData.unshift(value);
    storeApi.putSync(key, JSON.stringify(nextData.slice(0, maxLen)));
  }
};

const LBSHistoryDropDown: React.FC<HistoryDropDownProps> = ({ keyword, onClick, target, blurTarget, open, changeOpen, historySaveKey }) => {
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
          offset: [0, 4],
        },
      },
    ],
    []
  );
  const [searchList, setSearchList] = useState<string[]>(getHistoryList(historySaveKey));
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(null);
  const { styles, attributes } = usePopper(target, popperElement, {
    placement: 'bottom',
    modifiers,
  });

  useEffect(() => {
    if (keyword) {
      putHistroyList({
        key: historySaveKey,
        value: keyword,
      });
      setSearchList(getHistoryList(historySaveKey));
    }
  }, [keyword, historySaveKey]);

  if (!open || searchList.length === 0) {
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
        {searchList.map(hist => (
          <div
            key={hist}
            className={style.item}
            onClick={() => {
              onClick(hist);
            }}
          >
            <SearchGlobalIcon />
            <span>{hist}</span>
          </div>
        ))}
      </div>
    </OutsideClickHandler>
  );
};
export default LBSHistoryDropDown;
