import { apiHolder, apis, ContactApi, SearchTeamOrgModel, ContactModel, OrgApi, NIMApi, Team, IMMessage, IMUser, ApiResponse, OrgSearch } from 'api';
import { convertToPinyin } from 'tiny-pinyin';
import lodashGet from 'lodash/get';
import { from, fromEventPattern, merge, Observable } from 'rxjs';
import { map, switchMap, catchError, scan, take } from 'rxjs/operators';
import { ContactItem, OrgItem } from '@web-common/utils/contact_util';
import { transContactSearch2ContactItem, transOrgSearch2OrgItem } from '@web-common/components/util/contact';
import { IM_SEARCH_TABS } from './searchTabEnum';
import { memberSort } from '../common/memberSort';
import { getIn18Text } from 'api';
const nimApi = apiHolder.api.requireLogicalApi('NIM') as unknown as NIMApi;
const contactApi = apiHolder.api.requireLogicalApi(apis.contactApiImpl) as unknown as ContactApi & OrgApi;
const httpApi = apiHolder.api.getDataTransApi();
const systemApi = apiHolder.api.getSystemApi();
const storeApi = apiHolder.api.getDataStoreApi();

interface ServiceNumResApi {
  accId: string;
  icon: string;
  name: string;
  pinyin: string[];
}
export interface DoSearch<T> {
  (
    val: string,
    options?: {
      lastItem?: T | false;
      source?: string;
      maxItem?: number;
    }
  ): Promise<T[]>;
}
// 搜索通讯录
export const doSearchContact: DoSearch<ContactItem> = async (val: string, options = {}) => {
  try {
    const { main } = await contactApi.doSearchNew({
      query: val,
      isIM: true,
      maxItem: options.maxItem,
      showDisable: false,
      contactType: 'enterprise',
      noRelateEnterprise: true,
      useFrequentOrder: true,
      frequentChannel: 'im',
    });
    const account = systemApi.getCurrentUser()?.id || '';
    if (!main[account]) {
      return [];
    }
    const { contactList, frequentContactList } = main[account];
    return [...frequentContactList, ...contactList].map(item => transContactSearch2ContactItem(item));
  } catch (ex) {
    console.error(ex);
  }
  return [];
};
// 搜索服务号(机器人)
const createRules = (keyword: string) => [
  {
    field: 'nick',
    rule(nick: string) {
      return nick.indexOf(keyword);
    },
  },
  {
    field: 'pinyin',
    rule(pinyin: string) {
      const pinyinList = (pinyin as string).split('-').reduce((total, cur, curIndex, arr) => {
        total.push(arr.slice(curIndex).join(''));
        return total;
      }, [] as string[]);
      return pinyinList.findIndex(item => new RegExp(`^${encodeURIComponent(keyword)}`, 'i').test(item));
    },
  },
];
// 搜索机器人角色
export const CUSTOM_SEARCH_UIEVENTS = {
  trigger: 'im.search.trigger',
};
const doSearchServiceAccount: DoSearch<IMUser> = (() => {
  const url = systemApi.getUrl('getYunxinServiceNum');
  let users: IMUser[] = [];
  // 用户打开搜索面板之后搜索数据
  const onTriggerSearchPannel = handler => {
    nimApi.subCustomEvent(CUSTOM_SEARCH_UIEVENTS.trigger, handler, {});
  };
  const offTriggerSearchPannel = handler => {
    nimApi.offCustomEvent(CUSTOM_SEARCH_UIEVENTS.trigger, handler);
  };
  fromEventPattern(onTriggerSearchPannel, offTriggerSearchPannel)
    .pipe(
      switchMap(() => {
        const _request = httpApi.get(url) as Promise<ApiResponse<ServiceNumResApi[]>>;
        const $requestStream = from(_request).pipe(
          map(res => res.data!.data),
          map(users =>
            users!.map(
              user =>
                ({
                  account: user.accId,
                  nick: user.name,
                  avatar: user.icon,
                  pinyin: user.pinyin.join('-'),
                } as IMUser)
            )
          ),
          catchError(() => from(Promise.resolve([] as IMUser[]))),
          take(1)
        );
        const _sessionusers = nimApi.imusers.getSubject() as Observable<Record<string, IMUser>>;
        const $sessionUsers = _sessionusers.pipe(map(list => Object.values(list).filter(item => /^lx_/i.test(item.account))));
        return merge($requestStream, $sessionUsers);
      }),
      scan((total, current) => {
        const totalIds = total.map(item => item.account);
        return [...total, ...current.filter(user => !totalIds.includes(user.account))];
      }, [] as IMUser[])
    )
    .subscribe(list => {
      users = list;
    });
  return async (keyword: keyof IMUser) => memberSort(users, createRules(keyword));
})();
// 搜索群组
export interface SearchTeamOrgModelEx extends SearchTeamOrgModel {
  pinyin?: string;
  orgPYLabelName?: string;
  matchType?: 'name' | 'pinyin';
}
export interface SearchTeamOrgSearchEx extends OrgItem {
  pinyin?: string;
  orgPYLabelName?: string;
  matchType?: 'name' | 'pinyin';
}
export const doSearchTeam: DoSearch<SearchTeamOrgModelEx> = async (val: string): Promise<[ContactModel[], SearchTeamOrgModelEx[]]> => {
  const res = await contactApi.doSearchTeamContact(val);
  const contactList: ContactModel[] = res.contactList;
  const teamList: SearchTeamOrgModel[] = res.teamList.map(item => {
    const teamPinyin = convertToPinyin(item.orgName, '-', true);
    (item as SearchTeamOrgModelEx).pinyin = teamPinyin;
    (item as SearchTeamOrgModelEx).orgPYLabelName = teamPinyin
      .split('-')
      .map(itm => itm[0])
      .join('');
    lodashGet(item, 'contactList', []).map(itm => {
      if (lodashGet(itm, 'contact.contactName', '')) {
        itm.contact.contactPinyin = convertToPinyin(itm.contact.contactName, '-', true);
      }
    });
    return item;
  });

  const teamMap = new Map(
    teamList.map(item => {
      return [item.originId, item];
    })
  );

  // 获取最近点击的群组列表信息
  const recentSearchTeamMap: Map<string, SearchTeamOrgModelEx> = new Map();
  const { suc, data: recentTeamIdstring } = await storeApi.get('recentSearchImTeam');
  if (suc && typeof recentTeamIdstring === 'string') {
    recentTeamIdstring
      .split(',')
      .filter(item => {
        return teamMap.has(`team_${item}`);
      })
      .forEach(item => {
        recentSearchTeamMap.set(`team_${item}`, teamMap.get(`team_${item}`) as SearchTeamOrgModel);
      });
  }

  // 获取会话中群组列表
  const sessionTeamMap: Map<string, SearchTeamOrgModel> = await new Promise(r => {
    nimApi.sessionStream
      .getSubject()
      ?.pipe(
        take(1),
        map(list => {
          const _list = list
            .filter(item => {
              return item.scene === 'team' && teamMap.has(`team_${item.to}`);
            })
            .map(item => {
              const key = `team_${item.to}`;
              return [key, teamMap.get(key)] as [string, SearchTeamOrgModel];
            });
          return new Map(_list);
        })
      )
      .subscribe(list => {
        r(list);
      });
  });

  // 返回排序之后的群组列表
  const _sortedTeamlist = [...new Map([...recentSearchTeamMap, ...sessionTeamMap, ...teamMap]).values()];
  return [contactList, _sortedTeamlist];
};
// 搜索群组
export interface MatchedTeam extends Team {
  pinyin?: string;
  matchType?: 'name' | 'pinyin';
}
// 搜索群聊
export const doSearchMsgs: DoSearch<IMMessage> = async (val: string, options = {}): Promise<IMMessage[]> => {
  const source = lodashGet(options, 'source', '');
  if (source !== 'remote') {
    const props = {
      end: lodashGet(options, 'lastItem.time', Infinity),
    };
    const { msgs } = (await nimApi.excute('getLocalMsgs', {
      keyword: val,
      limit: 30,
      ...props,
    })) as {
      msgs: IMMessage[];
    };
    return msgs;
  }
  try {
    const props = {
      toTime: lodashGet(options, 'lastItem.time', new Date().getTime()),
    };
    const { msgs } = (await nimApi.excute('msgFtsInServerByTiming', {
      keyword: val,
      msgLimit: 30,
      ...props,
    })) as {
      msgs: IMMessage[];
    };
    return msgs;
  } catch (ex) {
    return [];
  }
};
export enum SEARCH_METHODS_ENUM {
  CONTACT = 'CONTACT',
  TEAM = 'TEAM',
  MSGS = 'MSGS',
}
export const SEARCH_METHODS = {
  [IM_SEARCH_TABS.CONTACT]: {
    text: getIn18Text('TONGXUNLU'),
    name: IM_SEARCH_TABS.CONTACT,
    func: doSearchContact,
    supportPagination: false,
  },
  [IM_SEARCH_TABS.TEAM]: {
    text: getIn18Text('QUNZU'),
    name: IM_SEARCH_TABS.TEAM,
    func: doSearchTeam,
    supportPagination: false,
  },
  [IM_SEARCH_TABS.MSGS]: {
    text: getIn18Text('LIAOTIANJILU'),
    name: IM_SEARCH_TABS.MSGS,
    func: doSearchMsgs,
    // 是否支持分页
    supportPagination: {
      local: true,
      remote: true,
    },
  },
  [IM_SEARCH_TABS.SERVICE_ACCOUNT]: {
    text: getIn18Text('FUWUHAO'),
    name: IM_SEARCH_TABS.SERVICE_ACCOUNT,
    func: doSearchServiceAccount,
    supportPagination: false,
  },
};
export type DoSearchResult = {
  type: keyof typeof SEARCH_METHODS;
  name: string;
  results: MatchedTeam[] | IMMessage[] | ContactModel[] | SearchTeamOrgModelEx[];
};
export const doSearch = async (val: string, methods: (keyof typeof SEARCH_METHODS)[], callback: (param: DoSearchResult[]) => any) => {
  const _list = await Promise.all(
    methods.map(item => {
      const { func } = SEARCH_METHODS[item];
      return (func as DoSearch<ContactModel | Team | IMMessage | SearchTeamOrgModelEx>)(val);
    })
  );
  const list = _list.map((item, index) => ({
    results: item,
    name: SEARCH_METHODS[methods[index]].text,
    type: methods[index],
  }));
  callback(list);
};
export const getTabProps = (key: string, attr = 'tabname', defaultVal = '') => {
  const reg = /(?<keyword>[^\/]*)\/(?<tabname>\w+)\??(?<source>\w+)?/;
  const result = key.match(reg);
  if (!result) {
    return '';
  }
  const item = lodashGet(result.groups, attr, defaultVal);
  if (attr === 'keyword') {
    return decodeURIComponent(item);
  }
  return item;
};
