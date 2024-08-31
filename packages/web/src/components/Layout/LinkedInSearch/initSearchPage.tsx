import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Button, Input, Select, Row, Col, Divider } from 'antd';
import { getIn18Text } from 'api';
import DownTriangle from '@web-common/components/UI/Icons/svgs/disk/DownTriangle';
import { useVersionCheck } from '@web-common/hooks/useVersion';
import { ReactComponent as CheckIcon } from '@/images/icons/customs/check.svg';
import { ReactComponent as SearchIcon } from '@/images/icons/datasearch/searchIcon.svg';
import { ReactComponent as DescIcon1 } from './assets/search_linkin_icon1.svg';
import { ReactComponent as DescIcon2 } from './assets/search_linkin_icon2.svg';
import { ReactComponent as DescIcon3 } from './assets/search_linkin_icon3.svg';
import CustomerTabs from '@/components/Layout/Customer/components/Tabs/tabs';
import { TAB_LIST, SearchType, PersonSearchTypeList } from './constant';
import style from './initSearch.module.scss';
import HistoryDropDown from '../globalSearch/search/HistoryDorpDown';
import { SearchHistoryItem } from './hooks/useSearchHistory';

interface Props {
  onSearch: Function;
  activeTab: string;
  query: string;
  searchHistoryOpen: boolean;
  searchHistory: SearchHistoryItem[];
  setSearchHistoryOpen: (open: boolean) => void;
  clearHistory: (st: string) => void;
  addToSearchHistory: (value: SearchHistoryItem) => void;
}

export interface SearchState {
  query: string;
  activeTab: string;
}

export const InitSearchPage = (props: Props) => {
  const { onSearch, activeTab, query, searchHistoryOpen, searchHistory, setSearchHistoryOpen, clearHistory, addToSearchHistory } = props;

  const [searchState, setSearchState] = useState<SearchState>({ activeTab, query });
  const searchInputRef = useRef<HTMLDivElement>(null);
  const historySearchType = useMemo(() => `${searchState.activeTab}`, [searchState]);
  useEffect(() => {
    setSearchState({ activeTab, query });
  }, [activeTab, query]);

  const triggerSearch = (newSearchState?: SearchState) => {
    if (onSearch) {
      const currSearchState = newSearchState ?? searchState;
      addToSearchHistory({
        query: currSearchState.query,
        searchType: historySearchType,
      });
      onSearch(currSearchState);
    }
  };
  const clickHistoryItem = (queryValue: string) => {
    const newSearchState = {
      ...searchState,
      query: queryValue,
    };
    setSearchState(newSearchState);
    triggerSearch(newSearchState);
  };

  return (
    <div className={style.wrapper}>
      <div className={style.head}>
        <h3 className={style.title}>{useVersionCheck() === 'v2' ? getIn18Text('SHEMEISOUSUO') : getIn18Text('LinkedInCustomerAcquisition')}</h3>
        <div className={style.desc}>
          <span>
            <CheckIcon />
            <span>{getIn18Text('ZHIJIGAOZHILIANGYONGHU')}</span>
          </span>
          <span>
            <CheckIcon />
            <span>{getIn18Text('TUPOSOUSUOPINLVXIANZHI')}</span>
          </span>
          <span>
            <CheckIcon />
            <span>{getIn18Text('ZHINENGSHENWAXIANGGUANGONGSIHEGUANJIANKP')}</span>
          </span>
          <span>
            <CheckIcon />
            <span>{getIn18Text('YIJIANYINGXIAOCHUDA')}</span>
          </span>
        </div>
        <div className={style.search}>
          <CustomerTabs
            className={style.companyTabs}
            defaultActiveKey="buysers"
            tabList={TAB_LIST}
            onChange={val => setSearchState({ ...searchState, activeTab: val })}
            activeKey={searchState.activeTab}
          />
          <Input.Group className={style.inputWrap}>
            <span ref={searchInputRef} style={{ flex: 1 }}>
              <Input
                className={style.input}
                prefix={<SearchIcon className={style.inputPreIcon} />}
                placeholder={
                  searchState.activeTab !== SearchType.person ? getIn18Text('QINGSHURUGONGSIMINGCHENG') : getIn18Text('QINGSHURUCHANPINHUOGONGSIMINGCHENGJINXINGSOUSUO')
                }
                value={searchState.query}
                onFocus={() => {
                  setSearchHistoryOpen(true);
                }}
                onPressEnter={() => triggerSearch()}
                onChange={({ target: { value } }) => setSearchState({ ...searchState, query: value })}
              />
            </span>
            <Button type="primary" className={style.searchBtn} onClick={() => triggerSearch()}>
              {getIn18Text('SOUSUO')}
            </Button>
          </Input.Group>
          <HistoryDropDown
            target={searchInputRef.current?.parentElement}
            open={searchHistoryOpen && !searchState.query && searchHistory.filter(e => e.searchType === historySearchType).length > 0}
            changeOpen={setSearchHistoryOpen}
            searchList={searchHistory}
            onDelete={clearHistory}
            onClick={clickHistoryItem}
            searchType={historySearchType}
            subBtnVisible={false}
            autoDetectSubType={false}
          />
        </div>
      </div>
      <div className={style.content}>
        <div className={style.contentTitle}>{getIn18Text('ProductFeatures')}</div>
        <Row justify="space-between" gutter={20}>
          <Col span={8}>
            <div className={style.descCard}>
              <div className={style.descIcon}>
                <DescIcon1 />
              </div>
              <div className={style.descContent}>
                <div className={style.descTitle}>{getIn18Text('facebookTitle1')}</div>
                <div className={style.descText}>利用LinkedIn这一高质量信息平台作为信息源，帮助您高效寻找真实企业，快速触达目标客户。</div>
              </div>
            </div>
          </Col>
          <Col span={8}>
            <div className={style.descCard}>
              <div className={style.descIcon}>
                <DescIcon2 />
              </div>
              <div className={style.descContent}>
                <div className={style.descTitle}>{getIn18Text('facebookTitle2')}</div>
                <div className={style.descText}>通过关键词搜索到目标公司后，可通过系统的多维度智能深挖，发掘企业关键联系人。</div>
              </div>
            </div>
          </Col>
          <Col span={8}>
            <div className={style.descCard}>
              <div className={style.descIcon}>
                <DescIcon3 />
              </div>
              <div className={style.descContent}>
                <div className={style.descTitle}>多维度联系方式</div>
                <div className={style.descText}>可根据关键词或公司名高效搜索联系人信息，整合呈现多种联系方式，一键进行邮件/WhatsApp营销。</div>
              </div>
            </div>
          </Col>
        </Row>
      </div>
    </div>
  );
};
