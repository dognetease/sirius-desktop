import { ResponseData } from '../data/http';
import { Api } from '../_base/api';

// 广告配置
export interface AdvertConfig {
  id: string;
  spaceId: string;
  title: string;
  description: string;
  sort: string;
  operationType: 'ADVERT' | 'ACTIVITY';
  showTag: string;
  autoFetchIntervalSecond: string;
  ext: string;
  // 广告包含多个物料时，将随机选择其中一个物料展示。所以这里可以认为只有一个
  advertResourceList: AdvertResource[];
}

export function isSupportedConfig(config: AdvertConfig): boolean {
  return config.advertResourceList[0].type === 'PIC' || config.advertResourceList[0].type === 'CUSTOM';
}

export const getImageUrl = (config: AdvertConfig) => {
  const resource = config.advertResourceList[0];
  if (resource.type === 'PIC') {
    return resource.content.image[0].url || '';
  }
  if (resource.type === 'CUSTOM') {
    return resource.content.images[0].url || '';
  }
  return '';
};
export const getBgColor = (config: AdvertConfig) => config.advertResourceList[0].bgColor;

// 广告物料
export interface AdvertResource {
  id: string;
  advertId: string;
  advertSpaceId: string;
  source: 'DIRECT_CASTING' | 'YOUDAO' | 'TOUTIAO' | 'NETEASE_MEDIA' | 'GDT';
  type: 'PIC' | 'INFO_FLOW' | 'VIDEO' | 'CUSTOM';
  content: AdvertResourceContent;
  bgColor?: string;
  gradualChangeColor: string;
  name: string;
  description: string;
  outsideStatisticsList: AdvertTrackInfo[];
}

export interface AdvertResourceContent {
  title: string;
  description: string;
  // 广告后台只能传单张图片, 这里可以认为只有一个
  // AdvertResourceType === 'CUSTOM'的时候. 取images
  images: AdvertResourceContentImage[];
  // AdvertResourceType === 'PIC'的时候. 取image
  image: AdvertResourceContentImage[];
  icon: AdvertResourceContentImage[];
  clickUrl: string;
  clickContent: string;
}

export type PopupPositionType = 'leftTop' | 'top' | 'rightTop' | 'left' | 'center' | 'right' | 'leftBottom' | 'bottom' | 'rightBottom';

export interface SurveyConfig {
  surveyId: number;
  surveyUrl: string;
  apiUrl: string;
  type: number;
  /** 按钮配置 */
  btnText: string;
  btnColor: string;
  btnBgColor: string;
  btnPosition: string;
  /** 弹窗配置 */
  popupPosition: PopupPositionType;
  showLogo: number;
  delayOpen: number;
  delayOpenTime: number;
  /** 自定义参数 */
  query: unknown;
}

export interface AdvertResourceContentImage {
  uid: string;
  url: string;
}

export interface AdvertTrackInfo {
  type: 'VIEW' | 'CLICK' | 'DOWNLOAD';
  trackUrl: string;
}

export interface AdvertApi extends Api {
  /**
   * 获取广告配置
   */
  fetchConfig(spaceCode: string): Promise<ResponseData>;

  /**
   * 广告的打点
   */
  track(info: AdvertTrackInfo): Promise<ResponseData>;
}
