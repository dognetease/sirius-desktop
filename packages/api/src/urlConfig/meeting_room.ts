import { config } from 'env_def';
import { host } from '@/urlConfig/url_common';

// const host = (config('host') || '') as string;
export class MeetingRoomUrl {
  /**
   * 会议室
   */
  hasMeetingRoom: string = (host + config('hasMeetingRoom')) as string;

  meetingRoomCondition: string = (host + config('meetingRoomCondition')) as string;

  meetingRoomList: string = (host + config('meetingRoomList')) as string;

  meetingRoomDetail: string = (host + config('meetingRoomDetail')) as string;

  meetingRoomAvailable: string = (host + config('meetingRoomAvailable')) as string;

  oneMeetingRoomInfo: string = (host + config('oneMeetingRoomInfo')) as string;
}
export type MeetingRoomUrlKeys = keyof MeetingRoomUrl;
const urlConfig = new MeetingRoomUrl();
const urlsMap = new Map<MeetingRoomUrlKeys, string>();

Object.keys(urlConfig).forEach(item => {
  urlsMap.set(item as MeetingRoomUrlKeys, urlConfig[item as MeetingRoomUrlKeys]);
});
export default urlsMap;
