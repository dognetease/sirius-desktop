import { useState, useEffect, useMemo } from 'react';
import { ContactModel, api, EntityPersonalOrg, apis, ContactAndOrgApi, SystemApi } from 'api';
import { StaticNodeKey } from '@web-common/utils/contact_util';
import { ContactTreeDataNode, ContactTreeOrgNode, ContactTreeType } from '@web-common/components/util/contact';
import { getIn18Text } from 'api';
const contactApi = api.requireLogicalApi(apis.contactApiImpl) as ContactAndOrgApi;
const systemApi = api.getSystemApi() as SystemApi;
export type treeTypeMap = {
  [props in ContactTreeType]?: ContactTreeDataNode[];
};
export type PersonalContact = {
  contactName: string;
  contactEmail: string;
  contactPinyin?: string;
};
export type PersonalContactGroupItem = {
  key: string;
  title: string;
  contacts: PersonalContact[];
};
const usePersonalContactGroup = () => {
  const [personalContactGroup, setPersonalContactGroup] = useState<PersonalContactGroupItem[]>([]);
  const transPersonalOrgTree = (data: EntityPersonalOrg): ContactTreeOrgNode => {
    const { id, orgName } = data;
    return {
      key: id,
      title: orgName,
      isLeaf: false,
      orgInfo: data,
      nodeType: 'personalOrg',
    };
  };
  const initPersonalList = async () => {
    const list = await contactApi.doGetPersonalContact();
    const groupMap = new Map<string, Map<string, ContactModel>>();
    list.forEach(item => {
      const { personalOrg, id } = item.contact;
      const allMap = groupMap.get(StaticNodeKey.PERSON_ALL) || new Map<string, ContactModel>();
      allMap.set(id, item);
      groupMap.set(StaticNodeKey.PERSON_ALL, allMap);
      if (personalOrg?.length) {
        personalOrg.forEach(personalOrgId => {
          const idMap = groupMap.get(personalOrgId) || new Map<string, ContactModel>();
          idMap.set(id, item);
          groupMap.set(personalOrgId, idMap);
        });
      } else {
        const noGroupIdSet = groupMap.get(StaticNodeKey.PERSON_NO_GROUP) || new Map<string, ContactModel>();
        noGroupIdSet.set(id, item);
        groupMap.set(StaticNodeKey.PERSON_NO_GROUP, noGroupIdSet);
      }
    });
    return {
      groupMap,
      personalList: list,
    };
  };
  const initPersonal = async (): Promise<{
    groupMap: Map<string, Map<string, ContactModel>>;
    treeTypeMap: treeTypeMap;
  }> => {
    const [{ success, data: personalOrgList }, { groupMap, personalList }] = await Promise.all([
      contactApi.doGetPersonalOrg({ _account: systemApi.getCurrentUser()?.id || '' }),
      initPersonalList(),
    ]);
    let children: ContactTreeDataNode[] = [];
    if (success && personalOrgList) {
      children = personalOrgList.map(item => transPersonalOrgTree(item));
    }
    children.unshift({
      key: StaticNodeKey.PERSON_ALL,
      title: getIn18Text('SUOYOULIANXIREN'),
      isLeaf: false,
      nodeType: 'personalOrg',
    });
    const noGroupSize = groupMap.get(StaticNodeKey.PERSON_NO_GROUP)?.size || 0;
    if (noGroupSize && noGroupSize !== personalList.length) {
      children.push({
        key: StaticNodeKey.PERSON_NO_GROUP,
        title: getIn18Text('WEIFENZULIANXIREN'),
        isLeaf: false,
        nodeType: 'personalOrg',
      });
    }
    return {
      groupMap,
      treeTypeMap: {
        personal: [
          {
            key: 'personalRoot',
            nodeType: 'org',
            title: getIn18Text('GERENTONGXUNLU'),
            isLeaf: false,
            children,
          },
        ],
      },
    };
  };
  useEffect(() => {
    initPersonal().then(initData => {
      const { groupMap, treeTypeMap } = initData;
      const nextPersonalContactGroup: PersonalContactGroupItem[] = [];
      if (Array.isArray(treeTypeMap.personal) && treeTypeMap.personal[0] && Array.isArray(treeTypeMap.personal[0].children)) {
        treeTypeMap.personal[0].children.forEach(item => {
          if (groupMap.get(item.key as string)) {
            const contacts = [...groupMap.get(item.key as string)!.values()].map(({ contact }) => ({
              contactName: contact.contactName,
              contactEmail: contact.accountName,
              contactPinyin: contact.contactPinyin,
            }));
            nextPersonalContactGroup.push({
              key: item.key as string,
              title: item.title as string,
              contacts,
            });
          }
        });
        setPersonalContactGroup(nextPersonalContactGroup);
      }
    });
  }, []);
  const personalContactGroupMap = useMemo(
    () =>
      personalContactGroup.reduce<{
        [groupKey: string]: PersonalContactGroupItem;
      }>((accumulator, group) => ({ ...accumulator, [group.key]: group }), {}),
    [personalContactGroup]
  );
  const personalContacts = useMemo(
    () =>
      personalContactGroup.reduce<PersonalContact[]>((accumulator, group) => {
        group.contacts.forEach(contact => {
          if (accumulator.every(item => item.contactEmail !== contact.contactEmail)) {
            accumulator.push(contact);
          }
        });
        return accumulator;
      }, []),
    [personalContactGroup]
  );
  return {
    personalContactGroup,
    personalContactGroupMap,
    personalContacts,
  };
};
export default usePersonalContactGroup;
