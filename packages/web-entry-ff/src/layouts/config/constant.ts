import { ChildrenType } from 'web-entry-wm/src/layouts/config/topMenu';

export enum TopMenuPath {
  price = 'price',
  freightRate = 'freightRate',
  customerManagement = 'customerManagement',
  order = 'order',
  statistics = 'statistics',
  worktable = 'worktable',
  mailbox = 'mailbox',
  wm = 'wm',
  wmData = 'wmData',
  intelliMarketing = 'intelliMarketing',
  site = 'site',
  coop = 'coop',
  enterpriseSetting = 'enterpriseSetting',
  rbac = 'rbac',
  personal = 'personal',
  systemTask = 'systemTask',
  noviceTask = 'noviceTask',
  unitable_crm = '/unitable-crm',
}

export const speUrl = [TopMenuPath.mailbox, TopMenuPath.worktable];

export interface TopMenuType {
  name: string;
  path: string;
  hiddenWithFree?: boolean;
  open?: boolean;
  hidden?: boolean;
  topIcon?: React.ReactNode;
  children: ChildrenType[];
}
