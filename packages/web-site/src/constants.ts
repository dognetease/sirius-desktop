export enum PAGE_TYPE {
  MY_SITE = 'mySite',
  MARKET = 'market',
  BRAND = 'brand',
}

export type TemplateItem = {
  templateId: string; // 模板 id
  templateName: string; // 模板名称
  thumbnail?: string; // 缩略图
};

// 限制用户新建站点的响应code
export const ExceedMaxSiteNumberResCode = 1007;
