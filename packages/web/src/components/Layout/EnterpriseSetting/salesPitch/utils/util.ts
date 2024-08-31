import { debounce } from 'lodash';
import {
  SalesPitchDataMap,
  FilterSalesPitchCondition,
  SalesPitchStages,
  SalesPitchModel,
  salesPitchHelper,
  SalesPitchCardIdInfo,
  DataTrackerApi,
  apiHolder as api,
  apis,
  SalesPitchTypes,
  inWindow,
} from 'api';
import {
  SalesPitchTrackManagePrams,
  SalesPitchTrackManageReqPrams,
  SalesPitchTrackUsePrams,
  SalesPitchTrackUseReqPrams,
} from '@/components/Layout/EnterpriseSetting/salesPitch/types';
import { navigate } from 'gatsby';

const trackApi: DataTrackerApi = api.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;

export const recordDragList = <T>(list: T[], startIndex: number, endIndex: number) => {
  const result = [...list];
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);
  return result;
};

interface DebounceRequestWrapperRes<T> {
  success: boolean;
  data?: T;
  errMessage?: string;
}

interface DebounceRequestRes<T> extends DebounceRequestWrapperRes<T> {
  isLastReq: boolean;
}

export const debounceRequest = <Q = any, T = any>(req: (reqParams: Q) => Promise<DebounceRequestWrapperRes<T>>, debounceTime = 1000) => {
  const cache: { id: string } = { id: '' };

  const _request = debounce(async (resolve: (param: DebounceRequestRes<T>) => void, reqParams: Q, _reqId: string) => {
    try {
      const { success, data } = await req(reqParams);
      resolve({ success, isLastReq: cache.id === _reqId, data });
    } catch (e) {
      resolve({ success: false, isLastReq: cache.id === _reqId, errMessage: typeof e === 'string' ? e : '' });
    }
  }, debounceTime);

  return (reqParams: Q): Promise<DebounceRequestRes<T>> =>
    new Promise(resolve => {
      const reqId = Date.now() + '';
      cache.id = reqId;
      _request(resolve, reqParams, reqId);
    });
};

export const filterSalesPitchDataMap = (dataMap: SalesPitchDataMap, filter?: FilterSalesPitchCondition): SalesPitchDataMap => {
  if (!filter || !filter.type || filter.type === 'ALL') {
    return dataMap;
  }
  const stages = Object.keys(dataMap) as SalesPitchStages[];
  const result = stages.reduce((total, current) => {
    total[current] = dataMap[current].filter(v => v.type === filter.type);
    return total;
  }, {} as SalesPitchDataMap);
  return result;
};

export const getToIndexWhenHideEnterprise = (allList: SalesPitchModel[], filterList: SalesPitchModel[], toIndex: number): number => {
  if (toIndex === 0) {
    return 0;
  }
  const toIndexTarget = filterList[toIndex];
  let findTarget = false;
  for (let i = allList.length - 1; i >= 0; i--) {
    const current = allList[i];
    if (findTarget) {
      if (current.type !== 'ENTERPRISE') {
        return i + 1;
      }
    } else if (current.cardId === toIndexTarget.cardId) {
      findTarget = true;
    }
  }
  if (!findTarget) {
    return -1;
  }
  return 0;
};

export const getFromIndexWhenHideEnterprise = (allList: SalesPitchModel[], filterList: SalesPitchModel[], fromIndex: number): number => {
  const fromIndexTarget = filterList[fromIndex];
  return allList.findIndex(v => v.cardId === fromIndexTarget.cardId);
};

export const getIndexByCardId = (cardId: string, dataMap: SalesPitchDataMap): { idInfo: SalesPitchCardIdInfo; index: number } | undefined => {
  if (!cardId) {
    return undefined;
  }
  const idInfo = salesPitchHelper.splitSalesPitchCardId(cardId);
  if (!idInfo) {
    return undefined;
  }
  const { stageId, id } = idInfo;
  const index = dataMap[stageId as SalesPitchStages].findIndex(v => v.id === id);
  return {
    idInfo,
    index,
  };
};

// 根据cardID找到对应的话术
export const getSalePitchByCardID = (cardId: string, dataMap: SalesPitchDataMap): SalesPitchModel | undefined => {
  const { index, idInfo } = getIndexByCardId(cardId, dataMap) || {};
  if (!idInfo || index === undefined) {
    return undefined;
  }
  return dataMap[idInfo.stageId as SalesPitchStages][index || 0];
};

// 根据cardID找到对应的话术
export const getSiblingSalePitchByCardID = (cardId: string, dataMap: SalesPitchDataMap, forward = true): SalesPitchModel | undefined => {
  const { index, idInfo } = getIndexByCardId(cardId, dataMap) || {};
  if (!idInfo || index === undefined) {
    return undefined;
  }
  const targetColumn = dataMap[idInfo.stageId as SalesPitchStages];
  const newIndex = forward ? index + 1 : index - 1;
  return targetColumn[newIndex];
};

export const salesPitchUseTrack = ({ opera, scene }: SalesPitchTrackUsePrams) => {
  const SCENE_MAP: Record<SalesPitchTrackUsePrams['scene'], SalesPitchTrackUseReqPrams['scene']> = {
    settingBoard: 'managepage',
    settingList: 'managepage',
    readMailAside: 'read_page',
    writePage: 'write_page',
    uniCustomer: 'managepage',
  };
  const params: SalesPitchTrackUseReqPrams = {
    opera,
    scene: SCENE_MAP[scene],
  };
  trackApi.track('script_use', params);
};

export const salesPitchManageTrack = ({ opera, type }: SalesPitchTrackManagePrams) => {
  const OPERA_MAP: Record<SalesPitchTrackManagePrams['opera'], SalesPitchTrackManageReqPrams['opera']> = {
    ADD: 'create',
    EDIT: 'edit',
    DRAG: 'drag',
    SHOW: 'show',
  };
  const TYPE_MAP: Record<SalesPitchTypes, SalesPitchTrackManageReqPrams['type']> = {
    PERSONAL: 'personal',
    ALL: 'company',
    ENTERPRISE: 'company',
  };
  const params: SalesPitchTrackManageReqPrams = {
    opera: OPERA_MAP[opera],
    type: type ? TYPE_MAP[type] : undefined,
  };
  trackApi.track('script_manage', params);
};

export const isSame = (oldData: { [x: string]: any }, newData: { [x: string]: any }): boolean => {
  const keys = ['discourseScene', 'discourseContent', 'discourseStage', 'type'];
  const isDiff = keys.some(k => oldData[k] !== newData[k]);
  return !isDiff;
};

export const goSalesPitchSetting = () => {
  // window.location.assign('/#enterpriseSetting?page=salesPitch');
  // if (inWindow()) {
  //   window.location.hash = '/unitable-crm/phrase';
  // }
  // 邮件+ 里的话术库跳转需要改下地址， 原因是新版uni里的话术库下掉了
  let target = process.env.BUILD_ISELECTRON ? '#phase?page=phase' : '#enterpriseSetting?page=phase&showSidebar=false';
  navigate(target);
};

export const CARD_CONFIG = {
  ROW_HEIGHT: 212,
  ROW_GAP: 12,
};
