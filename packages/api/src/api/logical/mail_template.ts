import { Api } from '../_base/api';

export interface TemplateDetail {
  tabId: number; // 1最近；2自定义;3推荐
  tab: string;
  tailDesc: string;
  templateList: TemplateInfo[];
}
export interface TemplateInfo {
  templateId: string;
  templateName: string;
  thumbnail: Thumbnail;
  templateType: string; // COMMON通用, PERSONAL自定义
}
export interface Thumbnail {
  url: string;
}

export interface TemplateDataModel {
  usedCount: number;
  openRate: string;
  replyRate: string;
}
export interface TemplateByIdDetail extends TemplateDataModel {
  templateId: string;
  templateName: string;
  thumbnail: Thumbnail;
  content: string;
  subject: string;
  bcc: string[];
  to: string[];
  cc: string[];
  tagList: WaimaoRecommendTemplateTag[];
}

export interface TemplateCommonRes<T = any> {
  success: boolean;
  message?: string;
  code?: number;
  data?: T;
}

export interface TemplateListReq {
  templateCategory: string; // 业务划分，LX: 灵犀业务； EDM: 外贸业务
  supportNewTemplateType?: string; // 是否展示企业模板tab 'ENTERPRISE'
}

export interface TemplateDetailReq {
  templateId: string;
  needStatistics?: boolean;
}

export interface SaveTemplateReq {
  templateId?: string;
  templateName: string;
  templateCategory: string;
  content: string;
  subject?: string;
  bcc?: string[];
  to?: string[];
  cc?: string[];
  tagIdList?: number[];
}

export interface DeleteTemplateReq {
  templateId: string;
}

export interface TemplateUseTimeReq {
  templateId: string;
  time: number;
}

export interface WaimaoRecommendTemplateTag {
  tagId: number | undefined;
  tagName: string;
}

export interface WaimaoRecommendTemplateOrder {
  orderKey: string;
  orderName: string;
}

export interface WaimaoRecommendTemplateListReq {
  tag: number | undefined;
  order: string;
  templateCategory: string;
}

export interface TemplateType {
  templateType: 'COMMON' | 'PERSONAL';
}
export interface TemplateTagIdList {
  tagIdList: number[];
}
export interface TemplateConditionRes {
  tabList: Array<{
    tab: {
      tabId: number;
      tab: string;
    };
    tagList?: Array<{
      tagId: number;
      tagName: string;
    }>;
    orderList?: Array<{
      orderId: string;
      orderName: string;
    }>;
    typeList?: Array<{
      typeId: number;
      typeName: string;
    }>;
    enterSelected?: boolean;
  }>;
}

export interface SaveOrUpdateTagReq extends WaimaoRecommendTemplateTag {
  templateCategory: 'LX' | 'LX-WAIMAO';
}
export interface GetTemplateListReq {
  templateCategory: string;
  tabType: number;
  tagId?: number;
  /**
   * 模板类型，主要是为了兼容图文类型
   */
  templateContentType?: number;
  order?: {
    index: string;
    sort: number;
  };
}

export interface GetTemplateListRes {
  tabId: number;
  tab: string;
  templateList: Array<{
    templateId: string;
    templateName: string;
    thumbnail: {
      url: string;
    };
    templateType: string;
    usedCount: number;
    deliveryRateDisplay: string;
    openRateDisplay: string;
    replyRateDisplay: string;
    contentType: number;
    tabId: number;
  }>;
}

export interface TemplateSearchReq {
  query: string;
  category: string;
}
export type TemplateSearchRes = Array<{
  templateId: string;
  templateName: string;
  thumbnail: {
    url: string;
  };
  content: string;
  subject: string;
  bcc: string;
  to: string;
  cc: string;
  templateType: string;
  tabId: number;
  templateDesc?: string;
  templateContentType?: 0 | 1;
}>;

export interface TemplateQuertLimitRes {
  templateLimitVOList: QuertLimitResModel[];
}

export interface QuertLimitResModel {
  templateType: string;
  count: number;
  limit: number;
}

export interface TemplateInfoModal {
  from?: string;
  title?: string;
  content?: string;
  templateName?: string;
  tagIds?: number[];
}

export interface UpdateTimeProps {
  lastAddTime?: number;
}

export interface GetTemplateTopReq {
  size: number;
  templateCategory: string;
}

export type GetTemplateTopRes = Array<{
  tabId: number;
  tab: string;
  templateList: Array<{
    templateId: string;
    templateName: string;
    thumbnail: {
      url: string;
      newUrl?: string;
    };
    templateType: string;
    usedCount: number;
    sendCount: number;
    deliveryRate: string;
    openRate: string;
    replyRate: string;
    updateTime: number;
    templateDesc: string;
    templateContentType: number;
    tabId?: number;
    tagList: {
      tagId: number;
      tagName: string;
    }[];
  }>;
}>;

export interface MailTemplateApi extends Api {
  /**
   * 获取邮件模板列表
   */
  doGetMailTemplateList(params: TemplateListReq, _account?: string): Promise<TemplateCommonRes<TemplateDetail[]>>;

  /**
   * 获取邮件模板详情
   */
  doGetMailTemplateDetail(params: TemplateDetailReq, _account?: string): Promise<TemplateCommonRes<TemplateByIdDetail>>;

  /**
   * 保存邮件模板
   */
  doSaveMailTemplate(params: SaveTemplateReq, _account?: string): Promise<TemplateCommonRes<DeleteTemplateReq>>;

  /**
   * 删除模板
   */
  doDeleteMailTemplate(params: DeleteTemplateReq, _account?: string): Promise<TemplateCommonRes<string>>;

  /**
   * 上报模板使用时间
   */
  doSaveMailTemplateUseTime(params: TemplateUseTimeReq, _account?: string): Promise<TemplateCommonRes<string>>;

  /**
   * 外贸推荐模板标签分组
   */
  getWaimaoRecommendTemplateTagList(templateCategory?: 'LX' | 'LX-WAIMAO'): Promise<TemplateCommonRes<{ tags: WaimaoRecommendTemplateTag[] }>>;

  /**
   * 外贸推荐模板列表
   */
  getWaimaoRecommendTemplateList(req: WaimaoRecommendTemplateListReq): Promise<TemplateCommonRes<TemplateDetail[]>>;

  /**
   * 查询分组(新增接口)
   */
  getTemplateTagList(req: TemplateType): Promise<TemplateCommonRes<{ tagList: WaimaoRecommendTemplateTag[] }>>;

  /**
   * 批量删除分组(新增接口)
   */
  deleteTemplateTags(req: TemplateTagIdList): Promise<TemplateCommonRes>;

  /**
   *  新增/更新分组
   */
  saveOrUpdateTemplateTag(req: SaveOrUpdateTagReq): Promise<TemplateCommonRes>;

  /**
   * 获取筛选条件
   */
  getQueryCondition(req: { fromPage: 1 | 2 }): Promise<TemplateConditionRes>;

  /**
   * 获取邮件模板列表
   */
  getTemplateList(params: GetTemplateListReq): Promise<GetTemplateListRes | null>;

  /**
   * 获取top模板
   */
  getTemplateTop(req: GetTemplateTopReq): Promise<GetTemplateTopRes>;

  /**
   * 模板搜索
   */
  templateSearch(params: TemplateSearchReq): Promise<TemplateSearchRes>;

  /**
   * 模板搜索
   */
  templateQueryLimit(): Promise<TemplateQuertLimitRes>;

  /**
   * 写信快捷使用-推荐模板
   */
  fetchSuggestTemplates(): Promise<any>;
  /**
   * 模板更新时间
   */
  fetchNewTemplateUpdateTime(): Promise<any>;
}
