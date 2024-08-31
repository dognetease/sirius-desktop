import { apiHolder, apis, SalesPitchApi } from 'api';
import { debounceRequest } from '@web-mail/utils/debounceRequest';
// import { mockApi } from '@web-common/state/reducer/salesPitchReducer/mock';

const salesPitchApi = apiHolder.api.requireLogicalApi(apis.salesPitchApiImpl) as SalesPitchApi;

const debounceReqDataGroupWarp = debounceRequest();
const debounceReqConfigGroupWarp = debounceRequest();
const debounceReqSortGroupWarp = debounceRequest();

// 获取话术列表
const getSalesPitchData = debounceReqDataGroupWarp(salesPitchApi.getSalesPitchData.bind(salesPitchApi)) as typeof salesPitchApi.getSalesPitchData;

// 查询话术库配置
const getSalesPitchConfig = debounceReqConfigGroupWarp(salesPitchApi.getSalesPitchConfig.bind(salesPitchApi)) as typeof salesPitchApi.getSalesPitchConfig;

// 本地查询话术库配置
const getLocalSalesPitchConfig = salesPitchApi.getLocalSalesPitchConfig.bind(salesPitchApi);

// 修改话术库配置
const setSalesPitchConfig = salesPitchApi.setSalesPitchConfig.bind(salesPitchApi);

// 修改本地话术库配置
const setLocalSalesPitchConfig = salesPitchApi.setLocalSalesPitchConfig.bind(salesPitchApi);

// 新增话术
const addSalesPitch = salesPitchApi.addSalesPitch.bind(salesPitchApi);

// 编辑话术
const editSalesPitch = salesPitchApi.editSalesPitch.bind(salesPitchApi);

// 话术搜索
const searchSalesPitch = salesPitchApi.searchSalesPitch.bind(salesPitchApi);

// 话术排序
const sortSalesPitch = debounceReqSortGroupWarp(salesPitchApi.sortSalesPitch.bind(salesPitchApi)) as typeof salesPitchApi.sortSalesPitch;

// 删除话术
const deleteSalesPitch = salesPitchApi.deleteSalesPitch.bind(salesPitchApi);

export const salesPitchRequest = {
  getSalesPitchData,
  getSalesPitchConfig,
  getLocalSalesPitchConfig,
  setSalesPitchConfig,
  setLocalSalesPitchConfig,
  addSalesPitch,
  editSalesPitch,
  searchSalesPitch,
  sortSalesPitch,
  deleteSalesPitch,
};
