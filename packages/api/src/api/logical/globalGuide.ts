import { Api } from '../_base/api';

export namespace IGlobalGuide {
  export enum TipType {
    BIG_DATA1 = 'BIG_DATA1',
    BIG_DATA2 = 'BIG_DATA2',
    BIG_DATA3 = 'BIG_DATA3',
    BIG_DATA4 = 'BIG_DATA4',
    MAIL_MARKETING = 'MAIL_MARKETING',
    CRM_CUSTOMER = 'CRM_CUSTOMER',
    CRM_LEAD = 'CRM_LEAD',
    DEFAULT_TIP = 'DEFAULT_TIP',
  }

  export enum ModuleType {
    BIG_DATA = 'BIG_DATA',
    MAIL_MARKETING = 'MAIL_MARKETING',
    CRM_CUSTOMER = 'CRM_CUSTOMER',
    CRM_LEAD = 'CRM_LEAD',
    SMART_SEARCH = 'SMART_SEARCH',
    DEFAULT = 'DEFAULT',
  }

  export enum VideoType {
    SIMPLE = 'SIMPLE',
    COVER = 'COVER',
  }

  export interface Button {
    title: string;
    btnWebUrl: string;
    btnDesktopUrl: string;
    type: 'default' | 'primary' | 'link';
  }

  export interface Video {
    coverUrl: string;
    title: string;
    videoId: string;
    source: string;
    scene: string;
    videoRenderType: VideoType;
  }

  export interface Image {
    imageUrl: string;
  }

  export interface Modal {
    content: string;
    image: Image;
    tipType: TipType;
    title: string;
    video: Video;
    btn: Button[];
    freezeDays: number;
    maxTipLimit: number;
    trigget?: 'auto' | 'manual';
  }
}

export interface GlobalGuideApi extends Api {
  getGuideContent(moduleType: IGlobalGuide.ModuleType): Promise<IGlobalGuide.Modal>;
  getAppVersion(req: { appName: string; version: string }): Promise<{ version: string }>;
}
