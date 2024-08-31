import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Menu, Dropdown } from 'antd';
import { apiHolder as api, apis, DataTrackerApi, MailApi, MailSearchRecord, MailSearchTypes } from 'api';
import TimeIcon from '@web-common/components/UI/Icons/svgs/TimeSvg';
import AdvancedIcon from '@web-common/components/UI/Icons/svgs/AdvanceSearchSvg';
import './index.scss';
import { useAppSelector } from '@web-common/state/createStore';
import { setCurrentAccount } from '../../util';
import { getIn18Text } from 'api';

const mailApi = api.api.requireLogicalApi(apis.mailApiImpl) as MailApi;
const trackApi: DataTrackerApi = api.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;
interface BaseSearchBoxProp {
  visible: boolean;
  setVisible: (visible: boolean) => void;
  setAdvancedSearchVisible: (visible: boolean) => void;
  setSearchType: (searchType: MailSearchTypes) => void;
  setInputValue: (inputValue: string) => void;
  onSearchChange: (inputValue: string) => void;
  searchWord: string;
  searchType?: MailSearchTypes;
}
interface SearchItem {
  key: MailSearchTypes;
  name: string;
  exclude?: boolean;
}
type SearchTypeConfig = Record<MailSearchTypes, SearchItem>;
const SEARCH_TYPES: SearchTypeConfig = {
  all: { key: 'all', name: '', exclude: true },
  title: { key: 'title', name: getIn18Text('ZHUTI') },
  sender: { key: 'sender', name: getIn18Text('FAJIANREN') },
  receiver: { key: 'receiver', name: getIn18Text('SHOUJIANREN') },
  attachment: { key: 'attachment', name: getIn18Text('FUJIANMINGCHENG') },
};
const SEARCH_TYPES_OPTIONS: SearchItem[] = Object.keys(SEARCH_TYPES)
  .map(key => SEARCH_TYPES[key as MailSearchTypes])
  .filter(v => !v.exclude);
const BaseSearchBox: React.FC<BaseSearchBoxProp> = ({
  children,
  visible,
  searchWord,
  setAdvancedSearchVisible,
  setVisible,
  setSearchType,
  setInputValue,
  onSearchChange,
  searchType = SEARCH_TYPES.all.key,
}) => {
  const [contentVisible, setContentVisible] = useState(false);
  const [associateVisible, setAssociateVisible] = useState(false);
  const [recordList, setRecordList] = useState<MailSearchRecord[]>([]);
  // 控制可见性，获取联想记录
  useEffect(() => {
    if (visible) {
      if (searchWord) {
        setContentVisible(true);
        setAssociateVisible(false);
        setRecordList([]);
      } else {
        // 搜索都在主账号下
        // setCurrentAccount();
        mailApi.doGetMailSearchRecords(10).then(res => {
          if (visible) {
            if (res.length > 0) {
              setContentVisible(false);
              // 加一个延时，是为了避免上一个弹窗消失的动画，导致这个弹窗出现时有点卡顿
              setTimeout(() => {
                setAssociateVisible(true);
                setRecordList(res);
              }, 30);
            } else {
              setContentVisible(false);
              setAssociateVisible(false);
              setRecordList([]);
            }
          }
        });
      }
    } else {
      setContentVisible(false);
      setAssociateVisible(false);
      setRecordList([]);
    }
  }, [visible, searchWord]);
  // 无联想记录时，联想弹框不可见
  useEffect(() => {
    if (recordList.length === 0) {
      setAssociateVisible(false);
    }
  }, [recordList]);
  // 高级搜索
  const onAdvancedClick = useCallback(() => {
    trackApi.track('pcMail_click_advancedSearch');
    setVisible(false);
    setAdvancedSearchVisible(true);
  }, []);
  // 普通搜索类别
  const onItemSearchClick = useCallback(
    (item: SearchItem) => {
      setSearchType(item.key);
      setVisible(false);
      onSearchChange(searchWord);
    },
    [searchWord]
  );
  // 搜索全部
  const onItemAllClick = useCallback(() => {
    setSearchType(SEARCH_TYPES.all.key);
    setVisible(false);
    onSearchChange(searchWord);
  }, [searchWord]);
  // 联想浮层点击
  const onAssociateItemClick = useCallback((item: MailSearchRecord) => {
    setInputValue(item.content);
    setSearchType(item.type);
    setVisible(false);
  }, []);
  // 删除联想记录
  const onAssociateDelClick = useCallback(
    (item?: MailSearchRecord, index: number = 0) => {
      let payload: MailSearchRecord[] = [];
      let delList = [];
      if (item) {
        payload = [...recordList.slice(0, index), ...recordList.slice(index + 1)];
        delList = [item.id];
      } else {
        delList = recordList.map(item => item.id);
      }
      setRecordList(payload);
      // setCurrentAccount();
      mailApi.doDeleteMailSearchRecord(delList).then();
    },
    [recordList, setRecordList]
  );
  const isCorpMail = useAppSelector(state => state.loginReducer.loginInfo.isCorpMailMode);
  // 搜索浮层
  const ContentMenu = useMemo(
    () => (
      <Menu defaultSelectedKeys={[SEARCH_TYPES.all.key]} selectedKeys={[searchType]} className="base-search-context-menu">
        <Menu.Item key={SEARCH_TYPES.all.key} className="search-all-item" onClick={() => onItemAllClick()}>
          <span>{getIn18Text('SOUSUOQUANBUJIE')}</span>
          <span className="search-all-enter">Enter</span>
        </Menu.Item>
        {isCorpMail
          ? ''
          : SEARCH_TYPES_OPTIONS.map(it => (
              <Menu.Item key={it.key} onClick={() => onItemSearchClick(it)}>
                {it.name}
                {getIn18Text('BAOHAN1')}
                <span className="highlight">{searchWord}</span>
              </Menu.Item>
            ))}
        <Menu.Divider />
        <Menu.Item key="advancedSearch" className="advanced-search-item" onClick={onAdvancedClick}>
          <AdvancedIcon className="advanced-search-icon" />
          {getIn18Text('GAOJISOUSUO')}
        </Menu.Item>
      </Menu>
    ),
    [searchWord, searchType]
  );
  // 联想浮层
  const AssociateMenu = useMemo(
    () => (
      <Menu className="base-search-associate-menu">
        <Menu.Item key="recordTitle" className="associate-title">
          <div className="associate-item-title">
            <span>{getIn18Text('LISHISOUSUO')}</span>
            <span className="associate-item-clear" onClick={() => onAssociateDelClick()}>
              {getIn18Text('QINGKONG')}
            </span>
          </div>
        </Menu.Item>
        {recordList.map((it, index) => (
          <Menu.Item
            key={it.id}
            className="associate-item"
            onClick={({ domEvent }) => {
              domEvent.stopPropagation();
              onAssociateItemClick(it);
            }}
          >
            <TimeIcon className="associate-item-icon" />
            <span className="associate-item-content" title={it.content}>
              {it.content}
            </span>
            <span className="associate-item-type">{SEARCH_TYPES[it.type].name}</span>
            <span
              className="associate-item-delete"
              onMouseDown={e => {
                e.stopPropagation();
                e.preventDefault();
                onAssociateDelClick(it, index);
              }}
            />
          </Menu.Item>
        ))}
        <Menu.Divider />
        <Menu.Item key="advancedSearch" className="associate-item" onClick={onAdvancedClick}>
          <AdvancedIcon className="advanced-search-icon" />
          {getIn18Text('GAOJISOUSUO')}
        </Menu.Item>
      </Menu>
    ),
    [recordList]
  );
  // 浮层
  const DropdownOverlay = useMemo(() => {
    if (visible) {
      if (contentVisible) {
        return ContentMenu;
      }
      if (associateVisible) {
        return AssociateMenu;
      }
    }
    return <></>;
  }, [visible, contentVisible, associateVisible, recordList]);
  return (
    <Dropdown overlay={DropdownOverlay} visible={visible && (contentVisible || associateVisible)} trigger={['click']}>
      {children}
    </Dropdown>
  );
};
export default BaseSearchBox;
