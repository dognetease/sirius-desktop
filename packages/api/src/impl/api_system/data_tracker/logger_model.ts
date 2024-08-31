import { resultObject } from '@/api/_base/api';

export interface LogData {
  date: number;
  _dateStr: string;
  deviceId?: string | undefined;
  user: string | undefined;
  uuid: string | undefined;
  sid: string | undefined;
  winId: number | undefined;
  eventId: string;
  data: resultObject | string | undefined;
  curPath: string;
  pid?: string;
  appendix?: string;
  _traceId: string;
}
