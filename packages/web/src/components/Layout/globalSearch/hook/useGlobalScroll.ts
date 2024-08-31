import { useEffect, useRef, useState } from 'react';
import { isWindows } from '@/components/Layout/globalSearch/constants';
interface Prop {
  tabList?: Array<{
    key: string;
    value: string;
  }>;
  defaultTab?: string;
}
const useGlobalSrcoll = ({ tabList, defaultTab }: Prop) => {
  const [globalStickShow, setGlobalStickShow] = useState<boolean>(false);
  const [globalTabShow, setGlobalTabShow] = useState<boolean>(false);
  const [selectStickyTab, setSelectStickyTab] = useState<string>('');
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (defaultTab) {
      setSelectStickyTab(defaultTab);
    }
  }, [defaultTab]);
  const onContentScroll = (evt: any) => {
    if ((evt.target as HTMLDivElement).scrollTop > (isWindows ? 30 : 0)) {
      setGlobalStickShow(true);
    } else {
      setGlobalStickShow(false);
    }
    tabList && tabList.length > 0 && defaultTab ? setSelectStickyTab(defaultTab) : '';
    handleScrollChange(evt);
    // tabList && tabList.length > 0 && defaultTab ? setSelectStickyTab(defaultTab) : handleScrollChange(evt);
  };
  const handleScrollChange = (evt: any) => {
    if (containerRef.current && (evt.target as HTMLDivElement).scrollTop > containerRef.current.offsetTop - 10) {
      setGlobalTabShow(true);
    } else {
      setGlobalTabShow(false);
    }
  };

  return {
    globalStickShow,
    globalTabShow,
    selectStickyTab,
    containerRef,
    onContentScroll,
  };
};

export default useGlobalSrcoll;
