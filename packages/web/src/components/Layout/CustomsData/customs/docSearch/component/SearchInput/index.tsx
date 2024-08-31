import { CustomsRecordReq } from 'api';
import { ReactComponent as ArrowDown } from '@/images/icons/customs/arrow_down_fullfill.svg';
import { SearchIconAtInput } from '@web-common/components/UI/Icons/svgs/SearchSvg';
import { Select } from 'antd';
import classnames from 'classnames';
import React, { useEffect, useImperativeHandle, useRef, useState } from 'react';
import style from './searchinput.module.scss';
import styles from '../../../customsSearch/customsSearch.module.scss';
import HscodeDropList from '../HscodeDropList/HscodeDropList';
import { getIn18Text } from 'api';
import GlobalSearchInput, { SearchInputProps as GlobalSearchInputProps } from '@/components/Layout/globalSearch/search/SearchInput/GlobalSearchInput';
import GptRcmdList from '@/components/Layout/globalSearch/search/GptRcmdList/GptRcmdList';
export type CustomsSearchType = keyof Required<Pick<CustomsRecordReq, 'queryCompany' | 'goodsShipped' | 'hsCode' | 'port'>>;

interface SearchInputProps extends GlobalSearchInputProps {
  layoutLevel: number;
  onDocSearch?(param: { value: string; type: CustomsSearchType; nearSynonymList?: string[] }): void;
  onCombineChange?(type: CustomsSearchType, value: string): void;
  combineValue: [CustomsSearchType, string];
  originValue?: string;
  tranlateValue?: string;
  searchedValue?: string;
  checkedNearSynonymList?: string[];
  getCustomsNearSynonymList?: (value: string[]) => void;
}

export const tabs: Array<{ value: CustomsSearchType; label: string; desc?: string }> = [
  {
    value: 'goodsShipped',
    label: getIn18Text('CHANPIN'),
    desc: getIn18Text('CHANPINMINGCHENGHUOCHANPINMIAOSHU'),
  },
  {
    value: 'hsCode',
    label: 'HSCode',
  },
  {
    value: 'queryCompany',
    label: getIn18Text('GONGSI'),
    desc: getIn18Text('GONGSIMINGCHENG'),
  },
  {
    value: 'port',
    label: getIn18Text('GANGKOU'),
  },
];

export interface DocSearchInputRef {
  getWrapperRef(): HTMLElement | null;
  getInputWrapper(): HTMLInputElement | null;
}

const DocSearchInput = React.forwardRef<DocSearchInputRef, SearchInputProps>(
  (
    {
      layoutLevel,
      onDocSearch,
      onCombineChange,
      combineValue,
      originValue,
      tranlateValue,
      onFocus,
      onBlur,
      searchedValue,
      checkedNearSynonymList,
      getCustomsNearSynonymList,
      ...rest
    },
    forwardRef
  ) => {
    const [stype, sValue] = combineValue;
    const [open, setOpen] = useState<boolean>(false);
    const innerInputRef = useRef<HTMLInputElement>(null);
    const [left, setLeft] = useState<number>(0);
    const [top, setTop] = useState<number | string>(0);

    const [inputFocus, setInputFocus] = useState<boolean>(false);

    const handerTranslate = (value: string) => {
      var dom = document.createElement('div');
      dom.innerHTML = value;
      dom.style.visibility = 'hidden';
      dom.style.display = 'inline-block';
      document.body.appendChild(dom);
      let length = dom.clientWidth || value.length * 12;
      dom.remove();
      if (value) {
        let val = 35 + length;
        if (val > 500) {
          setLeft(15);
          setTop(52);
        } else {
          setLeft(151 + length);
          setTop(0);
        }
      }
    };

    useEffect(() => {
      if (originValue && tranlateValue) {
        handerTranslate(originValue);
      } else {
        setLeft(0);
      }
    }, [originValue, tranlateValue]);
    useImperativeHandle(
      forwardRef,
      () => ({
        getWrapperRef() {
          return innerInputRef.current?.parentElement || null;
        },
        getInputWrapper() {
          return innerInputRef.current;
        },
      }),
      [innerInputRef.current]
    );

    const handleSearch = (value?: string, nearSynonymList?: string[]) => {
      onDocSearch?.({
        value: value ? value : sValue,
        type: stype,
        nearSynonymList,
      });
    };

    useEffect(() => {
      setOpen(false);
    }, [stype]);

    const curTab = tabs.find(e => e.value === stype);

    if (layoutLevel < 3) {
      return (
        <div
          className={classnames(styles.searchBox, style.searchbox, {
            [styles.searchBoxInit]: layoutLevel === 1,
            [styles.searchBoxList]: layoutLevel > 1,
          })}
        >
          <GlobalSearchInput
            ref={innerInputRef}
            checkedRcmdList={checkedNearSynonymList}
            onRemoveRcmd={name => {
              const nextList = checkedNearSynonymList?.filter(e => e !== name);
              handleSearch(sValue, nextList);
            }}
            // prefix={
            //   <div className={styles.searchPrefix}>
            //     <Select
            //       className={style.select}
            //       value={stype}
            //       onChange={st => {
            //         onCombineChange?.(st, '');
            //       }}
            //       suffixIcon={<ArrowDown />}
            //     >
            //       {tabs.map(item => {
            //         return <Select.Option value={item.value}>{item.label}</Select.Option>;
            //       })}
            //     </Select>
            //     <div className={styles.divide}></div>
            //     <span className={styles.searchPrefixIcon}>
            //       <SearchIconAtInput hover={inputFocus} />
            //     </span>
            //   </div>
            // }
            value={sValue}
            onChange={e => {
              onCombineChange?.(stype, e.target.value);
            }}
            // className={classnames(styles.inputLarge, style.input)}
            placeholder={`请输入${curTab?.desc || curTab?.label}`}
            onFocus={(...e) => {
              onFocus?.(...e);
              setInputFocus(true);
            }}
            onBlur={(...e) => {
              onBlur?.(...e);
              setInputFocus(false);
            }}
            onSearch={str => {
              handleSearch(str);
            }}
            enterButton={getIn18Text('SOUSUO')}
            {...rest}
          />
          {layoutLevel > 1 && stype === 'goodsShipped' && !!searchedValue && (
            <GptRcmdList
              disableLang
              searchedValue={searchedValue}
              checkedRcmdList={checkedNearSynonymList}
              onCheckRmcd={(list, dosearch) => {
                dosearch && getCustomsNearSynonymList && getCustomsNearSynonymList(list);
                dosearch && handleSearch(sValue, list);
              }}
            />
          )}
          {/* <Input.Group
            compact
            className={classnames(styles.inputWrap, style.inputGroup, {
              [styles.inputWrapInit]: layoutLevel === 1,
            })}
          > */}
          {/* <Select
              className={style.select}
              value={stype}
              onChange={st => {
                onCombineChange?.(st, '');
              }}
              suffixIcon={<ArrowDown />}
            >
              {tabs.map(item => {
                return <Select.Option value={item.value}>{item.label}</Select.Option>;
              })}
            </Select> */}
          {/* <HollowOutGuide
              title="系统会自动翻译成多语种搜索，可在筛选条件中切换语种"
              guideId="MUTI_LANG_TIP"
              okText="知道了"
              type="3"
              enable={!!sValue && stype === 'goodsShipped' && layoutLevel === 2}
            > */}
          {/* <Input
              value={sValue}
              onChange={e => {
                onCombineChange?.(stype, e.target.value);
              }}
              className={classnames(styles.inputLarge, style.input)}
              placeholder={`请输入${curTab?.desc || curTab?.label}`}
              prefix={<SearchIconAtInput hover={inputFocus} />}
              onPressEnter={() => handleSearch()}
              onFocus={(...e) => {
                onFocus?.(...e);
                setInputFocus(true);
              }}
              onBlur={(...e) => {
                onBlur?.(...e);
                setInputFocus(false);
              }}
              {...rest}
            /> */}
          {/* </HollowOutGuide> */}
          {/* <Button
              type="primary"
              onClick={() => {
                handleSearch();
              }}
              className={styles.searchBtn}
            >
              {getIn18Text('SOUSUO')}
            </Button>
          </Input.Group> */}
          <HscodeDropList
            onSelect={hscode => {
              onCombineChange?.('hsCode', hscode);
              handleSearch(hscode);
              // setOpen(false)
            }}
            isFouse={inputFocus}
            visible={open}
            onChangeVisible={setOpen}
            searchValue={stype === 'hsCode' ? sValue : undefined}
            target={innerInputRef.current}
            blurTarget={innerInputRef.current?.parentElement}
          />
        </div>
      );
    }
    return null;
  }
);

export default DocSearchInput;
