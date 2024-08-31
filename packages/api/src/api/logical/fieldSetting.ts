/* eslint-disable camelcase */
import { Api } from '../_base/api';

export interface FieldSettingApi extends Api {
  getList(): Promise<FieldTableList[]>;

  checkCanDelete(req: ReqCheckDelete): Promise<boolean>;

  updateFieldOptions(req: ReqUpdateFieldOptions): Promise<boolean>;

  getVariableList(): Promise<Array<EdmVariableItem>>;

  addVariable(name: string): Promise<boolean>;

  batchAddVariable(req: ReqBatchAddVariable): Promise<boolean>;

  delVariable(id: string): Promise<boolean>;

  editVariable(id: string, name: string): Promise<boolean>;

  getVariableSystemList(): Promise<EdmVariableSystemListRes>;
}

export interface ReqBatchAddVariable {
  variableNames: string[];
}

export interface FieldTableList {
  field_list: Array<FieldItem>;
  part_label: string;
  part_name: string;
}

export interface FieldItem {
  id: string;
  field_label: string;
  field_name: string;
  prompt: string;
  view_type: string;
  dic_id: string;
  dic_items: Array<FieldOptionItem>;
}

export interface FieldOptionItem {
  code: string;
  dic_id: string;
  id: string;
  label: string;
  weight: number;
}

export interface ReqCheckDelete {
  fieldId: string;
  dicItemId: string;
}

export interface ReqUpdateFieldOptions {
  dic_id: string;
  item_list: Array<{
    item_id?: string;
    item_label: string;
    item_weight: number;
  }>;
}

export interface EdmVariableItem {
  variableId: string;
  variableName: string;
  createTime: string;
  autoScanVariableName?: string;
}

export interface SystemListNameValueModel {
  code: string;
  picture: string;
  pictureValue: string;
}
export interface SystemListNameModel {
  show: string;
  value: SystemListNameValueModel[];
}

export interface SystemListOtherModel {
  show: string;
  code: string;
}

export interface SystemListModel {
  name: SystemListNameModel;
  other: SystemListOtherModel[];
}
export interface EdmVariableSystemListRes {
  addressBook: SystemListModel;
  customer: SystemListModel;
  crm: SystemListModel;
}
