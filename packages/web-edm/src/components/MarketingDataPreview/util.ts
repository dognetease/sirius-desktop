import { apiHolder, api, EventApi, SystemEvent, SystemApi } from 'api';

const eventApi = api.getEventApi() as EventApi;
const systemApi = apiHolder.api.getSystemApi() as SystemApi;
const isEdmWeb = systemApi.isWebWmEntry();

export const OpenEdmDetail = async (detailId: string, isParent: 0 | 1) => {
  const list = await window.electronLib.windowManage.getAllWinInfo();
  const main = list.find((item: any) => item.type === 'main');
  if (main) {
    window.electronLib.windowManage.show(main.id);
    //
    eventApi.sendSysEvent({
      eventName: 'openMarketingDetail',
      eventData: {
        detailId,
        isParent,
      },
    });
  }
};

export const getDetailPath = (): string => {
  return isEdmWeb ? '/#intelliMarketing?page=detail' : '/#edm?page=index';
};

export const getAiHostingDetailPath = (): string => {
  return isEdmWeb ? '/#intelliMarketing?page=aiHosting' : '/#edm?page=aiHosting';
};
