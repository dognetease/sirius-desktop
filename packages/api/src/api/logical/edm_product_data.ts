import { Api } from '../_base/api';

export interface UserBehaviorData {
  clickNum: number;
  stayTime: number;
  viewPosition: number;
}

export interface UserClickDetailDataItem {
  productId: string;
  productCode: string;
  productName: string;
  clueNum: number;
  clueIds: string[];
  userBehaviorData: UserBehaviorData;
}

export interface UserClickDataItem {
  clickProductNum: number;
  contactEmail: string;
  contactName: string;
  clueNum: number;
  clueIds: string[];
  userBehaviorData: UserBehaviorData;
  userClickDetailData: UserClickDetailDataItem[];
}

export interface ProductClickDetailDataItem {
  contactEmail: string;
  contactName: string;
  clueNum: number;
  clueIds: string[];
  userBehaviorData: UserBehaviorData;
}

export interface ProductClickDataItem {
  productClickDetailData: ProductClickDetailDataItem[];
  productId: string;
  productCode: string;
  productName: string;
}

export interface ResponseProductClickData {
  edmEmailId: number;
  productClickData: ProductClickDataItem[];
  totalClickNum: number;
  userClickData: UserClickDataItem[];
}

export interface RequestProductClickData {
  edmEmailId: string;
  subject?: string;
}

export interface ResponseProductAnalyticsDataItem {
  avgStayTime: number;
  avgViewPosition: number;
  clueNum: number;
  clueIds: string[];
  emailReadNum: number;
  productClickNum: number;
  productClickUserNum: number;
  productId: string;
  productCode: string;
  productName: string;
  taskNum: number;
}

export interface ResponseProductAnalyticsData {
  clickData: ResponseProductAnalyticsDataItem[];
  page: number;
  pageSize: number;
  totalPage: number;
  totalSize: number;
}

export interface RequestProductAnalyticsData {
  page: number;
  pageSize?: number;
  productCondition?: string;
  readNum?: number;
  taskNum?: number;
  clickUserNum?: number;
}

export interface RequestCustomerClueInfo {
  clueIds: string[];
}

export interface CustomerClueInfo {
  name: string;
  email: string;
  companyName: string;
  clueId: string;
}

export type ResponseCustomerClueInfo = CustomerClueInfo[];

export interface RequestAllTaskProductClickData {
  page?: number; // 页号，默认从1开始
  pageSize?: number; // 每页展示数量默认 20
}

export interface ResponseAllTaskProductClickData {
  page: number;
  pageSize: number;
  totalPage: number;
  totalSize: number;
  userClickData: UserClickDataItem[];
}

export interface RequestProductViewData {
  contactEmail: string;
}

export interface ProductViewDataItem {
  productId: string;
  productCode: string;
  productName: string;
  userBehaviorData: UserBehaviorData;
}

export type ResponseProductViewData = Array<ProductViewDataItem>;

export interface EdmProductDataApi extends Api {
  // 数据统计 - 产品数据
  getEdmProductClickData(req: RequestProductAnalyticsData): Promise<ResponseProductAnalyticsData>;
  // 任务详情 - 产品点击数
  getEdmTaskClickData(req: RequestProductClickData): Promise<ResponseProductClickData>;
  // 获取留资列表
  getEdmCustomerClueInfo(req: RequestCustomerClueInfo): Promise<ResponseCustomerClueInfo>;
  // 站点潜在客户页面 - 获取历次点击商品的客户
  getAllTaskProductClickData(req: RequestAllTaskProductClickData): Promise<ResponseAllTaskProductClickData>;
  // 站点潜在客户页面 - 点击详情弹窗
  getProductViewData(req: RequestProductViewData): Promise<ResponseProductViewData>;
}
