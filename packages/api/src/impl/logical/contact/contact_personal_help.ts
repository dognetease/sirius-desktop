import merge from 'lodash/merge';
import lodashIntersection from 'lodash/intersection';
import cloneDeep from 'lodash/cloneDeep';
import lodashGroupBy from 'lodash/groupBy';
import { api } from '@/api/api';
import { ContactServer, ContactServerInstance } from './contact_server';
import {
  ContactCommonRes,
  contactUpdateParams,
  DeletePersonalOrgParams,
  diffRes,
  handleSyncParams,
  InsertPersonalOrgRes,
  syncRes,
  contactInsertParams,
  contactDeleteParams,
  PersonalImportParams,
  PersonalExportParams,
  ContactMultileAccountOption,
  PersonalOrgParams,
} from '@/api/logical/contactAndOrg';
import { util } from '@/api/util';
import { ContactDB, ContactDBInstance } from './contact_dbl';
import ContactUtilInterface, { ContactConst } from './contact_util';
import { ContactTransform, ContactTransformInstance } from './contact_transform';
import { CatchErrorRes, ContactModel, EntityPersonalOrg, EntityPersonalOrgContact, EntityPersonalMark } from '@/api/_base/api';

export class ContactPersonalHelper {
  systemApi = api.getSystemApi();

  contactServer: ContactServer = ContactServerInstance;

  contactDB: ContactDB = ContactDBInstance;

  contactUtil: ContactConst = ContactUtilInterface;

  contactTrans: ContactTransform = ContactTransformInstance;

  /**
   * 将服务端分组id转换成本地分组id
   * @param id
   */
  transOrgIdByPersonalOrg(id: string) {
    if (id.startsWith('personal_org_')) {
      return id;
    }
    return 'personal_org_' + id;
  }

  /**
   * 获取分组列表
   * @param params
   */
  async doGetPersonalOrg(params: ContactMultileAccountOption<PersonalOrgParams>): Promise<ContactCommonRes<EntityPersonalOrg[]>> {
    const { _account = this.contactUtil.getCurrentAccount(), idList = [] } = params;

    try {
      const data = await this.contactDB.getPersonalOrg({
        idList: idList as string[],
        _account,
      });
      return {
        success: true,
        data,
      };
    } catch (e) {
      console.error('[contact] doGetPersonalOrg', e);
      return {
        success: false,
      };
    }
  }

  /**
   * 添加分组
   * @param name
   * @param idList
   */
  async doInsertPersonalOrg(
    params: ContactMultileAccountOption<{ groupName: string; idList?: string[]; isMark?: boolean }>
  ): Promise<ContactCommonRes<InsertPersonalOrgRes>> {
    const { isMark, groupName: name, _account } = params;
    try {
      let marked: number | undefined;
      // 如果要打星标 需要计算本地最大星标数
      if (isMark) {
        const { count: maxMarkedNum } = await this.contactDB.getMaxPersonalMark(_account);
        marked = maxMarkedNum + 1;
      }

      const { data, success, message } = await this.contactServer.insertPersonalOrg({
        groupName: name,
        idList: params.idList || [],
        marked,
        _account,
      });
      if (success && data) {
        // 将服务端分组数据转化成本地分组数据
        const orgList = this.contactDB.personalOrgIntoOrg([data.personContactGroup]);
        const orgIdList = [this.transOrgIdByPersonalOrg(data.personContactGroup.groupId)];
        const promiseList: Promise<ContactCommonRes<syncRes>>[] = [];

        // 如果打星标了 将星标数据插入到table中
        if (marked && data.personContactGroup.groupId) {
          await this.contactDB.doInsertPersonalMark(
            {
              list: [
                {
                  type: 2,
                  value: data.personContactGroup.groupId,
                  orginId: data.personContactGroup.groupId,
                  name,
                  emails: [],
                  marked,
                },
              ],
              _account,
            },
            {
              isIncrease: true,
              _lastUpdateTime: Date.now(), // 最后修改时间，用来删除
            }
          );
        }

        if (orgList?.length) {
          // 将本地分组数据加入org数据库
          promiseList.push(
            this.contactDB
              .intoTable(
                {
                  tableName: this.contactUtil.orgTable,
                  list: orgList,
                  _account,
                },
                {
                  asSoon: true,
                }
              )
              .then(() =>
                this.handlePersonalOrgSyncRes({
                  action: 'insert',
                  success: true,
                  idList: orgIdList,
                })
              )
          );
        }
        if (data.accountIdList?.length) {
          // 构建分组与联系人关联数据
          const personalOrgContact = this.contactTrans.transPersonalOrgContact(data.accountIdList, orgIdList);
          // 分组与联系人关联数据加入orgContact数据库
          promiseList.push(
            this.contactDB
              .intoTable(
                {
                  tableName: this.contactUtil.orgContactTable,
                  list: personalOrgContact,
                  _account,
                },
                {
                  asSoon: true,
                }
              )
              .then(() =>
                this.handlePersonalOrgContactSyncRes({
                  success: true,
                  action: 'insert',
                  idList: util.getKeyListByList(personalOrgContact, 'id'),
                })
              )
          );
          // 修改个人联系人的personalOrg字段 在之前的分组id上加入新的分组id
          promiseList.push(
            this.contactDB
              .updateContactById({
                list: data.accountIdList.map(id => ({
                  id,
                  personalOrg: orgIdList,
                })),
                action: 'insert',
                _account,
              })
              .then(({ success: isSuccess }) =>
                this.handlePersonalSyncRes({
                  action: 'update',
                  success: isSuccess,
                  idList: data.accountIdList,
                })
              )
          );
        }
        const arr = await Promise.all(promiseList);
        const { flag, resData } = this.handleSyncRes(arr);
        if (flag) {
          this.contactDB.sendContactNotify({
            ...resData,
            _account,
          });
          return {
            success: true,
            data: {
              id: this.transOrgIdByPersonalOrg(data.personContactGroup.groupId),
              name: data.personContactGroup.groupName,
            },
          };
        }
      }
      return {
        success: false,
        message,
      };
    } catch (e) {
      console.error('[contact] doInsertPersonalOrg error', e);
      return {
        success: false,
      };
    }
  }

  /**
   * 编辑分组
   * @param orgId: 分组id
   * @param name: 分组名称
   * @param idList
   */
  async doUpdatePersonalOrg(
    params: ContactMultileAccountOption<{ orgId: string; groupName: string; idList: string[]; isMark?: true | false }>
  ): Promise<ContactCommonRes> {
    const { orgId, groupName: name, idList, isMark = false, _account } = params;
    try {
      let syncResArr: Array<ContactCommonRes<syncRes>> = [];

      let marked: undefined | number;
      const { count: maxMarkedNum, data: markList } = await this.contactDB.getMaxPersonalMark(_account);

      const markMap = new Map(markList.filter(item => item.type === 2).map(item => [item.value as string, item.marked]));

      // 如果要设置星标 && 星标列表中没有包含当前orgId 递增makred
      if (isMark && !markMap.has(orgId)) {
        marked = maxMarkedNum + 1;
      }

      // 如果要取消星标 并且星标列表中没有包含当前orgId
      if (!isMark && markMap.has(orgId)) {
        marked = -100;
      }

      // 如果要设置星标 && 星标列表有包含当前orgId传递原始的marked
      if (isMark && markMap.has(orgId)) {
        marked = markMap.get(orgId);
      }

      const { data, success } = await this.contactServer.updatePersonalOrg({
        orgId,
        groupName: name,
        idList,
        marked,
        _account: params._account,
      });
      if (success && data) {
        // 更新星标数据
        if (typeof marked === 'number') {
          await this.contactDB.doInsertPersonalMark(
            {
              list: [
                {
                  type: 2,
                  value: orgId,
                  name,
                  emails: [],
                  marked,
                },
              ],
              _account,
            },
            {
              isIncrease: true,
              _lastUpdateTime: Date.now(),
            }
          );
        }

        // 获取联系人与分组的关联关系
        const res = await this.doGetPersonalOrgContactByOrgId({ id: [orgId], _account });
        if (res.success && res.data) {
          // 联系人与分组的关联关系id集合
          const personalOrgContactIdSet = new Set<string>();
          // 分组对应的个人联系人id集合
          const personalContactIdSet = new Set<string>();
          Object.values(res.data).forEach(item => {
            item.forEach(({ id: orgContactId, contactId }) => {
              personalOrgContactIdSet.add(orgContactId);
              personalContactIdSet.add(contactId);
            });
          });
          const ids = [...personalOrgContactIdSet];
          const contactIds = [...personalContactIdSet];
          const list: Promise<ContactCommonRes<syncRes>>[] = [];
          if (ids.length) {
            // 删除之前联系人与分组的关联关系id集合
            list.push(
              this.contactDB
                .deleteData({
                  tableName: this.contactUtil.orgContactTable,
                  list: ids,
                  _account,
                })
                .then(isSuccess =>
                  this.handlePersonalOrgContactSyncRes({
                    idList: ids,
                    success: isSuccess,
                    action: 'delete',
                  })
                )
            );
          }
          if (contactIds.length) {
            list.push(
              this.contactDB
                .updateContactById({
                  list: contactIds.map(id => ({
                    id,
                    personalOrg: [orgId],
                  })),
                  action: 'delete',
                  _account,
                })
                .then(({ success: isSuccess }) =>
                  this.handlePersonalSyncRes({
                    idList: contactIds,
                    success: isSuccess,
                    action: 'update',
                  })
                )
            );
            // 修改个人联系人的personalOrg字段 在个人联系人之前的分组id上删除当前的orgId
          }
          const arr = await Promise.all(list);
          syncResArr = syncResArr.concat(arr);
        }
        // 将服务端分组数据转化成本地分组数据
        const orgList = this.contactDB.personalOrgIntoOrg([data.personContactGroup]);
        // 分组id列表
        const orgIdList = [this.transOrgIdByPersonalOrg(data.personContactGroup.groupId)];
        const promiseList: Promise<ContactCommonRes<syncRes>>[] = [];
        // 将修改的本地分组数据加入org数据库
        promiseList.push(
          this.contactDB
            .intoTable(
              {
                tableName: this.contactUtil.orgTable,
                list: orgList,
                _account,
              },
              {
                asSoon: true,
              }
            )
            .then(() =>
              this.handlePersonalOrgSyncRes({
                idList: orgIdList,
                action: 'insert',
                success: true,
              })
            )
        );
        // 给修改的分组加上联系人
        if (data.accountIdList) {
          // 构建分组与联系人关联数据
          const personalOrgContact = this.contactTrans.transPersonalOrgContact(data.accountIdList, orgIdList);
          // 将分组与联系人关联数据加入orgContact数据库
          promiseList.push(
            this.contactDB
              .intoTable(
                { tableName: this.contactUtil.orgContactTable, list: personalOrgContact, _account },
                {
                  asSoon: true,
                }
              )
              .then(() =>
                this.handlePersonalOrgContactSyncRes({
                  idList: personalOrgContact.map(oItem => oItem.id),
                  action: 'insert',
                  success: true,
                })
              )
          );
          // 修改个人联系人的personalOrg字段 在个人联系人之前的分组id上加入新的分组id
          promiseList.push(
            this.contactDB
              .updateContactById({
                list: data.accountIdList.map(id => ({
                  id,
                  personalOrg: orgIdList,
                })),
                action: 'insert',
                _account,
              })
              .then(({ success: isSuccess }) =>
                this.handlePersonalSyncRes({
                  idList: data.accountIdList,
                  success: isSuccess,
                  action: 'update',
                })
              )
          );
        }
        const arr = await Promise.all(promiseList);
        syncResArr = syncResArr.concat(arr);
        const { flag, resData } = this.handleSyncRes(syncResArr);
        if (flag) {
          this.contactDB.sendContactNotify({
            ...resData,
            _account,
          });
          return {
            success: true,
            data: {
              id: orgId,
              name,
            },
          };
        }
      }
      return {
        success: false,
      };
    } catch (e) {
      console.error('[contact] doUpdatePersonalOrg error', e);
      return {
        success: false,
      };
    }
  }

  /**
   * 通过分组获取分组关联关系
   * @param id
   */
  async doGetPersonalOrgContactByOrgId(
    params: ContactMultileAccountOption<{ id: string | string[] }>
  ): Promise<ContactCommonRes<Record<string, EntityPersonalOrgContact[]>>> {
    const { id, _account } = params;
    try {
      const idList = util.singleToList<string>(id);
      const orgContactList = (await this.contactDB.getOrgContactList({
        idList,
        type: 'orgId',
        needGroup: false,
        needContactData: false,
        needContactModelData: false,
        _account,
      })) as EntityPersonalOrgContact[];
      const data: Record<string, EntityPersonalOrgContact[]> = {};
      orgContactList.forEach(item => {
        const arr = data[item.orgId] || [];
        arr.push(item);
        data[item.orgId] = arr;
      });
      return {
        success: true,
        data,
      };
    } catch (e) {
      return {
        success: false,
      };
    }
  }

  /**
   * 给分组新增联系人
   * @param orgIdList
   * @param idList
   */
  async doInsertContactByPersonalOrgId(params: ContactMultileAccountOption<{ orgIdList: string[]; idList: string[] }>): Promise<ContactCommonRes> {
    const { orgIdList, idList, _account } = params;
    try {
      const notInPersonalOrg = orgIdList.some(item => !item.startsWith('personal_org'));
      if (notInPersonalOrg) {
        throw new Error('personal_org id not exits');
      }
      const { success, message } = await this.contactServer.insertPersonalContactByPersonalOrgId(params);
      if (success) {
        const personalOrgContact = this.contactTrans.transPersonalOrgContact(idList, orgIdList);
        const arr = await Promise.all([
          this.contactDB
            .intoTable(
              {
                tableName: this.contactUtil.orgContactTable,
                list: personalOrgContact,
                _account,
              },
              {
                asSoon: true,
              }
            )
            .then(() =>
              this.handlePersonalOrgContactSyncRes({
                success: true,
                idList: personalOrgContact.map(item => item.id),
                action: 'insert',
              })
            ),
          this.contactDB
            .updateContactById({
              list: idList.map(id => ({
                id,
                personalOrg: orgIdList,
              })),
              action: 'insert',
              _account,
            })
            .then(({ success: isSuccess }) =>
              this.handlePersonalSyncRes({
                success: isSuccess,
                idList,
                action: 'update',
              })
            ),
        ]);
        const { flag, resData } = this.handleSyncRes(arr);
        if (flag) {
          this.contactDB.sendContactNotify({
            ...resData,
            _account,
          });
          return {
            success: true,
          };
        }
      }
      return {
        success: false,
        message,
      };
    } catch (e) {
      console.error('[contact] doInsertContactByPersonalOrgId error', e);
      return {
        success: false,
      };
    }
  }

  /**
   * 删除分组
   * @param params
   */
  async doDeletePersonalOrg(params: ContactMultileAccountOption<DeletePersonalOrgParams>): Promise<ContactCommonRes> {
    const { orgIdList, deletePersonContact, _account } = params;
    try {
      const notInPersonalOrg = orgIdList.some(item => !item.startsWith('personal_org'));
      if (notInPersonalOrg) {
        throw new Error('personal_org id not exits');
      }
      const res = await this.contactServer.deletePersonalOrg(params);
      if (res.success) {
        // 删除星标数据
        await this.contactDB.doDeletePersonalMark({
          ids: params.orgIdList.map(item => (!item.startsWith('personal_org') ? `personal_org_${item}` : item)),
          _account,
        });

        const promiseList: Promise<ContactCommonRes<syncRes>>[] = [];

        const { success, data: personalOrgContactMap } = await this.doGetPersonalOrgContactByOrgId({ id: orgIdList, _account });
        // 删除org数据库的分组id
        const deleteOrgPromise = this.contactDB
          .deleteData({
            tableName: this.contactUtil.orgTable,
            list: orgIdList,
            _account,
          })
          .then(isSuccess =>
            this.handlePersonalOrgSyncRes({
              success: isSuccess,
              idList: orgIdList,
              action: 'delete',
            })
          );
        promiseList.push(deleteOrgPromise);
        // 删除orgContactIds
        if (success && personalOrgContactMap) {
          const personalOrgIdSet = new Set<string>();
          const personalContactIdSet = new Set<string>();
          Object.values(personalOrgContactMap).forEach(item => {
            item.forEach(({ id, contactId }) => {
              personalOrgIdSet.add(id);
              personalContactIdSet.add(contactId);
            });
          });
          const orgContactIdList = [...personalOrgIdSet.keys()];
          const contactIdList = [...personalContactIdSet.keys()];
          if (orgContactIdList.length) {
            // 删除orgId关联的orgContact数据库关联关系
            const deleteOrgContact = this.contactDB
              .deleteData({
                tableName: this.contactUtil.orgContactTable,
                list: orgContactIdList,
                _account,
              })
              .then(isSuccess =>
                this.handlePersonalOrgContactSyncRes({
                  idList: orgContactIdList,
                  success: isSuccess,
                  action: 'delete',
                })
              );
            promiseList.push(deleteOrgContact);
          }
          if (!deletePersonContact && contactIdList.length) {
            // 修改个人联系人的personalOrg字段 在个人联系人之前的分组id上sh的删掉分组id
            const updateContact = this.contactDB
              .updateContactById({
                list: contactIdList.map(id => ({
                  id,
                  personalOrg: orgIdList,
                })),
                action: 'delete',
                _account,
              })
              .then(({ success: isSuccess }) =>
                this.handlePersonalSyncRes({
                  idList: contactIdList,
                  success: isSuccess,
                  action: 'update',
                })
              );
            promiseList.push(updateContact);
          }
          if (deletePersonContact && contactIdList.length) {
            const deletePersonal = this.contactDB
              .personalContactDelete({
                list: contactIdList,
                _account,
              })
              .then(({ success: isSuccess }) =>
                this.handlePersonalSyncRes({
                  idList: contactIdList,
                  success: isSuccess,
                  action: 'delete',
                })
              );
            promiseList.push(deletePersonal);
          }
        }
        const arr = await Promise.all(promiseList);
        const { flag, resData } = this.handleSyncRes(arr);
        if (flag) {
          this.contactDB.sendContactNotify({
            ...resData,
            _account,
          });
          return {
            success: true,
          };
        }
        return {
          success: false,
        };
      }
      return {
        success: false,
        message: res.message === 'FA_GROUP_NOT_FOUND' ? '分组已被删除！' : res.message,
      };
    } catch (e) {
      console.error('[contact] doDeletePersonalOrg error', e);
      return {
        success: false,
      };
    }
  }

  async doInsertContact(params: ContactMultileAccountOption<{ list: contactInsertParams | contactInsertParams[] }>): Promise<CatchErrorRes<ContactModel[]>> {
    const { list: _list, _account } = params;
    try {
      // 如果需要打星标
      let list = Array.isArray(_list) ? _list : [_list];

      if (!list.length) {
        return { success: false };
      }
      const needMark = list.some(item => item.isMark);

      if (needMark) {
        let { count: maxMarkedNum } = await this.contactDB.getMaxPersonalMark(_account);

        list = list.map(item => {
          if (item.isMark) {
            item.marked = ++maxMarkedNum;
          }
          return item;
        });
      }
      const data = await this.contactServer.insertPersonalContact(params);

      // 更新星标DB
      if (needMark && data?.success) {
        const markList = data.data!.map(item => ({
          emails: item.email,
          type: 1,
          value: item.qiyeAccountId,
          name: item.qiyeAccountName,
          marked: item.marked,
        }));

        await this.contactDB.doInsertPersonalMark({ list: markList, _account });
      }

      return this.contactDB.doInsertOrReplacePersonal({ data: data!, _account });
    } catch (e) {
      console.error('[contact] doInsertContact error', e);
      return {
        success: false,
      };
    }
  }

  /**
   * 更新个人联系人
   * @param params
   */
  async doUpdateContact(_params: ContactMultileAccountOption<{ params: contactUpdateParams }>): Promise<CatchErrorRes<ContactModel[]>> {
    try {
      const { isMainAccount, _account, params } = _params;

      params.groupIdList = params.groupIdList?.filter(item => item && item.match(/\d/));

      // 添加星标排序
      const { count: maxMarkedNum, data: personalMarkList } = await this.contactDB.getMaxPersonalMark(_account);
      const personamMarkMap = new Map(personalMarkList.map(item => [item.value, item.marked]));
      // 如果需要星标&& 之前没有标记过 递增mark值
      if (params.isMark === true && !personamMarkMap.has(params.accountId)) {
        params.marked = maxMarkedNum + 1;
      }
      // 取消星标
      if (!params.isMark && personamMarkMap.has(params.accountId)) {
        params.marked = -100;
      }

      // 如果需要星标&之前标记过 直接传递之前的mark值
      if (params.isMark && personamMarkMap.has(params.accountId)) {
        params.marked = personamMarkMap.get(params.accountId);
      }

      Reflect.deleteProperty(params, 'isMark');

      const data = await this.contactServer.updatePersonalContact(_params);

      // 如果>0 表示要更新星标 否则则是删除星标
      if (typeof params.marked === 'number' && params.marked > 0) {
        const list = this.contactTrans.transformPersonalParam2PersonalMarkEntityList(params);
        this.contactDB.doInsertPersonalMark({ list, _account, isMainAccount });
      } else if (params.marked === -100) {
        this.contactDB.doDeletePersonalMark({
          ids: [params.accountId],
          _account,
        });
      }

      return this.contactDB.doInsertOrReplacePersonal({ data: data!, _account });
    } catch (e) {
      console.error('[contact] doInsertContact error', e);
      return {
        success: false,
      };
    }
  }

  /**
   * 删除个人联系人
   * @param params
   */
  async doDeleteContact(params: ContactMultileAccountOption<contactDeleteParams>): Promise<boolean> {
    try {
      const data = await this.contactServer.deletePersonalContact(params);
      if (!data || !data.success) {
        return false;
      }

      const { data: personalMarkList } = await this.contactDB.getMaxPersonalMark(params._account);

      const personalMarkContactIds = personalMarkList.map(item => item.value as string);

      const needDeleteMarkIds = lodashIntersection(params.accountIdList, personalMarkContactIds);
      // 删除星标数据
      if (needDeleteMarkIds.length) {
        await this.contactDB.doDeletePersonalMark({
          ids: needDeleteMarkIds,
          _account: params._account,
        });
      }

      const { success, data: resData } = await this.contactDB.personalContactDelete({
        list: params.accountIdList,
        _account: params._account,
      });

      if (success && resData) {
        this.contactDB.sendContactNotify({
          ...resData,
          ...this.contactUtil.getPublicParamFromMultipleOptions(params),
        });
      }
      return true;
    } catch (e) {
      console.error('[contact] doDeleteContact error', e);
      return false;
    }
  }

  async doBatchDeletePersonalMark(
    params: ContactMultileAccountOption<{
      configList: {
        type: 1 | 2;
        id: string;
      }[];
    }>
  ) {
    const { configList, _account } = params;
    const operationList = configList.map(item => ({
      marked: -100,
      type: item.type === 1 ? '1' : '2',
      id: item.id,
    }));

    // 调用服务端API执行加/删星标操作
    await this.contactServer.batchOperatePersonalMark({
      operateList: cloneDeep(operationList),
      _account: this.systemApi.getCurrentUser()?.id || '',
    });

    const contactIdMap: Map<string, { id: string; marked: number }> = new Map();
    const orgIdMap: Map<string, { id: string; marked: number }> = new Map();
    const ids: Set<string> = new Set();

    operationList.forEach(item => {
      if (item.type === '1') {
        contactIdMap.set(item.id, {
          id: item.id,
          marked: item.marked,
        });
      } else {
        orgIdMap.set(item.id, {
          id: item.id,
          marked: item.marked,
        });
      }

      ids.add(item.id);
    });

    //  删除personalMark表 & 更新 contact/org表
    await Promise.all([
      this.contactDB.doDeletePersonalMark({
        ids: [...ids],
        _account,
      }),
      contactIdMap.size
        ? this.contactDB.updateContactOrgMarkInfoWithQuery({
            ids: contactIdMap,
            type: 1,
            _account,
          })
        : Promise.resolve([]),
      orgIdMap.size
        ? this.contactDB.updateContactOrgMarkInfoWithQuery({
            ids: orgIdMap,
            type: 2,
            _account,
          })
        : Promise.resolve([]),
    ]);
    return true;
  }

  async doBatchAddPersonalMark(
    params: ContactMultileAccountOption<{
      configList: {
        type: 1 | 2;
        id: string;
      }[];
    }>
  ) {
    const { configList, _account } = params;
    const { count: baseMarkedValue, data: allMarkList } = await this.contactDB.getMaxPersonalMark(_account);
    const operationList = new Map(
      configList.map((item, index) => [
        item.id,
        {
          marked: baseMarkedValue + 1 + index,
          type: item.type === 1 ? '1' : '2',
          id: item.id,
        },
      ])
    );

    const allMarkIdsSet = new Set(allMarkList.map(item => item.value));
    // 如果所有的ID都在本地DB中已经存在 表示只是做数据更新
    const noNewMarkData = configList.every(item => allMarkIdsSet.has(item.id));

    // 调用服务端API执行加/删星标操作
    await this.contactServer.batchOperatePersonalMark({
      operateList: cloneDeep([...operationList.values()]),
      _account: this.systemApi.getCurrentUser()?.id || '',
    });

    const contactRequestIds: string[] = [];
    const orgIdRequestIds: string[] = [];

    operationList.forEach(item => {
      if (item.type === '1') {
        contactRequestIds.push(item.id);
      } else {
        orgIdRequestIds.push(item.id);
      }
    });

    // 查询contact & contactItem & org相关信息
    const [contactModelList, contactItemModelList, orgModelList] = await Promise.all([
      contactRequestIds.length
        ? this.contactDB.getContactList({
            idList: contactRequestIds,
          })
        : Promise.resolve([]),
      contactRequestIds.length
        ? this.contactDB.getContactItemListByContactId({
            idList: contactRequestIds,
          })
        : Promise.resolve([]),
      orgIdRequestIds.length
        ? this.contactDB.getOrgList({
            idList: orgIdRequestIds,
            _account,
          })
        : Promise.resolve([]),
    ]);

    const markIntoList: Map<string, EntityPersonalMark> = new Map();

    // 生成marktable完整数据
    // 先插入contact类型数据数据
    const groupByContactIdObj = lodashGroupBy(
      contactItemModelList.filter(item => item.contactItemType === 'EMAIL'),
      item => item.contactId
    );

    Object.keys(groupByContactIdObj).forEach(contactId => {
      const emails = groupByContactIdObj[contactId].map(item => item.contactItemVal);
      markIntoList.set(contactId, {
        emails,
        value: contactId,
        type: 1,
      } as unknown as EntityPersonalMark);
    });

    contactModelList
      .filter(item => markIntoList.has(item.id))
      .forEach(item => {
        const markObjPart = markIntoList.get(item.id)!;

        markIntoList.set(item.id, {
          ...markObjPart,
          name: item.contactName,
          marked: operationList.get(item.id)!.marked,
          // 需要修改成服务端的ID
          originId: item.id,
        });
      });

    // 在插入org类型数据
    orgModelList.forEach(item => {
      markIntoList.set(item.originId, {
        emails: [],
        value: item.id,
        type: 2,
        name: item.orgName,
        marked: operationList.get(item.id)!.marked,
        // 需要修改成服务端的ID
        originId: item.originId,
      } as unknown as EntityPersonalMark);
    });

    // 插入DB表
    await Promise.all([
      this.contactDB.doInsertPersonalMark(
        {
          list: [...markIntoList.values()].flat(),
          _account,
        },
        { quickUpdate: true, isIncrease: true, noNewMarkData }
      ),

      // 更新Contact表
      contactModelList.length
        ? this.contactDB.updateContactOrgMarkInfo({
            list: contactModelList.map(item => ({
              ...item,
              marked: operationList.get(item.id)!.marked || 0,
            })),
            type: 1,
            _account,
          })
        : Promise.resolve([]),

      // 更新Org表
      orgModelList.length
        ? this.contactDB.updateContactOrgMarkInfo({
            list: orgModelList.map(item => ({
              ...item,
              marked: operationList.get(item.id)!.marked || 0,
            })),
            type: 2,
            _account,
          })
        : Promise.resolve([]),
    ]);
    return true;
  }

  // 批量操作(添加、取消)星标
  async doBatchOperatePersonalMark(
    params: ContactMultileAccountOption<{
      configList: {
        type: 1 | 2;
        id: string;
      }[];
    }>,
    action: 'add' | 'cancel' = 'add'
  ) {
    const { configList, _account } = params;
    if (!Array.isArray(configList) || !configList.length) {
      return { success: false, msg: '传参不能为空' };
    }

    try {
      if (action === 'add') {
        await this.doBatchAddPersonalMark({
          configList,
          _account,
        });
      } else {
        await this.doBatchDeletePersonalMark(params);
      }
      return {
        success: true,
        msg: '',
      };
    } catch (ex) {
      return {
        success: false,
        msg: ex instanceof Error ? ex.message : `${ex}`,
      };
    }
  }

  async handlePersonalOrgSyncRes(params: handleSyncParams): Promise<ContactCommonRes<syncRes>> {
    const { success, action, idList } = params;
    if (success) {
      const orgPersonal: diffRes = {};
      if (action === 'delete') {
        orgPersonal.deleteDiff = idList;
      } else if (action === 'insert') {
        orgPersonal.insertDiff = idList;
      } else {
        orgPersonal.updateDiff = idList;
      }
      return {
        success: true,
        data: {
          org_personal: orgPersonal,
          syncStatus: {
            personalOrg: true,
          },
        },
      };
    }
    return {
      success: false,
    };
  }

  async handlePersonalOrgContactSyncRes(params: handleSyncParams): Promise<ContactCommonRes<syncRes>> {
    const { success, action, idList } = params;
    if (success) {
      const orgContact_personal: diffRes = {};
      if (action === 'delete') {
        orgContact_personal.deleteDiff = idList;
      } else if (action === 'insert') {
        orgContact_personal.insertDiff = idList;
      } else {
        orgContact_personal.updateDiff = idList;
      }
      return {
        success: true,
        data: {
          orgContact_personal,
          syncStatus: {
            personalOrg: true,
          },
        },
      };
    }
    return {
      success: false,
    };
  }

  async handlePersonalSyncRes(params: handleSyncParams): Promise<ContactCommonRes<syncRes>> {
    const { success, action, idList } = params;
    if (success) {
      const contact_personal: diffRes = {};
      if (action === 'delete') {
        contact_personal.deleteDiff = idList;
      } else if (action === 'insert') {
        contact_personal.insertDiff = idList;
      } else {
        contact_personal.updateDiff = idList;
      }
      return {
        success: true,
        data: {
          contact_personal,
          syncStatus: {
            personal: true,
          },
        },
      };
    }
    return {
      success: false,
    };
  }

  handleSyncRes(arr: ContactCommonRes<syncRes>[]) {
    let resData: syncRes = {};
    let flag = true;
    arr.forEach(item => {
      if (item.success && item.data && flag) {
        resData = merge(resData, item.data);
      } else {
        flag = false;
      }
    });
    return {
      resData,
      flag,
    };
  }

  // 导入联系人
  async importPersonalContact(params: PersonalImportParams): Promise<ContactCommonRes<number>> {
    try {
      const res = await this.contactServer.personContactImport(params);
      if (res.success && res.data) {
        await this.contactDB.doInsertOrReplacePersonal({
          data: {
            success: true,
            data: res.data,
          },
          _account: this.systemApi.getCurrentUser()?.id || '',
        });
        return {
          success: true,
          data: res.data.length,
        };
      }
      return {
        success: false,
        code: res.code,
        message: res.message,
      };
    } catch (e) {
      console.error('[contact_personal_help] importPersonalContact error', e);
      return {
        success: false,
        message: this.contactUtil.catchError(e),
      };
    }
  }

  // 导出联系人
  exportPersonalContact(params: PersonalExportParams) {
    return this.contactServer.personContactExport(params);
  }

  // 导出联系人模板
  exportPersonalContactTemplate(type?: 1 | 2) {
    return this.contactServer.personContactExportTemplate(type);
  }
}

export const ContactPersonalHelperInstance = new ContactPersonalHelper();
