import React from 'react';
import { MemberType, MailBoxEntryContactInfoModel, ContactModel, api, ContactAndOrgApi, apis } from 'api';
import OptionItem from './contact-option-item';
import TeamOptionItem from './team-option-item';
import { ContactItem, OrgItem, transMailContactModel2ContactItem } from '@web-common/utils/contact_util';
// import { getContactItemKey } from '@web-common/components/util/contact';

export interface OptionLabel {
  key?: string;
  value: string;
  label: React.ReactElement;
}

export const modelToContactInfo = (model: ContactModel, type: MemberType): MailBoxEntryContactInfoModel => {
  const email = contactApi.doGetModelDisplayEmail(model);
  const infoItem = model.contactInfo.find(info => info.contactItemType === 'EMAIL' && info.contactItemVal === email);
  return {
    contact: model,
    contactItem: infoItem!,
    mailMemberType: type,
    inContactBook: true,
  };
};

export const getContactModelKey = (item: ContactItem): string => `${item.id || '_'}_${item.email || '_'}`;

export const getTeamContactKey = (item: OrgItem): string => `${item.id}_${item.orgRank}`;

export const buildOptionLabel: (item: ContactItem, search?: string, useComposite?: true) => OptionLabel = (item, search, useComposite) => {
  // const key = getContactItemKey(item, useId);
  const key = useComposite ? `${item.id}###${item.email}` : item?.email || '';

  console.warn('buildOptionLabel', key, item, search);
  return {
    search, // 阻止antd自动生成当前搜索词的option
    value: key, // 作为tag、option的key
    label: <OptionItem key={key} item={item} search={search} />,
  };
};

export const buildTeamOptionLabel: (item: OrgItem, search?: string) => OptionLabel = (item, search) => {
  const key = getTeamContactKey(item);
  return {
    search, // 阻止antd自动生成当前搜索词的option
    value: item.id, // 作为tag、option的key
    label: <TeamOptionItem key={key} item={item} search={search} />,
  };
};
const contactApi = api.requireLogicalApi(apis.contactApiImpl) as ContactAndOrgApi;
export const equalModel = (source: MailBoxEntryContactInfoModel, target: MailBoxEntryContactInfoModel) => {
  if (!source || !target) return false;
  const sourceEmail = source.contact && contactApi.doGetModelDisplayEmail(source.contact);
  const targetEmail = target.contact && contactApi.doGetModelDisplayEmail(target.contact);
  return sourceEmail === targetEmail;
};

/** 从文本中提取邮件列表 */
export const extractEmailsFromText = (str: string) =>
  str
    // 分隔符
    ?.split(/[\s*\r\n,;；，、]+/)
    // 过滤出格式正确的邮件,包括XXX<aaa@bbb>这种格式
    ?.filter(mail => mail.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/))
    // 去重
    ?.filter((mail, index, arr) => arr.indexOf(mail) === index)
    ?.map(email => {
      // 处理XXX<aaa@bbb.com>
      const emailWithName = email
        ?.split(/[<>]+/)
        ?.filter(_ => _.length > 0)
        ?.reverse();
      const [mail, contactName] = emailWithName;
      return { mail, contactName };
    })
    ?.filter((mail, index, arr) => arr.findIndex(t => t.mail === mail.mail) === index);

/**
 * 将联系人胶囊对象转换成邮件字符串
 * @param receiver
 * @returns
 */
export const getCopiedContact = (receiver: ContactItem) => {
  const inContactBook = receiver.type !== 'external';
  const contactEmail = receiver.email;
  const contactName = receiver.name || '';
  return inContactBook ? `${contactName}<${contactEmail}>` : contactEmail;
};

/**
 * 将复制的联系人胶囊对象数组转换成邮件字符串
 * @param receivers 所有收件人，包括发送抄送密码
 * @param type 当前focus的输入框 发送|抄送|密送
 * @param selectedEmails 当前已选中的联系人胶囊
 * @returns 'aa@bb.com  胡凡<hufan02@office.163.com>'
 */
export const getCopiedContacts = (receivers: MailBoxEntryContactInfoModel[], type: string, selectedEmails: string[]) => {
  const copiedContacts: string[] = [];
  receivers?.forEach(item => {
    if (item.mailMemberType === type) {
      const contactItem = transMailContactModel2ContactItem(item);
      if (selectedEmails.includes(contactItem.email)) {
        const copiedContact = getCopiedContact(contactItem);
        if (copiedContact) {
          copiedContacts.push(copiedContact);
        }
      }
    }
  });
  return copiedContacts.join('\n');
};
