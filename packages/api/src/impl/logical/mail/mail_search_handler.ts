import { config } from 'env_def';
import moment from 'moment';
import { isObject, cloneDeep } from 'lodash';
import {
  // EntityMailAttachment,
  // EntityMailContent,
  EntityMailData,
  EntityMailStatus,
  localSearchDataFilterName,
  mailSearchAttachmentFilterName,
  mailTable,
  RequestSearch,
  ResponseGpKey,
  ResponseGroupResult,
  ResponseMailListEntry,
  ResponseMailSearchSummaryInfoItem,
  ResponseSearch,
} from './mail_action_store_model';
import { MailContentHandler } from './mail_content_handler';
import {
  MailBoxModel,
  MailEntryModel,
  MailModelEntries,
  MailSearchCondition,
  MailSearchModel,
  MailSearchResult,
  MailSearchTypes,
  MailStatResult,
  MailStatType,
  queryMailBoxParam,
  SearchCacheInfo,
  StatResult,
  StatResultItem,
  TypeMailState,
} from '@/api/logical/mail';
import { PopUpMessageInfo, resultObject } from '@/api/_base/api';
import { ApiResponse, ResponseData } from '@/api/data/http';
import { StringMap, StringTypedMap } from '@/api/commonModel';
import { MailAbstractHandler } from './mail_abs_handler';
import { util } from '@/api/util';
import { customerSysConfig } from '@/config';
import corpMailUtils from './corp_mail_utils';
// import { QueryConfig } from '@/api/data/new_db';

type StatVal = {
  valueLabel: string;
  cond: MailSearchCondition;
};

type StatLabelConf = {
  label: string;
  valueMapping: (str: string) => StatVal | undefined;
};

type AdvancedSearchCondition =
  | {
      field: string;
      operator?: string;
      operand: any;
    }
  | { conditions: any; operator?: string; operand?: any };

/**
 * 信件搜索处理逻辑
 */
export class MailSearchHandler extends MailContentHandler {
  private async handleSearchGroupResult(groupings: ResponseGroupResult, _account?: string) {
    const actions = this.mailApi.getActions({
      actions: this.actions,
      subActions: this.subActions,
      _account,
    })?.val;
    if (actions.mailBoxOriginData && actions.mailBoxOriginData.length > 0) {
      const mailBoxModels = this.handleFolderRet(actions.mailBoxOriginData, groupings);
      return Promise.resolve(mailBoxModels);
    }
    await this.doListMailBox(undefined, undefined, undefined, _account);
    if (actions.mailBoxOriginData && actions.mailBoxOriginData.length > 0) {
      return this.handleFolderRet(actions.mailBoxOriginData, groupings, _account);
    }
    return Promise.reject(new Error('文件夹请求失败，请稍后重试'));
  }

  private handleSummaryEntities(ids: string[], key: string, _account?: string) {
    const isCorpMail = this.systemApi.getIsCorpMailMode();
    const urlKey = isCorpMail ? 'getContentByIds' : 'searchMailInfo';
    const url = this.buildUrl(urlKey, undefined, undefined, _account);
    const data = {
      ids,
      pattern: key,
      summaryWindowSize: isCorpMail ? ids.length : null,
    };
    return this.impl
      .post(url, data, { ...(this.getConfigForHttp(urlKey, { data, url, method: 'post' }) || {}), _account })
      .then(this.unpackData.bind(this))
      .then((res: ResponseData<ResponseMailSearchSummaryInfoItem[]>) => {
        const ret: StringMap = {};
        if (res.code === MailAbstractHandler.sOk) {
          res.var?.forEach(it => {
            const mid = isCorpMail ? it.id : it.mid;
            ret[mid as string] = it.summary;
          });
        }
        return ret;
      });
  }

  // eslint-disable-next-line max-params
  buildSearchResult(
    result: [MailEntryModel[], StringMap, MailBoxModel[], MailStatResult | undefined],
    searchId: number,
    key: string,
    total: number,
    fid: number | undefined,
    searchType: MailSearchTypes = 'all',
    filterCond?: MailSearchCondition[] | undefined,
    _account?: string
  ) {
    // const regExp = key ? new RegExp('(?<!\<b\>)' + util.escapeRegex(key) + '(?!\<\/b\>)', 'ig') : undefined;
    const replaceSearchContent: (str: string, encode?: boolean) => string = (str, encode = true) => {
      if (!key) {
        return str;
      }
      // encode 为 false，说明 str 已经 encode 过，那么搜索时为了处理搜索 & 而将 encode 过的 &amp; 打断的情况，需要对 key 来 encode 一下
      const encodeKey = encode ? key : this.htmlApi.encodeHtml(key);
      let ret = '';
      let start = 0;
      let pre = 0;
      while (pre < str.length) {
        start = str.indexOf(encodeKey, pre);
        if (start >= 0) {
          let subStr = str.substring(pre, start);
          if (subStr.endsWith('<b>')) {
            subStr = subStr.replace(/<\s*b\s*>/gi, '');
          }
          ret += subStr;
          ret += '<b>';
          ret += encode ? this.htmlApi.encodeHtml(encodeKey) : encodeKey;
          ret += '</b>';
          pre = start + encodeKey.length;
        } else {
          let content = str.substring(pre);
          if (content.startsWith('</b>')) {
            content = content.replace(/<\s*\/b\s*>/gi, '');
          }
          ret += encode ? this.htmlApi.encodeHtml(content) : content;
          break;
        }
      }
      return ret;
    };
    const resultElement: MailEntryModel[] = result[0] as MailEntryModel[];
    const hasAttachmentSearch = searchType === 'all' || searchType === 'attachment';
    if (resultElement && resultElement.length > 0) {
      const summaries: StringMap = result[1] as StringMap;
      // eslint-disable-next-line no-restricted-syntax
      for (const it of resultElement) {
        let briefChanged = false;
        if (it && it.id && summaries[it.id]) {
          const summary = summaries[it.id];
          if (summary !== '......' && key) {
            // 第一个或匹配成对的<b></b>左侧的内容，第二个匹配的是<b></b>中间的内容，第三个匹配的是<b></b>右侧的内容
            // 如果出现bug的话，可以简化处理，不考虑成对的条件，直接匹配非<b>非</b>的内容o(╥﹏╥)o
            // const reg = /(?<=(\/b|^)).*?(?=<b>)|(?<=(<b>|^)).*?(?=(<\/b>|$))|(?<=<\/b>).*?(?=(<b>|$))/mgi;
            // it.entry.brief = summary.replace(reg, match => this.htmlApi.encodeHtml(match));
            const sm = summary.replace(/<\s*b\s*>/gi, '').replace(/<\s*\/b\s*>/gi, '');
            it.entry.brief = replaceSearchContent(sm, true);
            briefChanged = true;
          }
        }
        if (it.entry.brief && !briefChanged && searchType === 'all' && key) {
          it.entry.brief = replaceSearchContent(it.entry.brief, false);
        }
        if (['all', 'title'].includes(searchType) && key) {
          it.entry.title = replaceSearchContent(it.entry.title, false);
        }
        if (hasAttachmentSearch && it.entry.attachment && it.entry.attachment.length > 0 && key) {
          it.entry.attachment.forEach(it => {
            it.fileHandledName = replaceSearchContent(it.fileName);
          });
        }
        if (['all', 'title'].includes(searchType) && Array.isArray(it.receiver) && it.receiver.length > 0 && key) {
          it.receiver = it.receiver.map(v => ({
            ...v,
            contact: {
              ...v.contact,
              contact: {
                ...v.contact.contact,
                contactName: replaceSearchContent(v.contact.contact.contactName),
              },
            },
            contactItem: {
              ...v.contactItem,
              contactItemVal: replaceSearchContent(v.contactItem.contactItemVal),
            },
          }));
        }
      }
    }
    const stats = cloneDeep(result[3]); // 深复制一下，避免readonly的错误
    if (stats && stats.fromAddress && stats.fromAddress.items) {
      const fromItems = stats.fromAddress.items;
      Object.keys(fromItems).forEach(k => {
        // 使用顺序：1,设置好的 (本地) 2，遍历匹配的（远程） 3.兜底使用邮箱首字符
        const contactLabel = util.getContactPYLabel(fromItems[k].label).charAt(0).toLocaleUpperCase();
        fromItems[k].contactLabel = fromItems[k].contactLabel || contactLabel || fromItems[k].filterCond.operand.toString().charAt(0).toLocaleUpperCase();
      });
    }
    const ret = {
      entities: resultElement,
      folders: result[2],
      stats,
      searchId,
      total,
      _account: this.systemApi.getCurrentUser(_account)?.id,
      key,
      filterCond,
      fid,
    } as MailSearchResult;
    return ret;
  }

  private storeSearchWords(srId: number, key: string, _account?: string) {
    const targetActions = this.mailApi.getActions({
      actions: this.actions,
      subActions: this.subActions,
      _account,
    })?.val;
    if (!targetActions?.searchWord[key]) {
      targetActions.searchWord[key] = srId;
    }
    this.storeApi.put(MailAbstractHandler.mailSearchSeq, srId + '', { _account }).then();
    this.storeApi.put(MailAbstractHandler.mailSearchKeyWord, JSON.stringify(targetActions?.searchWord), { _account }).then();
  }

  private storeSearchIds(srId: number, ids: string[], reqKey: string, _account?: string) {
    const targetActions = this.mailApi.getActions({
      actions: this.actions,
      subActions: this.subActions,
      _account,
    })?.val;
    const cache = targetActions?.searchMidsCache || {};
    if (!cache[srId]) {
      cache[srId] = {};
    }
    cache[srId][reqKey] = ids;
  }

  private storeSearchFolderRes(re: MailBoxModel[], reqKey: string, srId: number, _account?: string) {
    const targetActions = this.mailApi.getActions({
      actions: this.actions,
      subActions: this.subActions,
      _account,
    })?.val;
    if (!targetActions) return;
    targetActions.searchResCache[srId] = targetActions.searchResCache[srId] || {};
    targetActions.searchResCache[srId][reqKey] = re;
  }

  private advancedSearchResultIds: string[] = [];

  private advancedSearchFolder: MailBoxModel[] = [];

  private advacendSearchResultTotal = 0;

  async doAdvanceSearchMail(searchParamsModel: MailSearchModel, noCache = false, _account?: string) {
    // const start = searchParamsModel.start
    const fid = (searchParamsModel && searchParamsModel.fids && searchParamsModel.fids[0]) || undefined;
    console.log('4444----高级搜索---searchParamsModel', searchParamsModel);
    console.log('4444----高级搜索---noCache', noCache);
    if (searchParamsModel.start === 0) {
      this.advancedSearchResultIds = [];
      if (noCache) {
        this.advancedSearchFolder = [];
      }
    } else if (this.advancedSearchResultIds.length > 0) {
      const ids = this.advancedSearchResultIds.slice(searchParamsModel.start, searchParamsModel.start + searchParamsModel.limit);
      if (ids.length > 0) {
        const promiseEntry = new Promise<any>(re => {
          this.doListMailBoxEntities({
            mids: ids,
            count: ids.length,
            _account,
          }).then(re);
        });
        const [res] = await Promise.all([promiseEntry]);
        const list = Array.isArray(res) ? res : res.data;
        this.loggerApi.track('mail_search_advance_page_success', {
          searchParamsModel,
          noCache,
        });
        return this.buildSearchResult([list as any, {}, this.advancedSearchFolder, {}], 0, searchParamsModel.pattern || '', this.advacendSearchResultTotal, fid);
      }
      return this.buildSearchResult([[], {}, this.advancedSearchFolder, {}], 0, '', this.advacendSearchResultTotal, fid);
    } else {
      return this.buildSearchResult([[], {}, this.advancedSearchFolder, {}], 0, '', this.advacendSearchResultTotal, fid);
    }
    const url = this.buildUrl('searchMail', undefined, undefined, _account);
    const formData = this.buildAdvancedSearchEntryReq(searchParamsModel);
    const searchRes = await this.impl.post(
      url,
      formData,
      this.getConfigForHttp('searchMail', {
        url,
        data: { ...formData },
        method: 'post',
        _account,
      })
    );
    const isCorpMail = this.systemApi.getIsCorpMailMode();
    if (isCorpMail) {
      corpMailUtils.corpMailTransformResponse(searchRes);
    }

    const searchResData = searchRes.data as ResponseSearch;
    if (searchResData.code === MailAbstractHandler.sOk) {
      const index = searchResData.var.findIndex(it => typeof it === 'string');
      let objRes: ResponseMailListEntry[];
      this.advacendSearchResultTotal = searchResData.var.length;
      if (index > -1) {
        objRes = searchResData.var.slice(0, index) as ResponseMailListEntry[];
      } else {
        objRes = searchResData.var as ResponseMailListEntry[];
      }
      this.advancedSearchResultIds = searchResData.var.map(it => (typeof it === 'string' ? it : it.id));
      const promiseFolder = new Promise<MailBoxModel[]>(re => {
        if (noCache) {
          try {
            this.handleSearchGroupResult(searchResData.groupings, _account).then(re);
          } catch (error) {
            re([]);
          }
        } else {
          re(this.advancedSearchFolder);
        }
      });
      const promiseEntry = new Promise(re => {
        try {
          this.handleListMailBoxEntities(
            {
              start: 0,
              limit: 3000,
              summaryWindowSize: searchParamsModel.summaryWindowSize || 20,
            },
            {
              d: objRes,
              t: objRes.length,
            },
            {
              count: objRes.length,
              _account,
            }
          ).then(re);
        } catch (error) {
          re([]);
        }
      });
      const promiseStat = this.handleStatResult(searchResData.groupings);
      const [res1, res2, res3] = await Promise.all([promiseEntry, promiseFolder, promiseStat]);
      // res1本地保存一下，防止本地库无数据
      this.saveMails(res1 as MailEntryModel[], _account);
      this.advancedSearchFolder = res2;
      this.loggerApi.track('mail_search_advance_server_success', {
        searchParamsModel,
        noCache,
      });
      return this.buildSearchResult(
        [res1 as MailEntryModel[], {}, res2, res3],
        -1,
        searchParamsModel.pattern || '',
        this.advacendSearchResultTotal,
        fid,
        undefined,
        undefined,
        _account
      );
    }
    return this.buildSearchResult([[], {}, [], {}], 0, '', 0, fid, undefined, undefined, _account);
  }

  buildAdvancedSearchEntryReq(searchParamsModel: MailSearchModel) {
    const condition = searchParamsModel.conditions[0];
    const conditions: Array<AdvancedSearchCondition> = [];
    const contentConditions: Array<{
      field: string;
      operator?: string;
      operand: any;
      ignoreCase?: boolean;
    }> = [];
    let flagConditions: Array<{
      field: string;
      operator?: string;
      operand: any;
    }> = [];
    if (searchParamsModel.pattern) {
      contentConditions.push({
        field: 'cont',
        operand: searchParamsModel.pattern,
        operator: 'contains',
      });
    }

    // corpmail，需要将read的flag条件和附件的flag条件分开
    const readFlagsConditions: Array<{
      field: string;
      operator?: string;
      operand: any;
    }> = [];

    // for (const field in condition)
    Object.keys(condition).forEach(field => {
      switch (field) {
        // 附件 attached 已读 未读 read 等
        case 'flags':
          if (condition.flags?.attached !== undefined) {
            flagConditions = flagConditions.concat([
              {
                field: 'flags',
                operand: {
                  attached: condition.flags.attached,
                },
              },
              {
                field: 'flags',
                operand: {
                  linkAttached: condition.flags.attached,
                },
              },
            ]);
          }
          if (condition.flags?.read !== undefined) {
            readFlagsConditions.push({
              field: 'flags',
              operand: {
                read: condition.flags.read,
              },
            });
          }
          break;
        case 'from':
          if (condition.from) {
            contentConditions.push({
              field: 'from',
              operand: condition.from,
              operator: 'contains',
              ignoreCase: true,
            });
          }
          break;
        case 'to':
          if (condition.to) {
            contentConditions.push({
              field: 'to',
              operand: condition.to,
              operator: 'contains',
              ignoreCase: true,
            });
          }
          break;
        case 'memo':
          if (condition.memo) {
            contentConditions.push({
              field: 'memo',
              operand: condition.memo,
              operator: 'contains',
              ignoreCase: true,
            });
          }
          break;
        case 'subject':
          if (condition.subject) {
            contentConditions.push({
              field: 'subject',
              operand: condition.subject,
              operator: 'contains',
              ignoreCase: true,
            });
          }
          break;
        case 'label0':
          if (condition.label0 !== undefined || searchParamsModel.fids?.includes(-1)) {
            conditions.push({
              field: 'label0',
              operator: '=',
              operand: 1,
            });
          }
          break;
        case 'sentDate':
          if (condition.sentDate) {
            const [start, end] = condition.sentDate;
            let operator;
            let operand;
            if (start && end) {
              operator = 'in_range';
              operand = !Array.isArray(condition.sentDate) ? [condition.sentDate].join(':') : condition.sentDate.join(':');
            } else if (start) {
              operator = '>=';
              operand = start;
            } else if (end) {
              operator = '<=';
              operand = end;
            }
            if (start || end) {
              conditions.push({
                field: 'sentDate',
                operand,
                operator,
              });
            }
          }
          break;
        default:
          break;
      }
    });
    if (contentConditions.length > 0) {
      conditions.push({
        conditions: contentConditions,
        operator: 'and',
      });
    }
    const isCorpMail = this.systemApi.getIsCorpMailMode();
    if (flagConditions.length > 0) {
      conditions.push({
        conditions: flagConditions,
        operator: isCorpMail ? 'or' : 'and',
      });
    }

    if (readFlagsConditions.length > 0) {
      conditions.push({
        conditions: readFlagsConditions,
        operator: 'and',
      });
    }

    const fids = searchParamsModel.fids?.filter(id => id >= 0);

    return {
      conditions,
      operator: 'and',
      order: searchParamsModel.order || 'date',
      desc: searchParamsModel.desc,
      windowSize: searchParamsModel.windowSize || 20,
      summaryWindowSize: searchParamsModel.summaryWindowSize || 20,
      returnAttachments: true,
      returnTag: true,
      fids: isCorpMail ? null : fids,
      fid: isCorpMail ? fids : null, // corp字段为fid,
      groupings: searchParamsModel?.ignoreGroup
        ? undefined
        : {
            fid: '',
          },
    };
  }

  getSearchDataCondition(data: EntityMailData, key: string, mailSearchType?: MailSearchTypes) {
    const isSearchAll = !mailSearchType || mailSearchType === 'all';

    const isSearchTitle = mailSearchType === 'title';
    const titleCondition = isSearchAll || isSearchTitle ? data.title?.toLowerCase().includes(key) : false;
    if (isSearchTitle) {
      return titleCondition;
    }

    const isSearchSender = mailSearchType === 'sender';
    const fromEmailCondition = isSearchAll || isSearchSender ? !!data.fromEmail && data.fromEmail.toLowerCase().includes(key) : false;
    const fromNameCondition = isSearchAll || isSearchSender ? !!data.fromName && data.fromName.toLowerCase().includes(key) : false;
    if (isSearchSender) {
      return fromEmailCondition || fromNameCondition;
    }

    const isSearchReceiver = mailSearchType === 'receiver';
    const toContactNameCondition = isSearchAll || isSearchReceiver ? util.testArrayContainsKey(key, data.toContactName) : false;
    const toEmailCondition = isSearchAll || isSearchReceiver ? util.testArrayContainsKey(key, data.toEmail) : false;
    if (isSearchReceiver) {
      return toContactNameCondition || toEmailCondition;
    }

    const briefCondition = !!data.brief && data.brief.toLowerCase().includes(key);
    return titleCondition || briefCondition || toContactNameCondition || fromEmailCondition || fromNameCondition || toEmailCondition;
  }

  // 本地搜索二次筛选直接过滤mailModel
  // private filterEntry(
  //   data: MailEntryModel[],
  //   filterCondParam: any
  // ): MailEntryModel[] {
  //   if (!filterCondParam) {
  //     return data;
  //   }
  //   // filterCondParam需要支持且的关系，传进来是数组
  //   const filterCond = Array.isArray(filterCondParam) ? filterCondParam : [filterCondParam];
  //   const fromFilterCond = filterCond.find(f => f && f.field === 'from'); // 发信人过滤器
  //   const sentDateFilterCond = filterCond.find(f => f && f.field === 'sentDate'); // 日期过滤
  //   const attachedFilterCond = filterCond.find(f => f && f.field === 'flags' && f.operand && f.operand.attached !== undefined); // 有无附件过滤
  //   const readFilterCond = filterCond.find(f => f && f.field === 'flags' && f.operand && f.operand.read !== undefined); // 已读未读过滤
  //   const result = data.filter((mail) => {
  //     // 发信人过滤
  //     if (fromFilterCond && fromFilterCond.operand) {
  //       if (!fromFilterCond.operand.includes(mail.sender.contact.contact.accountName)) {
  //         return false;
  //       }
  //     }
  //     // 日期过滤
  //     if (sentDateFilterCond && sentDateFilterCond.operand) {
  //       let temp;
  //       const now = moment();
  //       const { sendTime } = mail.entry;
  //       const threeDayKey = now.clone().subtract(2, 'day').format('YYYY-MM-DD');
  //       const oneWeekKey = now.clone().subtract(6, 'day').format('YYYY-MM-DD');
  //       const oneMonthKey = now
  //         .clone()
  //         .subtract(29, 'day')
  //         .format('YYYY-MM-DD');
  //       const threeMonthKey = now
  //         .clone()
  //         .subtract(89, 'day')
  //         .format('YYYY-MM-DD');
  //       const threeMonthOutKey = now
  //         .clone()
  //         .subtract(90, 'day')
  //         .format('YYYY-MM-DD');
  //       if (sentDateFilterCond.operand.includes(threeDayKey)) {
  //         temp = moment(sendTime).isSameOrAfter(moment(threeDayKey), 'day');
  //       } else if (sentDateFilterCond.operand.includes(oneWeekKey)) {
  //         temp = moment(sendTime).isSameOrAfter(moment(oneWeekKey), 'day');
  //       } else if (sentDateFilterCond.operand.includes(oneMonthKey)) {
  //         temp = moment(sendTime).isSameOrAfter(moment(oneMonthKey), 'day');
  //       } else if (sentDateFilterCond.operand.includes(threeMonthKey)) {
  //         temp = moment(sendTime).isSameOrAfter(moment(threeMonthKey), 'day');
  //       } else if (sentDateFilterCond.operand.includes(threeMonthOutKey)) {
  //         temp = moment(sendTime).isBefore(moment(threeMonthKey), 'day');
  //       }
  //       if (!temp) {
  //         return false;
  //       }
  //     }
  //     // 有无附件过滤
  //     if (attachedFilterCond) {
  //       // 日程邀请邮件，有附件数，但是不能按照有附件的算
  //       let hasAttachment = !(+mail.entry.attachmentCount === 0 || (+mail.entry.attachmentCount === 1 && mail.entry.isIcs)); // 是否有附件
  //       const temp = attachedFilterCond.operand.attached ? hasAttachment : !hasAttachment;
  //       if (!temp) {
  //         return false;
  //       }
  //     }
  //     // 是否已读过滤
  //     if (readFilterCond) {
  //       const temp = readFilterCond.operand.read ? mail.entry.readStatus === 'read' : mail.entry.readStatus === 'unread';
  //       if (!temp) {
  //         return false;
  //       }
  //     }
  //     return true;
  //   });
  //   return result;
  // }

  // 本地搜索过滤data表返回的数据
  // private filterMailData(
  //   data: resultObject[],
  //   filterCondParam: any
  // ): resultObject[] {
  //   if (!filterCondParam) {
  //     return data;
  //   }
  //   const filterCond = Array.isArray(filterCondParam) ? filterCondParam : [filterCondParam];
  //   const fromFilterCond = filterCond.find(f => f && f.field === 'from'); // 发信人过滤器
  //   const sentDateFilterCond = filterCond.find(f => f && f.field === 'sentDate'); // 日期过滤
  //   const attachedFilterCond = filterCond.find(f => f && f.field === 'flags' && f.operand && f.operand.attached !== undefined); // 有无附件过滤
  //   const result = data.filter((mail) => {
  //     // 发信人过滤
  //     if (fromFilterCond && fromFilterCond.operand) {
  //       if (!fromFilterCond.operand.includes(mail.fromEmail)) {
  //         return false;
  //       }
  //     }
  //     // 日期过滤
  //     if (sentDateFilterCond && sentDateFilterCond.operand) {
  //       let temp;
  //       const now = moment();
  //       const sendTime = Math.abs(mail.sdTime);
  //       const threeDayKey = now.clone().subtract(2, 'day').format('YYYY-MM-DD');
  //       const oneWeekKey = now.clone().subtract(6, 'day').format('YYYY-MM-DD');
  //       const oneMonthKey = now.clone().subtract(29, 'day').format('YYYY-MM-DD');
  //       const threeMonthKey = now.clone().subtract(89, 'day').format('YYYY-MM-DD');
  //       const threeMonthOutKey = now.clone().subtract(90, 'day').format('YYYY-MM-DD');
  //       if (sentDateFilterCond.operand.includes(threeDayKey)) {
  //         temp = moment(sendTime).isSameOrAfter(moment(threeDayKey), 'day');
  //       } else if (sentDateFilterCond.operand.includes(oneWeekKey)) {
  //         temp = moment(sendTime).isSameOrAfter(moment(oneWeekKey), 'day');
  //       } else if (sentDateFilterCond.operand.includes(oneMonthKey)) {
  //         temp = moment(sendTime).isSameOrAfter(moment(oneMonthKey), 'day');
  //       } else if (sentDateFilterCond.operand.includes(threeMonthKey)) {
  //         temp = moment(sendTime).isSameOrAfter(moment(threeMonthKey), 'day');
  //       } else if (sentDateFilterCond.operand.includes(threeMonthOutKey)) {
  //         temp = moment(sendTime).isBefore(moment(threeMonthKey), 'day');
  //       }
  //       if (!temp) {
  //         return false;
  //       }
  //     }
  //     // 有无附件过滤
  //     if (attachedFilterCond) {
  //       // 日程邀请邮件，有附件数，但是不能按照有附件的算
  //       let hasAttachment = !(+mail.attachmentCount === 0 || (+mail.attachmentCount === 1 && mail.isIcs)); // 是否有附件
  //       const temp = attachedFilterCond.operand.attached ? hasAttachment : !hasAttachment;
  //       if (!temp) {
  //         return false;
  //       }
  //     }
  //     return true;
  //   });
  //   return result;
  // }

  // 本地搜索二次筛选filter处理
  getSearchDataFilter(data: EntityMailData, additionalData: resultObject) {
    const filterCond = additionalData?.param.filterCond as any[];
    if (!filterCond || filterCond.length === 0) {
      return true;
    }
    const fromFilterCond = filterCond.find(f => f && f.field === 'from'); // 发信人过滤器
    const sentDateFilterCond = filterCond.find(f => f && f.field === 'sentDate'); // 日期过滤
    const attachedFilterCond = filterCond.find(f => f && f.field === 'flags' && f.operand && f.operand.attached !== undefined); // 有无附件过滤
    // 发信人过滤
    if (fromFilterCond && fromFilterCond.operand) {
      if (!fromFilterCond.operand.includes(data.fromEmail)) {
        return false;
      }
    }
    // 日期过滤
    if (sentDateFilterCond && sentDateFilterCond.operand) {
      let temp;
      const now = moment();
      const threeDayKey = now.clone().subtract(2, 'day').format('YYYY-MM-DD');
      const oneWeekKey = now.clone().subtract(6, 'day').format('YYYY-MM-DD');
      const oneMonthKey = now.clone().subtract(29, 'day').format('YYYY-MM-DD');
      const threeMonthKey = now.clone().subtract(89, 'day').format('YYYY-MM-DD');
      const threeMonthOutKey = now.clone().subtract(90, 'day').format('YYYY-MM-DD');
      if (sentDateFilterCond.operand.includes(threeDayKey)) {
        temp = moment(-data.sdTime).isSameOrAfter(moment(threeDayKey), 'day');
      } else if (sentDateFilterCond.operand.includes(oneWeekKey)) {
        temp = moment(-data.sdTime).isSameOrAfter(moment(oneWeekKey), 'day');
      } else if (sentDateFilterCond.operand.includes(oneMonthKey)) {
        temp = moment(-data.sdTime).isSameOrAfter(moment(oneMonthKey), 'day');
      } else if (sentDateFilterCond.operand.includes(threeMonthKey)) {
        temp = moment(-data.sdTime).isSameOrAfter(moment(threeMonthKey), 'day');
      } else if (sentDateFilterCond.operand.includes(threeMonthOutKey)) {
        temp = moment(-data.sdTime).isBefore(moment(threeMonthKey), 'day');
      }
      if (!temp) {
        return false;
      }
    }
    // 有无附件过滤
    if (attachedFilterCond) {
      // 日程邀请邮件，有附件数，但是不能按照有附件的算
      const hasAttachment = !(+data.attachmentCount === 0 || (+data.attachmentCount === 1 && data.isIcs)); // 是否有附件
      const temp = attachedFilterCond.operand.attached ? hasAttachment : !hasAttachment;
      if (!temp) {
        return false;
      }
    }
    return true;
  }

  // 现在本地搜索逻辑
  async doLocalSearchMail(key: string, param: queryMailBoxParam): Promise<MailSearchResult> {
    console.time('4444----本地耗时');
    console.log('4444----本地---key', key);
    console.log('4444----本地---param', param);
    const isThread = param.checkType === 'checkThread' ? 1 : 0;
    const onlySearchAttachmemnt = param.searchType === 'attachment';
    const searchType = param.searchType || 'all';
    // 搜索data库
    const filterData = onlySearchAttachmemnt
      ? Promise.resolve(undefined)
      : this.db.getByEqCondition(
          {
            filter: localSearchDataFilterName,
            additionalData: {
              key,
              param,
              isThread,
              searchType,
            },
            ...mailTable.data,
          },
          param._account
        );

    const shouldSearchAttachment = param.searchType === 'all' || onlySearchAttachmemnt;

    const mailAttachmentCheck = shouldSearchAttachment
      ? this.db.getByEqCondition(
          {
            filter: mailSearchAttachmentFilterName,
            additionalData: {
              key,
              param,
              isThread,
              searchType,
            },
            ...mailTable.attachment,
          },
          param._account
        )
      : Promise.resolve(undefined);

    // 将db异步操作包裹起来，兜底
    try {
      console.time('4444----本地111');
      const [mailData, mailAttachment] = await Promise.all([filterData, mailAttachmentCheck]);
      console.timeEnd('4444----本地111');
      const mids: Set<string> = new Set<string>();
      const checkMids: Set<string> = new Set<string>();
      // mailData需要根据二次筛选过滤一次
      // const mailDataAfterFilter = this.filterMailData(mailData, param.filterCond);
      this.buildSetData(mids, checkMids, undefined, mailAttachment);
      let mailDataArr = mailData;
      if (mailDataArr && mailDataArr.length) {
        this.buildSetData(mids, checkMids, undefined, mailDataArr);
      }
      mailDataArr = mids.size ? await this.db.getByIds(mailTable.data, Array.from(mids), param._account) : [];
      // 根据mids获取全量的status数据
      console.time('4444----本地222');
      const allStatusEntries: EntityMailStatus[] = ((await this.db.getByIds(mailTable.status, Array.from(mids), param._account)) as EntityMailStatus[]).filter(v => !!v);
      const allAttachmentEntries: resultObject[] =
        mailDataArr && mailDataArr.length ? (await this.db.getByIds(mailTable.attachment, Array.from(mids), param._account)).filter(v => !!v) : mailAttachment || [];
      console.timeEnd('4444----本地222');
      // 根据全量status数据构建一个map，用于缓存
      // 根据全量attachment数据构建一个map
      const map: Map<string, EntityMailStatus> = new Map<string, EntityMailStatus>();
      const attachmentMap: Map<string, resultObject> = new Map<string, resultObject>();
      allStatusEntries.forEach(it => map.set(it.mid, it));
      allAttachmentEntries.forEach(it => attachmentMap.set(it.mid, it));
      // 如果filterCond和id都是空，则表示是第一次搜索关键词，此时结果可以缓存一下，方便后续二次搜索
      if ((!param.filterCond || param.filterCond.length === 0) && !param.id) {
        // 此时是第一次搜索，可以缓存mailData和map，后续二次筛选直接使用，todo：优化
      }
      let total = mids.size; // total表示所有条件且的数量,先赋值为未过滤的
      const filterMailData = this.getFilterMailData(mailDataArr, map, attachmentMap, param.id, param.filterCond || [], param.status);
      let entries: MailEntryModel[] = [];
      let groupings: ResponseGroupResult = {};
      let folder: MailBoxModel[] = [];
      let stat: MailStatResult = {};
      // 如果全量数据存在
      if (total > 0) {
        total = filterMailData.length; // 过滤后的长度，邮件列表的长度
        const ids = filterMailData.map(m => m.mid);
        ids.sort((a, b) => {
          const aData = map.get(a);
          const bData = map.get(b);
          if (!aData) {
            return 1;
          }
          if (!bData) {
            return -1;
          }
          return aData.rcTime - bData.rcTime;
        });
        const starter = param.index || 0;
        const needCheckId = starter + param.count > checkMids.size ? ids.slice(param.index) : ids.slice(starter, starter + param.count);
        entries = await this.mailDbHanlder.getMailById({
          id: needCheckId,
          noContent: true,
          _account: param._account,
        });
        // 构成groupings
        console.time('4444----本地333');
        groupings = this.buildGroupingsByFilter(mailDataArr, map, attachmentMap, param);
        console.timeEnd('4444----本地333');
        console.log('4444----本地---groupings', groupings);
        folder = await this.handleSearchGroupResult(groupings, param._account);
        console.log('4444----本地---folder', folder);
        stat = await this.handleStatResult(groupings);
        console.log('4444----本地---stat', stat);
      }
      const aaa = this.buildSearchResult([entries, {}, folder, stat], -1, key, total, param.id, param.searchType, param.filterCond, param._account);
      console.timeEnd('4444----本地耗时');
      console.log('4444----本地---aaa', aaa);
      this.loggerApi.track('mail_search_local_success', aaa);
      return aaa;
    } catch (error) {
      console.log('[mail-search] local Search error:', error);
      console.log('4444----本地---失败', error);
      this.loggerApi.track('mail_search_local_fail', { error, key, param });
      return this.buildSearchResult([[], {}, [], {}], -1, key, 0, param.id, param.searchType, param.filterCond, param._account);
    }
  }

  // 原本地搜索逻辑
  // async doLocalSearchMail(
  //   key: string,
  //   param: queryMailBoxParam
  // ): Promise<MailSearchResult> {
  //   console.time('4444----本地耗时');
  //   console.log('4444----本地---key', key);
  //   console.log('4444----本地---param', param);

  //   const isThread = param.checkType === 'checkThread' ? 1 : 0;
  //   const filterData = this.db.getByEqCondition({
  //     filter: localSearchDataFilterName,
  //     additionalData: {
  //       key,
  //       param,
  //       isThread,
  //       searchType: param.searchType || 'all',
  //     },
  //     ...mailTable.data,
  //   });
  //   const filterAttachment = this.db.getByEqCondition({
  //     filter: mailSearchAttachmentFilterName,
  //     additionalData: {
  //       key,
  //       param,
  //       isThread,
  //     },
  //     ...mailTable.attachment,
  //   });
  //   const filterContent = this.db.getByEqCondition({
  //     filter: mailAttachmentOfContentFilterName,
  //     additionalData: {
  //       key,
  //       param,
  //       isThread,
  //     },
  //     ...mailTable.attachment,
  //   });
  //   // 二次过滤条件，已读这一项可以添加到这里，status查询尚未实现read
  //   let readStatus; // 二次过滤的已读筛选
  //   if (param.filterCond && param.filterCond.length) {
  //     const filterCond = param.filterCond as any[];
  //     const readFilter = filterCond.find(f => f && f.field === 'flags' && f.operand && f.operand.read !== undefined)
  //     if (readFilter) {
  //       readStatus = readFilter.operand.read ? 'read' : 'unread';
  //     }
  //   }
  //   param.status = param.status || readStatus as TypeMailState;
  //   const newParam = { ...param, index: 0, count: 3000 };
  //   const mailStatusCheck =
  //     !!param.status || param.id !== undefined || !!param.filter
  //       ? this.mailDbHanlder.buildQuery(newParam)
  //       : Promise.resolve(undefined);
  //   const mailAttachmentCheck =
  //     param.searchType === 'all'
  //       ? filterAttachment
  //       : Promise.resolve(undefined);
  //   const mailContentCheck =
  //     param.searchType === 'all' ? filterContent : Promise.resolve(undefined);
  //   // 将db异步操作包裹起来，兜底
  //   try {
  //     console.time('4444----本地111');

  //     const [mailData, mailAttachment, mailContent, statusMap] =
  //       await Promise.all([
  //         filterData,
  //         mailAttachmentCheck,
  //         mailContentCheck,
  //         mailStatusCheck,
  //       ]);
  //     console.timeEnd('4444----本地111');

  //     const mids: Set<string> = new Set<string>();
  //     const checkMids: Set<string> = new Set<string>();
  //     let filterMids: Set<string> | undefined;
  //     // 不需要检查 status，statusMap 为 undefined, filterMids 也为 undefined
  //     // status 没查到数据，statusMap 为 []， filterMids 为 new Set
  //     if (statusMap) {
  //       filterMids = new Set<string>();
  //       if (statusMap.length > 0) {
  //         statusMap.forEach((it: resultObject) => {
  //           filterMids!.add(it.mid);
  //         });
  //       }
  //     }
  //     console.time('4444----本地222');
  //     // mailData需要根据二次筛选过滤一次
  //     const mailDataAfterFilter = this.filterMailData(mailData, param.filterCond);
  //     // this.buildSetData(mids, checkMids, filterMids, mailData);
  //     this.buildSetData(mids, checkMids, filterMids, mailDataAfterFilter);
  //     this.buildSetData(mids, checkMids, filterMids, mailAttachment);
  //     this.buildSetData(mids, checkMids, filterMids, mailContent);
  //     console.timeEnd('4444----本地222');

  //     let allEntries: EntityMailStatus[] = [];
  //     let entries: MailEntryModel[] = [];
  //     let groupings: ResponseGroupResult = {};
  //     let folder: MailBoxModel[] = [];
  //     let stat: MailStatResult = {};
  //     let total = (param.status === 'read' || param.status === 'unread') ? checkMids.size : mids.size;
  //     if (total > 0) {
  //       allEntries = ((await this.db.getByIds(mailTable.status, Array.from(mids))) as EntityMailStatus[]).filter((v) => !!v);
  //       const map: Map<string, EntityMailStatus> = new Map<string, EntityMailStatus>();
  //       allEntries.forEach((it) => map.set(it.mid, it));
  //       const ids = Array.from(checkMids);
  //       ids.sort((a, b) => {
  //         const aData = map.get(a);
  //         const bData = map.get(b);
  //         if (!aData) {
  //           return 1;
  //         }
  //         if (!bData) {
  //           return -1;
  //         }
  //         return aData.rcTime - bData.rcTime;
  //       });
  //       const starter = param.index || 0;
  //       const needCheckId = (starter + param.count > checkMids.size) ? ids.slice(param.index) : ids.slice(
  //         starter, starter + param.count
  //       );
  //       // 全部数据
  //       console.time('4444----本地---allEntriesss');
  //       // const allEntriesss = await this.mailDbHanlder.getMailById({
  //       //   // id: ids,
  //       //   id: Array.from(checkMids),
  //       //   noContent: true,
  //       // });
  //       entries = await this.mailDbHanlder.getMailById(
  //         {
  //           id: needCheckId,
  //           noContent: true,
  //         }
  //       );
  //       console.timeEnd('4444----本地---allEntriesss');
  //       // 过滤一下
  //       // const afterFilterEntry = this.filterEntry(
  //       //   allEntriesss,
  //       //   param.filterCond
  //       // ).sort((a, b) => +moment(b.entry.receiveTime) - +moment(a.entry.receiveTime));
  //       // const afterIds = afterFilterEntry.map((it) => it.id);
  //       // total = afterIds.length;
  //       // const starter = param.index || 0;
  //       // const needCheckId = starter + param.count > afterIds.length ? afterIds.slice(param.index) : afterIds.slice(starter, starter + param.count);
  //       // entries = afterFilterEntry.filter((m) => needCheckId.includes(m.id));
  //       // groupings = this.buildGpResult(entries);
  //       groupings = this.buildGroupings(mailDataAfterFilter, map, checkMids);
  //       console.log('4444----本地---groupings', groupings);
  //       if (Array.isArray(groupings.fid)) {
  //         const target = groupings.fid.find((v) => v.val === param.id);
  //         if (target) {
  //           total = target.cnt;
  //         }
  //       }
  //       folder = await this.handleSearchGroupResult(groupings);
  //       stat = await this.handleStatResult(groupings);
  //       console.log('4444----本地---stat', stat);
  //     }
  //     const aaa = this.buildSearchResult(
  //       [entries, {}, folder, stat],
  //       -1,
  //       key,
  //       total,
  //       param.id,
  //       param.searchType,
  //       param.filterCond
  //     );
  //     console.timeEnd('4444----本地耗时');

  //     console.log('4444----本地---aaa', aaa);
  //     this.loggerApi.track('mail_search_local_success', aaa);
  //     return aaa;
  //   } catch (error) {
  //     console.log('[mail-search] local Search error:', error);
  //     console.log('4444----本地---失败');
  //     this.loggerApi.track('mail_search_local_fail', { error, key, param });
  //     return this.buildSearchResult(
  //       [[], {}, [], {}],
  //       -1,
  //       key,
  //       0,
  //       param.id,
  //       param.searchType,
  //       param.filterCond
  //     );
  //   }
  // }

  // private buildGpResult(entries: MailEntryModel[]) {
  //   const re = {
  //     fid: [],
  //     'flags.read': [],
  //     'flags.attached': [],
  //     fromAddress: [],
  //     sentDate: [],
  //   } as ResponseGroupResult;
  //   if (entries && entries.length > 0) {
  //     const map: Map<number, number> = new Map<number, number>();
  //     let unread = 0;
  //     let attached = 0;
  //     const fromAddrMap = new Map(); // 邮箱：数量
  //     const fromAddrNameMap = new Map(); // 邮箱：昵称
  //     const fromAddrContactLabelMap = new Map(); // 邮箱：昵称拼音首字母
  //     const nowTime = new Date().getTime();
  //     const sendDateMap = {
  //       [nowTime - 2 * 24 * 3600 * 1000]: 0, // 三天内,
  //       [nowTime - 6 * 24 * 3600 * 1000]: 0, // 一周内
  //       [nowTime - 29 * 24 * 3600 * 1000]: 0, // 一月内
  //       [nowTime - 89 * 24 * 3600 * 1000]: 0, // 三月内
  //       // 以上时间包括今天
  //     };
  //     entries.forEach((it) => {
  //       // if(map.has(it.folder)){
  //       const num = map.get(it.entry.folder) || 0;
  //       map.set(it.entry.folder, num + 1);
  //       const contactName = it.sender.contact.contact.accountName || it.sender.contact.contact.id; // 发件人邮箱
  //       const nickName = it.sender.contact.contact.contactName || contactName;  // 发件人昵称
  //       const contactLabel = it.sender.contact.contact.contactLabel;  // 发件人昵称，拼音首字母
  //       const adNum = +fromAddrMap.get(contactName) || 0;
  //       fromAddrMap.set(contactName, adNum + 1);
  //       fromAddrNameMap.set(contactName, nickName);
  //       fromAddrContactLabelMap.set(contactName, contactLabel);
  //       if (it.entry.readStatus === 'unread') {
  //         unread += 1;
  //       }
  //       if (!(+it.entry.attachmentCount === 0 || (+it.entry.attachmentCount === 1 && it.entry.isIcs))) {
  //         attached += 1;
  //       }
  //       const sendTime = moment(it?.entry?.sendTime);
  //       Object.keys(sendDateMap).forEach((time) => {
  //         if (moment.isMoment(sendTime) && sendTime.isSameOrAfter(moment(+time), 'day')) {
  //           sendDateMap[+time] = sendDateMap[+time] + 1;
  //         }
  //       });
  //       // }
  //     });
  //     re['flags.read']?.push({ val: true, cnt: entries.length - unread });
  //     re['flags.read']?.push({ val: false, cnt: unread });
  //     re['flags.attached']?.push({ val: true, cnt: attached });
  //     re['flags.attached']?.push({
  //       val: false,
  //       cnt: entries.length - attached,
  //     });
  //     map.forEach((k, v) => {
  //       re.fid?.push({ val: v, cnt: k });
  //     });
  //     fromAddrMap.forEach((k, v) => {
  //       const nickName = fromAddrNameMap.get(v);
  //       const contactLabel = fromAddrContactLabelMap.get(v);
  //       re.fromAddress?.push({ val: v, cnt: k, nickName, contactLabel });
  //     });
  //     // 遍历设置sendDateArr,默认时间都是11:00:00
  //     const sendDateArr = [];
  //     Object.keys(sendDateMap)
  //       .sort((a, b) => +b - +a)
  //       .forEach((time) => {
  //         sendDateArr.push({
  //           val: moment(+time).format('YYYY-MM-DD'),
  //           cnt: sendDateMap[+time],
  //         });
  //       });
  //     // 三月前单独处理，三月前时间处理为90天前
  //     sendDateArr.push({
  //       val: moment().subtract(90, 'day').format('YYYY-MM-DD'),
  //       cnt: entries.length - sendDateMap[nowTime - 89 * 24 * 3600 * 1000],
  //     });
  //     re.sentDate = sendDateArr;
  //   }
  //   return re;
  // }

  // 本地搜索，根据全量mailData和status和param.id, param.filterCondition，返回过滤后的mailData，
  private getFilterMailData(
    entriesIn: resultObject[],
    statusMap: Map<string, EntityMailStatus>,
    attachmentMap: Map<string, resultObject>,
    id: number | undefined,
    filterCondIn: MailSearchCondition[],
    status: TypeMailState | undefined
  ): resultObject[] {
    // 如果没有过滤条件，则直接返回entriesIn
    if (!id && filterCondIn.length === 0 && !status) {
      return entriesIn;
    }
    const filterCond = filterCondIn as any[];
    const fromFilterCond = filterCond.find(f => f && f.field === 'from'); // 发信人过滤器
    const sentDateFilterCond = filterCond.find(f => f && f.field === 'sentDate'); // 日期过滤
    const attachedFilterCond = filterCond.find(f => f && f.field === 'flags' && f.operand && f.operand.attached !== undefined); // 有无附件过滤
    const readFilterCond = filterCond.find(f => f && f.field === 'flags' && f.operand && f.operand.read !== undefined); // 有无附件过滤
    const result = entriesIn.filter(mail => {
      // 发信人过滤
      if (fromFilterCond && fromFilterCond.operand) {
        if (!fromFilterCond.operand.includes(mail.fromEmail)) {
          return false;
        }
      }
      // 日期过滤
      if (sentDateFilterCond && sentDateFilterCond.operand) {
        let temp;
        const now = moment();
        const sendTime = Math.abs(mail.sdTime);
        const threeDayKey = now.clone().subtract(2, 'day').format('YYYY-MM-DD');
        const oneWeekKey = now.clone().subtract(6, 'day').format('YYYY-MM-DD');
        const oneMonthKey = now.clone().subtract(29, 'day').format('YYYY-MM-DD');
        const threeMonthKey = now.clone().subtract(89, 'day').format('YYYY-MM-DD');
        const threeMonthOutKey = now.clone().subtract(90, 'day').format('YYYY-MM-DD');
        if (sentDateFilterCond.operand.includes(threeDayKey)) {
          temp = moment(sendTime).isSameOrAfter(moment(threeDayKey), 'day');
        } else if (sentDateFilterCond.operand.includes(oneWeekKey)) {
          temp = moment(sendTime).isSameOrAfter(moment(oneWeekKey), 'day');
        } else if (sentDateFilterCond.operand.includes(oneMonthKey)) {
          temp = moment(sendTime).isSameOrAfter(moment(oneMonthKey), 'day');
        } else if (sentDateFilterCond.operand.includes(threeMonthKey)) {
          temp = moment(sendTime).isSameOrAfter(moment(threeMonthKey), 'day');
        } else if (sentDateFilterCond.operand.includes(threeMonthOutKey)) {
          temp = moment(sendTime).isBefore(moment(threeMonthKey), 'day');
        }
        if (!temp) {
          return false;
        }
      }
      // 有无附件过滤
      if (attachedFilterCond) {
        // 日程邀请邮件，有附件数，但是不能按照有附件的算，内联附件需要根据attachmentMap中的数据来判断
        const attachmentsArr = attachmentMap.get(mail.mid)?.attachment;
        // 全部都是内联附件，认为也是无附件
        // 附件数为0
        const attachmentNull = +mail.attachmentCount === 0 && (!attachmentsArr || attachmentsArr.length === 0);
        // 仅有一个ics附件
        const onlyIcs = +mail.attachmentCount === 1 && mail.isIcs;
        // 无附件或者全都是内联附件, 二次筛选当做无附件
        const allInline = !attachmentsArr || attachmentsArr.length === 0 || attachmentsArr.every((m: { inlined: any }) => !!m.inlined);
        const hasAttachment = mail.linkAttached || (!attachmentNull && !onlyIcs && !allInline); // 是否有附件
        const temp = attachedFilterCond.operand.attached ? hasAttachment : !hasAttachment;
        if (!temp) {
          return false;
        }
      }
      // 文件夹过滤
      if (id) {
        const folder = statusMap.get(mail.mid)?.folder as number;
        // 是需要的文件夹
        const temp = folder === +id;
        if (!temp) {
          return false;
        }
      }
      // 已读未读过滤
      if (readFilterCond) {
        const hasRead = statusMap.get(mail.mid)?.readStatus !== 0;
        const temp = readFilterCond.operand.read ? hasRead : !hasRead;
        if (!temp) {
          return false;
        }
      }
      // 过滤tab中的红旗
      if (status === 'redFlag') {
        const isRedFlag = statusMap.get(mail.mid)?.redFlag === 1;
        if (!isRedFlag) {
          return false;
        }
      }
      // 过滤tab中的未读
      if (status === 'unread') {
        const unRead = statusMap.get(mail.mid)?.readStatus === 0;
        if (!unRead) {
          return false;
        }
      }
      return true;
    });
    return result;
  }

  // 本地搜索，根据mailData和status，id，filterCondition，构建groupings
  private buildGroupingsByFilter(entries: resultObject[], statusMap: Map<string, EntityMailStatus>, attachmentMap: Map<string, resultObject>, param: queryMailBoxParam) {
    const re = {
      fid: [],
      'flags.read': [],
      'flags.attached': [],
      fromAddress: [],
      sentDate: [],
    } as ResponseGroupResult;
    // id: number | undefined, filterCondIn: MailSearchCondition[]
    const { id, filterCond = [], status } = param;
    const filterCondIn = filterCond as any[];
    if (entries && entries.length > 0) {
      // 除去id后的别的条件，且的过滤
      const idEntries = this.getFilterMailData(entries, statusMap, attachmentMap, undefined, filterCondIn, status);
      const idGroupings = this.buildGroupingsByKey(idEntries, statusMap);
      re.fid = idGroupings.fid;
      // 除去发件人后的别的条件,且的过滤
      const noFromFilterCondIn = filterCondIn.filter(f => f && f.field !== 'from');
      const fromEntries = this.getFilterMailData(entries, statusMap, attachmentMap, id, noFromFilterCondIn, status);
      const fromGroupings = this.buildGroupingsByKey(fromEntries, statusMap);
      re.fromAddress = fromGroupings.fromAddress;
      // 除去发件人后的别的条件，且的过滤
      const noSentDateFilterCondIn = filterCondIn.filter(f => f && f.field !== 'sentDate');
      const sentDateEntries = this.getFilterMailData(entries, statusMap, attachmentMap, id, noSentDateFilterCondIn, status);
      const sentDateGroupings = this.buildGroupingsByKey(sentDateEntries, statusMap);
      re.sentDate = sentDateGroupings.sentDate;
      // 除去附件后的别的条件，且的过滤
      const noAttachmentFilterCondIn = filterCondIn.filter(f => {
        const isAttachment = f && f.field === 'flags' && f.operand && f.operand.attached !== undefined;
        return !isAttachment;
      });
      const attachmentEntries = this.getFilterMailData(entries, statusMap, attachmentMap, id, noAttachmentFilterCondIn, status);
      const attachmentGroupings = this.buildGroupingsByKey(attachmentEntries, statusMap, attachmentMap);
      re['flags.attached'] = attachmentGroupings['flags.attached'];
      // 除去阅读状态后的别的条件，且的过滤
      const noReadFilterCondIn = filterCondIn.filter(f => {
        const isRead = f && f.field === 'flags' && f.operand && f.operand.read !== undefined;
        return !isRead;
      });
      const readEntries = this.getFilterMailData(entries, statusMap, attachmentMap, id, noReadFilterCondIn, status);
      const readGroupings = this.buildGroupingsByKey(readEntries, statusMap);
      re['flags.read'] = readGroupings['flags.read'];
    }
    return re;
  }

  // 本地搜索，根据过滤后的entry和statusMap还有对应的key来形成对应的groupings部分
  private buildGroupingsByKey(entries: resultObject[], statusMap: Map<string, EntityMailStatus>, attachmentMap?: Map<string, resultObject>) {
    const re = {
      fid: [],
      'flags.read': [],
      'flags.attached': [],
      fromAddress: [],
      sentDate: [],
    } as ResponseGroupResult;
    if (entries && entries.length > 0) {
      const map: Map<number, number> = new Map<number, number>();
      let unread = 0;
      let attached = 0;
      const fromAddrMap = new Map(); // 邮箱：数量
      const fromAddrNameMap = new Map(); // 邮箱：昵称
      const fromAddrContactLabelMap = new Map(); // 邮箱：昵称拼音首字母
      const nowTime = new Date().getTime();
      const sendDateMap = {
        [nowTime - 2 * 24 * 3600 * 1000]: 0, // 三天内,
        [nowTime - 6 * 24 * 3600 * 1000]: 0, // 一周内
        [nowTime - 29 * 24 * 3600 * 1000]: 0, // 一月内
        [nowTime - 89 * 24 * 3600 * 1000]: 0, // 三月内
        // 以上时间包括今天
      };
      entries.forEach(it => {
        // 处理文件夹数量
        const folder = statusMap.get(it.mid)?.folder as number;
        const num = map.get(folder) || 0;
        map.set(folder, num + 1);
        // 处理发信人
        const contactName = it.fromEmail; // 发件人邮箱
        const nickName = it.fromName; // 发件人昵称
        const contactLabel = util.getContactPYLabel(nickName).charAt(0).toLocaleUpperCase(); // 发件人昵称，拼音首字母
        const adNum = +fromAddrMap.get(contactName) || 0;
        fromAddrMap.set(contactName, adNum + 1);
        fromAddrNameMap.set(contactName, nickName);
        fromAddrContactLabelMap.set(contactName, contactLabel);
        const readStatus = statusMap.get(it.mid)?.readStatus === 0 ? 'unread' : 'read';
        if (readStatus === 'unread') {
          unread += 1;
        }
        const attachmentsArr = attachmentMap && attachmentMap.get(it.mid)?.attachment;
        // 附件数为0
        const attachmentNull = +it.attachmentCount === 0 && (!attachmentsArr || attachmentsArr.length === 0);
        // 仅有一个ics附件
        const onlyIcs = +it.attachmentCount === 1 && it.isIcs;
        // 无附件或者全都是内联附件, 二次筛选当做无附件
        const allInline = !attachmentsArr || attachmentsArr.length === 0 || attachmentsArr.every((m: { inlined: any }) => !!m.inlined);
        const hasAttachment = it.linkAttached || (!attachmentNull && !onlyIcs && !allInline); // 是否有附件
        if (hasAttachment) {
          attached += 1;
        }
        const sendTime = moment(Math.abs(it.sdTime));
        Object.keys(sendDateMap).forEach(time => {
          if (moment.isMoment(sendTime) && sendTime.isSameOrAfter(moment(+time), 'day')) {
            sendDateMap[+time] = sendDateMap[+time] + 1;
          }
        });
        // }
      });
      re['flags.read']?.push({ val: true, cnt: entries.length - unread });
      re['flags.read']?.push({ val: false, cnt: unread });
      re['flags.attached']?.push({ val: true, cnt: attached });
      re['flags.attached']?.push({
        val: false,
        cnt: entries.length - attached,
      });
      map.forEach((k, v) => {
        re.fid?.push({ val: v, cnt: k });
      });
      fromAddrMap.forEach((k, v) => {
        const nickName = fromAddrNameMap.get(v);
        const contactLabel = fromAddrContactLabelMap.get(v);
        re.fromAddress?.push({
          val: v,
          cnt: k,
          nickName,
          contactLabel,
        });
      });
      // 遍历设置sendDateArr,默认时间都是11:00:00
      const sendDateArr = [];
      Object.keys(sendDateMap)
        .sort((a, b) => +b - +a)
        .forEach(time => {
          sendDateArr.push({
            val: moment(+time).format('YYYY-MM-DD'),
            cnt: sendDateMap[+time],
          });
        });
      // 三月前单独处理，三月前时间处理为90天前
      sendDateArr.push({
        val: moment().subtract(90, 'day').format('YYYY-MM-DD'),
        cnt: entries.length - sendDateMap[nowTime - 89 * 24 * 3600 * 1000],
      });
      re.sentDate = sendDateArr;
    }
    return re;
  }

  // 本地搜索，根据mailData和status构建groupings
  // private buildGroupings(entriesIn: resultObject[], statusMap: Map<string, EntityMailStatus>, checkMids: Set<string>) {
  //   const re = {
  //     fid: [],
  //     'flags.read': [],
  //     'flags.attached': [],
  //     fromAddress: [],
  //     sentDate: [],
  //   } as ResponseGroupResult;
  //   if (entriesIn && entriesIn.length > 0) {
  //     let entries = cloneDeep(entriesIn);
  //     if (checkMids && checkMids.size) {
  //       entries = entries.filter(e => checkMids.has(e.mid));
  //     }
  //     const map: Map<number, number> = new Map<number, number>();
  //     let unread = 0;
  //     let attached = 0;
  //     const fromAddrMap = new Map(); // 邮箱：数量
  //     const fromAddrNameMap = new Map(); // 邮箱：昵称
  //     const fromAddrContactLabelMap = new Map(); // 邮箱：昵称拼音首字母
  //     const nowTime = new Date().getTime();
  //     const sendDateMap = {
  //       [nowTime - 2 * 24 * 3600 * 1000]: 0, // 三天内,
  //       [nowTime - 6 * 24 * 3600 * 1000]: 0, // 一周内
  //       [nowTime - 29 * 24 * 3600 * 1000]: 0, // 一月内
  //       [nowTime - 89 * 24 * 3600 * 1000]: 0, // 三月内
  //       // 以上时间包括今天
  //     };
  //     entries.forEach((it) => {
  //       // 处理文件夹数量
  //       const folder = statusMap.get(it.mid)?.folder as number;
  //       const num = map.get(folder) || 0;
  //       map.set(folder, num + 1);
  //       // 处理发信人
  //       const contactName = it.fromEmail; // 发件人邮箱
  //       const nickName = it.fromName;  // 发件人昵称
  //       const contactLabel = util.getContactPYLabel(nickName).charAt(0).toLocaleUpperCase();  // 发件人昵称，拼音首字母
  //       const adNum = +fromAddrMap.get(contactName) || 0;
  //       fromAddrMap.set(contactName, adNum + 1);
  //       fromAddrNameMap.set(contactName, nickName);
  //       fromAddrContactLabelMap.set(contactName, contactLabel);
  //       const readStatus = statusMap.get(it.mid)?.readStatus === 0 ? 'unread' : 'read';
  //       if (readStatus === 'unread') {
  //         unread += 1;
  //       }
  //       if (!(+it.attachmentCount === 0 || (+it.attachmentCount === 1 && it.isIcs))) {
  //         attached += 1;
  //       }
  //       const sendTime = moment(Math.abs(it.sdTime));
  //       Object.keys(sendDateMap).forEach((time) => {
  //         if (
  //           moment.isMoment(sendTime) &&
  //           sendTime.isSameOrAfter(moment(+time), 'day')
  //         ) {
  //           sendDateMap[+time] = sendDateMap[+time] + 1;
  //         }
  //       });
  //       // }
  //     });
  //     re['flags.read']?.push({ val: true, cnt: entries.length - unread });
  //     re['flags.read']?.push({ val: false, cnt: unread });
  //     re['flags.attached']?.push({ val: true, cnt: attached });
  //     re['flags.attached']?.push({
  //       val: false,
  //       cnt: entries.length - attached,
  //     });
  //     map.forEach((k, v) => {
  //       re.fid?.push({ val: v, cnt: k });
  //     });
  //     fromAddrMap.forEach((k, v) => {
  //       const nickName = fromAddrNameMap.get(v);
  //       const contactLabel = fromAddrContactLabelMap.get(v);
  //       re.fromAddress?.push({
  //         val: v,
  //         cnt: k,
  //         nickName,
  //         contactLabel,
  //       });
  //     });
  //     // 遍历设置sendDateArr,默认时间都是11:00:00
  //     const sendDateArr = [];
  //     Object.keys(sendDateMap)
  //       .sort((a, b) => +b - +a)
  //       .forEach((time) => {
  //         sendDateArr.push({
  //           val: moment(+time).format('YYYY-MM-DD'),
  //           cnt: sendDateMap[+time],
  //         });
  //       });
  //     // 三月前单独处理，三月前时间处理为90天前
  //     sendDateArr.push({
  //       val: moment().subtract(90, 'day').format('YYYY-MM-DD'),
  //       cnt: entries.length - sendDateMap[nowTime - 89 * 24 * 3600 * 1000],
  //     });
  //     re.sentDate = sendDateArr;
  //   }
  //   return re;
  // }

  private buildSetData(mids: Set<string>, checkMids: Set<string>, filterMids?: Set<string>, mailData?: resultObject[]) {
    if (!mailData || mailData.length === 0) {
      return;
    }
    mailData.forEach(it => {
      mids.add(it.mid);
      if (!filterMids || filterMids.has(it.mid)) {
        checkMids.add(it.mid);
      }
    });
  }

  doGetSearchCacheInfo(key: string, param: queryMailBoxParam, searchId?: number, noData?: boolean, _account?: string): SearchCacheInfo | boolean {
    const actions = this.mailApi.getActions({
      actions: this.actions,
      subActions: this.subActions,
      _account,
    })?.val;
    const searchWordKey = key + (param.searchType || 'all');
    const savedSeq = actions.searchWord[searchWordKey];

    const srId = savedSeq || searchId || actions.searchSeq.next();
    if (!savedSeq) {
      this.storeSearchWords(srId, searchWordKey, _account);
    }
    const reqKey = this.buildSearchEntryReqKey(param);
    const searchMidsCacheElement = actions.searchMidsCache[srId];
    const resCacheElement = actions.searchResCache[srId];
    // const savedFolderRes = resCacheElement && resCacheElement[''];
    const savedFolderRes = resCacheElement && resCacheElement[reqKey];
    const mailStatEl = actions.searchStatCache[srId];
    const mailStat = mailStatEl && mailStatEl[reqKey];
    const hasCache = !!(searchMidsCacheElement && searchMidsCacheElement[reqKey] && savedFolderRes && mailStat);
    if (noData) {
      return hasCache;
    }
    return {
      hasCache,
      srId,
      reqKey,
      searchMidsCacheElement,
      savedFolderRes,
      mailStat,
    };
  }

  doClearSearchCache(_account?: string) {
    const actions = this.mailApi.getActions({
      actions: this.actions,
      subActions: this.subActions,
      _account,
    })?.val;
    actions.searchWord = {};
    actions.searchMidsCache = {};
    actions.searchResCache = {};
    actions.searchStatCache = {};
    this.storeApi.del(MailAbstractHandler.mailSearchSeq, { _account }).then();
    this.storeApi.del(MailAbstractHandler.mailSearchKeyWord, { _account }).then();
  }

  doSearchMail(key: string, param: queryMailBoxParam, searchId?: number): Promise<MailSearchResult> {
    // console.log('4444----服务端--key', key);
    // console.log('4444----服务端--param', param);
    // console.log('4444----服务端--searchId', searchId);

    // console.log('[mail-search] search: ' + key, param, searchId);
    if (!key) {
      return Promise.reject(new Error('请输入搜索词'));
    }
    const { _account } = param;
    const { hasCache, srId, reqKey, searchMidsCacheElement, savedFolderRes, mailStat } = this.doGetSearchCacheInfo(
      key,
      param,
      searchId,
      false,
      _account
    ) as SearchCacheInfo;
    // const statusKey = param.status || '';
    param.addSentContent = true;
    const req = this.buildSearchEntryReq(key, param);
    const start = param.index || 0;
    // console.log('4444----服务端--hasCache', hasCache);
    if (hasCache) {
      const allIds = searchMidsCacheElement[reqKey];
      const ids = allIds.slice(start, start + param.count);
      if (ids && ids.length > 0) {
        const promiseSummary: Promise<StringMap> = this.handleSummaryEntities(ids, key, _account);
        const promiseEntry = this.doListMailBoxEntities({
          mids: ids,
          count: ids.length,
          _account,
        });
        return Promise.all([promiseEntry, promiseSummary])
          .then((result: [MailEntryModel[] | MailModelEntries, StringMap]) => {
            const entries: MailEntryModel[] = Array.isArray(result[0]) ? (result[0] as MailEntryModel[]) : (result[0] as MailModelEntries).data;
            const ccc = this.buildSearchResult(
              [entries, result[1], savedFolderRes, mailStat],
              srId,
              key,
              allIds.length,
              param.id,
              param.searchType,
              param.filterCond,
              _account
            );
            // console.log('4444----服务端--缓存srId', srId);
            // console.log('4444----服务端--缓存reqKey', reqKey);
            // console.log('4444----服务端--缓存savedFolderRes', savedFolderRes);
            // console.log('4444----服务端--缓存mailStat', mailStat);
            // console.log('4444----服务端--缓存', ccc);
            this.loggerApi.track('mail_search_cloud_cache_success', ccc);
            return ccc;
          })
          .catch(res => {
            console.error('服务端缓存命中失败', res);
            this.loggerApi.track('mail_search_cloud_cache_fail', {
              res,
              key,
              param,
            });
            return Promise.reject(this.commonCatch(res));
          });
      }
      return Promise.resolve(this.buildSearchResult([[], {}, savedFolderRes, {}], srId, key, allIds.length, param.id, param.searchType, param.filterCond, _account));
    }
    const key1 = 'searchMail';
    const url = this.buildUrl(key1, undefined, undefined, _account);
    // const isCorpMail = this.systemApi.getIsCorpMailMode();
    // 取出当前的fids保存下，防止后续用到，然后req.fids = fids[0],目的是为了处理邮件搜索，文件夹嵌套的的问题
    const oldFids = req.fids;
    if (req.fids && req.fids.length > 1) {
      req.fids = [req.fids[0]];
    }
    return this.impl
      .post(url, req, {
        ...(this.getConfigForHttp(key1, {
          url,
          data: req,
          method: 'post',
        }) || {}),
        _account,
      })
      .then((res: ApiResponse) => {
        req.fids = oldFids;
        // if (isCorpMail) {
        //   corpMailUtils.corpMailTransformResponse(res);
        // }
        const data = res.data as ResponseSearch;
        console.log('[mail-search] return from network:', data);
        if (data.code === MailAbstractHandler.sOk) {
          // this.handleCacheStatus(res);
          const result: ResponseMailListEntry[] = data.var.filter(it => typeof it !== 'string') as ResponseMailListEntry[];
          const ids: string[] = data.var.map(it => (typeof it === 'string' ? it : it.id)) as string[];
          this.storeSearchIds(srId, ids, reqKey, _account);
          const { groupings } = data;
          const promiseSummary: Promise<StringMap> = this.handleSummaryEntities(ids.slice(start, start + param.count), key, _account);
          const promiseEntry: Promise<MailEntryModel[]> = this.handleListMailBoxEntities(
            req,
            { d: result, t: result.length },
            {
              ...param,
              _account,
            },
            key
          ).then(result => (Array.isArray(result) ? result : (result as MailModelEntries).data));
          // const promiseFolder: Promise<MailBoxModel[]> = savedFolderRes
          //   ? Promise.resolve(savedFolderRes)
          //   : this.handleSearchGroupResult(groupings);

          // 服务端返回的是全量的groupings，需要过滤一下，不然数量一直全量，可能后期要去掉和服务端保持一致
          const filterGroupings = this.filterGrouping(groupings);
          const promiseFolder: Promise<MailBoxModel[]> = this.handleSearchGroupResult(filterGroupings, _account);
          // const promiseStat: Promise<MailStatResult> =
          //   mailStat && Object.keys(mailStat).length > 0
          //     ? Promise.resolve(mailStat)
          //     : this.handleStatResult(groupings);
          const promiseStat: Promise<MailStatResult> = this.handleStatResult(filterGroupings);
          return Promise.all([promiseEntry, promiseSummary, promiseFolder, promiseStat])
            .then((res: [MailEntryModel[], StringMap, MailBoxModel[], MailStatResult]) => {
              // this.storeSearchFolderRes(res[2], statusKey, srId);
              // this.storeSearchStat(res[3], statusKey, srId);
              this.storeSearchFolderRes(res[2], reqKey, srId, _account);
              this.storeSearchStat(res[3], reqKey, srId, _account);
              // console.log('4444----服务端--res', res);
              this.saveMails(res[0] as MailEntryModel[], _account);
              const bbb = this.buildSearchResult(res, srId, key, ids.length, param.id, param.searchType, param.filterCond, _account);
              // console.log('4444----服务端--远程', bbb);
              this.loggerApi.track('mail_search_cloud_server_success', bbb);
              return bbb;
            })
            .catch(res => {
              console.error('服务端搜索错误：', res);
              this.loggerApi.track('mail_search_cloud_server_fail', {
                res,
                key,
                param,
              });
              return Promise.reject(this.commonCatch(res));
            });
        }
        return Promise.reject(this.getErrMsg(data.code));
      });

    // throw new Error("not implemented");
  }

  // 服务端搜索回来的邮件，全量的内容，需要保存一下本地，防止操作的时候报错
  private saveMails(MailEntryModels: MailEntryModel[], _account?: string) {
    // res0本地保存一下，防止本地库无数据
    const allMails = MailEntryModels;
    if (allMails && allMails.length) {
      const selfMails = allMails.filter(mail => !mail.isTpMail);
      const tpMails = allMails.filter(mail => !!mail.isTpMail);
      if (selfMails.length > 0) {
        this.mailDbHandler.saveMails(selfMails, 'default', _account).catch();
      }
      if (tpMails.length > 0) {
        this.mailDbHandler.saveTpMails(tpMails).catch();
      }
    }
  }

  public doSpecialJob(key: string) {
    console.info('entered once hello ------------------------------------!!');
    if (key === '*#build*#') {
      this.eventApi.sendSysEvent({
        eventName: 'error',
        eventLevel: 'error',
        eventStrData: '',
        eventData: {
          popupType: 'window',
          popupLevel: 'info',
          title: '构建信息',
          content: window.BuildData,
          code: 'PARAM.ERR',
        } as PopUpMessageInfo,
        eventSeq: 0,
      });
    } else if (key === '*#shiftHost*#') {
      this.eventApi.sendSysEvent({
        eventName: 'error',
        eventLevel: 'error',
        eventStrData: '',
        eventData: {
          popupType: 'window',
          popupLevel: 'info',
          title: '切换到nginx转发',
          content: '此模式不影响mail(hz).qiye.163.com 的host转发配置',
          code: 'PARAM.ERR',
        } as PopUpMessageInfo,
        eventSeq: 0,
      });
      customerSysConfig.shiftHost = 'true';
    } else if (key === '*#devtools*#') {
      if (this.systemApi.isElectron()) {
        window.electronLib.windowManage.toggleDevTools();
      }
    } else if (key === '*#raiseException*#') {
      this.eventApi.sendSysEvent({
        eventName: 'error',
        eventLevel: 'error',
        eventStrData: '',
        eventData: {
          popupType: 'toast',
          popupLevel: 'info',
          title: '自动产生错误',
          code: 'PARAM.ERR',
        } as PopUpMessageInfo,
        eventSeq: 0,
      });
      this.errReporter.doReportMessage(new Error('error on purpose' + Math.random()));
      throw new Error('error on purpose');
    } else if (key === '*#popClose*#') {
      MailContentHandler.debugMailPopWindow = false;
      this.eventApi.sendSysEvent({
        eventName: 'error',
        eventLevel: 'error',
        eventStrData: '',
        eventData: {
          popupType: 'toast',
          popupLevel: 'info',
          title: '关闭弹窗调试',
          code: 'PARAM.ERR',
        } as PopUpMessageInfo,
        eventSeq: 0,
      });
    } else if (key === '*#popOpen*#') {
      MailContentHandler.debugMailPopWindow = true;
      this.eventApi.sendSysEvent({
        eventName: 'error',
        eventLevel: 'error',
        eventStrData: '',
        eventData: {
          popupType: 'toast',
          popupLevel: 'info',
          title: '开启弹窗调试',
          code: 'PARAM.ERR',
        } as PopUpMessageInfo,
        eventSeq: 0,
      });
    } else if (key === '*#mailCacheEnable*#') {
      this.setDbEnable(true);
      this.eventApi.sendSysEvent({
        eventName: 'error',
        eventLevel: 'error',
        eventStrData: '',
        eventData: {
          popupType: 'toast',
          popupLevel: 'info',
          title: '开启邮件本地存储',
          code: 'PARAM.ERR',
        } as PopUpMessageInfo,
        eventSeq: 0,
      });
    } else if (key === '*#mailCacheDisable*#') {
      this.setDbEnable(false);
      this.eventApi.sendSysEvent({
        eventName: 'error',
        eventLevel: 'error',
        eventStrData: '',
        eventData: {
          popupType: 'toast',
          popupLevel: 'info',
          title: '关闭邮件本地存储',
          code: 'PARAM.ERR',
        } as PopUpMessageInfo,
        eventSeq: 0,
      });
    } else if (key === '*#net*#') {
      if (typeof window.electronLib !== 'undefined' && window.electronLib.appManage) {
        const path = (config('host') || '') as string;
        const host = new URL(path).hostname;
        window.electronLib.appManage.getNetState(host).then((res: any[]) => {
          const post = {
            host,
            electron_online: navigator.onLine,
            dns_lookup_v4: res[0],
            dns_lookup_v6: res[1],
            dns_resolveAny: res[2],
            traceroute: res[3],
          };
          this.eventApi.sendSysEvent({
            eventName: 'error',
            eventLevel: 'error',
            eventStrData: '',
            eventData: {
              popupType: 'window',
              popupLevel: 'info',
              title: '网络监测',
              content: JSON.stringify(post),
              code: 'PARAM.ERR',
            } as PopUpMessageInfo,
            eventSeq: 0,
          });
        });
      }
    } else if (key === '*#cleanDb*#') {
      this.eventApi.sendSysEvent({
        eventName: 'error',
        eventLevel: 'error',
        eventStrData: '',
        eventData: {
          popupType: 'toast',
          popupLevel: 'info',
          title: '清理数据库',
          code: 'PARAM.ERR',
        } as PopUpMessageInfo,
        eventSeq: 0,
      });
      if (this.systemApi.isElectron() && window.electronLib) {
        window.electronLib.windowManage.clearLocalData('indexdb').then(() => {
          this.eventApi.sendSysEvent({
            eventName: 'error',
            eventLevel: 'error',
            eventStrData: '',
            eventData: {
              popupType: 'toast',
              popupLevel: 'info',
              title: '清理数据库成功',
              code: 'PARAM.ERR',
            } as PopUpMessageInfo,
            eventSeq: 0,
          });
        });
        window.electronLib.windowManage.clearLocalData('localstorage').then(() => {
          this.eventApi.sendSysEvent({
            eventName: 'error',
            eventLevel: 'error',
            eventStrData: '',
            eventData: {
              popupType: 'toast',
              popupLevel: 'info',
              title: '清理本地数据完成',
              code: 'PARAM.ERR',
            } as PopUpMessageInfo,
            eventSeq: 0,
          });
        });
        this.eventApi.sendSimpleSysEvent('logout');
      }
    } else if (key === '*#settings*#') {
      if (this.systemApi.isElectron() && window.electronLib) {
        window.electronLib.windowManage
          .createWindow({
            type: 'customer',
            url: 'https://mailhz.qiye.163.com/js6/main.jsp?sid=' + this.systemApi.getCurrentUser()?.sessionId + '&hl=zh_CN#module=options.BaseSetModule%7C%7B%7D',
            setMainWindowCookie: true,
          })
          .then((win: any) => {
            window.electronLib.windowManage.show(win.winId);
          });
      }
      // electronLib.windowManage.toggleDevTools(win.winId);
    } else if (key === '*#schedulePort*#') {
      if (this.systemApi.isElectron() && window.electronLib) {
        window.electronLib.windowManage
          .createWindow({
            type: 'customer',
            url:
              'https://mailhz.qiye.163.com/static/schedulemanager/index.html?sid=' +
              this.systemApi.getCurrentUser()?.sessionId +
              '&hl=zh_CN&ver=js6#/lingxi/calender/port',
            setMainWindowCookie: true,
          })
          .then((win: any) => {
            window.electronLib.windowManage.show(win.winId);
          });
      }
      // electronLib.windowManage.toggleDevTools(win.winId);
    } else if (key === '*#scheduleNew*#') {
      if (this.systemApi.isElectron() && window.electronLib) {
        window.electronLib.windowManage
          .createWindow({
            type: 'customer',
            url:
              'https://mailhz.qiye.163.com/static/schedulemanager/index.html?sid=' +
              this.systemApi.getCurrentUser()?.sessionId +
              '&hl=zh_CN&ver=js6#/lingxicalender/create',
            setMainWindowCookie: true,
          })
          .then((win: any) => {
            window.electronLib.windowManage.show(win.winId);
          });
      }
      // electronLib.windowManage.toggleDevTools(win.winId);
    } else if (key === '*#disableInterval*#') {
      this.eventApi.sendSysEvent({
        eventName: 'error',
        eventLevel: 'error',
        eventStrData: '',
        eventData: {
          popupType: 'toast',
          popupLevel: 'info',
          title: '关闭定时事件',
          code: 'PARAM.ERR',
        } as PopUpMessageInfo,
        eventSeq: 0,
      });
      this.systemApi.cancelEvent('long', '', true);
    } else if (key === '*#enableInterval*#') {
      this.eventApi.sendSysEvent({
        eventName: 'error',
        eventLevel: 'error',
        eventStrData: '',
        eventData: {
          popupType: 'toast',
          popupLevel: 'info',
          title: '关闭定时事件',
          code: 'PARAM.ERR',
        } as PopUpMessageInfo,
        eventSeq: 0,
      });
      this.systemApi.cancelEvent('long', '', false);
    } else if (key.startsWith('*#logToken:') && key.endsWith('*#')) {
      const appKey = key.replace('*#logToken:', '').replace('*#', '');
      this.dataTrakerApi.setToken(appKey);
      this.eventApi.sendSysEvent({
        eventName: 'error',
        eventLevel: 'error',
        eventStrData: '',
        eventData: {
          popupType: 'toast',
          popupLevel: 'info',
          title: '设置token 成功',
          code: 'PARAM.ERR',
        } as PopUpMessageInfo,
        eventSeq: 0,
      });
      // 想所有页面设置token
      this.eventApi.sendSysEvent({
        eventName: 'setDATrackerToken',
        eventData: {
          token: appKey,
        },
      });
      this.systemApi.cancelEvent('long', '', false);
    }
  }

  private buildSearchEntryReqKey(req: queryMailBoxParam) {
    let ret = `${req.status || ''}_${req.ids?.join(',') || ''}_${req.id || ''}`;
    if (req?.filterCond) {
      const filterCond = req?.filterCond as any[];
      const fromFilterCond = filterCond.find(f => f && f.field === 'from'); // 发信人过滤器
      const sentDateFilterCond = filterCond.find(f => f && f.field === 'sentDate'); // 日期过滤
      const attachedFilterCond = filterCond.find(f => f && f.field === 'flags' && f.operand && f.operand.attached !== undefined); // 有无附件过滤
      const readFilterCond = filterCond.find(f => f && f.field === 'flags' && f.operand && f.operand.read !== undefined); // 已读未读过滤
      const attachedOperand = attachedFilterCond ? JSON.stringify(attachedFilterCond.operand) : '';
      const readOperand = readFilterCond ? JSON.stringify(readFilterCond.operand) : '';
      // 逐个添加保证顺序
      if (fromFilterCond) {
        ret = `${ret}_${fromFilterCond.field || ''}_${fromFilterCond?.operator || ''}_${fromFilterCond.operand || ''}`;
      }
      if (sentDateFilterCond) {
        ret = `${ret}_${sentDateFilterCond.field || ''}_${sentDateFilterCond?.operator || ''}_${sentDateFilterCond.operand || ''}`;
      }
      if (attachedFilterCond) {
        ret = `${ret}_${attachedFilterCond.field || ''}_${attachedFilterCond?.operator || ''}_${attachedOperand || ''}`;
      }
      if (readFilterCond) {
        ret = `${ret}_${readFilterCond.field || ''}_${readFilterCond?.operator || ''}_${readOperand || ''}`;
      }
    }
    return ret;
  }

  private buildSearchEntryReq(key: string, param: queryMailBoxParam): RequestSearch {
    // const windowSize = param.count * 10 > 1500 ? 1500 : param.count * 10;
    let ftsFiles = MailAbstractHandler.searchFields;
    if (param.searchType === 'title') {
      ftsFiles = 'subj';
    } else if (param.searchType === 'sender') {
      ftsFiles = 'from';
    } else if (param.searchType === 'receiver') {
      ftsFiles = 'to';
    } else if (param.searchType === 'attachment') {
      ftsFiles = 'aname';
    }
    const cond = Array.isArray(param.filterCond) ? param.filterCond : param.filterCond ? [param.filterCond] : [];
    const target: RequestSearch = {
      'fts.ext': true,
      'fts.fields': ftsFiles,
      conditions: cond,
      groupings: {
        fid: '',
        'flags.read': '',
        sentDate: '',
        'flags.attached': '',
        fromAddress: '',
      },
      order: 'date',
      operator: 'and',
      desc: true,
      start: param.index || 0,
      windowSize: param.count,
      // start: param.index,
      pattern: key,
      limit: 3000,
      summaryWindowSize: param.count,
      returnAttachments: true,
      returnTotal: true,
      returnTag: true,
      tag: param.tag,
    };
    let fids: Array<number> = [];
    if (param.ids && param.ids.length > 0) {
      fids = param.ids.filter(it => it > 0);
    } else if (param.id && param.id > 0) {
      fids = [param.id as number];
    }
    // const isCorpMail = this.systemApi.getIsCorpMailMode();
    // if (isCorpMail) {
    //   // corpMail使用fid
    //   target.fid = fids;
    // } else {
    target.fids = fids;
    // }
    if (param.status) {
      switch (param.status) {
        case 'spam':
          break;
        case 'redFlag':
          target.conditions.push({
            field: 'label0',
            operator: '=',
            operand: 1,
          });
          break;
        case 'read':
          target.conditions.push({
            field: 'flags',
            operator: '=',
            operand: { read: true },
          });
          break;
        case 'unread':
          target.conditions.push({
            field: 'flags',
            operator: '=',
            operand: { read: false },
          });
          break;
        default:
          break;
      }
    }
    return target;
  }

  statKeyMap: StringTypedMap<StatLabelConf> = {
    'flags.read': {
      label: '阅读状态',
      valueMapping: (key: string) => {
        if (key === 'true') {
          return {
            valueLabel: '已读',
            cond: {
              field: 'flags',
              operator: '=',
              operand: { read: true },
            },
          };
        }
        return {
          valueLabel: '未读',
          cond: {
            field: 'flags',
            operator: '=',
            operand: { read: false },
          },
        };
      },
    },
    sentDate: {
      label: '时间范围',
      valueMapping: (key: string) => {
        // const number = util.parseDate(key);
        if (key) {
          // 此处只需要精确到天即可
          const dt = moment(key);
          // const span = Date.now() - dt.getTime();
          if (dt.isSameOrAfter(moment().clone().subtract(2, 'day'), 'day')) {
            return {
              valueLabel: '三天内',
              cond: {
                field: 'sentDate',
                operator: 'in_range',
                operand: key + ':',
              },
            };
          }
          if (dt.isSameOrAfter(moment().clone().subtract(6, 'day'), 'day')) {
            return {
              valueLabel: '一周内',
              cond: {
                field: 'sentDate',
                operator: 'in_range',
                operand: key + ':',
              },
            };
          }
          if (dt.isSameOrAfter(moment().clone().subtract(29, 'day'), 'day')) {
            return {
              valueLabel: '一月内',
              cond: {
                field: 'sentDate',
                operator: 'in_range',
                operand: key + ':',
              },
            };
          }
          if (dt.isSameOrAfter(moment().clone().subtract(89, 'day'), 'day')) {
            return {
              valueLabel: '三月内',
              cond: {
                field: 'sentDate',
                operator: 'in_range',
                operand: key + ':',
              },
            };
          }
          if (dt.isBefore(moment().clone().subtract(89, 'day'), 'day')) {
            return {
              valueLabel: '三月前',
              cond: {
                field: 'sentDate',
                operator: 'in_range',
                operand: ':' + key,
              },
            };
          }
        }
        return undefined;
      },
    },
    'flags.attached': {
      label: '有无附件',
      valueMapping: (key: string) => {
        if (key === 'true') {
          return {
            valueLabel: '有附件',
            cond: {
              field: 'flags',
              operator: '=',
              operand: { attached: true },
            },
          };
        }
        return {
          valueLabel: '无附件',
          cond: {
            field: 'flags',
            operator: '=',
            operand: { attached: false },
          },
        };
      },
    },
    fromAddress: {
      label: '发件人',
      valueMapping: (key: string) => {
        const item = this.contactHandler.parseContactStr(key, '');
        const parsedInfo = item.parsed[0];
        return {
          valueLabel: (parsedInfo && parsedInfo.name) || '',
          cond: {
            field: 'from',
            operand: (parsedInfo && parsedInfo.email) || key,
            operator: 'contains',
            ignoreCase: true,
          },
        };
      },
    },
  };

  private handleStatResult(gp: ResponseGroupResult): Promise<MailStatResult> {
    const ret: MailStatResult = {};
    const groupings = gp && Object.keys(gp).length ? gp : {};
    Object.keys(groupings).forEach((it: string) => {
      const item = {
        items: {},
        name: '',
      } as StatResult;
      const confItem = this.statKeyMap[it];
      if (confItem) {
        item.name = confItem.label;
        const result = groupings[it as ResponseGpKey];
        result?.forEach(gpItem => {
          const key = it === 'sentDate' ? moment(gpItem.val as string).format('YYYY-MM-DD') : String(gpItem.val);
          const val = confItem.valueMapping(key);
          if (val) {
            item.items[key] = {
              label: it === 'fromAddress' ? gpItem.nickName || val.valueLabel : val.valueLabel,
              key,
              value: gpItem.cnt,
              filterCond: val.cond,
            };
            // 添加拼音首字母
            if (it === 'fromAddress') {
              item.items[key] = {
                ...item.items[key],
                contactLabel: gpItem.contactLabel,
              };
            }
          }
        });
        // 如果是sentDate。结果需要根据valueLabel，合并一下
        if (it === 'sentDate') {
          item.items = this.asignSentDateByLabel(item.items);
        }
        // 如果是发信人，则处理一下key值
        if (it === 'fromAddress') {
          item.items = this.handleKeyFromAddress(item.items);
        }
        ret[it as MailStatType] = item;
      }
    });
    return Promise.resolve(ret);
  }

  // 服务端搜索，groupings中的sentDate。结果需要根据valueLabel，合并一下
  private asignSentDateByLabel(obj: Record<string, StatResultItem>): Record<string, StatResultItem> {
    const labelObj: Record<string, StatResultItem> = {};
    const resultObj: Record<string, StatResultItem> = {};
    if (isObject(obj)) {
      Object.values(obj).forEach(k => {
        const label = k.label as string;
        if (labelObj[label]) {
          const oldKey = +moment(labelObj[label].key);
          const newKey = +moment(k.key);
          // 日期key值也需要更新为最小的
          labelObj[label] = {
            ...labelObj[label],
            // value: labelObj[label].value + k.value,
            value: oldKey > newKey ? k.value : labelObj[label].value,
            key: oldKey > newKey ? k.key : labelObj[label].key,
            filterCond: oldKey > newKey ? k.filterCond : labelObj[label].filterCond,
          };
        } else {
          labelObj[label] = { ...k };
        }
      });
      Object.values(labelObj).forEach(k => {
        resultObj[k.key] = k;
      });
      return resultObj;
    }
    return obj;
  }

  // 发信人，处理key值兼容
  private handleKeyFromAddress(obj: Record<string, StatResultItem>): Record<string, StatResultItem> {
    if (isObject(obj)) {
      const resultObj: Record<string, StatResultItem> = {};
      Object.values(obj).forEach(k => {
        const key = k.filterCond.operand as string;
        // 如果key值重复了，则合并且val相加
        if (resultObj[key]) {
          resultObj[key] = {
            ...resultObj[key],
            ...k,
            key,
            value: resultObj[key].value + k.value,
          };
        } else {
          resultObj[key] = {
            ...k,
            key,
          };
        }
      });
      return resultObj;
    }
    return obj;
  }

  // 服务端搜索返回的grupings是全量的，需要根据筛选条件过滤一下
  // 此处的过滤逻辑去掉，仅仅留下sentdate包含逻辑
  private filterGrouping(
    gp: ResponseGroupResult
    // param: queryMailBoxParam
  ): ResponseGroupResult {
    if (!gp || Object.keys(gp).length === 0) {
      return gp;
    }
    const groupings = { ...gp };
    // if (param.id !== undefined) {
    //   groupings.fid = groupings.fid?.filter((c) => +c.val === param.id);
    // }
    // 先处理一下sentDate的包含关系
    if (groupings.sentDate && groupings.sentDate.length) {
      const len = groupings.sentDate.length;
      // 服务端返回的sentDate没有包含关系，需要客户端自己处理下
      let sentDateValue = 0;
      groupings.sentDate = groupings.sentDate?.map((c, idx) => {
        if (idx < len - 1) {
          sentDateValue += c.cnt;
          c.cnt = sentDateValue;
        }
        return c;
      });
    }
    // const filterCond = param.filterCond as any[];
    // if (filterCond && filterCond.length) {
    //   const fromFilterCond = filterCond.find((f) => f && f.field === 'from'); // 发信人过滤器
    //   const sentDateFilterCond = filterCond.find(
    //     (f) => f && f.field === 'sentDate'
    //   ); // 日期过滤
    //   const attachedFilterCond = filterCond.find(
    //     (f) =>
    //       f &&
    //       f.field === 'flags' &&
    //       f.operand &&
    //       f.operand.attached !== undefined
    //   ); // 有无附件过滤
    //   const readFilterCond = filterCond.find(
    //     (f) =>
    //       f && f.field === 'flags' && f.operand && f.operand.read !== undefined
    //   ); // 已读未读过滤
    //   if (fromFilterCond && fromFilterCond.operand) {
    //     groupings.fromAddress = groupings.fromAddress?.filter((c) =>
    //       c.val.toString().includes(fromFilterCond.operand)
    //     );
    //   }
    //   if (sentDateFilterCond && sentDateFilterCond.operand) {
    //     const m = moment(sentDateFilterCond.operand.replace(':', '').trim());
    //     groupings.sentDate = groupings.sentDate?.filter((c) =>
    //       moment(c.val as string).isSameOrAfter(m)
    //     );
    //   }
    //   if (attachedFilterCond) {
    //     groupings['flags.attached'] = groupings['flags.attached']?.map((c) => {
    //       if (c.val === attachedFilterCond.operand.attached) {
    //         return c;
    //       }
    //       c.cnt = 0;
    //       return c;
    //     });
    //   }
    //   if (readFilterCond) {
    //     groupings['flags.read'] = groupings['flags.read']?.map((c) => {
    //       if (c.val === readFilterCond.operand.read) {
    //         return c;
    //       }
    //       c.cnt = 0;
    //       return c;
    //     });
    //   }
    // }
    return groupings as ResponseGroupResult;
  }

  private storeSearchStat(re: MailStatResult, reqKey: string, srId: number, _account?: string) {
    console.log('store search result ', reqKey, re, srId);
    const targetActions = this.mailApi.getActions({
      actions: this.actions,
      subActions: this.subActions,
      _account,
    })?.val;
    if (!targetActions) return;
    targetActions.searchStatCache[srId] = targetActions.searchStatCache[srId] || {};
    targetActions.searchStatCache[srId][reqKey] = re;
  }
}
