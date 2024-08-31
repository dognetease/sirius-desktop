import React, { useContext, useEffect, useMemo } from 'react';
import PlusOutlined from '@ant-design/icons/PlusOutlined';
import { SearchGlobalIcon } from '@web-common/components/UI/Icons/svgs/SearchSvg';
import classNames from 'classnames';
import { SubKeyWordContext } from '../../keywordsSubscribe/subcontext';
import style from './index.module.scss';
import { globalSearchDataTracker } from '../../tracker';
import { GlobalSearchSubKeywordType } from 'api';
import { getIn18Text } from 'api';
import { HistoryFilterParams } from '../commonMap';
import { CountryFilterProp } from '../search';
import { FilterParam } from '../search';

type QueryType = string | string[];
type FilterType = 'filterVisited' | 'hasMail' | 'notLogisticsCompany' | 'hasCustomData' | 'hasWebsite' | 'filterEdm';
export interface ItemProp {
  query: any;
  searchType: string;
  filterParams?: FilterParam;
  country?: CountryFilterProp[];
  time?: CountryFilterProp[];
  language?: CountryFilterProp[];
  excludeValueList?: string;
}

interface SearchHistoryItemProps<T extends QueryType = string> {
  name: T;
  subBtnVisible?: boolean;
  onClick(name: T, data?: ItemProp): void;
  hideSearchIcon?: boolean;
  itemLayout?: 'inline' | 'vertical';
  subType?: GlobalSearchSubKeywordType;
  autoDetectSubType?: boolean;
  renderExtra?(extra?: string[]): void;
  country?: CountryFilterProp[];
  filterParams?: FilterParam;
  data?: ItemProp;
}

const SearchHistoryItem: <T extends QueryType>(
  props: SearchHistoryItemProps<T> & {
    children?: React.ReactNode;
  }
) => React.ReactElement = ({
  name: propsName,
  onClick,
  subBtnVisible,
  hideSearchIcon = false,
  itemLayout = 'vertical',
  subType = 'product',
  autoDetectSubType,
  renderExtra,
  country,
  filterParams,
  data,
}) => {
  const [state, dispatch] = useContext(SubKeyWordContext);
  const [name, ...restName] = typeof propsName === 'string' ? [propsName] : propsName;
  const subed = state.list.map(e => e.value).includes(name);
  const initSubType = useMemo<GlobalSearchSubKeywordType>(() => {
    if (autoDetectSubType) {
      return Number.isInteger(Number(name)) ? 'hscode' : 'product';
    } else {
      return subType;
    }
  }, [autoDetectSubType, subType, name]);
  const handleSubOpen = () => {
    dispatch({
      type: 'MODAL_OPEN_CHANGE',
      payload: {
        open: true,
        initForm: {
          keyword: name,
          product: initSubType,
        },
      },
    });
    globalSearchDataTracker.trackKeywordSubCreate('record');
  };
  return (
    <div
      className={style.itemContent}
      onClick={() => {
        onClick(propsName, data);
      }}
    >
      <div
        className={classNames(style.item, {
          [style.itemInline]: itemLayout === 'inline',
        })}
        key={name}
      >
        {!hideSearchIcon && <SearchGlobalIcon />}
        <span className={style.name} data-link>
          <span>{name}</span>
        </span>
        {subBtnVisible && (
          <>
            {subed ? (
              <span className={style.sub}>{getIn18Text('YIDINGYUE')}</span>
            ) : (
              <span className={classNames(style.sub, style.subNew)} onClick={handleSubOpen}>
                <PlusOutlined color="#4C6AFF" twoToneColor="#4C6AFF" />
                <span className={style.subtext}>{getIn18Text('DINGYUE')}</span>
              </span>
            )}
          </>
        )}
      </div>
      <div className={style.itemFilter}>
        <span>{restName.length > 0 && !!renderExtra && renderExtra(restName)}</span>
        <span
          className={classNames(style.itemCountry, {
            [style.itemBefore]:
              restName.length > 0 &&
              ((country && country.length) ||
                (filterParams && Object.keys(filterParams).length) ||
                (data?.language && data?.language.length) ||
                (data?.time && data.time.length) ||
                data?.excludeValueList),
          })}
        >
          {country &&
            country.length > 0 &&
            country?.map((item, index) => {
              return (
                <span>
                  {item.label}
                  {index + 1 === country.length &&
                  (!filterParams || Object.keys(filterParams ?? {}).length === 0) &&
                  (!data?.language || data.language.length === 0) &&
                  !data?.time &&
                  !data?.excludeValueList
                    ? ''
                    : ' 、'}
                </span>
              );
            })}
          {filterParams &&
            Object.keys(filterParams).map((item, index) => {
              return (
                <span>
                  {HistoryFilterParams[item as FilterType]}
                  {index + 1 === Object.keys(filterParams).length && (!data?.language || data.language.length === 0) && !data?.time && !data?.excludeValueList
                    ? ''
                    : ' 、'}
                </span>
              );
            })}
          {data?.language && data?.language.length > 0 && (
            <span>
              {data?.language[0].label}
              {data.language.length > 1 ? `等${data.language.length}种语言` : ''}
              {!data?.time && !data?.excludeValueList ? '' : ' 、'}
            </span>
          )}
          {data?.time &&
            data.time.length > 0 &&
            data.time.map((item, index) => {
              return (
                <span>
                  {item.label} {index + 1 === data.time?.length && !data?.excludeValueList ? '' : ' 、'}
                </span>
              );
            })}
          {data?.excludeValueList && '不包含' + data.excludeValueList}
        </span>
      </div>
    </div>
  );
};

export default SearchHistoryItem;
