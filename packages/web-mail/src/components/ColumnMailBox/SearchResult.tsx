/**
 * 搜索结果
 * 搜索逻辑如下：
 * 首次搜索：输入关键词后执行loading，搜索排序第一的账号（主账号）内容，返回后展示账号，展开未选中账号继续搜索
 * 二次搜索：除了先搜索当前展开的账号外，其他与同上
 * 已经开始搜索后，再点击任意账号展开，不影响搜索过程
 */
import React, { useMemo, useState, useEffect, useCallback } from 'react';
import lodashGet from 'lodash/get';
import { isObject } from 'lodash';
import { FLOLDER } from '@web-mail/common/constant';
import cloneDeep from 'lodash/cloneDeep';
import SearchOutlined from '@ant-design/icons/SearchOutlined';
import IconCard from '@web-common/components/UI/IconCard';
import { apiHolder as api, apis, MailBoxModel, MailStatType, AccountApi, MailSearchCondition } from 'api';
import { SearchLoading } from '@web-common/components/UI/SearchLoading/searchLoading';
import SiriusCollapse from '@web-mail/components/SiriusCollapse';
import { SearchSelectedKeyMap, SearchSelectedKeyObj, accountObj } from '../../types';
import { getChildTreeByRule, SEARCH_RESULT_STATS_ORDER } from '../../util';
import useState2RM from '../../hooks/useState2ReduxMock';
import SearchResultTree from './SearchResultTree';
import { getIn18Text } from 'api';

interface SearchResultProps {
  handleSwitchFolder: (node: MailBoxModel, filterCond: MailSearchCondition[]) => void;
  expandFolder: (keys: any) => void;
  reSearch: (key: string) => void;
  onSeverSearch: (key: string) => void;
}

const accountApi = api.api.requireLogicalApi(apis.accountApiImpl) as AccountApi;

const SearchResult: React.FC<SearchResultProps> = props => {
  const { handleSwitchFolder, expandFolder, reSearch, onSeverSearch } = props;
  // 搜索列表-上部-二级tab选中
  const [searchSelected] = useState2RM('searchListStateTab', 'doUpdateSearchListStateTab');
  // 邮件-搜索-搜索状态对象
  const [mailSearchStateMap, doUpdateMailSearchStateMap] = useState2RM('mailSearchStateMap', 'doUpdateMailSearchStateMap');
  // 邮件-搜索-搜索类型
  const [mailSearching] = useState2RM('mailSearching', 'doUpdateMailSearching');
  // 是否处于搜索模式
  const isSearching = useMemo(() => !!mailSearching, [mailSearching]);
  // 邮件-搜索-是否是高级搜素
  const isAdvancedSearch = useMemo(() => mailSearching === 'advanced', [mailSearching]);
  // 当前搜索账号
  const [mailSearchAccount, doUpdateMailSearchAccount] = useState2RM('mailSearchAccount', 'doUpdateMailSearchAccount');
  // 搜索列表-当前选中的key
  const [selectedSearchKeys, setSelectedSearchKeys] = useState2RM('selectedSearchKeys', 'doUpdateSelectedSearchKey');
  // 搜索列表-文件夹-树形结构-list
  const [searchResultObj, setSearchResultObj] = useState2RM('searchResultObj', 'doUpdateSearchResultObj');
  // 邮件列表整体是否处于loading
  const [searchLoading] = useState2RM('searchLoading', 'doUpdateMailSearchLoading');
  // 搜索-非文件夹-默认选中的key，因为是动态的所以要设置一下
  const [defaultSelectedSearchKeyMap, doUpdateDefaultSelectedSearchKeyMap] = useState2RM('defaultSelectedSearchKeyMap', 'doUpdateDefaultSelectedSearchKeyMap');
  // 搜索结果临时数组，存储每个账号的搜索结果
  const [searchResultList, setSearchResultList] = useState<any>([{}]);
  // 中间态key设置
  const [intermediateKey, setIntermediateKey] = useState<string[]>([]);
  // 所有账号
  const [totalAccount, setTotalAccount] = useState<accountObj[]>([]);

  const getTotalAccount = async () => {
    const totalAccounts = ((await accountApi.getMainAndSubAccounts({ expired: false })) || []).map(item => ({
      // 例：绑定第三方个人邮箱后，显示邮箱和实际用于搜索的是不一样的
      // 用户实际email，在第三方个人账号时与agentEmail不同
      key: item.id,
      // 显示的用户email，仅用于显示
      value: item.agentEmail,
      keyType: item.emailType,
    }));
    setTotalAccount(totalAccounts);
  };

  useEffect(() => {
    if (isSearching) {
      getTotalAccount();
    } else {
      setSearchResultList([]);
      setIntermediateKey([]);
      setTotalAccount([]);
    }
  }, [isSearching]);

  useEffect(() => {
    if (Object.keys(defaultSelectedSearchKeyMap).length === 0) {
      return;
    }
    const keys = [];
    for (const key in defaultSelectedSearchKeyMap) {
      if (!defaultSelectedSearchKeyMap[key].resetDisable) {
        keys.push(key);
      }
    }
    setIntermediateKey(keys);
  }, [defaultSelectedSearchKeyMap]);

  // 点击云端搜索进入loading，开始搜索
  const beforeSeverSearch = (email: string) => {
    resetCurrentMailList(email, 'server');
    onSeverSearch(email);
  };

  // 重置当前邮箱为loading状态
  const resetCurrentMailList = (email: string, type?: string) => {
    const current = searchResultList.find(item => item?.key === email);
    const currentIndex = searchResultList.findIndex(item => item?.key === email);
    const cloneSearchResultList = cloneDeep(searchResultList);
    cloneSearchResultList.splice(currentIndex, 1, {
      key: current.key,
      title: current.title,
      type: current.type,
      count: '',
      children: renderLoading(current.key, type),
    });
    setSearchResultList(cloneSearchResultList);
  };

  // 搜索云端结构
  const searchCloud = (email: string) =>
    mailSearchStateMap[email] === 'local' ? (
      <div className="m-filter-type">
        <p className="m-filter-type-desc">{getIn18Text('MEIZHAODAOXIANG')}</p>
        <p className="m-filter-type-change">
          {/* 可搜索该账号 全部云端邮件 */}
          {getIn18Text('KECHANGSHI')}
          <span onClick={() => beforeSeverSearch(email)}>
            {getIn18Text('SOUSUOQUANBUYUN')}
            <SearchOutlined />
          </span>
        </p>
      </div>
    ) : null;

  // 搜索中结构
  const renderLoading = (email: string, type?: string) => {
    const stype = type || mailSearchStateMap[email];
    const text = `${!stype || stype === 'local' ? '本地' : ''}${stype === 'server' ? '云端' : ''}搜索中`;
    return (
      <div className="u-item-loading">
        <SearchLoading height={14} text={text} size={14} textStyle={{ fontSize: 12, margin: 0 }} />
      </div>
    );
  };

  // 搜索无结果结构
  const renderEmpty = (email: string) => (
    <>
      {searchCloud(email)}
      <div className="m-filter-wrapper">
        <p className="m-filter-empty">无搜索结果</p>
      </div>
    </>
  );

  // 非空搜索结果render
  const renderItem = (data, email: string, disable: boolean) => {
    return (
      <div className="m-filter-wrapper">
        {/* {searchCloud(email)} */}
        <div className="m-filter-scope">
          <span className="m-filter-scope-explain">筛选范围</span>
          <span className={`m-filter-scope-reset ${disable ? 'm-filter-scope-reset-disable' : ''}`} onClick={() => !disable && resetSearch(email)}>
            <span>{getIn18Text('ZHONGZHI')}</span>
            <IconCard type="resetSearch" stroke={disable ? '#a8aaad' : ''} />
          </span>
        </div>
        <SearchResultTree data={data} email={email} handleSwitchFolder={handleSwitchFolder} expandFolder={expandFolder} />
      </div>
    );
  };

  // 获取搜索结果
  const getResult = useCallback(() => {
    // 默认选中key的map
    const selectedSearchKeyMap: SearchSelectedKeyMap = cloneDeep(defaultSelectedSearchKeyMap);
    // 高级搜索下只展示当前搜索账号
    const displayAccount = isAdvancedSearch ? totalAccount.filter(item => item.key === mailSearchAccount) : totalAccount;
    // 更新对应账号搜索结果内容
    const resultList = displayAccount.map(item => {
      const email = item.key;
      const emailValue = item.value;
      // 搜索结果非当前账号，原来有结果直接返回，否则初始化
      if (email !== searchResultObj._account) {
        const current = searchResultList.find(item => item?.key === email);
        return current?.key
          ? current
          : {
              key: email,
              title: emailValue,
              type: item.keyType,
              count: '',
              children: renderLoading(email),
            };
      }
      // 返回数据参数和当前选中对比，当一致时说明是正常本次筛选返回的数据，再更新，否则舍弃，避免结果混乱
      // 返回文件夹id和当前选中文件夹id
      const currentFid = searchResultObj.fid || FLOLDER.SEARCH_ALL_RESULT;
      const selectFid = +(selectedSearchKeys[email]?.folder || FLOLDER.SEARCH_ALL_RESULT);
      // 返回其他筛选条件
      const currentFilterCond = searchResultObj.filterCond || [];
      // 当前邮箱所选中条件
      const totalSelect = cloneDeep(selectedSearchKeys[email] || {});
      // 由于在搜索时文件夹的选中走单独的fid，全部的选中是不传filterCond的，所以这里过滤一遍
      for (const k in totalSelect) {
        if (k === 'folder' || totalSelect[k].operand === 'all') {
          delete totalSelect[k];
        }
      }
      // 过滤后的结果与返回其他筛选条件对比确定是否是当次的搜索结果
      const selectFilterCond = Object.values(totalSelect);
      let correct = true;
      try {
        correct = currentFid === selectFid && JSON.stringify(currentFilterCond) === JSON.stringify(selectFilterCond);
      } catch (e) {
        correct = false;
      }
      if (!correct) {
        return;
      }
      // 搜索结果数量
      const searchTotal = searchResultObj.total;
      // 开始文件夹相关数据的更新：（因为文件夹数据使用searchTreeList，其他数据在searchStatsObj里）
      const filterSearchTreeRes = filterSearchTree(searchResultObj.folders);
      let filterFolders = Array.isArray(filterSearchTreeRes) ? filterSearchTreeRes : [filterSearchTreeRes];
      // 针对文件夹 设置仅有一个结果不展示全部
      const notEmptyFilterFolders = filterFolders.filter(item => lodashGet(item, 'entry.mailBoxUnread', 0) !== 0);
      if (notEmptyFilterFolders.length === 2) {
        filterFolders = [notEmptyFilterFolders[1]];
      }
      // 初始化文件夹相关数据的更新
      const result = [
        {
          key: 'folder',
          name: '文件夹',
          item: filterFolders,
        },
      ];
      // 文件夹下 默认选中的文件夹id
      const defaultFolderId = (filterFolders.length === 1 ? filterFolders[0]?.mailBoxId : FLOLDER.SEARCH_ALL_RESULT) + '';
      // 判断是否有默认之外的选中，用于重置状态和邮箱中间态
      let resetDisable = true;
      if (selectedSearchKeys[email]?.folder && selectedSearchKeys[email].folder !== defaultFolderId) {
        resetDisable = false;
      }
      // 初始化当前邮箱默认选中key的map
      selectedSearchKeyMap[email] = {
        folder: defaultFolderId,
        resetDisable,
      } as SearchSelectedKeyObj;
      // 开始非文件夹相关数据的更新：(保证顺序)
      SEARCH_RESULT_STATS_ORDER.forEach(key1 => {
        const searchStatsObj = searchResultObj.stats;
        if (!searchStatsObj[key1]) {
          return;
        }
        // 计算全部并塞入，clone一下
        const item = cloneDeep(searchStatsObj[key1].items);
        let itemCount = 0;
        // 遍历每一个小项，结果为0的删除
        for (const key2 in item) {
          if ((item[key2]?.value || 0) === 0) {
            delete item[key2];
          } else {
            // 时间范围只需要把三月内和三月前数量相加
            // todo: 这里直接写['三月内', '三月前']不太行
            if ((key1 === 'sentDate' && ['三月内', '三月前'].includes(item[key2]?.label)) || key1 !== 'sentDate') {
              itemCount += item[key2]?.value;
            }
          }
        }
        // 针对非文件夹 设置仅有一个结果不展示全部
        const statsKeys = Object.keys(item);
        const filterStats =
          statsKeys.length === 1
            ? { ...item }
            : {
                all: {
                  filterCond: { operand: 'all' },
                  key: 'all',
                  label: '全部',
                  value: itemCount,
                },
                ...item,
              };
        // 非文件夹 默认选中的key
        const defaultStatsKey = statsKeys.length === 1 ? statsKeys[0] : 'all';
        // 更新重置状态
        if (selectedSearchKeys[email] && selectedSearchKeys[email][key1]?.operand) {
          if (isObject(selectedSearchKeys[email][key1].operand)) {
            if (Object.values(selectedSearchKeys[email][key1].operand)[0] + '' !== defaultStatsKey) {
              selectedSearchKeyMap[email].resetDisable = false;
            }
          } else if (selectedSearchKeys[email][key1].operand !== defaultStatsKey) {
            selectedSearchKeyMap[email].resetDisable = false;
          }
        }
        // 初始化默认选中key的map
        selectedSearchKeyMap[email][key1 as MailStatType] = defaultStatsKey;
        result.push({
          key: key1,
          name: searchStatsObj[key1].name,
          item: filterStats,
        });
      });
      // 返回结果
      return {
        key: email,
        title: emailValue,
        count: searchTotal,
        type: item.keyType,
        children:
          (!isAdvancedSearch && (Object.keys(selectedSearchKeyMap[email]).length > 2 || searchResultObj.fid)) || (isAdvancedSearch && searchTotal > 0)
            ? renderItem(result, email, !!selectedSearchKeyMap[email].resetDisable)
            : renderEmpty(email),
      };
    });
    return {
      resultList,
      selectedSearchKeyMap,
    };
  }, [isAdvancedSearch, selectedSearchKeys, defaultSelectedSearchKeyMap, totalAccount, searchResultList, searchResultObj, mailSearchAccount]);

  // 拿到账号初始化
  useEffect(() => {
    const resultList = totalAccount.map(item => ({
      key: item.key,
      title: item.value,
      type: item.keyType,
      count: '',
      children: renderLoading(item.key),
    }));
    // 更新搜索结果结构
    setSearchResultList(resultList);
  }, [totalAccount]);

  // 搜索结果返回后，更新搜索结果列表
  useEffect(() => {
    if (totalAccount.length === 0) {
      return;
    }
    // 如果本地搜索结果为空，直接搜索云端
    // 排除文件夹和列表上方筛选情况
    if (
      (!mailSearchStateMap[mailSearchAccount] || mailSearchStateMap[mailSearchAccount] === 'local') &&
      searchResultObj.total === 0 &&
      (!searchResultObj.fid || searchResultObj.fid < 100) &&
      searchSelected === 'ALL'
    ) {
      onSeverSearch(mailSearchAccount);
      return;
    }
    const { resultList, selectedSearchKeyMap } = getResult();
    // 每次搜索结果列表更新后更新默认选中map，并保留中间态状态
    doUpdateDefaultSelectedSearchKeyMap(selectedSearchKeyMap);
    // 更新搜索结果结构
    setSearchResultList(resultList);
  }, [searchResultObj]);

  // 过滤搜索文件夹
  const filterSearchTree = (data: MailBoxModel[]) => getChildTreeByRule<MailBoxModel>(data, (folder: MailBoxModel) => folder);

  // 重置搜索，重新搜索某个邮箱
  const resetSearch = (key: string, loading?: boolean) => {
    // 是否需要重新loading
    if (loading) {
      resetCurrentMailList(key);
    }
    doUpdateMailSearchAccount(key);
    doUpdateDefaultSelectedSearchKeyMap({});
    setIntermediateKey([]);
    setSelectedSearchKeys({});
    reSearch(key);
  };

  return (
    <div className="search-result-wrap">
      <SiriusCollapse
        intermediateKey={intermediateKey}
        single
        showTooltip
        operateSeparate
        dataList={searchResultList}
        searchAccount={mailSearchAccount}
        resetSearch={resetSearch}
        collapseStyle={{ visibility: searchLoading ? 'hidden' : 'visible' }}
      />
    </div>
  );
};

export default SearchResult;
