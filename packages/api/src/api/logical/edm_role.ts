import { Api } from '../_base/api';
import { MailPlusEdmPrivilegeViewData } from '@/api/logical/mail_plus_customer';

export interface EdmRoleApi extends Api {
  getProductPrivilege(productId: string): Promise<boolean>;
  getEdmAccount(req?: ReqAdminAccount): Promise<ResAdminAccount>;
  getCurrentRoleInfo(req?: ReqRoleInfo): Promise<Array<RoleModel>>;
  getRoleList(req?: ReqAdminAccount): Promise<ResRoleList>;
  addOrRemoveRoleToAccount(req: ReqAccountRoleOp): Promise<boolean>;
  addOrRemoveRole(req: ReqRoleOp): Promise<{ roleId: string }>;
  saveMembersToRole(req: ReqSaveMembers): Promise<boolean>;
  getRoleDetail(roleId: string): Promise<RoleDetailModel>;

  // 获取权限
  getCurrentPrivilege(req?: ReqAdminAccount): Promise<ModulePrivilege[]>;
  getAllPrivilege(req?: ReqAdminAccount): Promise<ModulePrivilege[]>;
  getVersion(req: ReqAdminAccount): Promise<ResVersion>;
  getModulePrivilege(req: ReqModulePrivilege): Promise<ModulePrivilege>;
  getModuleDataRange(req: string): Promise<DataRangeModel>;
  savePrivilege(req: ReqSavePrivilege): Promise<boolean>;

  getMenuList(): Promise<MenuItem[]>;
  getMenuListV2(): Promise<MenuListV2Res>;
  getMenuListNew(): Promise<MenuItemNew>;
  getMenuWhitelist(): Promise<WhiteListRes>;
  getKfInfo(): Promise<{ orgId: string; corpId: number; corpName: string; domain: string }>;
  getMenuSwitch(): Promise<{ menuVersionWithoutOldSwitch: boolean }>;
  getMenuVersion(): Promise<{ menuVersion: MenuVersion }>;
  setMenuListNew(req: MenuListNew): Promise<MenuItem[]>;
  showKfEntry(): Promise<ResShowKfEntry>;
  saveMenuSetting(req: { menuItems: Array<Partial<MenuItem>> }): Promise<boolean>;
  saveMenuSettingV2(req: { menuItems: Array<Partial<MenuItem>> }): Promise<boolean>;

  aiFloatEntrance(): Promise<{ showAIAssistance: boolean }>;

  doGetContactPrivilegeRangeData(): string[] | undefined;

  doGetCluePrivilegeRangeData(): string[] | undefined;

  doGetPrivilegeMap(): Map<string, Set<string>> | undefined;

  doGetContactViewPrivilege(): boolean;

  doGetMailPlusEdmViewPrivilege(): MailPlusEdmPrivilegeViewData;

  doGetPrivilegeByLabel(resourceLabel: string, accessLabel: string): boolean;
}

export type MenuVersion = 'NONE' | 'OLD' | 'NEW';

export interface MenuListV2Res {
  menuItems: MenuItem[];
  menuVersion: MenuVersion;
}

export enum MEMBER_TYPE {
  ORG = 'ORG',
  ACC = 'ACC',
  DEP = 'DEP',
}

export interface MenuItemNew {
  menuVersion: string;
  menuItems: MenuItem[];
}
export interface WhiteListRes {
  popup: boolean;
  popupDays: number;
  menuVersionPartitionNewSwitch?: boolean;
  menuVersionAllNewSwitch?: boolean;
}

export interface MenuListNew {
  menuVersion: string;
}
export interface ResShowKfEntry {
  showHelpEntrance: boolean;
}

export interface RoleModel {
  roleId: string;
  roleName: string;
  roleType?: string;
}

export interface RoleDetailModel extends RoleModel {
  createTime: string;
  members: Array<AdminAccountInfo>;
  count?: number;
  privileges?: PrivilegeDetailItem[];
}

export interface ReqAdminAccount {
  productId?: string;
  productVersionId?: string;
}

export interface ReqRoleInfo extends ReqAdminAccount {
  accId?: string;
  orgId?: string;
}

export interface ResVersion {
  version: 'FREE' | 'PAY';
  versionName: string;
  productMenus: MenuItem[];
  ultimateVersion?: boolean;
}

export interface AdminAccountInfo {
  memberAccId: string;
  memberType: MEMBER_TYPE;
}

export interface ResAdminAccount {
  members: Array<AdminAccountInfo>;
}

export interface RoleListItem extends RoleModel {
  createTime: string;
  members: Array<string>;
  count?: number;
}

export interface ResRoleList {
  myRoles: Array<RoleModel>;
  roles: Array<RoleListItem>;
}

export interface ReqAccountRoleOp extends ReqAdminAccount {
  orgId: string;
  accId: string;
  roles: string[];
  op: number;
}

export interface ReqRoleOp extends ReqAdminAccount {
  op: number;
  roleId?: string;
  roleName?: string;
}

export interface ReqSaveMembers {
  roleId: string;
  members: AdminAccountInfo[];
}

export interface ReqModulePrivilege extends ReqAdminAccount {
  resourceLabel: string;
}

export interface AccessModel {
  accessId: string;
  accessLabel: string;
  accessName: string;
  accessType: string;
}

export interface ModulePrivilege {
  resourceId: string;
  resourceLabel: string;
  resourceName: string;
  accessList: AccessModel[];
  resourceCategoryLabel: string;
  resourceCategoryName: string;
}

export interface DataRangeModel {
  resourceId: string;
  resourceLabel: string;
  resourceName: string;
  accessId: string;
  accessLabel: string;
  accessRangeList: string[];
  accessName: string;
  accIds?: string[];
}

export interface MenuItem {
  menuLabel: string;
  menuName: string;
  showMenu?: boolean;
  subMenuItems?: MenuItem[];
}

export interface PrivilegeItem {
  resourceId: string;
  resourceLabel: string;
  accessLabel: string;
  accessName?: string;
  accessType: string;
  accessRange?: string;
  members?: AdminAccountInfo[];
}

export interface ReqSavePrivilege {
  roleId: string;
  privileges: Array<PrivilegeItem>;
}

export interface AccessItemWithValue {
  accessId: string;
  accessName: string;
  accessLabel: string;
  accessType: string;
  accessRange?: string;
  members?: AdminAccountInfo[];
}
export interface PrivilegeDetailItem {
  resourceLabel: string;
  resourceId: string;
  resourceName: string;
  accessList: AccessItemWithValue[];
}
