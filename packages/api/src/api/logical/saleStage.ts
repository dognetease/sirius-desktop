/* eslint-disable camelcase */
import { Api } from '../_base/api';

export interface SaleStageApi extends Api {
  // 获取销售阶段列表
  getList(): Promise<SaleStageTableList>;
  // 新增商机阶段
  addStage(req: StageItem): Promise<boolean>;
  // 设置成交阶段
  updateStage(req: StageItem): Promise<boolean>;
  // 删除商机阶段
  deleteStage(req: StageItem): Promise<any>;
  // 排序阶段
  updateOrderList(req: SaleStageTableList): Promise<boolean>;
  // 设置成交阶段
  setDealStage(req: StageItem): Promise<boolean>;
}

export interface StageItem {
  id: string;
  name: string;
  stage: number;
  type: number;
  weight: number;
}

export interface SaleStageTableList extends Array<StageItem> {}
