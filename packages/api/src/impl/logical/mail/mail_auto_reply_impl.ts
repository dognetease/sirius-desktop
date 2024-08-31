/* eslint-disable prefer-promise-reject-errors */
import { config } from 'env_def';
import moment from 'moment';
import { api } from '@/api/api';
import { AutoReplyApi, AutoReplyVarModel, AutoReplyModel, MomentsModel } from '@/api/logical/mail_autoReply';
import { DataTransApi, ResponseData } from '@/api/data/http';
import { apis } from '@/config';
import { SystemApi } from '@/api/system/system';

import { MailConfApi } from '@/api/logical/mail';

import corpMailUtils from './corp_mail_utils';
import { methodMap, MethodMap } from './mail_action_store_model';
import { StringMap } from '@/api/commonModel';
import { DataStoreApi, StoreData } from '@/api/data/store';
import { getIn18Text } from '@/api/utils';

class AutoReplyApiImpl implements AutoReplyApi {
  private systemApi: SystemApi;

  mailConf: MailConfApi;

  httpApi: DataTransApi;
  // actions: ActionStore;

  DataStore: DataStoreApi;

  name: string;

  static readonly map: Record<string, string> = {
    '<': '<',
    '>': '>',
    '&': '&',
    '"': '"',
  };

  static readonly storeName = 'AutoReplyInfo';

  constructor() {
    this.name = apis.autoReplyApiImpl;
    this.systemApi = api.getSystemApi();
    this.mailConf = api.requireLogicalApi(apis.mailConfApiImpl) as unknown as MailConfApi;
    this.httpApi = api.getDataTransApi();

    this.DataStore = api.getDataStoreApi();
    // this.getConfigForHttp = MailAbstractHandler.getConfigForHttp
  }

  buildUrl(key: keyof MethodMap, additionalParam?: StringMap): string {
    const sid = this.systemApi.getCurrentUser()?.sessionId || '';
    if (!sid) {
      return config('notExistUrl') as string;
    }
    const isCorpMailModeUser = this.systemApi.getIsCorpMailMode();
    if (isCorpMailModeUser) {
      const params = { sid, ...(additionalParam || {}) };
      const url = corpMailUtils.getUrlByMailFuncName(key);
      return this.httpApi.buildUrl(url, params);
    }
    let req = {
      func: methodMap[key],
      sid,
    };
    if (additionalParam) {
      req = Object.assign(req, additionalParam);
    }
    return this.httpApi.buildUrl(this.systemApi.getUrl('mailOperation'), req);
  }

  init(): string {
    return this.name;
  }

  async getMailRulesByAutoReply(): Promise<AutoReplyModel> {
    const url = this.buildUrl('getMailClassifyRule');
    const data = this.httpApi
      .post(url, { category: 'autoreply' }, { contentType: 'json' })
      .then((res: ResponseData) => {
        if (res.data.code === 'S_OK') {
          if (res.data.var.length > 0) {
            return AutoReplyApiImpl.setAutoReplyModelByRules(res.data.var[0]);
          }
          // 仅仅在关闭的时候会走缓存
          return this.getLocalStore();
        }
        return AutoReplyApiImpl.getDefaultAutoReply();
      })
      .catch(err => {
        console.log('getMailRulesByAutoReply=failed', err);
        return this.getLocalStore();
      });
    return data;
  }

  static setAutoReplyModelByRules(res: AutoReplyVarModel): AutoReplyModel {
    // todo==存入localstorage
    const autoReply: AutoReplyModel = AutoReplyApiImpl.getDefaultAutoReply();
    if (Object.keys(res).length > 0) {
      autoReply.disabled = false;
    }
    autoReply.id = res.id ? res.id : null;
    // autoReply.moments = AutoReplyApiImpl.initMomentsState();
    if (res?.condictions?.length > 0) {
      let start = null;
      let end = null;
      if (typeof res.condictions[0].operand === 'string') {
        start = res.condictions[0].operand;
      } else {
        [start, end] = res.condictions[0].operand;
      }
      // time的事件戳 也要加上前面的日期
      const startMoment = start ? moment(start).second(0).millisecond(0) : null;
      const endMoment = end ? moment(end).second(0).millisecond(0) : null;
      const moments: MomentsModel = {
        startDate: startMoment,
        startTime: startMoment,
        endDate: endMoment,
        endTime: endMoment,
      };
      autoReply.moments = moments;
    }
    if (res?.actions?.length > 0) {
      const { content, onlyContact, onceForSameSender } = res.actions[0];
      autoReply.content = content;
      autoReply.onlyContact = onlyContact;
      autoReply.onceForSameSender = onceForSameSender;
    }
    console.log('autoReply=====', autoReply);
    // }
    return autoReply;
  }

  async addMailRulesByAutoReply(form: AutoReplyModel): Promise<number | null> {
    // const xmlStr = AutoReplyApiImpl.translateXml(form);
    const items = AutoReplyApiImpl.translateJson(form);
    // addMailClassifyRule 于新建规则用同一条
    const url = this.buildUrl('addMailClassifyRule');
    const result = this.httpApi
      // .post(url, { var: xmlStr }, { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }})
      .post(url, { items, category: 'autoreply' }, { contentType: 'json' })
      .then(res => {
        // console.log('res', res)
        if (res.data?.code === 'S_OK') {
          // 不存储id
          this.setLocalStore({ ...form, id: null });
          return res.data?.var[0];
        }
        return null;
      });
    return result;
  }

  async updateMailRulesByAutoReply(form: AutoReplyModel): Promise<boolean> {
    // const xmlStr = AutoReplyApiImpl.translateXml(form);
    const items = AutoReplyApiImpl.translateJson(form);
    // editMailClassifyRule 于新建规则用同一条
    const url = this.buildUrl('editMailClassifyRule');
    const result = this.httpApi
      // .post(url, { var: xmlStr }, { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }})
      .post(url, { items, category: 'autoreply' }, { contentType: 'json' })
      .then(res => {
        if (res.data?.code === 'S_OK') {
          // 注意：不保存id
          this.setLocalStore({ ...form, id: null });
          return true;
        }
        return false;
      });
    return result;
  }

  // todo== 本地缓存
  private getLocalStore(): AutoReplyModel {
    // 从数据库中取，如果没有，则返回默认的
    const sync: StoreData = this.DataStore.getSync(AutoReplyApiImpl.storeName);
    if (sync && sync.suc && sync.data) {
      const data = JSON.parse(sync.data);
      data.disabled = true;
      const { startDate, endDate, startTime, endTime } = data.moments;
      // 序列化后， moments会变成字符串
      data.moments = {
        startDate: startDate ? moment(startDate) : null,
        endDate: endDate ? moment(endDate) : null,
        startTime: startTime ? moment(startTime) : null,
        endTime: endTime ? moment(endTime) : null,
      };
      return data;
    }
    // 仅第一次使用
    return AutoReplyApiImpl.getDefaultAutoReply();
  }

  private setLocalStore(form: AutoReplyModel) {
    this.DataStore.putSync(AutoReplyApiImpl.storeName, JSON.stringify(form));
  }

  static translateJson(form: AutoReplyModel) {
    const { id, content, disabled, moments, onceForSameSender, onlyContact } = form;
    const { startTime, endTime } = moments as MomentsModel;
    // 新增不需要id（设为null）， 变更需要id
    const item = {
      id,
      name: 'autoReply',
      disabled,
      continue: true,
      actions: [
        {
          type: 'reply',
          content,
          onlyContact,
          onceForSameSender,
        },
      ],
      condictions: [
        {
          field: 'receivedDate',
          disabled,
          operand: moment.isMoment(endTime) ? [moment(startTime).valueOf(), moment(endTime).valueOf()] : moment(startTime).valueOf(),
          operator: startTime && endTime ? 'between' : 'gt',
        },
      ],
    };
    return [item];
  }

  static initMomentsState = () => {
    const cur = moment();
    cur.second(0).millisecond(0);
    let minutes = cur.minutes();
    minutes = Math.ceil(minutes / 15) * 15;
    cur.minutes(minutes);
    // 初始任务邮件内容
    const moments: MomentsModel = {
      startDate: cur,
      startTime: cur.clone(),
      endDate: null,
      endTime: null,
    };
    return moments;
  };

  static getDefaultAutoReply = () => {
    const autoReply: AutoReplyModel = {
      disabled: true,
      id: null,
      content: getIn18Text('NINHAO，NINDEYOUJIAN'),
      onlyContact: false,
      onceForSameSender: false,
      moments: AutoReplyApiImpl.initMomentsState(),
    };
    return autoReply;
  };
  /**
   * @deprecated xml格式调用
   */

  static translateXml(form: AutoReplyModel) {
    const { id, content, disabled, moments } = form;
    const { startTime, endTime } = moments as MomentsModel;

    const contentStr = AutoReplyApiImpl.html2Escape(content as string);

    console.log('contentStr', contentStr);
    const result = `<?xml version="1.0"?>
      <object>
        <string name="category">autoreply</string>
        <array name="items">
          <object>
            <string name="name">autoReply</string>
            <boolean name="disabled">${disabled}</boolean>
            <boolean name="continue">true</boolean>
            <array name="condictions">
              <object>
                <string name="field">receivedDate</string>
                <boolean name="disabled">${disabled}</boolean>
                <string name="operator">${startTime && endTime ? 'between' : '&gt;'}</string>
                ${
                  moment.isMoment(endTime)
                    ? `
                <array name="operand">
                <date>${moment(startTime).format('YYYY-MM-DD HH:mm:ss')}</date>
                <date>${moment(endTime).format('YYYY-MM-DD HH:mm:ss')}</date>
                </array> 
                `
                    : `
                <date name="operand">${moment(startTime).format('YYYY-MM-DD HH:mm:ss')}</date>
                `
                }
              </object>
            </array>
            <array name="actions">
              <object>
                <string name="type">reply</string>
                <boolean name="disabled">false</boolean>
                <string name="content">${contentStr}</string>
              </object>
            </array>
            ${id ? `<int name="id">${id}</int>` : ''}
          </object>
        </array>
      </object>`;
    return result;
  }
  /**
   * @deprecated The method should not be used
   */

  static html2Escape(sHtml: string) {
    return sHtml.replace(/[<>&"]/g, c => AutoReplyApiImpl.map[c]);
  }
}

const autoReplyApiImpl: AutoReplyApi = new AutoReplyApiImpl();

api.registerLogicalApi(autoReplyApiImpl);

export default autoReplyApiImpl;
