import { WinType } from 'env_def';
import { Api, ContactModel, EntityOrg, OrgModel } from '@/api/_base/api';
import { ContactAndOrgApi, contactCondition, ContactOrgOption } from '@/api/logical/contactAndOrg';

export interface ContactInterfaceApi {
  excute(name: keyof ContactAndOrgApi): ContactAndOrgApi[keyof ContactAndOrgApi] | ((...params: unknown[]) => Promise<unknown>);
}
export interface ContactCacheApi {
  // printCache(): void;
  waitContactSync(): void;
}
export interface ContactProxyImpl extends Api {
  getInstance(): ContactCacheApi | ContactInterfaceApi | null;
  getWinType(): WinType | string;
  getContactApi(): Api;
}

export interface ContactRule {
  key: keyof contactCondition;
  valid(flag: boolean): boolean;
  rule(item: ContactModel): boolean;
}
export interface OrgRule {
  key: keyof contactCondition;
  valid(flag: boolean): boolean;
  rule(item: EntityOrg): boolean;
}

export type SupportRules = keyof Pick<contactCondition, 'isIM' | 'showDisable'> | keyof Pick<ContactOrgOption, 'isIM' | 'showDisable'>;

export type ExcuteRule = {
  (ruleVars: Pick<contactCondition, 'isIM' | 'showDisable'>, item: ContactModel, rules: ContactRule[]): boolean;
  (ruleVars: Pick<ContactOrgOption, 'isIM' | 'showDisable'>, item: EntityOrg, rules: OrgRule[]): boolean;
};

export type TraverseFindSubOrgTree = (
  topOrg: EntityOrg,
  orgMap: Map<string, EntityOrg>,
  orgRelationMap: Map<string, Set<string>>,
  orgSubsetRelationMap: Map<string, Set<string>>,
  level: number
) => OrgModel;
