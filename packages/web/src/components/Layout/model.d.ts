import React from 'react';

export type PageName =
  | 'coop'
  | 'intelliMarketing'
  | 'wmData'
  | 'mailbox'
  | 'contact'
  | 'message'
  | 'schedule'
  | 'disk'
  | 'apps'
  | 'unitable-crm'
  | 'setting'
  | 'edm'
  | 'customer'
  | 'worktable'
  | 'customsData'
  | 'enterpriseSetting'
  | 'sns'
  | 'globalSearch'
  | 'systemTask'
  | 'noviceTask'
  | 'jumpOut_acquisition'
  | 'jumpOut_customsBigData'
  | 'jumpOut_mailMarketing'
  | 'jumpOut_website'
  | 'jumpOut_mediaMarketing'
  | 'wa';

export interface SiriusPageProps {
  name: PageName;
  tag?: React.ReactNode | string;
  icon?: React.ReactComponentElement;
  active?: boolean;
  reshow?: boolean;
  hidden?: boolean;
  hideInTab?: boolean;
  redPoint?: boolean;
  activeKey?: string;
}
export interface KeyProps {
  id: PageName;
  name: string;
  key: string;
  show?: boolean;
}
