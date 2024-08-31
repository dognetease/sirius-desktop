import { apis } from '@/config';
import { api } from '@/api/api';
import { Api } from '@/api/_base/api';
import { ClearDraftMailRes, DeleteDraftMailByCidRes, GetLatestedDraftByCidRes, MailDraftApi, ReplaceDraftMailByCidRes } from '@/api/logical/mail_draft';
import { DbApiV2 } from '@/api/data/new_db';
import { mailUnfinishedMailTable } from './mail_action_store_model';
import { MailApi, MailEntryModel, WriteMailInitModelParams } from '@/api/logical/mail';
import { util } from '@/api/util';
import { SystemApi } from '@/api/system/system';

class MailDraftApiImpl implements MailDraftApi {
  name: string;

  db: DbApiV2;

  mailApi: MailApi;

  systemApi: SystemApi;

  constructor() {
    this.name = apis.mailDraftApiImpl;
    this.db = api.requireLogicalApi(apis.dbInterfaceApiImpl) as DbApiV2;
    this.mailApi = api.requireLogicalApi(apis.mailApiImpl) as unknown as MailApi;
    this.systemApi = api.getSystemApi();
  }

  init(): string {
    return this.name;
  }

  // 获取草稿邮件数目
  async getDraftMailCount() {
    const allDraftMail = await this.db.getByRangeCondition({
      ...mailUnfinishedMailTable,
    });
    const cidSet = new Set();
    allDraftMail.forEach(item => {
      cidSet.add(item.cid);
    });
    return cidSet.size || 0;
  }

  // 获取全部草稿附件的全部版本
  // 最多 500
  async getAllDraftMail() {
    const allDraftMail = await this.db.getByRangeCondition({
      ...mailUnfinishedMailTable,
      start: 0,
      count: 500,
      desc: false,
    });
    // 按照创建时间倒序
    const orderedAllDraftMail = util.setDataOrder({
      data: allDraftMail,
      orderBy: [['createTime', false]],
    });
    const cidMap: Map<number, MailEntryModel[]> = new Map();
    orderedAllDraftMail.forEach(item => {
      const { cid } = item;
      if (cidMap.has(cid)) {
        cidMap.set(cid, [...(cidMap.get(cid) || []), item as MailEntryModel]);
      } else {
        cidMap.set(cid, [item as MailEntryModel]);
      }
    });
    return cidMap || {};
  }

  // 删除某草稿邮件的全部版本
  async deleteDraftMailByCid(cid: string | string[]): Promise<DeleteDraftMailByCidRes> {
    const cidArr = Array.isArray(cid) ? cid : [cid];
    try {
      const delNum = await this.db.deleteByByRangeCondition({
        ...mailUnfinishedMailTable,
        adCondition: {
          field: 'cid',
          type: 'anyOf',
          args: cidArr,
        },
      });
      return {
        success: true,
        data: delNum,
      };
    } catch (error) {
      console.log('删除草稿邮件失败', error);
      return {
        success: false,
        message: '删除草稿邮件失败',
      };
    }
  }

  // 替换草稿邮件的全部版本
  async replaceDraftMailByCid(cid: string, replaceCid: string): Promise<ReplaceDraftMailByCidRes> {
    try {
      const resArr = await this.db.getByRangeCondition({
        ...mailUnfinishedMailTable,
        adCondition: {
          field: 'cid',
          type: 'anyOf',
          args: [replaceCid],
        },
      });
      // 删除旧的
      await this.db.deleteByByRangeCondition({
        ...mailUnfinishedMailTable,
        adCondition: {
          field: 'cid',
          type: 'anyOf',
          args: [replaceCid],
        },
      });
      const replacedArr = resArr.map(item => ({
        ...item,
        cid,
      }));
      // 插入新的
      await this.db.putAll(mailUnfinishedMailTable, replacedArr);
      return {
        success: true,
        data: replacedArr as MailEntryModel[],
      };
    } catch (error) {
      console.log('替换草稿cid失败', error);
      return {
        success: false,
        message: '替换草稿cid失败',
      };
    }
  }

  // 清空
  async clearDraftMail(): Promise<ClearDraftMailRes> {
    try {
      const delNum = await this.db.deleteByByRangeCondition({
        ...mailUnfinishedMailTable,
        adCondition: {
          field: 'cid',
          type: 'above',
          args: [0],
        },
      });
      return {
        success: true,
        data: delNum,
      };
    } catch (error) {
      console.log('清空草稿邮件失败', error);
      return {
        success: false,
        message: '清空草稿邮件失败',
      };
    }
  }

  // 根据cid获取最新草稿
  async getLatestedDraftByCid(cid: string): Promise<GetLatestedDraftByCidRes> {
    try {
      const mainAccountEmail = this.systemApi.getMainAccount1().email;
      if (!mainAccountEmail) {
        return {
          success: false,
          message: '找不到主账号',
        };
      }
      const cidDrafts = await this.db.getByEqCondition({
        ...mailUnfinishedMailTable,
        // 只在主账号里查
        _dbAccount: mainAccountEmail,
        query: { cid },
      });
      if (!cidDrafts.length) {
        return {
          success: false,
          message: `本地未存储${cid}的草稿`,
        };
      }
      // 按照创建时间倒序
      const orderedCidDraftMail = util.setDataOrder({
        data: cidDrafts,
        orderBy: [['createTime', false]],
      });
      const latestedVersion = orderedCidDraftMail[0] as MailEntryModel;
      const { draftId, draftVersionId } = latestedVersion;
      // 拿到最新的远端草稿id，以编辑草稿的方式创建（只要远端成功一次就一定有，因此一般都有）
      // 附件以远端为主 正文以本地为主 内联特殊处理
      if (draftId) {
        const draftParams: WriteMailInitModelParams = {
          id: draftId,
          mailType: 'draft',
          writeType: 'editDraft',
          withoutPlaceholder: true,
          extraData: {
            draftVersionId: draftVersionId || '',
          },
        };
        const res = await this.mailApi.initModel(draftParams);
        return {
          success: true,
          data: res,
        };
      }
      // 拿不到（还没有远端存储过），直接用直接创建，概率极低
      const initParams: WriteMailInitModelParams = {
        writeType: 'common',
        mailType: 'common',
        result: { ...latestedVersion, recoverCid: latestedVersion.cid },
        withoutPlaceholder: true,
      };
      const res = await this.mailApi.initModel(initParams);
      return {
        success: true,
        data: res,
      };
    } catch (error) {
      console.log(`根据cid${cid}获取最近草稿失败`, error);
      return {
        success: false,
        message: `根据cid${cid}获取最近草稿失败`,
      };
    }
  }

  // 恢复草稿
  async recoverDraft(draft: MailEntryModel) {
    const { draftId, draftVersionId } = draft;
    // 以编辑草稿的方式创建
    if (draftId) {
      const draftParams: WriteMailInitModelParams = {
        id: draftId,
        mailType: 'draft',
        writeType: 'editDraft',
        withoutPlaceholder: true,
        extraData: {
          draftVersionId: draftVersionId || '',
        },
      };
      this.mailApi.callWriteLetterFunc(draftParams);
    } else {
      // 直接创建
      const initParams: WriteMailInitModelParams = {
        writeType: 'common',
        mailType: 'common',
        result: { ...draft, recoverCid: draft.cid },
        withoutPlaceholder: true,
      };
      this.mailApi.callWriteLetterFunc(initParams);
    }
  }
}

const mailDraftApiImpl: Api = new MailDraftApiImpl();

api.registerLogicalApi(mailDraftApiImpl);

export default mailDraftApiImpl;
