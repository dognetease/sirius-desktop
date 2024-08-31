import { Moment } from 'moment';
import { Api } from '../_base/api';
// 自动回复的model
export interface AutoReplyModel {
  disabled: boolean;
  id: number | null;
  content: string;
  moments: MomentsModel;
  onlyContact: boolean; // 是否只回复通讯录联系人
  onceForSameSender: boolean; // 同一发件人7天内是否只回复一次
  // [key: string]: boolean | number | null | string | MomentsModel;
}

export type MomentType = Moment | null;
export interface MomentsModel {
  startDate: MomentType;
  endDate: MomentType;
  startTime: MomentType;
  endTime: MomentType;
  [key: string]: MomentType;
}
export interface AutoReplyActionsModel {
  type: string;
  content: string;
  onceForSameSender: boolean;
  onlyContact: boolean;
}
export interface AutoReplyCondictionsModel {
  field: string;
  ignoreCase?: boolean;
  disabled: boolean;
  operand: string[];
  operator: string;
}
export interface AutoReplyVarModel {
  id?: number | null;
  name: string;
  continue: boolean;
  actions: AutoReplyActionsModel[];
  condictions: AutoReplyCondictionsModel[];
}
export interface AutoReplyApi extends Api {
  addMailRulesByAutoReply(form: AutoReplyModel): Promise<number | null>;
  getMailRulesByAutoReply(): Promise<AutoReplyModel>;
  updateMailRulesByAutoReply(form: AutoReplyModel): Promise<boolean>;
}
