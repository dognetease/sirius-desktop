import {
  SalesPitchDataMap,
  SalesPitchStages,
  SalesPitchTypes,
  AddSalesPitchModel,
  DeleteSalesPitchModel,
  ReqParamsSalesPitchList,
  SalesPitchModel,
  SalesPitchConfig,
  SearchSalesPitchParams,
  SortSalesPitchParams,
  salesPitchHelper,
  ResponseData,
} from 'api';
import { SALES_PITCH_STAGE_CONFIG_LIST } from '@web-common/state/reducer/salesPitchReducer/config';

export const mockPromise = <T>(data: T, timeout = 1000, success = true): Promise<T> =>
  new Promise((resolve, reject) => {
    setTimeout(() => {
      if (success) {
        resolve(data);
      } else {
        reject();
      }
    }, timeout);
  });

export const mockSalesPitchModel = (type: SalesPitchTypes = 'ENTERPRISE', stageId: SalesPitchStages = 'START') => {
  const id = 123;
  return {
    id, // 服务端返回的原始 ID，cardId
    cardId: salesPitchHelper.genSalesPitchCardId({ stageId, type, id }),
    discourseScene: '场景1111',
    discourseContent: '内容111111',
    discourseStage: stageId,
    type,
  };
};

export const mockSalesPitchList = (stageId: SalesPitchStages, length = 10, content = '') =>
  Array.from({ length }).map((_v, index) => {
    const _type = [2, 3].includes(index) ? ('ENTERPRISE' as SalesPitchTypes) : ('PERSONAL' as SalesPitchTypes);
    const cardId = salesPitchHelper.genSalesPitchCardId({ stageId, type: _type, id: index + 1 });
    return {
      id: index + 1,
      cardId,
      discourseScene: `场景${index}`,
      discourseContent: `内容${index + 1}${content}` + ([2, 3].includes(index) ? ' ENTERPRISE' : 'PERSONAL'),
      discourseStage: stageId,
      type: _type,
    };
  });

export const mockSalesPitchBoard = (length = 10, content = ''): SalesPitchDataMap =>
  SALES_PITCH_STAGE_CONFIG_LIST.reduce((total, current) => {
    total[current.id] = mockSalesPitchList(current.id, length, content);
    return total;
  }, {} as SalesPitchDataMap);

// 根据cardID找到对应的话术
export const mockGetSalePitchByCardID = (cardId: string, data: SalesPitchDataMap) => {
  console.log(cardId, data);
  return mockSalesPitchModel('ENTERPRISE', 'INQUIRY');
};

export const mockApi = {
  async getSalesPitchData(params: ReqParamsSalesPitchList): Promise<SalesPitchDataMap> {
    console.log(params);
    return mockPromise(mockSalesPitchBoard(5, '正常列表'), 1500);
  },
  async getSalesPitchConfig(): Promise<SalesPitchConfig> {
    return mockPromise({ showEnterprise: true });
  },
  async setSalesPitchConfig(params: SalesPitchConfig): Promise<boolean> {
    console.log(params);
    return mockPromise(true);
  },
  async addSalesPitch(params: AddSalesPitchModel): Promise<ResponseData> {
    console.log(params);
    return mockPromise({ success: true, data: mockSalesPitchModel() }, 1000, true);
  },
  async editSalesPitch(params: SalesPitchModel): Promise<SalesPitchModel> {
    console.log(params);
    return mockPromise(mockSalesPitchModel());
  },
  async searchSalesPitch(params: SearchSalesPitchParams): Promise<SalesPitchDataMap> {
    return mockPromise(mockSalesPitchBoard(5, '搜索列表' + params.queryKey));
  },
  async sortSalesPitch(params: SortSalesPitchParams): Promise<boolean> {
    console.log(params);
    return mockPromise(true, 1000, true);
  },
  async deleteSalesPitch(params: DeleteSalesPitchModel): Promise<boolean> {
    console.log(params);
    return mockPromise(true, 1000, true);
  },
};
