import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import classnames from 'classnames/bind';
import message from '@web-common/components/UI/Message/SiriusMessage';
import { SearchTeamOrgModel, Team, IMMessage, IMUser, apiHolder, apis, ContactAndOrgApi } from 'api';
import debounce from 'lodash/debounce';
import lodashGet from 'lodash/get';
import { doGetContactModelByContactItem } from '@web-common/state/selector/contact';
import { SEARCH_METHODS, getTabProps } from './doSearchAction';
import { IM_SEARCH_TABS } from './searchTabEnum';
import { NoResultPlaceholder } from './emptyResult';
import style from './empty.module.scss';
import MsgItem from './RecordItem';
import { Item as TeamItem } from './MatchedTeams/item';
import { ItemExact as TeamItemExact } from './MatchedTeams/itemExact';
import { openSession } from '../common/navigate';
import { IMSearchServiceNumber } from './searchMixContactItem';
import { hocWrapper, BottomlineWatch } from './searchItemWrapper';
import { Item as ItemContact } from './searchContactItem';
import { ContactItem } from '@web-common/utils/contact_util';
import { SearchLoading } from '@web-common/components/UI/SearchLoading/searchLoading';
import { LocalMsgsNote, RemoteMsgsNote, CommonItemsNote, LocalTeamExactMsgsNote } from './searchMsgFootnote';
import { getIn18Text } from 'api';
const realStyle = classnames.bind(style);

const storeApi = apiHolder.api.getDataStoreApi();

interface Props {
  maxCount: number;
  checkedNum: number;
  height: number;
  summaryContent: string;
  goMore(tab: IM_SEARCH_TABS): void;
  showTeamExact(keyword: string): void;
  closeModal(): void;
  updateCheckedNum(index): void;
  enterConfirmFlag: boolean;
}
// 联系人打开联系人
const triggerContact = async (item: ContactItem) => {
  const contactApi = apiHolder.api.requireLogicalApi(apis.contactApiImpl) as ContactAndOrgApi;
  const model = await contactApi.doGetContactById([item.id!]);
  let account = model[0]?.contactInfo?.find(item => item.contactItemType === 'yunxin')?.contactItemVal || '';

  // const sourceCore = lodashGet(model, '[0].contact.source', '');
  const curId = lodashGet(model, '[0].contact.id', '');

  // 如果当前数据还只是核心数据.从服务端查询通讯录数据
  if (!account && curId && curId.length) {
    const contactFromServer = await contactApi.doGetContactByQiyeAccountId({
      idList: [curId],
    });
    account = contactFromServer[0]?.contactInfo?.find(item => item.contactItemType === 'yunxin')?.contactItemVal || '';
  }

  if (!account || !account.length) {
    return;
  }
  openSession(
    {
      mode: 'normal',
      sessionId: `p2p-${account}`,
    },
    {
      createSession: true,
    }
  );
};
// 打开群组
const triggerTeam = (teamInfo: SearchTeamOrgModel) => {
  const teamId = teamInfo.id.replace(/[^\d]+/, '');

  // 记录选择的群组ID信息(群组搜索结果，最近选择的群组最靠前)
  setTimeout(async () => {
    let _historyList: string[] = [];
    const { suc, data: _list } = await storeApi.get('recentSearchImTeam');
    if (suc && typeof _list === 'string') {
      _historyList = [..._list.split(',')];
    }
    // 最多只保留五条信息
    _historyList.length >= 5 && _historyList.pop();
    _historyList.unshift(teamId);
    storeApi.put('recentSearchImTeam', _historyList.join(','));
  }, 0);

  openSession(
    {
      sessionId: `team-${teamId}`,
      mode: 'normal',
    },
    {
      createSession: true,
    }
  );
};
// 打开消息
const triggerMsg = (msg: IMMessage) => {
  // 这个会话可能被删除了.所以需要先尝试创建(如果是群聊需要验证这个群是否有效或者存在)
  const params = {
    mode: 'history' as 'history',
    idClient: msg.idClient,
    sessionId: msg.sessionId,
    msgTime: msg.time,
  };
  const options = {
    createSession: true,
    validateTeam: msg.scene === 'team',
  };
  try {
    openSession(params, options);
  } catch (err) {
    if (err.code === 803) {
      message.error(getIn18Text('NINBUZAIGAIQUN'));
    } else {
      message.error(getIn18Text('DINGWEISHIBAI\uFF0C'));
    }
  }
};
const triggerServiceNumber = (user: IMUser) => {
  const { account } = user;
  openSession(
    {
      mode: 'normal',
      sessionId: `p2p-${account}`,
    },
    {
      createSession: true,
    }
  );
};
const triggerWrapper = (func, callback) => item => {
  func(item);
  callback();
};
export const SearchLocalMsgTips: React.FC<{
  msgs: IMMessage[];
}> = () => {};
export const SearchRemoteMsgTips: React.FC<{
  msgs: IMMessage[];
}> = () => {};
type ResultMap = [keyof typeof SEARCH_METHODS, ((IMUser | ContactItem) | Team | IMMessage)[] | undefined];
export const Result: React.FC<Props> = props => {
  const { maxCount, checkedNum, height, summaryContent, goMore, showTeamExact, closeModal, updateCheckedNum, enterConfirmFlag } = props;
  const [searchStatus, setSearchStatus] = useState<'nokeyword' | 'empty' | 'ing' | 'finish'>('ing');
  const debounceSetStatus = useCallback(
    debounce((status: 'nokeyword' | 'empty' | 'ing' | 'finish') => {
      setSearchStatus(status);
    }),
    []
  );
  const [queryResultMap, setQueryResultMap] = useState<ResultMap[]>([]);
  const totalResultCount = useMemo(
    () => [
      ...new Set(
        queryResultMap.map(([, result]) => {
          if (Array.isArray(result)) {
            return result.length;
          }
          return -1;
        })
      ),
    ],
    [queryResultMap]
  );
  const keyword = getTabProps(summaryContent, 'keyword').trim();
  const ifTeam = /^\d{6,}$/.test(keyword) && getTabProps(summaryContent, 'tabname') === 'all';
  useEffect(() => {
    const ing = Math.max(...totalResultCount) <= 0 && Math.min(...totalResultCount) === -1;
    const isEmpty = totalResultCount.join('') === '0' && !ifTeam;
    if (ing) {
      debounceSetStatus('ing');
    } else if (isEmpty) {
      debounceSetStatus('empty');
    } else {
      debounceSetStatus('finish');
    }
  }, [totalResultCount]);
  // 摘要信息变化之后重置数据
  useEffect(() => {
    const tabname = getTabProps(summaryContent, 'tabname');
    const allTabs = [IM_SEARCH_TABS.CONTACT, IM_SEARCH_TABS.TEAM, IM_SEARCH_TABS.MSGS, IM_SEARCH_TABS.SERVICE_ACCOUNT];
    const tabs = tabname === IM_SEARCH_TABS.ALL ? allTabs : [tabname];
    const sets = tabs.reduce((total, field) => {
      total.push([field, undefined]);
      return total;
    }, [] as ResultMap[]);
    setQueryResultMap(sets);
  }, [summaryContent]);
  const TeamExactWrapperComponent = useMemo(
    () =>
      hocWrapper(TeamItemExact, {
        dataKeyName: 'teamExact',
        checkedClassname: realStyle('searchItemChecked'),
        title: '',
        triggerMethod: triggerWrapper(item => showTeamExact(item.keyword), closeModal),
        goMore() {},
        wrapperClassName: realStyle(''),
        mixedProps: {},
      }),
    []
  );
  const ContactWrappedComponent = useMemo(
    () =>
      hocWrapper(ItemContact, {
        dataKeyName: 'item',
        keywordAlias: 'search',
        checkedClassname: realStyle('searchItemChecked'),
        title: SEARCH_METHODS[IM_SEARCH_TABS.CONTACT].text,
        goMore() {
          goMore(SEARCH_METHODS[IM_SEARCH_TABS.CONTACT].name);
        },
        wrapperClassName: realStyle('searchContactWrapper'),
        triggerMethod: triggerWrapper(triggerContact, closeModal),
        // 必选参数 目前没啥用
        mixedProps: {
          im: true,
          onSelect() {},
        },
        itemIdName: 'contact.accountId',
      }),
    []
  );
  const TeamWrapperComponent = useMemo(
    () =>
      hocWrapper(TeamItem, {
        dataKeyName: 'teamInfo',
        checkedClassname: realStyle('searchItemChecked'),
        title: SEARCH_METHODS[IM_SEARCH_TABS.TEAM].text,
        triggerMethod: triggerWrapper(triggerTeam, closeModal),
        goMore() {
          goMore(SEARCH_METHODS[IM_SEARCH_TABS.TEAM].name);
        },
        wrapperClassName: realStyle(''),
        mixedProps: {},
        itemIdName: 'id',
      }),
    []
  );
  const MsgWrapperComponent = useMemo(
    () =>
      hocWrapper(MsgItem, {
        dataKeyName: 'msg',
        checkedClassname: realStyle('searchItemChecked'),
        title: SEARCH_METHODS[IM_SEARCH_TABS.MSGS].text,
        triggerMethod: triggerWrapper(triggerMsg, closeModal),
        goMore() {
          goMore(SEARCH_METHODS[IM_SEARCH_TABS.MSGS].name);
        },
        wrapperClassName: realStyle(''),
        // msgItem需要
        mixedProps: {
          closeModal() {},
        },
        itemIdName: 'idClient',
      }),
    []
  );
  const ServiceNumberWrapperComponent = useMemo(
    () =>
      hocWrapper(IMSearchServiceNumber, {
        dataKeyName: 'user',
        checkedClassname: realStyle('searchItemChecked'),
        title: SEARCH_METHODS[IM_SEARCH_TABS.SERVICE_ACCOUNT].text,
        goMore() {
          goMore(SEARCH_METHODS[IM_SEARCH_TABS.SERVICE_ACCOUNT].name);
        },
        wrapperClassName: realStyle('searchContactWrapper'),
        triggerMethod: triggerWrapper(triggerServiceNumber, closeModal),
        // 必选参数 目前没啥用
        mixedProps: {},
        itemIdName: 'account',
      }),
    []
  );

  const summaryContentRef = useRef(summaryContent);
  useEffect(() => {
    summaryContentRef.current = getTabProps(summaryContent, 'keyword');
  }, [summaryContent]);
  const doQueryUpload = (keyword: string) => {
    if (lodashGet(keyword, 'length', 0) === 0) {
      return;
    }
    // 是否从服务端执行检索
    const source = getTabProps(summaryContent, 'source');
    const tabname = getTabProps(summaryContent, 'tabname');
    queryResultMap.forEach(async ([field]) => {
      const { func: method, name } = SEARCH_METHODS[field];
      // 综合下通讯录只搜索四条数据
      const params: { source?: string; maxItem?: number } = { source };
      if (field === 'contact' && tabname === 'all') {
        params.maxItem = 4;
      }
      const list = await method(keyword, params);

      // 将结果push到列表中
      summaryContentRef.current === keyword &&
        setQueryResultMap(state => {
          const curTabDataIndex = state.findIndex(item => item[0] === name);
          if (curTabDataIndex === -1) {
            return state;
          }
          const _state = [...state];
          if (field === 'team') {
            const teamList = list[1];
            _state.splice(curTabDataIndex, 1, [name, teamList]);
          } else {
            _state.splice(curTabDataIndex, 1, [name, list]);
          }
          return _state;
        });
    });
  };
  // note: 这里必须要监控queryResultMap的变化
  // 否则doqueryUpload执行之后queryResultMap初始化副作用会覆盖他
  useEffect(() => {
    const keyword = getTabProps(summaryContent, 'keyword');
    const _debounceQuery = debounce(doQueryUpload, 20);
    _debounceQuery(keyword);
    return () => {
      _debounceQuery.cancel();
    };
  }, [summaryContent, queryResultMap.map(([name]) => name).join('-')]);
  const totalCount = useMemo(() => {
    let tCount = queryResultMap.reduce((total, [, data]) => {
      total += Array.isArray(data) ? data.slice(0, maxCount).length : 0;
      return total;
    }, 0);
    if (ifTeam) {
      tCount += 1;
    }
    return tCount;
  }, [queryResultMap, maxCount]);
  // 获取更多数据
  const getMore = useCallback(
    async list => {
      // 如果不支持分页跳过
      const tabname = getTabProps(summaryContent, 'tabname');
      const source = getTabProps(summaryContent, 'source', 'local');
      // const list = lodashGet(queryResultMap, '[0][1]', []);
      const lastMsg = Array.isArray(list) && list.length ? list[list.length - 1] : null;
      // 如果配置不支持分页不处理
      if (!lodashGet(SEARCH_METHODS, `${tabname}.supportPagination.${source}`, false)) {
        return;
      }
      // @ts-ignore
      // @ts-ignore
      const moreData = await SEARCH_METHODS[tabname].func(keyword, {
        lastItem: lastMsg,
        source,
      });
      if (!Array.isArray(moreData)) {
        return;
      }
      setQueryResultMap(state => {
        const _list = [...state];
        _list[0][1] = [...(_list[0][1] || []), ...moreData];
        return _list;
      });
    },
    [summaryContent]
  );
  // Bottomline trigger直接触发的getMore上下文中list始终都是30...没招了通过其他变量触发请求吧
  // 保证list长度始终是最新的
  const [fetchMoreCount, setFetchMoreCount] = useState(0);
  useEffect(() => {
    setFetchMoreCount(0);
  }, [summaryContent]);
  const addFetchCount = () => {
    setFetchMoreCount(count => count + 1);
  };
  useEffect(() => {
    if (!fetchMoreCount) {
      return;
    }
    getMore(lodashGet(queryResultMap, '[0][1]', []));
  }, [fetchMoreCount]);
  // 请求中
  if (searchStatus === 'ing') {
    return <SearchLoading height={height} text={getTabProps(summaryContent, 'source') === 'remote' ? getIn18Text('YUNDUANSOUSUOZHONG') : getIn18Text('SOUSUOZHONG')} />;
  }
  // 空结果
  if (searchStatus === 'empty') {
    return (
      <NoResultPlaceholder height={height}>
        {getTabProps(summaryContent, 'source') !== 'remote' && [IM_SEARCH_TABS.ALL, IM_SEARCH_TABS.MSGS].includes(getTabProps(summaryContent, 'tabname')) ? (
          <p
            data-test-id="im_seach_modal_no_result_remote_search_btn"
            className={realStyle('emptyRemoteSearchLink')}
            onClick={() => {
              goMore((IM_SEARCH_TABS.MSGS + '?remote') as string);
            }}
          >
            {getIn18Text('CHANGSHIYUNDUANSOU')}
          </p>
        ) : null}
      </NoResultPlaceholder>
    );
  }
  return (
    <div style={{ height: height + 'px' }} className={realStyle('complexResults')}>
      {/* 群号精确搜索群租 */}
      {ifTeam && (
        <>
          <TeamExactWrapperComponent
            {...{
              showTitle: false,
              list: [{ id: 'teamExact', keyword }],
              maxCount,
              keyword,
              checkedIndex: checkedNum % totalCount,
              updateCheckNumber(index) {
                const realIndex = index;
                updateCheckedNum(realIndex);
              },
            }}
          >
            {list => (
              <CommonItemsNote
                maxCount={maxCount}
                count={list.length}
                switchTab={() => {
                  goMore(SEARCH_METHODS[IM_SEARCH_TABS.CONTACT].name);
                }}
              />
            )}
          </TeamExactWrapperComponent>
          {totalCount === 1 && <LocalTeamExactMsgsNote />}
        </>
      )}
      {queryResultMap.map(([name, data], index) => {
        const _data = data || [];
        const prefixCount = queryResultMap.slice(0, index).reduce((total, [, list]) => {
          total += Array.isArray(list) ? list.slice(0, maxCount).length : 0;
          return total;
        }, 0);
        // 因为选中number是外部自增加没有办法和results总数关联.
        // 所以checkedNum%totalCount=当前被选中的item
        const props = {
          showTitle: queryResultMap.length > 1,
          list: _data,
          maxCount,
          keyword,
          checkedIndex: (checkedNum % totalCount) - prefixCount - (ifTeam ? 1 : 0),
          prefixCount: prefixCount + (ifTeam ? 1 : 0),
          updateCheckNumber: updateCheckedNum,
          enterConfirmFlag,
        };
        return (
          <React.Fragment key={[name, summaryContent].join('-')}>
            {name === IM_SEARCH_TABS.CONTACT ? (
              <ContactWrappedComponent {...props}>
                {list => (
                  <CommonItemsNote
                    maxCount={maxCount}
                    count={list.length}
                    switchTab={() => {
                      goMore(SEARCH_METHODS[IM_SEARCH_TABS.CONTACT].name);
                    }}
                  />
                )}
              </ContactWrappedComponent>
            ) : null}
            {name === IM_SEARCH_TABS.TEAM ? (
              <TeamWrapperComponent {...props}>
                {list => (
                  <CommonItemsNote
                    maxCount={maxCount}
                    count={list.length}
                    switchTab={() => {
                      goMore(SEARCH_METHODS[IM_SEARCH_TABS.TEAM].name);
                    }}
                  />
                )}
              </TeamWrapperComponent>
            ) : null}
            {name === IM_SEARCH_TABS.MSGS ? (
              <MsgWrapperComponent {...props}>
                {list => {
                  if (getTabProps(summaryContent, 'tabname') !== 'all' && list.length % 30 === 0) {
                    return <BottomlineWatch trigger={addFetchCount} />;
                  }
                  if (getTabProps(summaryContent, 'source') === 'remote') {
                    return <RemoteMsgsNote count={list.length} />;
                  }
                  return (
                    <LocalMsgsNote
                      count={list.length}
                      maxCount={maxCount}
                      switchTab={flag => {
                        if (flag) {
                          goMore((IM_SEARCH_TABS.MSGS + '?remote') as string);
                        } else {
                          goMore(SEARCH_METHODS[IM_SEARCH_TABS.MSGS].name);
                        }
                      }}
                    />
                  );
                }}
              </MsgWrapperComponent>
            ) : null}
            {name === IM_SEARCH_TABS.SERVICE_ACCOUNT ? (
              <ServiceNumberWrapperComponent {...props}>
                {list => (
                  <CommonItemsNote
                    maxCount={maxCount}
                    count={list.length}
                    switchTab={() => {
                      goMore(SEARCH_METHODS[IM_SEARCH_TABS.SERVICE_ACCOUNT].name);
                    }}
                  />
                )}
              </ServiceNumberWrapperComponent>
            ) : null}
          </React.Fragment>
        );
      })}
    </div>
  );
};
