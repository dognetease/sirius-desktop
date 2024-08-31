/* eslint-disable camelcase */
import { IGlobalGuide, GlobalGuideApi } from '@/api/logical/globalGuide';
import { api } from '../../../api/api';
import { ApiRequestConfig } from '../../../api/data/http';

const eventApi = api.getEventApi();

export class GlobalGuideApiImpl implements GlobalGuideApi {
  name = 'globalGuideApiImpl';

  static readonly RndSyncRate = Math.floor(6 * Math.random());

  private http = api.getDataTransApi();

  private systemApi = api.getSystemApi();

  init() {
    return this.name;
  }

  async get(url: string, req?: any, config?: ApiRequestConfig) {
    try {
      const { data } = await this.http.get(url, req, config);
      if (!data || !data.success) {
        return Promise.reject(data?.message);
      }
      return data?.data;
    } catch (err: any) {
      eventApi.sendSysEvent({
        eventSeq: 0,
        eventName: 'error',
        eventLevel: 'error',
        eventData: {
          title: err.data?.message || err.data?.msg || '网络错误',
          popupType: 'toast',
          popupLevel: 'error',
          content: '',
        },
        auto: true,
      });
      return Promise.reject(err.data);
    }
  }

  async post(url: string, body: any, config?: ApiRequestConfig) {
    const apiConfig: ApiRequestConfig = {
      contentType: 'json',
      noEnqueue: false,
      ...(config || {}),
    };
    try {
      const { data } = await this.http.post(url, body, apiConfig);
      if (!data || !data.success) {
        return Promise.reject(data?.message);
      }
      return data?.data;
    } catch (err: any) {
      eventApi.sendSysEvent({
        eventSeq: 0,
        eventName: 'error',
        eventLevel: 'error',
        eventData: {
          title: err.data?.message || err.data?.msg || '网络错误',
          popupType: 'toast',
          popupLevel: 'error',
          content: '',
        },
        auto: true,
      });
      return Promise.reject(err.data);
    }
  }

  async getGuideContent(moduleType: IGlobalGuide.ModuleType): Promise<IGlobalGuide.Modal> {
    return this.get(this.systemApi.getUrl('getGuideContent'), { moduleType });
    // return {
    //   tipType: IGlobalGuide.TipType.DEFAULT_TIP,
    //   title: '🎉高效获客-海量数据供挖掘',
    //   content: '将您搜到的公司数据批量选择一键录入线索，并立即发起营销',
    //   image: {
    //     imageUrl: 'https://cowork-storage-public-cdn.lx.netease.com/common/2023/11/13/ea07728631c4476a8300b4066517117c.jpg',
    //   },
    //   video: {
    //     videoRenderType: IGlobalGuide.VideoType.SIMPLE,
    //     title: '视频标题',
    //     videoId: '123'
    //     source: '123'
    //     scene: '123'
    //     coverUrl: 'https://cowork-storage-public-cdn.lx.netease.com/common/2023/11/13/ea07728631c4476a8300b4066517117c.jpg',
    //     videoUrl: 'https://cowork-storage-public-cdn.lx.netease.com/common/2023/02/10/00d7fe85f18a46a695d099967647608e.mp4',
    //   },
    //   maxTipLimit: 3,
    //   freezeDays: 7,
    //   btn: [
    //     {
    //       type: 'primary',
    //       title: '立即行动',
    //       btnWebUrl: '',
    //       btnDesktopUrl: '',
    //     },
    //     {
    //       type: 'default',
    //       title: '取消',
    //       btnWebUrl: '',
    //       btnDesktopUrl: '',
    //     },
    //   ],
    // };
  }

  getAppVersion(req: { appName: string; version: string }): Promise<{ version: string }> {
    return this.get(this.systemApi.getUrl('getAppUpgradeVersion'), req);
  }
}

const globalGuideApiImpl = new GlobalGuideApiImpl();
api.registerLogicalApi(globalGuideApiImpl);
export default globalGuideApiImpl;
