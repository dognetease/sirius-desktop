import { BridgeEventCallback, CommonBridgeInterface } from '../interface/common';
import { RenderChannel } from './webChannel';
import { getname } from '../interface/webMasterDriver';
import { BroadcastEventOptions } from '../interface/webWorkerDriver';

export class CommonBridgeEngine implements CommonBridgeInterface {
  protected renderChannelApi = new RenderChannel({
    channelId: [getname(location.href), Date.now()].join('-'),
  });

  addWinEvent(eventName: string, calllback: BridgeEventCallback) {
    this.renderChannelApi.addEventListener(eventName, calllback);
  }

  removeWinEvent(eventName: string, eventId?: string) {
    this.renderChannelApi.removeEventListener(eventName, eventId);
  }

  broadcast2AllWin(businessEventName: string, params: { data: unknown; options?: BroadcastEventOptions }) {
    this.renderChannelApi.invoke({
      eventName: 'broadcastEvent2All',
      params: {
        businessEventName,
        params,
      },
    });
  }
}
