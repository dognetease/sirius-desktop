/*
 * @Author: wangzhijie02
 * @Date: 2022-06-13 15:22:11
 * @LastEditors: wangzhijie02
 * @LastEditTime: 2022-08-15 16:39:27
 * @Description: file content
 */
import { apiHolder, apis, ContactAndOrgApi, EntityOrg, EntityTeamOrg, conf } from 'api';
import { compact, isArray, flatten, throttle } from 'lodash';
const contactApi = apiHolder.api.requireLogicalApi(apis.contactApiImpl) as ContactAndOrgApi;
import { getContactList, toContactInfo } from '../../components/Doc/doc';
import { CoactorState, syncPrivilegeContactImpl } from '../../components/SharePage/sharePage';
import { ContactInfo, GetContactListParams } from './bridge';
import { mailApi, systemApi } from './siriusApi';

const isTeam = (el: any): el is EntityTeamOrg => {
  if (el && el.memberNum) {
    return true;
  }
  return false;
};
const isOrg = (el: any): el is EntityOrg => {
  if (el && el.orgName) {
    return true;
  }
  return false;
};
/**
 * 获取指定部门下所有成员（会递归部门）
 * @param id
 * @returns
 */
const getContactByOrgId = async (id: string) => {
  const orgInfo = await contactApi.doGetContactOrg({ orgId: id });
  if (orgInfo.orgList) {
    const orgIds = orgInfo.orgList.map(item => item.id);
    const uniqueOrgIds = Array.from(new Set(orgIds));
    return contactApi.doGetContactByOrgId(uniqueOrgIds);
  }
  return [];
};
const getContactIdListByTeamId = (teamId: string[]): Promise<string[]> => {
  if (teamId.length === 0) {
    return Promise.resolve([]);
  }
  const idList = teamId.map(id => {
    return `team_${id}`;
  });
  return contactApi
    .doGetOrgContactListByTeamId({
      idList,
      needContactModelData: true,
      filterSelf: false,
    })
    .then(res => {
      const list: string[] = [];
      res.forEach(item => {
        if (isArray(item)) {
          item.forEach(el => {
            list.push(el.contactId);
          });
        } else {
          item.contact;
          list.push(item.contactId);
        }
      });
      return list;
    })
    .catch(error => {
      return [];
    });
};
export async function getUnitableCellContactList(params: GetContactListParams, resourceId?: number): Promise<ContactInfo[]> {
  return new Promise(resolve => {
    const fun = async () => {
      console.log('getUnitableCellContactList: 接受的参数：', params);
      if (params.type === 'uid') {
        const contactList = await contactApi.doGetContactById(params.uid);
        resolve(contactList.map(toContactInfo));
        return;
      }
      if (params.type === 'search') {
        const list = await getContactList(params.prefix);
        resolve(list);
        return;
      }
      if (params.type === 'collaborator') {
        if (resourceId === undefined) {
          // 如果resourceId不存在，则不支持
          resolve([]);
          return;
        }
        syncPrivilegeContactImpl(
          {
            resourceId,
            resourceType: 'FILE',
          },
          {
            setContactList: async list => {
              const contactIds: string[] = [];
              const teamIds: string[] = [];
              const orgIds: string[] = [];
              list.forEach(item => {
                const el = item as any;
                const id = el?.contact?.id;
                if (id) {
                  contactIds.push(id);
                } else if (isTeam(el)) {
                  teamIds.push(el.id);
                } else if (isOrg(el)) {
                  orgIds.push(el.id);
                }
              });
              const orgList = orgIds.map(orgId => {
                return getContactByOrgId(orgId);
              });
              const [teamContactIdList, orgContactList] = await Promise.all([getContactIdListByTeamId(teamIds), Promise.all(orgList)]);
              const orgContactIdList = flatten(orgContactList).map(item => {
                return item.contact.id;
              });
              const set = new Set([...contactIds, ...teamContactIdList, ...orgContactIdList]);
              const contactIdList = Array.from(set);
              const contactList = await contactApi.doGetContactById(contactIdList);
              resolve(contactList.map(toContactInfo));
            },
          }
        );
      }
    };
    setTimeout(() => {
      resolve([]);
    }, 5000);
    // 精准匹配：通过用户id获取用户信息
    fun().catch(error => {
      console.log('getUnitableCellContactList 执行报错：', error);
      resolve([]);
    });
  });
}

const sendEmailImpl = (contact?: string[]) => {
  console.warn('unitable 云文档执行调用写邮件组件');
  try {
    if (apiHolder.env.forElectron) {
      mailApi.doWriteMailToContact(contact);
    } else if (systemApi.isMainPage()) {
      mailApi.doWriteMailToContact(contact);
    } else {
      const host = conf('host');
      const contactName = contact ? contact[0] : '';
      systemApi.openNewWindow(host + '/#?writeMailToContact=' + contactName, false);
    }
    return true;
  } catch (error) {
    console.log('unitable bridge sendEmial method throw error: ', error);
    return false;
  }
};
export const sendEmail = throttle(sendEmailImpl, 1000, {
  leading: true,
  trailing: false,
});
