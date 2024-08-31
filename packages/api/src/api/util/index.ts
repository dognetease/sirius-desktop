import { MD5 } from 'crypto-js';
import pinyin from 'tiny-pinyin';
import debounce from 'lodash/debounce';
import type { DebounceSettings } from 'lodash';
import cloneDeep from 'lodash/cloneDeep';
// import { config } from 'env_def';
import lodashGet from 'lodash/get';
import lodashOrderBy from 'lodash/orderBy';
import moment from 'moment';
import { CatchErrorRes, identityObject, resultObject } from '../_base/api';
import { diffRes, UtilHitQueryConfig, UtilHitQueryConfigItem } from '../logical/contactAndOrg';
import { DateTime } from '../logical/catalog';
import { TimeRange } from './data';
import { StringTypedMap } from '@/api/commonModel';
import { locationHelper } from '@/api/util/location_helper';
import { orderCompareParams, orderParams } from '@/api/data/new_db';
import { inWindow, isElectron } from '@/config';
import { MailBoxModel, MailFileAttachModel } from '../logical/mail';

// import { conf } from '@/common';
// import {TimeRange} from "web/src/components/Layout/Schedule/components/TimeLinePicker/data";
const numberRegexp = /-?[0-9]+/i;
const datePattern = /[0-9]{4}-[0-9]{1,2}-[0-9]{1,2}\s+[0-9]{1,2}:[0-9]{1,2}:?([0-9]{1,2}(\.[0-9]{0,3})?)?/i;
const colors = ['#6557FF', '#00CCAA', '#FE6C5E', '#00C4D6', '#A259FF', '#4C6AFF'];
export const isSupportNativeProxy = !!(typeof Proxy !== 'undefined' && Proxy.toString().includes('[native code]'));

export const personalRegexp = /^(bj|hz)/;
export const util = {
  compareArray<T = any>(a1: T[], a2: T[], sort: boolean) {
    if (a1 && a2) {
      if (a1.length === a2.length) {
        if (sort) {
          // eslint-disable-next-line no-restricted-syntax
          for (const it in a1) {
            if (Object.prototype.hasOwnProperty.apply(a1, [it]) && a1[it] !== a2[it]) {
              return false;
            }
          }
          return true;
        }
        const set: Set<any> = new Set();
        /* for (const it of a1) */
        a1.forEach(it => {
          set.add(it);
        });
        /* for (const it of a2) */
        return !a2.some(it => !set.has(it));
      }
    }
    return false;
  },

  isArrayDifferent(arrayA?: Array<string | number>, arrayB?: Array<string | number>) {
    // 该判断条件有缺陷，会导致邮件标签在初始值为空的情况下进入无法恢复的对比错误中
    // if (!arrayB || arrayB.length === 0) {
    //   return false;
    // }

    const setA = Array.isArray(arrayA) ? new Set(arrayA) : new Set([]);
    const setB = Array.isArray(arrayB) ? new Set(arrayB) : new Set([]);

    if (setA.size === 0 && setB.size === 0) {
      return false;
    }
    if (setA.size !== setB.size) {
      return true;
    }
    // eslint-disable-next-line no-restricted-syntax
    for (const itemA of setA) {
      if (!setB.has(itemA)) {
        return true;
      }
      setB.delete(itemA);
    }
    return setB.size > 0;
  },

  // arrayA 包含 arrayB
  isArrayInclude(arrayA?: Array<string | number>, arrayB?: Array<string | number>) {
    const setA = Array.isArray(arrayA) ? new Set(arrayA) : new Set([]);
    const setB = Array.isArray(arrayB) ? new Set(arrayB) : new Set([]);

    if (setA.size < setB.size) {
      return false;
    }

    // eslint-disable-next-line no-restricted-syntax
    for (const itemB of setB) {
      if (!setA.has(itemB)) {
        return false;
      }
      setA.delete(itemB);
    }
    return setA.size >= 0;
  },

  // 根据 fid 拼接本地用的 threadId
  getJointThreadId(threadId: string | undefined, fid: number) {
    if (!threadId) {
      return '';
    }
    // 注意：这个拼接方式会在读取时被用到，所以不要改动中间的连接符--
    return `${threadId}--${fid}`;
  },

  // outlook 生成的压缩附件 winmail.dat
  isWinMailAttachment(it: MailFileAttachModel) {
    return it.contentType === 'application/ms-tnef' && it.fileName === 'winmail.dat';
  },

  // 聚合邮件与原生id 是纯数字，前端构造的聚合邮件 fakeId是出数字拼接 1--456,
  isThreadMailById(id: string) {
    if (+id) {
      return true;
    }
    const splitIds = id.split('--');
    if (splitIds.length <= 1) {
      return false;
    }
    return splitIds.every(v => +v);
  },

  //  根据拼接的 fakeId 获取真实 ID
  getReadThreadId(id: string) {
    const splitIds = id.split('--');
    if (splitIds.length <= 1) {
      return splitIds[0];
    }
    return splitIds[1];
  },

  isArrayContains(arrayA?: Array<string | number>, arrayB?: Array<string | number>) {
    if (!Array.isArray(arrayA)) {
      return false;
    }

    if (!Array.isArray(arrayB) || arrayB.length === 0) {
      return true;
    }
    const setA = new Set(arrayA);
    const setB = new Set(arrayB);

    if (setA.size < setB.size) {
      return false;
    }

    // eslint-disable-next-line no-restricted-syntax
    for (const itemB of setB) {
      if (!setA.has(itemB)) {
        return false;
      }
    }
    return true;
  },

  /**
   * @deprecated:1.20版本之后废弃 使用lodash自带的orderBy排序
   * @param params
   * @returns
   */
  orderCompare(params: orderCompareParams): number {
    const { a, b, query, orderBy } = params;
    let idx = params.idx || 0;
    const prop = orderBy[idx];
    const desc = typeof prop === 'string' ? true : prop[1];
    const item = typeof prop === 'string' ? a[prop] : a[prop[0]];
    const item2 = typeof prop === 'string' ? b[prop] : b[prop[0]];
    if (item === undefined || item === null || item2 === undefined || item2 === null) {
      // console.error('[contact] orderCompare error', a, b, prop, query);
      return 0;
    }
    if (query && item && item2) {
      try {
        const index = item.toString().indexOf(query);
        const index2 = item2.toString().indexOf(query);
        if (index === -1 || index2 === -1) {
          return 0;
        }
        if (index < index2) {
          return desc ? -1 : 1;
        }
        if (index2 < index) {
          return desc ? 1 : -1;
        }
      } catch (e) {
        console.warn('[contact] orderCompare', item, query);
        console.warn(e);
      }
    }
    let res;
    if (typeof item === 'number' && typeof item2 === 'number') {
      res = item - item2;
    } else if (typeof item === 'string' || typeof item2 === 'string') {
      res = item.toString().localeCompare(item2.toString(), 'zh');
    }
    if (res === 0) {
      idx += 1;
      if (idx < orderBy.length) {
        return this.orderCompare({
          a,
          b,
          query,
          idx,
          orderBy,
        });
      }
    }
    return desc ? res : -res;
  },

  addHitQueryList<T extends resultObject>(config: UtilHitQueryConfig<T>): Array<T> {
    const { data, queryList, hitList } = config;
    const result: T[] = [];
    data.forEach(item => {
      const newItem = this.addHitQuery({ data: item, queryList, hitList });
      result.push(newItem as T);
    });
    return result;
  },
  addHitQuery<T extends resultObject>(config: UtilHitQueryConfigItem<T>): T {
    const { data: item, queryList, hitList } = config;
    const newItem: resultObject = cloneDeep(item);
    hitList.forEach(hit => {
      if (Array.isArray(hit)) {
        const hitName = hit[1];
        const obj = newItem[hit[0]];
        const value = obj[hitName];
        const hitQuery: string[] = obj.hitQuery || [];
        const isHit = queryList.some(query => value?.toLowerCase().includes(query?.toLowerCase()));
        if (isHit) {
          hitQuery.push(hitName);
          obj.hitQuery = hitQuery;
          newItem[hit[0]] = obj;
        }
      } else {
        const hitQuery: string[] = newItem.hitQuery || [];
        const value: string = item[hit];
        const isHit = queryList.some(query => value?.toLowerCase().includes(query?.toLowerCase()));
        if (isHit) {
          hitQuery.push(hit);
          newItem.hitQuery = hitQuery;
        }
      }
    });
    return newItem as T;
  },
  setDataOrder<T>(params: orderParams<T>): T[] {
    const { orderBy, data, query } = params;
    if (!Array.isArray(data) || !data.length || !Array.isArray(orderBy) || !orderBy.length) {
      return data;
    }

    const iteratees: (string | ((params: T) => number))[] = [];
    const orders: ('asc' | 'desc')[] = [];

    orderBy.forEach(orderItem => {
      const orderItemArr = (Array.isArray(orderItem) ? orderItem : [orderItem, true]) as [string, boolean];
      if (orderItemArr.length < 2) {
        return;
      }
      const [field, isAsc = false] = orderItemArr;
      if (typeof query === 'string' && query.length) {
        iteratees.push(o => {
          const str = lodashGet(o, field, '');

          return typeof str === 'string' && str.includes(query) ? str.indexOf(query) : Infinity;
        });
      } else {
        iteratees.push(field);
      }
      orders.push(isAsc ? 'asc' : 'desc');
    });
    return lodashOrderBy(data, iteratees, orders);
  },
  /**
   *  将list 切成以len长度为一组的数组
   * @param items 数据源
   * @param len（len默认1000）
   */
  sliceList<T = string>(items: T[], len = 1000): T[][] {
    const itemParams: T[][] = [];
    for (let i = 0; i * len < items.length; i += 1) {
      itemParams.push(items.slice(i * len, i * len + len));
    }
    return itemParams;
  },
  reload() {
    if (util.isElectron()) {
      window.electronLib.windowManage.reload();
    } else {
      window.location.reload();
    }
  },
  isElectron(): boolean {
    return isElectron();
  },
  isNumber(input: string): boolean {
    return !!input && String(input).length > 0 && numberRegexp.test(String(input));
  },
  /**
   * 转义正则表达式
   * @param str
   */
  escapeRegex(str: string): string {
    /**
     * https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Guide/Regular_Expressions/Assertions
     * 有些浏览器不支持正则表达式 断言。出现下面的错误提示：
     * syntaxerror invalid regular expression invalid group specifier name
     *
     * 直接使用字面量 写法，无法通过js引擎分析。所以改成 构造函数写法。
     */
    try {
      const regString = '(?<!=[\\/]+)[-\\/\\\\^$*+?.()|\\[\\]{}]';
      const regexEscapePattern = new RegExp(regString, 'g');
      // const regexEscapePattern = /(?<!=[\/]+)[-\/\\^$*+?.()|\[\]{}]/g;
      return str.replace(regexEscapePattern, '\\$&');
    } catch (error) {
      return str;
    }
  },
  regexEqual(x: any, y: any): boolean {
    return x instanceof RegExp && y instanceof RegExp && x.source === y.source && x.global === y.global && x.ignoreCase === y.ignoreCase && x.multiline === y.multiline;
  },
  /**
   * 工具函数:生成关联的唯一值通过（_）分割,超过3个参数生成md5值
   * @param arg: 传入的参数，分割
   * */
  getUnique(...arg: any[]): string {
    let str = '';
    str = Array.prototype.slice.apply(arg).reduce((pre, cur) => pre + '_' + cur, str);
    str = str.substring(1);
    if (arg.length > 2) {
      str = this.md5(str);
    }
    return str;
  },
  /**
   * 工具函数:把输入的字符串转成md5值
   * @param content: 传入的字符串
   * */
  md5(content: string): string {
    return MD5(content).toString();
  },
  /**
   * 工具函数：把单个数据类型变成数据类型列表
   * @param key 查询条件
   */
  singleToList<T = any>(key: T | T[]): T[] {
    let list: T[];
    if (Array.isArray(key)) {
      list = key;
    } else {
      list = [key];
    }
    return list;
  },
  /**
   * 工具函数：把一个对象型数组通过对象的某个属性分类成 以属性对应的属性值为属性的对象
   * @param list 需要转化的数组
   * @param key 分类依据的对象某属性
   */
  listToMapValueList<T = resultObject>(list: Array<T>, key: keyof T): identityObject<T[]> {
    if (!list || list.length === 0) {
      return {};
    }
    return list.reduce((o, item) => {
      if (item && item[key]) {
        const key2 = item[key] as unknown as string;
        const value: T[] = o[key2] || [];
        value.push(item);
        o[key2] = value;
      }
      return o;
    }, {} as identityObject<T[]>);
  },
  /**
   * 工具函数：把一个对象型数组通过对象的某个属性分类成 以属性对应的属性值为属性的对象
   * @param list 需要转化的数组
   * @param key 分类依据的对象某属性
   */
  listToMap<T = resultObject>(list: Array<T>, key: keyof T): identityObject<T> {
    if (!list || list.length === 0) {
      return {};
    }
    return list.reduce((o, item) => {
      if (item && item[key]) {
        const key2 = item[key] as unknown as string;
        o[key2] = item;
      }
      return o;
    }, {} as identityObject<T>);
  },
  /**
   * 获取两个数组的差值
   * @param oldList
   * @param newList
   */
  getDiff<T = any>(oldList: Array<T>, newList: Array<T>): Required<diffRes<T>> {
    const updateDiff = oldList.filter(item => newList.includes(item));
    const deleteDiff = oldList.filter(item => !updateDiff.includes(item));
    const insertDiff = newList.filter(item => !updateDiff.includes(item));
    return {
      deleteDiff,
      insertDiff,
      updateDiff,
    };
  },
  getDiffNew<T = any>(oldList: Array<T>, newList: Array<T>): Required<diffRes<T> & { updateDiff: Array<T> }> {
    const updateSet = new Set<T>();
    const insertSet = new Set<T>();
    const deleteSet = new Set<T>();
    oldList.forEach(item => {
      newList.forEach(newItem => {
        if (!updateSet.has(newItem)) {
          if (newItem === item) {
            updateSet.add(item);
            insertSet.delete(newItem);
          } else {
            insertSet.add(newItem);
          }
        }
      });
      if (!updateSet.has(item)) {
        deleteSet.add(item);
      }
    });
    return {
      deleteDiff: [...deleteSet],
      insertDiff: [...insertSet],
      updateDiff: [...updateSet],
    };
  },
  /**
   * 工具函数：把一个对象型数组通过对象的属性分类
   * @param list:需要转化的数组
   * @param objectKey：分类得到对象的属性名
   * @param listKey：分类得到数组的属性名
   * @return listKeyMap:通过listKey分类得到的对象
   * @return listKeyArray:通过listKey分类得到的数组
   * @return objectKeyMap：通过objectKey分类得到的对象
   * @return objectKeyArray:通过objectKey分类得到的数组
   */
  getGroupListByItem(list: resultObject[], objectKey: string, listKey: string) {
    return list.reduce(
      (obj, item) => {
        const { listKeyMap, listKeyArray, objectKeyMap, objectKeyArray } = obj;
        const listKeyItem = item[listKey];
        const objectKeyItem = item[objectKey];
        if (!listKeyMap[listKeyItem]) {
          listKeyArray.push(listKeyItem);
          listKeyMap[listKeyItem] = [];
        }
        listKeyMap[listKeyItem].push(item);
        if (!objectKeyMap[objectKeyItem]) {
          objectKeyArray.push(objectKeyItem);
          objectKeyMap[objectKeyItem] = [];
        }
        objectKeyMap[objectKeyItem].push(item);
        return {
          listKeyMap,
          listKeyArray,
          objectKeyArray,
          objectKeyMap,
        };
      },
      {
        listKeyMap: {},
        listKeyArray: [],
        objectKeyMap: {},
        objectKeyArray: [],
      }
    );
  },
  getKeyListByList<T = any>(list: resultObject[], key: string, unique?: boolean): Array<T> {
    let idList: any[] = [];
    if (!key) {
      throw new Error('key is illegal');
    }
    list.forEach(item => {
      if (item && item[key]) {
        idList.push(item[key]);
      }
    });
    if (unique) {
      idList = Array.from(new Set(idList));
    }
    return idList as Array<T>;
  },
  /**
   * 转化string为拼音
   * @param str 要转化的字符串
   */
  toPinyin(str: string) {
    try {
      return pinyin.convertToPinyin(str, '', true);
    } catch (e) {
      console.warn(e);
      return str;
    }
  },
  getContactLabel(name: string): string {
    let contactLabel = name ? name.charAt(0).toLocaleUpperCase() : '';
    if (/[^A-Z]/.test(contactLabel)) {
      contactLabel = '|';
    }
    return contactLabel;
  },
  getContactPYLabel(name: string): string {
    if (name === undefined) {
      return '';
    }
    const pinyinName = name.split('').map((item: string) => this.toPinyin(item));
    const res = pinyinName.reduce((pre: string, cur: string) => {
      pre += cur.charAt(0).toLocaleLowerCase();
      return pre;
    }, '');
    return res;
  },
  getTime(time: DateTime) {
    // if(!time)time=new Date();
    const str = `${time.y}/${time.m}/${time.d} ${time.hr}:${time.min}:${time.sec}`;
    return new Date(str).getTime();
  },

  getTimeByGMT(time: DateTime, gmt: string) {
    // if(!time)time=new Date();
    const str = `${time.y}/${time.m}/${time.d} ${time.hr}:${time.min}:${time.sec} ${gmt}`;
    return new Date(str).getTime();
  },

  getDateTime(data: Date | number): DateTime {
    const date = typeof data === 'number' ? new Date(data) : data;
    return {
      y: date.getFullYear(),
      m: date.getMonth() + 1,
      d: date.getDate(),
      hr: date.getHours(),
      min: date.getMinutes(),
      sec: date.getSeconds(),
    };
  },
  parseDate(prevTime: string | undefined) {
    try {
      if (prevTime && datePattern.test(prevTime)) {
        return Date.parse(prevTime.trim().split(' ').join('T') + '+08:00');
      }
      return undefined;
    } catch (error) {
      console.log('parseDate error', error);
      return undefined;
    }
  },

  dateFormat(time?: Date | number, fmt?: string): string {
    time = time || new Date();
    fmt = fmt || 'yyyy-MM-dd hh:mm:ss';
    const date = typeof time === 'number' ? new Date(time) : time;
    const o = {
      'M+': date.getMonth() + 1, // 月份
      'd+': date.getDate(), // 日
      'h+': date.getHours(), // 小时
      'm+': date.getMinutes(), // 分
      's+': date.getSeconds(), // 秒
      'q+': Math.floor((date.getMonth() + 3) / 3), // 季度
      S: date.getMilliseconds(), // 毫秒
    } as StringTypedMap<number>;
    if (/(y+)/.test(fmt)) {
      fmt = fmt.replace(RegExp.$1, (date.getFullYear() + '').substr(4 - RegExp.$1.length));
    }
    Object.keys(o).forEach(k => {
      if (fmt && new RegExp('(' + k + ')').test(fmt!)) {
        fmt = fmt.replace(RegExp.$1, RegExp.$1.length === 1 ? String(o[k]) : ('00' + o[k]).substr(('' + o[k]).length));
      }
    });
    return fmt;
  },

  dateFormatTo8(time?: Date | number, fmt?: string): string {
    time = time || new Date();
    fmt = fmt || 'yyyy-MM-dd hh:mm:ss';
    const timestamp = typeof time === 'number' ? time : time.valueOf();
    const m = moment(timestamp).utcOffset(8);
    const o = {
      'M+': m.month() + 1, // 月份
      'd+': m.date(), // 日
      'h+': m.hours(), // 小时
      'm+': m.minutes(), // 分
      's+': m.seconds(), // 秒
      'q+': Math.floor((m.month() + 3) / 3), // 季度
      S: m.milliseconds(), // 毫秒
    } as StringTypedMap<number>;
    if (/(y+)/.test(fmt)) {
      fmt = fmt.replace(RegExp.$1, (m.year() + '').substr(4 - RegExp.$1.length));
    }
    Object.keys(o).forEach(k => {
      if (fmt && new RegExp('(' + k + ')').test(fmt!)) {
        fmt = fmt.replace(RegExp.$1, RegExp.$1.length === 1 ? String(o[k]) : ('00' + o[k]).substr(('' + o[k]).length));
      }
    });
    return fmt;
  },
  /**
   * 返回两个区域的相交部分
   * @param range1
   * @param range2
   */
  rangeInteract(range1: TimeRange, range2: TimeRange) {
    const [start1, end1] = range1;
    const [start2, end2] = range2;
    if (end1.isBetween(start2, end2) || start1.isBetween(start2, end2)) {
      const start = start1.isBefore(start2) ? start2 : start1;
      const end = end1.isAfter(end2) ? end2 : end1;
      return [start, end];
    }
    if (end2.isBetween(start1, end1) || start2.isBetween(start1, end1)) {
      const start = start2.isBefore(start1) ? start1 : start2;
      const end = end2.isAfter(end1) ? end1 : end2;
      return [start, end];
    }
    if (start1.isSame(start2) && end1.isSame(end2)) {
      return [start1, end1];
    }
    return null;
  },
  /**
   * 1625021438000 => 2021-06-30 10:50:38 || --
   * @param timestamp 时间戳
   * @returns
   */
  formatDate(timestamp?: number): string {
    try {
      if (!timestamp) {
        return '--';
      }
      if (typeof timestamp === 'string') {
        return timestamp;
      }
      const date = new Date(timestamp + 8 * 3600 * 1000);
      return date.toJSON().substr(0, 19).replace('T', ' ').replace(/-/g, '-');
    } catch (error) {
      return '--';
    }
  },
  chopStrToSize(str?: string, len?: number, appendix?: string) {
    if (!str) {
      return '';
    }
    len = len || 20;
    return str.length > len ? str.substring(0, len) + (appendix || '...') : str;
  },
  // 根据字符长度截取字符串，中文2个，其他一个
  chopStrToByteSize(str: string, len?: number, appendix?: string) {
    if (!str) return '';
    if (!len) return str;
    if (this.getByteLength(str) <= len) return str;
    let res = '';
    let idx = 0;
    while (this.getByteLength(res) < len) {
      res += str.charAt(idx++);
    }
    return res + (appendix || '...');
  },
  // 获取字符串的字符长度，中文两个，英文一个
  getByteLength(str: string) {
    const zhReg = /[\u4E00-\u9FA5]/g;
    const matchResult = str.match(zhReg);
    return matchResult ? str.length - matchResult.length + matchResult.length * 2 : str.length;
  },
  cloneDeep(obj: any) {
    return JSON.parse(JSON.stringify(obj));
  },
  testArrayContainsKey(key: string, arr?: string[], ignoreCase = true) {
    if (!arr || arr.length === 0) {
      return false;
    }
    /* for (const str of arr) */
    const targetKey = ignoreCase ? key.toLowerCase() : key;
    return arr.some(str => {
      if (str) {
        const targetStr = ignoreCase ? str.toLowerCase() : str;
        if (targetStr.includes(targetKey)) {
          return true;
        }
      }
      return false;
    });
    // return false;
  },
  isMac() {
    return window.navigator.userAgent.toLocaleLowerCase().includes('mac os');
  },
  getCommonTxt(separator = '') {
    return this.isMac() ? '⌘' : 'Ctrl' + separator;
  },
  storeShortcutTransform(storeTypeShortcut: string) {
    // 将sttoreShortcut(页面显示的内容)转换为系统设置需要的快捷键
    // eg: ⌘ Shift A => CommandOrControl+Shift+A
    const command = this.getCommonTxt();
    const showKey = [command, 'Ctrl', 'Shift', 'Alt'];
    const globalShortcutKey = ['CommandOrControl', 'Ctrl', 'Shift', 'Alt'];
    return storeTypeShortcut
      ?.split(' ')
      .map(item => {
        const showKeyIndex = showKey.findIndex(specialKeyi => specialKeyi === item);
        return globalShortcutKey[showKeyIndex] || item;
      })
      .join('+');
  },
  async SyncCatchError<T = any>(fn: () => Promise<T>): Promise<CatchErrorRes<T>> {
    let res;
    try {
      const data = await fn();
      res = {
        success: true,
        data,
      };
    } catch (error: any) {
      res = {
        success: false,
        error,
      };
    }
    return res;
  },
  resetThreadMailId(id: string, isThread?: boolean): string {
    if (!isThread) {
      return id;
    }
    const SPLIT_SYMBOL = '--';
    return id.split(SPLIT_SYMBOL)[0];
  },
  isImage(fileType: string) {
    return ['png', 'jpeg', 'jpg', 'gif', 'webp'].includes(fileType.toLowerCase());
  },
  replaceInvalidFileChar(input: string, replacement = '_') {
    return input.replace(/[:*|!$\/\\]+/gi, replacement);
  },
  // 此处cid是 "eml-/Users/xxx/Downloads/2023年8月瑜伽课活动通知20230801-发件 (1).eml-1691999115924" 的结构，与读信cid无关
  // eml 路径 时间戳
  extractPathFromCid(cid: unknown): string[] | null {
    if (typeof cid === 'string') {
      return cid.match(/^eml-(.+)-(\d{13})$/);
    }
    return null;
  },
  /**
   * 笛卡尔积
   * @param arr eg：[[1,2],[3,4], [5,6]] => [[1,3,5],[1,3,6],[1,4,5],[1,4,6],[2,3,5],[2,3,6],[2,4,5],[2,4,6]]
   */
  cartesian(arr: any[][]): any[][] {
    let res: any[][] = [];
    arr.forEach((item, i) => {
      const temp: any[][] = [];
      item.forEach(item2 => {
        if (i === 0) {
          temp.push([item2]);
        } else {
          res.forEach(item3 => {
            temp.push([...item3, item2]);
          });
        }
      });
      res = temp;
    });
    return res;
  },
  /**
   * 颜色计算
   * @param email
   */
  getColor(email: string): string {
    const emailMd5 = util.md5(email);
    const num = emailMd5.charCodeAt(emailMd5.length - 1);
    return colors[num % 6];
  },
};

if (inWindow()) {
  window.apiUtil = util;
}
export const getLastSyncData = (fn: (...args: any[]) => Promise<any>): (() => Promise<any>) => {
  let count = 0;
  return (...args: any[]) => {
    count++;
    const index = count;
    return new Promise((resolve, reject) => {
      fn(...args)
        .then(res => {
          if (index !== count) {
            return;
          }
          resolve(res);
        })
        .catch(reject);
    });
  };
};
export const getLastDebounceSyncData = (fn: (...args: any[]) => Promise<any>) => debounce(getLastSyncData(fn), 300);
// const contextPath = config('contextPath') as string;
/**
 * 如果路径和数组中任意元素有关联，返回false,否则返回true
 * @param location 地址object
 * @param paths 地址列表
 */
export const pathNotInArrJudge = (location: Location, paths: string[]): boolean => {
  if (paths && paths.length > 0) {
    // let { pathname } = location;
    // if (contextPath && contextPath.length > 0) {
    //   pathname = pathname.replace(contextPath, '');
    // }
    /* for (const it of paths) */
    return !paths.some(it => locationHelper.testPathMatch(it, false, location));
    // {
    // if (it.length > 1 && ) {
    //   return true;
    // }
    // if (it === pathname) {
    //   return true;
    // }
    // return false;
    // }
  }
  return true;
};
// eslint-disable-next-line max-len
export const chineseCharRegexp =
  /[\u4E00-\u9FCC\u3400-\u4DB5\uFA0E\uFA0F\uFA11\uFA13\uFA14\uFA1F\uFA21\uFA23\uFA24\uFA27-\uFA29]|[\ud840-\ud868][\udc00-\udfff]|\ud869[\udc00-\uded6\udf00-\udfff]|[\ud86a-\ud86c][\udc00-\udfff]|\ud86d[\udc00-\udf34\udf40-\udfff]|\ud86e[\udc00-\udc1d]/;
export const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const applyAsync = (acc: Promise<any>, val: any) => acc.then(val);
export const composeAsync =
  (...funcs: any[]) =>
  (x: any) =>
    funcs.reduce(applyAsync, Promise.resolve(x));
export const getProperty = <T, K extends keyof T>(o: T, propertyName: K): T[K] => o[propertyName]; // o[propertyName] is of type T[K]

class JsonHelper {
  readonly hasProp: (v: PropertyKey) => boolean;

  seen: any[];

  constructor() {
    this.hasProp = Object.prototype.hasOwnProperty;
    this.seen = [];
  }

  throwsMessage(err: any) {
    return '[Throws: ' + (err ? err.message : '?') + ']';
  }

  safeGetValueFromPropertyOnObject(obj: resultObject, property: string) {
    if (this.hasProp.call(obj, property)) {
      try {
        return obj[property];
      } catch (err) {
        return this.throwsMessage(err);
      }
    }
    return obj[property];
  }

  visit(obj: resultObject): any {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }
    this.seen = this.seen || [];
    if (this.seen.indexOf(obj) !== -1) {
      return '[Circular]';
    }
    this.seen.push(obj);
    if (typeof obj.toJSON === 'function') {
      try {
        const fResult = this.visit(obj.toJSON());
        this.seen.pop();
        return fResult;
      } catch (err) {
        return this.throwsMessage(err);
      }
    }
    if (Array.isArray(obj)) {
      const aResult = obj.map(it => this.visit(it));
      this.seen.pop();
      return aResult;
    }
    const result: resultObject = Object.keys(obj).reduce((result, prop: string) => {
      // prevent faulty defined getter properties
      result[prop] = this.visit(this.safeGetValueFromPropertyOnObject(obj, prop));
      return result;
    }, {} as resultObject);
    this.seen.pop();
    return result;
  }

  ensureProperties(obj: resultObject) {
    // store references to objects we have seen before
    return this.visit(obj);
  }

  clean() {
    this.seen = [];
  }
}

export const objToXml = (target: Record<string, any>) =>
  Object.keys(target).reduce((total, key) => {
    const val = target[key];
    if (Array.isArray(val)) {
      let arrayStr = '';
      if (typeof val[0] === 'string') {
        arrayStr = `<string>${val.toString()}</string>`;
      } else {
        arrayStr += objToXml(val);
      }
      total += `<array name="${key}">${arrayStr}</array>`;
    } else if (typeof val === 'object') {
      total += `<object name="${key}">${objToXml(val)}</object>`;
    } else if (typeof val === 'number') {
      total += `<int>${val}</int>`;
    } else if (val !== undefined && val !== null) {
      total += `<${typeof val} name="${key}">${val}</${typeof val}>`;
    }
    return total;
  }, '');

export const getXmlByObject = (items: any[]) => {
  const prefix = '<?xml version="1.0"?><object><array name="items">';
  const content = items.reduce((total, current) => {
    if (total === undefined || total === null) {
      return total;
    }
    total += `<object>${objToXml(current)}</object>`;
    return total;
  }, '');
  const suffix = '</array></object>';
  return prefix + content + suffix;
};

export const toJson = function (data: resultObject, replacer?: (this: any, key: string, value: any) => any, space?: string) {
  const jsonHelper = new JsonHelper();
  try {
    return JSON.stringify(jsonHelper.ensureProperties(data), replacer, space);
  } catch (ex) {
    console.warn(ex);
    return '{"error":"json stringify error"}';
  } finally {
    jsonHelper.clean();
  }
};
export const getCommonCompareFunc = (key: string) => {
  const commonCompareFn = (a: resultObject, b: resultObject) => {
    if (a) {
      if (b) {
        if (key in a) {
          if (key in b) {
            const ak = a[key];
            const bk = b[key];
            if (typeof ak === 'string' && typeof bk === 'string') {
              return ak.localeCompare(bk);
            }
            if (typeof ak === 'number' && typeof bk === 'number') {
              return ak - bk;
            }
            return 0;
          }
          return -1;
        }
        return 1;
      }
      return -1;
    }
    return 1;
  };
  return commonCompareFn;
};

interface TriggerDebounceOption {
  debounceConf?: DebounceSettings;
  debounceTimeout: number;
  triggerSize: number;
}

export const triggerDebounceBySize = <T>(fn: (data: T[]) => unknown, options: TriggerDebounceOption = { triggerSize: 100, debounceTimeout: 1000 }) => {
  const set = new Set<T>();
  const { triggerSize = 100, debounceConf, debounceTimeout = 1000 } = options;
  const executor = async () => {
    const target = [...set];
    await fn(target);
    // 没用 clear 防止清理在执行过程中新添加的数据
    target.forEach(v => {
      set.delete(v);
    });
  };

  const debounceFn = debounce(
    () => {
      executor().then();
    },
    debounceTimeout,
    debounceConf
  );

  return (data: T[] | T) => {
    if (set.size >= triggerSize) {
      executor().then();
    } else {
      const _data = Array.isArray(data) ? data : [data];
      _data.forEach(v => {
        set.add(v);
      });
      debounceFn();
    }
  };
};

export const isObjectIncludesObject2 = <T extends resultObject>(obj: T, obj2: Partial<T>) => !Object.keys(obj2).some(key => obj[key] !== obj2[key]);

/**
 * 文件夹tree的层序遍历
 * maxCount: 最大的遍历次数限制，作为兜底，防止节点过多的时候同步卡死
 * deep 从1开始增长
 */
type TraverseCallback = (node: MailBoxModel, depth: number) => void;

export const traverseTreeBFS = (root: MailBoxModel | MailBoxModel[], callback: TraverseCallback, maxIterations = Infinity) => {
  const queue: [MailBoxModel, number][] = [];
  if (Array.isArray(root)) {
    for (let i = 0; i < root.length; i++) {
      const node = root[i];
      queue.push([node, 1]);
    }
  } else {
    queue.push([root, 1]);
  }
  let iterations = 0;

  while (queue.length > 0 && iterations < maxIterations) {
    const task = queue.shift();
    if (task) {
      const [node, depth] = task;
      callback(node, depth);
      iterations += 1;
      if (node?.children && node?.children.length) {
        for (let i = 0; i < node?.children.length; i++) {
          queue.push([node?.children[i], depth + 1]);
        }
      }
    }
  }
};

/**
 * 对系统文件夹按照id进行翻译对照
 */
export const folderId2TransMap = {
  1: 'SHOUJIANXIANG',
  3: 'FAJIANXIANG',
  2: 'CAOGAOXIANG',
  17: 'WEISHENHEWENJIAN',
  19: 'YISHENHEWENJIAN',
  7: 'GUANGGAOYOUJIAN',
  5: 'LAJIYOUJIAN1',
  6: 'BINGDUWENJIAN',
  4: 'YISHANCHU',
  18: 'DINGYUEYOUJIAN',
  89: 'GELIYOUJIAN',
  '-1': 'HONGQIYOUJIAN',
  '-9': 'RENWUYOUJIAN',
  '-4': 'WEIDUYOUJIAN',
  '-5': 'XINGBIAOLIANXIREN',
  '-3': 'SHAOHOUCHULI',
  '-33': 'QUANBUJIEGUO',
};

// export const getCurrentPageEnv = () => (!inWindow() ? '' : window.isAccountBg ? 'subAccount' : window.isBridgeWorker ? 'bridgerWorker' : 'frontPage');
// eslint-disable-next-line no-nested-ternary
export const getCurrentPageEnv = () => (!inWindow() ? '' : window.isBridgeWorker ? 'bridgerWorker' : 'frontPage');

export const getReLoginUpTime = () => {
  const defaultValue = null;
  if (!inWindow()) {
    return defaultValue;
  }
  try {
    const currentUser = window.apiResposity.getSystemApi().getCurrentUser();
    if (currentUser) {
      return new Date().getTime() - currentUser.lastLoginTime;
    }
  } catch (ex) {
    console.error('getReLoginUpTime error', ex);
    return defaultValue;
  }
  return defaultValue;
};

/**
 * 拼接文件夹-星标联系人所需id
 */
export const getFolderStartContactId = (id: string, type: number) => `${type === 1 ? 'personal' : 'org'}##${id}`;

/**
 * 切割文件夹-星标联系人所需id
 */
export const splitFolderStartContactId = (fid: string | number) => String(fid).split('##');

export const isWinmailDatAttachment = (contentType: string, fileName?: string) => contentType === 'application/ms-tnef' && fileName?.endsWith('dat');
/**
 * 存储在localStorage的key，以及配置
 * 格式页面 + 业务信息
 */
export enum StorageKey {
  LoginSkipBindMobile = 'login_skip_bind_mobile',
}

export const getIsEncryptedMail = (attachment: MailFileAttachModel | MailFileAttachModel[]) => {
  const attachments = Array.isArray(attachment) ? attachment : [attachment];
  return attachments.some(v => v.fileType === 'cmecypt');
};
