import { SalesPitchScenes } from '@/components/Layout/EnterpriseSetting/salesPitch/types';
import { SalesPitchConfig, SalesPitchDataMap, SalesPitchModel, SalesPitchStages } from 'api';

// 抽屉组件的props类型
export type DrawerType = 'ADD' | 'EDIT' | 'CHECK';

export interface SalesPitchReducerState {
  dataMap: SalesPitchDataMap;
  searchDataMap: SalesPitchDataMap;
  searchInput: string;
  isLoading: boolean;
  isFetchFailed: boolean;
  config: SalesPitchConfig;
  drawerType: DrawerType | '';
  drawerVisible: boolean;
  drawerDataId: string;
  selectedStageId: SalesPitchStages | '';
  selectedStageTab: SalesPitchStages;
  guideVisible: boolean;
  writePageGuidePos: {
    height: number;
    width: number;
    x: number;
    y: number;
  };
  // 写信页外部抽屉
  writePageOuterDrawerVisible: boolean;
  // 营销模板页外部抽屉
  edmTemplateOuterDrawerVisible: boolean;
  // 营销邮件富文本编辑器外部抽屉
  edmMailOuterDrawerVisible: boolean;
  // 写信页，点击使用的当前话术,使用以后，延迟清空
  writePageSalesPitch: SalesPitchModel | null;
  // 营销模板编辑页，点击使用的当前话术,使用以后，延迟清空
  edmTemplateSalesPitch: SalesPitchModel | null;
  // 营销邮件编辑器，点击使用的当前话术,使用以后，延迟清空
  edmMailSalesPitch: SalesPitchModel | null;
  // 转存为我的话术
  saveAsMySalesPitch: SalesPitchModel | null;
  activeScene: SalesPitchScenes | '';
}

export interface OnSortReqParams {
  newList: SalesPitchModel[];
  stageId: SalesPitchStages;
}

export type SalesPitchReducerKeys = keyof SalesPitchReducerState;

export interface PayloadUpdateDataMapByStage {
  stageId: SalesPitchStages;
  newList: SalesPitchModel[];
}
