import { UserItemInfo } from 'api';

export type AllotModalType = '' | 'add' | 'reassign';

export interface UserCheckItemInfo extends UserItemInfo {
  checked: boolean;
  allotNum: number;
}
