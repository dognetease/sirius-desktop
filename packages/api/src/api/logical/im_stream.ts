import { Observable } from 'rxjs';
import { EventEmitter } from 'events';
import { Team } from '@/index';
import { NIMApi, Session, CreateSessionApi, IMUser } from './im';

export interface IM_STREAM<T = unknown> {
  // sdk: NIMApi | null;
  init(instance: NIMApi): void;
  getSubject(): Observable<T> | null;
}

// session列表
export type SessionParams = Partial<{
  lastSessionId: string;
  limit: number;
  reverse: boolean;
}>;

export interface SessionInterface {
  _fetchSessionList(): Promise<Session[]>;
  deleteSession(id: string | string[]): Promise<void>;
  getMoreSessions(options: SessionParams): Promise<void>;
  getSession(id: Observable<string>): Observable<Session>;
  getSessionField(args: Observable<[string, string]>, $hash?: Observable<string>): Observable<unknown>;
  updateLocalCustom(id: string, info: Record<string, unknown>): void;
}

// 静音列表
interface MarkmuteParmasApi {
  account: string;
  isAdd: boolean;
}
export interface P2PMuteInterface {
  toggleMute(params: MarkmuteParmasApi): void;
}

export interface NotifyCountInterface {
  subscribeMuteStatus($sessionId: Observable<string>, defaultValue?: boolean): Observable<boolean>;
}

export interface CurrentSessionInterface {
  setSession(
    params: CreateSessionApi,
    options?: {
      validateTeam?: boolean;
      tryCreateSession?: boolean;
    }
  ): Promise<any>;

  createSession(scene: string, to: string): void;

  setPushSessionEvent(options: CreateSessionApi): void;
}

export interface MyinfoInterface {
  getMyField(field?: keyof IMUser): Observable<IMUser[keyof IMUser]>;
}

export interface SissionLaterParams {
  sessionId: string;
  sessionType: string;
  localCustom?: string;
  isLater?: boolean;
}

export interface SessionLaterInterface {
  updateLater(params: SissionLaterParams): void;
  getLaterList(): void;
}
export interface IMUserInterface {
  requestUser(ids: string): void;
  getUserById(ids: Observable<string>, $isForce?: Observable<boolean>): Observable<IMUser>;
  getUsersByIds(ids: Observable<string[]>): Observable<Record<string, IMUser>>;
  getUserProp(id: Observable<string>, prop: Observable<keyof IMUser>): Observable<IMUser[keyof IMUser]>;
}

export interface IMTeamInterface {
  requestTeamById(teamId: string, _isForceUpdate?: boolean): void;
  getTeamById(param: Observable<string>): Observable<Team>;
  getTeamField(param: Observable<[string, string]>): Observable<unknown>;
  contactEventEmitter: EventEmitter;
}

export type ServerEmoji = {
  emojiTag: string;
  name: string;
  emojis: Record<'name' | 'icon' | 'staticIcon', string>[];
  valid: boolean;
  selectIcon: string;
  unSelectIcon: string;
  order: number;
};
export interface IMCacheInterface {
  getServerEmojis(): ServerEmoji[];
}
