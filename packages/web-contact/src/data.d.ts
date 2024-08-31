import { ContactModel, EntityContact, ContactSearch, EntityOrg } from 'api';
import { DataNode } from 'antd/lib/tree';

interface UIContact extends EntityContact {
  id: string;
  contactName: string;
  accountName: string;
  color?: string;
  charAvatar?: string;
  labelPoint?: boolean;
  defaultEmail?: string;
  position?: string[][];
  // type: 'personal' | 'enterprise' | string
}

export interface UIContactModel extends ContactModel {
  // contactInfo:EntityContactItem[],
  contact: UIContact;
}

export interface ContactDataNode extends DataNode {
  key: string;
  nodeType: 'org' | 'personalOrg';
  data?: EntityOrg;
}

export type SearchResModel = Record<string, Record<SearchGroupKey, ContactItem[]>>;
