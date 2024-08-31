export interface WebChannelApiParams {
  channelId: string;
}

export interface ChannelBasicParams {
  channelId?: string;
}

export interface ExcuteParams extends ChannelBasicParams {
  eventName: string;
  params: unknown;
}

export interface ChannelExcuteParams extends ChannelBasicParams {
  channel: 'excute';
  seqno: string;
  args: ExcuteParams;
  channelId: string;
}

export interface ChannelReplyParams extends ChannelBasicParams {
  channel: 'reply';
  ackno: string;
  code: number;
  msg: string;
  data: unknown;
}

export interface ChannelResponseParams extends ChannelBasicParams {
  channel: 'response';
  data: unknown;
}

type BroadcaseEventName = 'bridgeConnected';

export interface ChannelEventData<T = unknown> {
  eventname: BroadcaseEventName | string;
  args?: T;
}

export interface ChannelEventParams extends ChannelBasicParams {
  channel: 'event';
  data: ChannelEventData;
}
export type ChannelParams = ChannelExcuteParams | ChannelReplyParams | ChannelEventParams | ChannelResponseParams;
