/* eslint-disable max-statements */
/* eslint-disable max-lines */
import lodashGet from 'lodash/get';
import { DbApiV2 } from '@/api/data/new_db';
import { api } from '@/api/api';
import { apis, inWindow } from '@/config';
import { EntityOrgContact, EntityContactItem, EntityContact, ContactModel } from '@/api/_base/api';
import { util, wait } from '@/api/util';
import { SystemApi } from '@/api/system/system';
import ContactUtilInterface, { ContactConst } from './contact_util';
import { DataTrackerApi } from '@/api/data/dataTracker';
import { ContactDB, ContactDBInstance } from './contact_dbl';

// import { DataStoreApi } from '@/api/data/store';

/**
 * 所有监测通讯录数据正确度的逻辑都放到这个文件中
 */
export class ContactHealthDetectHelper {
  protected dbApi: DbApiV2;

  protected systemApi: SystemApi;

  private dataTrackerApi: DataTrackerApi;

  // private storeApi: DataStoreApi;

  private contactUtil: ContactConst = ContactUtilInterface;

  private eventApi = api.getEventApi();

  private detectStatusMap: Map<string, 'ing' | 'done'> = new Map();

  contactDB: ContactDB = ContactDBInstance;

  private detectIsExistIds: Set<string> = new Set();

  async detectContactData() {
    // 检查contactItem&contact表数据是否缺失
    try {
      const enableContinue = await this.doDetectContactComplete('checkContactComplete');
      if (enableContinue) {
        return;
      }
    } catch (ex) {
      console.error('[healthdetect].error0', ex);
    }

    // 检查orgContact表中的重复数据
    try {
      const enableContinue = await this.doDetectOrgContactData(this.contactUtil.orgContactTable);
      if (!enableContinue) {
        return;
      }
    } catch (ex) {
      console.error('[healthdetect].error1', ex);
    }

    // 检查contactItem表中的重复数据
    try {
      await this.doDetectContactItemData(this.contactUtil.contactItemTable);
    } catch (ex) {
      console.error('[healthdetect].error2', ex);
    }
  }

  private orgContactlimitSize = 5000;

  // 最快5天检查一次
  private expiredSpan = 5 * 24 * 60 * 60 * 1000;

  // 存储检测结果
  private orgContactDuplicateMap: Map<string, Record<string, number>> = new Map();

  private contactItemtDuplicateMap: Map<string, Record<string, number>> = new Map();

  private intervalContactReadyHandler = 0;

  private isContactReady = false;

  constructor() {
    this.systemApi = api.getSystemApi();
    this.dbApi = api.requireLogicalApi(apis.dbInterfaceApiImpl) as DbApiV2;
    this.dataTrackerApi = api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;

    if (inWindow()) {
      this.intervalContactReadyHandler = this.systemApi.intervalEvent({
        id: 'contactHealthDetect-intervalContactStatus',
        handler: async () => {
          // 如果当前DB状态是none状态则不care
          const status = await this.contactDB.detectCoreEnterpriseHasData({ from: 'enterprise' });
          if (status === 'all') {
            this.isContactReady = true;
            this.systemApi.cancelEvent('long', this.intervalContactReadyHandler);
          }
        },
        eventPeriod: 'long',
        seq: 0,
      })!;
    }
  }

  private async doDetectContactComplete(taskName: string, triggerType: 'auto' | 'user' = 'auto') {
    if (this.detectStatusMap.get('checkContactComplete') === 'ing') {
      return false;
    }
    this.detectStatusMap.set('checkContactComplete', 'ing');
    // 从taskGlbal中查找上次的记录
    const { expiredTime } = await this.queryContactDetectTask(taskName);
    if (expiredTime > Date.now()) {
      this.detectStatusMap.set('checkContactComplete', 'done');
      return true;
    }
    const startTime = Date.now();
    const [contactList, contactItemList] = await Promise.all([
      this.dbApi.getByRangeCondition<EntityContact>({
        dbName: this.contactUtil.contactDbName,
        tableName: this.contactUtil.contactTable,
      }),
      this.dbApi.getByEqCondition({
        dbName: this.contactUtil.contactDbName,
        tableName: this.contactUtil.contactItemTable,
        query: {
          contactItemType: 'EMAIL',
        },
      }),
    ]);
    const contactCount = contactList.filter(item => item.type === 'enterprise').length;
    const contactItemCount = contactItemList.filter(item => item.type === 'enterprise').length;
    const eventName = process.env.BUILD_ISELECTRON ? 'detectContactException' : 'detectContactExceptionInWeb';
    // 如果通讯录数据和ContactItem数据不一致
    if (contactCount !== contactItemCount) {
      console.log('[contact_healthdetect_helper]doDetectContactComplete:doSomething', triggerType);
      this.dataTrackerApi.track('pc_contact_check_contactitem_complete', {
        type: triggerType,
        contactCount,
        contactItemCount,
        enableTrackInBg: true,
      });

      this.eventApi.sendSysEvent({
        eventName,
        eventData: {
          // 检测类型
          type: 'contactNotEqualContactItem',
          // 是否可以跳过全量同步
          enableSkipFullSync: true,
        },
        _account: this.systemApi.getCurrentUser()?.id,
      });
    }
    this.detectStatusMap.set('checkContactComplete', 'done');
    const endTime = Date.now();
    return endTime - startTime < 2000;
  }

  // 自动巡检删除contactItem中老数据
  async doDetectContactItemData(taskName: string = this.contactUtil.contactItemTable) {
    if (this.detectStatusMap.get(taskName) === 'ing') {
      return false;
    }
    this.detectStatusMap.set(taskName, 'ing');
    // 从taskGlbal中查找上次的记录
    const { expiredTime } = await this.queryContactDetectTask(taskName);
    if (expiredTime > Date.now()) {
      this.detectStatusMap.set(taskName, 'done');
      return true;
    }
    const startTime = Date.now();
    await this.doQueryDuplicateContactItem({
      offset: 0,
      limit: this.orgContactlimitSize,
    });

    await this.doDeleteValidContactItem();
    this.storeContactDetectTask(taskName, {
      expiredTime: Date.now() + this.expiredSpan,
      isDone: true,
    });
    const endTime = Date.now();
    this.detectStatusMap.set(taskName, 'done');
    // 如果整个步骤耗时低于2s的话 同一次遍历可以执行其他任务
    return endTime - startTime < 2000;
  }

  // 自动巡检删除contactItem中老数据
  private async doDetectOrgContactData(taskName: string): Promise<boolean> {
    if (this.detectStatusMap.get(taskName) === 'ing') {
      return false;
    }
    this.detectStatusMap.set(taskName, 'ing');

    // 从taskGlbal中查找上次的记录
    const { expiredTime } = await this.queryContactDetectTask(taskName);

    if (expiredTime > Date.now()) {
      this.detectStatusMap.set(taskName, 'done');
      return true;
    }

    const startTime = Date.now();

    await this.doQueryDuplicateOrgContact({
      offset: 0,
      limit: this.orgContactlimitSize,
    });

    await this.doDeleteDuplicateOrgContact();

    this.storeContactDetectTask(this.contactUtil.orgContactTable, {
      expiredTime: Date.now() + this.expiredSpan,
      isDone: true,
    });
    const endTime = Date.now();

    this.detectStatusMap.set(taskName, 'done');

    // 如果整个步骤耗时低于2s的话 同一次遍历可以执行其他任务
    return endTime - startTime < 2000;
  }

  private async storeContactDetectTask(
    taskName: string,
    taskResult: {
      expiredTime: number;
      isDone: true;
    }
  ) {
    const domain = this.systemApi.getCurrentUser()?.domain || '';
    const account = this.systemApi.getCurrentUser()?.accountMd5 || '';
    const id = util.getUnique(domain, account, taskName);

    this.dbApi.put(
      {
        dbName: 'task_global',
        tableName: 'contact_detecttask',
      },
      {
        id,
        domain,
        account,
        tablename: taskName,
        expiredTime: taskResult.expiredTime,
        isDone: taskResult.isDone,
      }
    );
  }

  /**
   * @description:查询检测状态。1.22版本只做orgContact的自动检测。orgContact目前是一次性做完 不做分批查询检测
   * @param tableName
   * @returns
   */
  private async queryContactDetectTask(taskName: string): Promise<{
    isDone: boolean;
    expiredTime: number;
  }> {
    // if (Math.random() < 2) {
    //   return { isDone: true, expiredTime: Date.now() + 1000 * 60 };
    // }

    const domain = this.systemApi.getCurrentUser()?.domain || '';
    const account = this.systemApi.getCurrentUser()?.accountMd5 || '';

    const tasklist = await this.dbApi.getByRangeCondition<{
      isDone: boolean;
      lastId: string;
      expiredTime: number;
    }>({
      dbName: 'task_global',
      tableName: 'contact_detecttask',
      adCondition: {
        type: 'equals',
        field: ['domain', 'account', 'tablename'],
        args: [[domain, account, taskName]],
      },
    });

    const isDone = lodashGet(tasklist, '[0].isDone', true);
    const expiredTime = lodashGet(tasklist, '[0].expiredTime', 0);

    return {
      isDone,
      expiredTime,
    };
  }

  private async doQueryDuplicateContactItem(options: { offset?: number; limit: number }) {
    const { offset = 0, limit } = options;
    const result = await this.dbApi.getByRangeCondition<EntityContactItem>({
      dbName: this.contactUtil.contactDbName,
      tableName: this.contactUtil.contactItemTable,
      start: offset,
      count: limit,
    });

    result.forEach(item => {
      const { contactId, _lastUpdateTime = 0, id, type, contactItemType } = item;
      if (type !== 'enterprise' || contactItemType !== 'EMAIL') {
        return;
      }

      if (!this.contactItemtDuplicateMap.has(contactId)) {
        this.contactItemtDuplicateMap.set(contactId, {});
      }

      const details = this.contactItemtDuplicateMap.get(contactId)!;

      details[id] = _lastUpdateTime;
    });

    // 如果返回结果小于limit 表示已经遍历结束
    if (result.length < limit) {
      return;
    }

    await wait(2000);
    await this.doQueryDuplicateContactItem({
      offset: offset + limit,
      limit,
    });
  }

  // 分批检测重复的orgContact数据
  private async doQueryDuplicateOrgContact(options: { offset?: number; limit: number }): Promise<void> {
    const { offset = 0, limit } = options;

    const mainCompanyId = this.systemApi.getCurrentCompanyId();
    const result = await this.dbApi.getByRangeCondition<EntityOrgContact>({
      dbName: this.contactUtil.contactDbName,
      tableName: this.contactUtil.orgContactTable,
      start: offset,
      count: limit,
    });

    result.forEach(item => {
      // 慎重判断type逻辑 别把个人群组给删了
      const { enterpriseId: _enterpriseId, orgId, id, contactId, _lastUpdateTime = 0 } = item;
      if (_enterpriseId && _enterpriseId !== mainCompanyId) {
        return;
      }
      // 只检查企业数据，不是数组开头的并不是企业
      if (orgId && !/^\d+/.test(orgId)) {
        return;
      }

      const virtualId = util.getUnique(contactId, orgId);
      if (!this.orgContactDuplicateMap.has(virtualId)) {
        this.orgContactDuplicateMap.set(virtualId, {});
      }
      this.orgContactDuplicateMap.get(virtualId)![id] = _lastUpdateTime;
    });

    // 如果返回结果小于limit 表示已经遍历结束
    if (result.length < limit) {
      return;
    }

    await wait(2000);
    await this.doQueryDuplicateOrgContact({
      offset: offset + limit,
      limit,
    });
  }

  /**
   * @description:删除无效的contactItem数据
   * @returns
   */
  private async doDeleteValidContactItem() {
    const inValidIds: string[] = [];

    this.contactItemtDuplicateMap.forEach(details => {
      // 只有一个lastupdatetime不处理
      if (details.size <= 1) {
        return;
      }

      const maxLastUpdateTime = Math.max(...Object.values(details));
      Object.keys(details).forEach(id => {
        if (details[id] < maxLastUpdateTime) {
          inValidIds.push(id);
        }
      });
    });

    if (inValidIds && inValidIds.length) {
      this.dbApi.deleteById(
        {
          dbName: this.contactUtil.contactDbName,
          tableName: this.contactUtil.contactItemTable,
        },
        inValidIds
      );

      this.dataTrackerApi.track('pc_contact_check_duplicatedata', {
        tableName: 'contactItem',
        count: inValidIds.length,
        type: 'interval',
        enableTrackInBg: true,
      });
    }
  }

  /**
   *
   * @returns 删除重复数据 true:有重复数据 false没有重复数据
   */
  private async doDeleteDuplicateOrgContact() {
    // 筛选重复数据
    const duplicateInvalidIds: string[] = [];

    this.orgContactDuplicateMap.forEach(item => {
      if (Object.keys(item).length <= 1) {
        return;
      }

      let maxIdKey = '';
      let maxLastUpdateTime = 0;

      // 比较出最大值对应的ID(有效值)
      Object.keys(item).forEach(key => {
        const curTime = item[key] || 0;
        maxLastUpdateTime = Math.max(maxLastUpdateTime, curTime);

        if (maxLastUpdateTime === curTime) {
          maxIdKey = key;
        }
      });

      Reflect.deleteProperty(item, maxIdKey);

      duplicateInvalidIds.push(...Object.keys(item));
    });

    if (!duplicateInvalidIds || !duplicateInvalidIds.length) {
      return;
    }

    console.error('[contactHealthDetectHelper]删除重复数据', duplicateInvalidIds);

    this.dataTrackerApi.track('pc_contact_check_duplicatedata', {
      tableName: 'orgContact',
      count: duplicateInvalidIds.length,
      type: 'interval',
      enableTrackInBg: true,
    });

    await this.dbApi.deleteById(
      {
        dbName: this.contactUtil.contactDbName,
        tableName: this.contactUtil.orgContactTable,
      },
      duplicateInvalidIds
    );
  }

  async shouldUpdateContact(list: ContactModel[]) {
    // 如果通讯录没有ready直接忽略
    if (!this.isContactReady) {
      return true;
    }

    this.detectIsExistIds = new Set([...this.detectIsExistIds, ...list.map(item => item.contact.id)]);

    if (this.detectIsExistIds.size < 10) {
      return true;
    }
    this.detectIsExistIds.clear();
    return this.doDetectContactComplete('checkContactComplete', 'user');
  }
}

export const contactHealthDetectHelper = new ContactHealthDetectHelper();
