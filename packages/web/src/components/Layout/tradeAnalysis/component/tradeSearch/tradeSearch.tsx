import React, { useState, useRef, useImperativeHandle, useEffect } from 'react';
import classnames from 'classnames';
import style from './tradeSearch.module.scss';
import SearchTab from '../../../globalSearch/search/SearchTab';
import { getIn18Text, HasQuantity } from 'api';
import GlobalSearchInput from '@/components/Layout/globalSearch/search/SearchInput/GlobalSearchInput';
import { SearchGlobalIcon } from '@web-common/components/UI/Icons/svgs/SearchSvg';
import { CustomsSearchRef } from '@/components/Layout/CustomsData/customs/customsSearch/customsSearch';
import { useIsForwarder } from '@/components/Layout/CustomsData/customs/ForwarderSearch/useHooks/useIsForwarder';
import HscodeDropList from '@/components/Layout/CustomsData/customs/docSearch/component/HscodeDropList/HscodeDropList';
import TradeHistory from './tradeHistory';
export type TabValueList = '1' | '2' | '3';
import { HistoryItem } from './tradeHistory';
export interface TradeSeachProps {
  defaultSearchtype: TabValueList;
  handleSearchTypeChange: (value: TabValueList) => void;
  onSearch: (value: string) => void;
  value: string;
  onChange: (value: React.ChangeEvent<HTMLInputElement>) => void;
  quantity: HasQuantity;
  initLayout: boolean;
  placeholder?: string;
  historySearch?: (value: HistoryItem) => void;
  historyList?: HistoryItem[];
}

// 搜索类型相关接口
interface ITabOption {
  label: string;
  value: TabValueList;
}

const SearchTypeOptions: ITabOption[] = [
  {
    label: getIn18Text('ANCHANPIN'),
    value: '1',
  },
  {
    label: '按HSCode',
    value: '2',
  },
  {
    label: '按企业',
    value: '3',
  },
];

const TradeSearch = React.forwardRef<CustomsSearchRef, TradeSeachProps>(
  (
    { handleSearchTypeChange, onSearch, value, onChange, defaultSearchtype, quantity, initLayout, placeholder, historySearch, historyList, ...rest },
    customsSearchRef
  ) => {
    const searchboxRef = useRef<HTMLInputElement>(null);
    const [isHsCode, setIsHsCode] = useState<Boolean>(false);
    const [isFocus, setIsFocus] = useState<boolean>(false);
    const [isShowOption, setIsShowOption] = useState<boolean>(false);
    // 货代菜单权限
    const isForwarder = useIsForwarder();
    useEffect(() => {
      setIsHsCode(defaultSearchtype === '2');
      setIsShowOption(false);
      // setSelectVal(tabValue);
    }, [defaultSearchtype]);
    useImperativeHandle(
      customsSearchRef,
      () => ({
        // blur target
        getInputWrapper() {
          return searchboxRef.current;
        },
        getSearchWrapper() {
          return searchboxRef.current?.parentElement || null;
        },
      }),
      []
    );
    return (
      <div className={style.searchComp}>
        <SearchTab
          defaultActiveKey={defaultSearchtype}
          tabList={isForwarder ? SearchTypeOptions : SearchTypeOptions.filter(item => item.value !== '3')}
          activeKey={defaultSearchtype}
          onChange={value => {
            handleSearchTypeChange(value);
          }}
        ></SearchTab>
        <div className={classnames(style.searchInputWrapper)}>
          <GlobalSearchInput
            ref={searchboxRef}
            onSearch={onSearch}
            value={value}
            prefix={<SearchGlobalIcon />}
            placeholder={placeholder}
            enterButton={getIn18Text('SOUSUO')}
            hiddenSearch={defaultSearchtype === '3' ? true : false}
            onChange={e => {
              onChange(e);
            }}
            onFocus={e => {
              // onFocus?.(e);
              setIsFocus(true);
            }}
            onBlur={() => {
              setIsFocus(false);
            }}
            {...rest}
          />
          <HscodeDropList
            onSelect={value => {
              // onChangeCurrentValue(value);
              onSearch(value);
            }}
            isFouse={isFocus}
            visible={isShowOption}
            onChangeVisible={setIsShowOption}
            searchValue={isHsCode ? value : undefined}
            target={searchboxRef.current}
            blurTarget={searchboxRef.current?.parentElement}
          />
        </div>
        {initLayout && (
          <div className={style.useQuery}>
            {getIn18Text('MEIRIKECHAXUN')}
            {quantity.dayTotalQuota}, {getIn18Text('JINRISHENGYU')}
            <span>{quantity.dayResidualQuota}</span>
            {getIn18Text('CI')}
          </div>
        )}
        {initLayout && defaultSearchtype === '3' && (
          <TradeHistory
            list={historyList || []}
            onSearch={value => {
              historySearch && historySearch(value);
            }}
          />
        )}
      </div>
    );
  }
);

export default TradeSearch;
