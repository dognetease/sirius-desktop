import { ipcRenderer } from 'electron';
import {
  IpcChannelManage,
  IpcListenerManageMap,
  IpcRendererReceive,
  IpcRendererReceiveIpcMain,
  IpcRendererReq,
  IpcRendererRes,
  IpcRendererSendTo,
} from '../declare/IpcChannelManage';

// type ChannelLastEventMap = {[k:string]: IpcRendererSendTo};

class ipcChannelManageImpl implements IpcChannelManage {
  public readonly rendererDataExchangeChannel = 'renderer-data-exchange';

  public readonly rendererDataExchangeEvent = 'renderer-data-exchange';

  public readonly openEmilFileEvent = 'open-file-channel';

  private ipcListenerManageMap: IpcListenerManageMap = {};

  // static channelLastEvent:ChannelLastEventMap={};

  send(req: IpcRendererReq): void {
    console.log('ipcRenderer.send', req);
    ipcRenderer.send(req.channel, req.functionName, req.params);
  }

  sendTo(req: IpcRendererSendTo): void {
    console.log('ipcRenderer.sendTo', req);
    const { channel } = req;
    ipcRenderer.sendTo(req.id, channel, req.data);
  }

  receiveIpcMain(req: IpcRendererReceiveIpcMain) {
    const { channel } = req;
    const { listener, once } = req;
    const listenerWrapper = async (event: unknown, args: unknown) => {
      await listener(args);
    };
    ipcRenderer[once ? 'once' : 'on'](channel, listenerWrapper);
    this.ipcListenerManageMap[channel] = () => {
      ipcRenderer.removeListener(req.channel, listenerWrapper);
    };
  }

  removeListener(channel: string) {
    const listener = this.ipcListenerManageMap[channel];
    if (listener) {
      listener();
    } else {
      ipcRenderer.removeAllListeners(channel);
    }
  }

  receive(req: IpcRendererReceive): void {
    const { listener } = req;
    const { channel } = req;
    ipcRenderer.on(channel, async (event, args) => {
      const res = await listener(args);
      if (res) {
        const sendMsg = {
          id: event.senderId,
          channel: this.rendererDataExchangeChannel,
          data: {
            eventName: this.rendererDataExchangeEvent,
            data: res,
          },
        };
        event.sender.sendTo(event.senderId, channel, sendMsg);
      }
    });
  }

  async invoke(req: IpcRendererReq): Promise<any> {
    let res: IpcRendererRes;
    try {
      res = await ipcRenderer.invoke(req.channel, req.functionName, req.params);
    } catch (error: any) {
      throw new Error('ipcRenderer.invoke-Error: ' + error + 'req:' + JSON.stringify(req));
    }
    return res ? res.data : undefined;
  }
}

export const ipcChannelManage = new ipcChannelManageImpl();
