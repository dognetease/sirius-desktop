import { config } from 'env_def';
import { host } from '@/urlConfig/url_common';

export class SalesPitchUrl {
  /**
   * 话术库
   */
  getSalesPitchList: string = (host + config('getSalesPitchList')) as string;

  deleteSalesPitch: string = (host + config('deleteSalesPitch')) as string;

  sortSalesPitchList: string = (host + config('sortSalesPitchList')) as string;

  updateSalesPitch: string = (host + config('updateSalesPitch')) as string;

  editSalesPitch: string = (host + config('editSalesPitch')) as string;

  changeSalesPitchType: string = (host + config('changeSalesPitchType')) as string;

  changeSalesPitchStage: string = (host + config('changeSalesPitchStage')) as string;

  addSalesPitch: string = (host + config('addSalesPitch')) as string;

  searchSalesPitch: string = (host + config('searchSalesPitch')) as string;

  getSalesConfig: string = (host + config('getSalesConfig')) as string;

  setSalesConfig: string = (host + config('setSalesConfig')) as string;
}

export type SalesPitchUrlKeys = keyof SalesPitchUrl;

const urlConfig = new SalesPitchUrl();

const urlsMap = new Map<SalesPitchUrlKeys, string>();

Object.keys(urlConfig).forEach(item => {
  urlsMap.set(item as SalesPitchUrlKeys, urlConfig[item as SalesPitchUrlKeys]);
});

export default urlsMap;
