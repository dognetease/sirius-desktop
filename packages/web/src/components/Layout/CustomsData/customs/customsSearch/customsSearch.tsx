import React, { useEffect, useImperativeHandle, useRef, useState } from 'react';
import style from './customsSearch.module.scss';
import classnames from 'classnames';
import Input from '@/components/Layout/Customer/components/UI/Input/customerInput';
import { SearchIconAtInput } from '@web-common/components/UI/Icons/svgs/SearchSvg';
import { Button, Checkbox, Select, Tooltip } from 'antd';
import { ReactComponent as ArrowDown } from '@/images/icons/customs/arrow_down_fullfill.svg';
import { customsDataType } from '@/../../api/src';
import { ReactComponent as QuestionIcon } from '@/images/icons/customs/question.svg';
import HscodeDropList from '../docSearch/component/HscodeDropList/HscodeDropList';
import HollowOutGuide from '@web-common/components/UI/HollowOutGuideNew/hollowOutGuide';
import { getIn18Text } from 'api';
import GlobalSearchInput from '@/components/Layout/globalSearch/search/SearchInput/GlobalSearchInput';
import GptRcmdList from '@/components/Layout/globalSearch/search/GptRcmdList/GptRcmdList';
import CustomsUpdateTime from './CustomsUpdateTime';
import { SearchGlobalIcon } from '@web-common/components/UI/Icons/svgs/SearchSvg';

interface Props {
  className: string;
  placeholder: string;
  onSearch: (param: string, nearSynonymList?: string[]) => void;
  initLayout: boolean;
  value: string;
  tabValue: customsDataType;
  onChangeCurrentValue: (param: string) => void;
  isExactSearch: boolean;
  onSearchType: (isExactSearch: boolean) => void;
  // handleSelect: (v: customsDataType) => void;
  onFocus?: React.FocusEventHandler<HTMLInputElement>;
  searchedValue?: string;
  checkedNearSynonymList?: string[];
}
const tabs: Array<{
  label: string;
  value: customsDataType;
  desc?: string;
}> = [
  {
    label: getIn18Text('CHANPIN'),
    value: 'goodsShipped',
    desc: getIn18Text('QINGSHURUCHANPINMINGCHENGHUOCHANPINMIAOSHU'),
  },
  {
    label: getIn18Text('GONGSI'),
    value: 'company',
    desc: getIn18Text('QINGSHURUGONGSIMINGCHENG'),
  },
  {
    label: 'HSCode',
    value: 'hsCode',
    desc: getIn18Text('QINGSHURUHSCODE'),
  },
];

export interface CustomsSearchRef {
  getInputWrapper?(): HTMLElement | null;
  getSearchWrapper?(): Element | null;
}

const CustomsSearch = React.forwardRef<CustomsSearchRef, Props>(
  (
    { className, onSearch, initLayout, value, tabValue, onChangeCurrentValue, onSearchType, isExactSearch, onFocus, searchedValue, checkedNearSynonymList },
    customsSearchRef
  ) => {
    const [isHsCode, setIsHsCode] = useState<Boolean>(false);
    const [isShowOption, setIsShowOption] = useState<boolean>(false);
    // const [selectVal, setSelectVal] = useState<customsDataType>(tabValue);
    const searchboxRef = useRef<HTMLInputElement>(null);
    const [isFocus, setIsFocus] = useState<boolean>(false);
    const curTab = tabs.find(e => e.value === tabValue);
    useEffect(() => {
      setIsHsCode(tabValue == 'hsCode');
      setIsShowOption(false);
      // setSelectVal(tabValue);
    }, [tabValue]);

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

    const fetchData = (val: string) => {
      // const value = (e.target as HTMLInputElement).value;
      onSearch(val);
    };
    const changeValue = (e: React.FormEvent<HTMLInputElement>) => {
      const value = (e.target as HTMLInputElement).value;
      onChangeCurrentValue(value);
    };
    // const handleSelectChange = (val: customsDataType) => {
    //   setSelectVal(val);
    //   handleSelect(val);
    // };
    return (
      <div
        // ref={searchboxRef}
        className={classnames(style.searchBox, className, {
          [style.searchBoxInit]: initLayout,
          [style.searchBoxList]: !initLayout,
        })}
      >
        <GlobalSearchInput
          ref={searchboxRef}
          enterButton={getIn18Text('SOUSUO')}
          checkedRcmdList={checkedNearSynonymList}
          onRemoveRcmd={name => {
            const nextList = checkedNearSynonymList?.filter(e => e !== name);
            onSearch(value, nextList);
          }}
          prefix={<SearchGlobalIcon />}
          onFocus={e => {
            onFocus?.(e);
            setIsFocus(true);
          }}
          onBlur={() => {
            setIsFocus(false);
          }}
          // className={classnames(style.inputLarge)}
          value={value}
          placeholder={curTab?.desc}
          onChange={changeValue}
          onSearch={fetchData}
          suffix={
            <div className={style.button} hidden={tabValue === 'hsCode'}>
              <Checkbox
                className={style.precise}
                onChange={e => {
                  onSearchType(e.target.checked);
                }}
                checked={isExactSearch}
              >
                {getIn18Text('JINGQUE')}
              </Checkbox>
              <Tooltip
                title={
                  <>
                    <span>模糊搜索：搜索结果将匹配搜索词中的任一个关键词。</span>
                    <br />
                    <span>精确搜索：搜索结果将完全匹配搜索词中的全部关键词。</span>
                  </>
                }
              >
                <QuestionIcon />
              </Tooltip>
            </div>
          }
        />
        {!initLayout && tabValue === 'goodsShipped' && !!searchedValue && (
          <GptRcmdList
            disableLang
            searchedValue={searchedValue}
            checkedRcmdList={checkedNearSynonymList}
            onCheckRmcd={(list, dosearch) => {
              dosearch && onSearch(value, list);
            }}
          />
        )}
        <CustomsUpdateTime
          className={classnames(style.time, {
            [style.timeLayout]: !initLayout,
          })}
          initLayout={initLayout}
          showOption={isShowOption}
        />
        <HscodeDropList
          onSelect={value => {
            onChangeCurrentValue(value);
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
    );
  }
);
export default CustomsSearch;
