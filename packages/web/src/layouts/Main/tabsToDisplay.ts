import { api, isEdm } from 'api';
import React, { useEffect, useState } from 'react';
import debounce from 'lodash/debounce';
import { SiriusPageProps } from '@/components/Layout/model';

const isElectron = api.getSystemApi().isElectron();

export function useTabs(tabs: Array<SiriusPageProps>, sidebarRef: React.RefObject<HTMLDivElement>, accountCount: number) {
  const [sidebarHeight, setSidebarHeight] = useState(660); // 默认高度
  const [showCount, setShowCount] = useState(6);
  const [tabToDisplay, setTabToDisplay] = useState<Array<SiriusPageProps>>([]);
  const [tabInMore, setTabInMore] = useState<Array<SiriusPageProps>>([]);
  const ItemHeight = 70;

  const debounceOb = debounce(entries => {
    const { contentRect } = entries[0];
    if (contentRect.height > 180) {
      setSidebarHeight(contentRect.height);
    }
  }, 500);

  useEffect(() => {
    const ob = new ResizeObserver(debounceOb);
    sidebarRef.current && ob.observe(sidebarRef.current);
    return () => {
      ob.disconnect();
    };
  }, [sidebarRef.current]);

  useEffect(() => {
    // sidebar高度
    // eslint-disable-next-line no-nested-ternary
    const paddingBottom = isElectron ? (accountCount >= 2 ? 108 : accountCount * 64 + 30) : 0;
    const h = sidebarHeight - paddingBottom;
    let count = Math.floor(h / ItemHeight) - 1;

    if (isEdm()) {
      count -= 1;
    }

    setShowCount(count);
  }, [accountCount, sidebarHeight]);

  useEffect(() => {
    let count = 0;
    const idx = tabs.findIndex(item => {
      if (!item.hidden) {
        count += 1;
      }
      if (count === showCount) {
        return true;
      }
      return false;
    });
    let tabToShow: Array<SiriusPageProps>;
    let rest: Array<SiriusPageProps> = [];
    if (idx > -1 && idx < tabs.length - 1) {
      // 出现更多
      tabToShow = tabs.slice(0, idx + 1);
      // 若全是隐藏tab，不需要出现更多
      rest = tabs.slice(idx + 1).filter(tab => !tab.hidden);
      setTabToDisplay(tabToShow);
      setTabInMore(rest);
    } else if (showCount > 0) {
      setTabToDisplay(tabs);
      setTabInMore(prev => {
        if (prev.length === 0) {
          return prev;
        }
        return [];
      });
    }
  }, [showCount, tabs]);

  return {
    tabInMore,
    tabToDisplay,
  };
}
