import { fromEventPattern, Observable } from 'rxjs';
import { EventEmitter } from 'events';
import { startWith, shareReplay } from 'rxjs/operators';
import { IM_STREAM, CurrentSessionInterface } from '@/api/logical/im_stream';
import { NIMApi, Session, CreateSessionApi, IMMessage } from '@/api/logical/im';

export class IM_CurrentSession implements IM_STREAM, CurrentSessionInterface {
  private subject: Observable<string>;

  private myEvent = new EventEmitter();

  private sdk: NIMApi | null = null;

  static Event_Name_Collections = {
    onCurrSessionId: 'onCurrSessionId',
  };

  constructor() {
    const { onCurrSessionId: eventName } = IM_CurrentSession.Event_Name_Collections;
    const onCurrSessionId = (handler: (e: string) => void) => {
      this.myEvent.addListener(eventName, handler);
    };
    const offCurrSessionId = (handler: (e: string) => void) => {
      this.myEvent.removeListener(eventName, handler);
    };

    const $event = fromEventPattern(onCurrSessionId, offCurrSessionId) as Observable<string>;
    this.subject = $event.pipe(startWith(''), shareReplay(1));
  }

  getSubject(): Observable<string> | null {
    return this.subject;
  }

  init(sdk: NIMApi) {
    this.sdk = sdk;
  }

  // 设置当前会话
  async setSession(
    options: CreateSessionApi,
    {
      validateTeam = false,
      tryCreateSession = false,
    }: {
      validateTeam: boolean;
      tryCreateSession: boolean;
    }
  ) {
    options = { scene: options.scene || 'p2p', ...options };
    // 先去验证群是否有效
    await this._isTeamValid(options.to, validateTeam ? options.scene : 'p2p');
    // 获取当前会话的session信息
    if (tryCreateSession) {
      await this._getSessionById(options.to, options.scene as string);
    }
    const { onCurrSessionId: eventName } = IM_CurrentSession.Event_Name_Collections;
    this.myEvent.emit(eventName, [options.scene, options.to].join('-'));
    return true;
  }

  // 通过消息通知设置当前会话同样需要触发事件
  async setPushSessionEvent(options: CreateSessionApi) {
    const { onCurrSessionId: eventName } = IM_CurrentSession.Event_Name_Collections;
    this.myEvent.emit(eventName, [options.scene, options.to].join('-'));
  }

  createSession(scene: string, to: string) {
    this._getSessionById(to, scene);
  }

  // 通过to&scene获取session对象
  private async _getSessionById(to: string, scene: string): Promise<Session> {
    //  step1:查找本地是否有当前会话
    try {
      const session = (await this.sdk!.excute('getLocalSession', {
        sessionId: [scene, to].join('-'),
      })) as Session;

      // 如果这个群在本地是有效群(包含scene/to信息)
      if (['scene', 'to', 'updateTime'].every(key => Reflect.has(session, key))) {
        return session;
      }
      throw new Error('invalid session');
    } catch (ex) {}

    // step2:尝试创建一个新会话
    try {
      const { session } = (await this.sdk!.excute('insertLocalSession', {
        scene,
        to,
      })) as { session: Session };
      return session;
    } catch (ex) {}

    /**
     * step3:
     * 如果当前查找的会话可能只包含ack/id/unread等信息 不能正常的创建会话
     * 通过先发送一条消息 然后再删除的方法解决这个问题
     */
    // step3:
    // 不能正常的发起会话.
    const msg = (await this.sdk!.excute('sendText', {
      scene,
      to,
      text: 'CREATE_CONVERSATION_MSG',
      isLocal: true,
    })) as IMMessage;
    await this.sdk!.excute('deleteLocalMsg', {
      msg,
    });
    // 放回当前最新的session对象
    return this.sdk!.excute('getLocalSession', {
      sessionId: [scene, to].join('-'),
    });
  }

  // 验证当前群是否valid
  private async _isTeamValid(to: string, scene = 'team'): Promise<boolean> {
    if (scene !== 'team') {
      return Promise.resolve(true);
    }
    await this.sdk!.excute('getTeam', { teamId: to });
    return Promise.resolve(true);
  }
}
