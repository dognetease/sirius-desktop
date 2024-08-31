import { Api } from '../_base/api';
import { ResponseData } from '../data/http';

export type SalesPitchStages = 'START' | 'INQUIRY' | 'QUOTATION' | 'SAMPLES' | 'ORDER' | 'MAINTENANCE';

export type SalesPitchTypes = 'PERSONAL' | 'ALL' | 'ENTERPRISE';

export type SalesPitchStageConf = { id: SalesPitchStages; name: string };

export type SalesPitchStageConfList = SalesPitchStageConf[];

export type SalesPitchStageConfMap = Record<SalesPitchStages, SalesPitchStageConf>;

export interface SalesPitchCardIdInfo {
  stageId: SalesPitchStages;
  type: SalesPitchTypes;
  id: number;
}

export interface SalesPitchModel {
  id: number; // 服务端返回的原始 ID，cardId
  cardId: string; // 是拼接后的 ID `${stageId}${SEP}${type}${SEP}${id}`;
  discourseScene: string;
  discourseContent: string;
  discourseStage: SalesPitchStages;
  type: SalesPitchTypes;
}

// 新增话术入参
export type AddSalesPitchModel = Pick<SalesPitchModel, 'discourseScene' | 'discourseContent' | 'discourseStage' | 'type'>;

export type EditSalesPitchModel = SalesPitchModel & {
  oldType: SalesPitchTypes;
};

// 删除话术入参
export interface DeleteSalesPitchModel {
  discourseID: number;
  discourseType: SalesPitchTypes;
}

export interface ResSalesPitchItem {
  id: number;
  discourseScene: string;
  discourseContent: string;
  discourseStage: SalesPitchStages;
  type: SalesPitchTypes;
}

export interface ResSalesPitchListItem {
  stage: SalesPitchStages;
  discourseList: ResSalesPitchItem[];
}

export type SalesPitchDataMap = Record<SalesPitchStages, SalesPitchModel[]>;

export interface ReqParamsSalesPitchList {
  stages?: SalesPitchStages[]; // 返回指定阶段下的话术列表；传空数组会返回全部阶段的列表
  type?: SalesPitchTypes; // PERSONAL时只返回个人的话术列表；ALL返回企业和个人；默认为ALL。
}

export interface SalesPitchConfig {
  showEnterprise: boolean;
}

export interface SearchSalesPitchParams {
  stage?: SalesPitchStages; // 不传默认搜索全部阶段
  queryKey: string;
}

export interface FilterSalesPitchCondition {
  type: SalesPitchTypes;
}

export interface SortSalesPitchOrder {
  discourseID: number;
  type: SalesPitchTypes;
}

export interface SortSalesPitchParams {
  order: SortSalesPitchOrder[];
  stage: SalesPitchStages;
}

export interface SalesPitchApi extends Api {
  // 获取话术列表
  getSalesPitchData(params: ReqParamsSalesPitchList): Promise<SalesPitchDataMap>;

  // 查询话术库配置
  getSalesPitchConfig(): Promise<SalesPitchConfig>;

  // 查本地询话术库配置
  getLocalSalesPitchConfig(): SalesPitchConfig;

  // 修改话术库配置
  setSalesPitchConfig(params: SalesPitchConfig): Promise<boolean>;

  // 修改本地话术库配置
  setLocalSalesPitchConfig(params: SalesPitchConfig): Promise<void>;

  // 新增话术
  addSalesPitch(params: AddSalesPitchModel): Promise<ResponseData>;

  // 编辑话术
  editSalesPitch(params: EditSalesPitchModel): Promise<SalesPitchModel>;

  // 话术搜索
  searchSalesPitch(params: SearchSalesPitchParams): Promise<SalesPitchDataMap>;

  // 话术排序
  sortSalesPitch(params: SortSalesPitchParams): Promise<boolean>;

  // 删除话术
  deleteSalesPitch(params: DeleteSalesPitchModel): Promise<boolean>;
}
