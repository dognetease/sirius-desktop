import { Api } from '../_base/api';

export interface ProductDetail {
  product_name_cn: string;
  product_name_en: string;
  product_number: string;
  id: string;
  price_currency: string;
  supplier: string;
  price: string;
  color: string;
  length: string;
  width: string;
  height: string;
}

export interface ProductCommonRes {
  page?: number;
  pageSize?: number;
  totalCount?: number;
  fields?: any[];
  records?: any[];
  error?: boolean;
}

export interface WaimaoProductListReq {
  keyword: string;
  page: number;
  pageSize: number;
}

export type ProductTableRes = string;

export interface WaimaoProductTableReq {
  tableKey: string;
}

export interface ProductLinksReq {
  productIds: string[];
  siteId: string;
  businessType: 'NORMAL' | 'MARKETING'; // 业务类型。NORMAL:普通邮件；MARKETING:营销邮件,可用值:NORMAL,MARKETING
  domain: string; // 详情页商品所属自定义域名
}

export type ProductLinksRes = Array<{ productLink: string; productId: string }>;

export interface MailProductApi extends Api {
  /**
   * 产品中心列表
   */
  getWaimaoProductList(req: WaimaoProductListReq): Promise<ProductCommonRes>;
  getWaimaoProductTable(req: WaimaoProductTableReq): Promise<ProductTableRes>;
  genProductLinks(req: ProductLinksReq): Promise<ProductLinksRes>;
}
