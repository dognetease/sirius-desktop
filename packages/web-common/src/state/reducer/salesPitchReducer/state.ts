import { SalesPitchReducerState } from './types';
import { salesPitchRequest as request } from './request';
import { genDefaultPitchDataMap } from './config';

export const salesPitchInitialState: SalesPitchReducerState = {
  // 话术全量数据
  dataMap: genDefaultPitchDataMap(),
  // 话术全量数据 for 搜索状态
  searchDataMap: genDefaultPitchDataMap(),
  // 搜索关键字
  searchInput: '',
  isLoading: false,
  isFetchFailed: false,
  config: request.getLocalSalesPitchConfig(),
  drawerType: '',
  drawerVisible: false,
  drawerDataId: '',
  selectedStageId: '',
  selectedStageTab: 'START',
  guideVisible: false,
  writePageGuidePos: {
    height: 0,
    width: 0,
    x: 0,
    y: 0,
  },
  writePageOuterDrawerVisible: false,
  edmTemplateOuterDrawerVisible: false,
  edmMailOuterDrawerVisible: false,
  writePageSalesPitch: null,
  edmTemplateSalesPitch: null,
  edmMailSalesPitch: null,
  saveAsMySalesPitch: null,
  activeScene: '',
};
