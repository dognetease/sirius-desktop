import { combineLatestWith, map, startWith } from 'rxjs/operators';
import { Observable, of } from 'rxjs';
import lodashGet from 'lodash/get';
import { NIMApi, Session } from '@/api/logical/im';
import { api as masterApi } from '@/api/api';
import { apis } from '@/config';
import { PushHandleApi } from '@/api/logical/push';
import { IM_STREAM, NotifyCountInterface } from '@/api/logical/im_stream';
/**
 * 2021-8-19
 * Notify一期(v1.5.0)。消息数量的推送
 * Notify二期(v1.6.0+) 消息推送接入Rxjs
 */

export class IMNotify implements Omit<IM_STREAM, 'getSubject'>, NotifyCountInterface {
  $nimInstance: NIMApi | null = null;

  private pushApi: PushHandleApi;

  private p2pMuteSubject: Observable<string[]>;

  private teamMuteSubject: Observable<string[]>;

  constructor() {
    this.pushApi = masterApi.requireLogicalApi(apis.pushApiImpl) as unknown as PushHandleApi;

    this.p2pMuteSubject = of([]);
    this.teamMuteSubject = of([]);
  }

  init($instance: NIMApi) {
    const { sessionStream, p2pMuteStream, teamMuteStream } = $instance;

    const sessionSubject = sessionStream.getSubject() as Observable<Session[]>;
    const p2pMuteSubject = p2pMuteStream.getSubject() as Observable<string[]>;
    this.p2pMuteSubject = p2pMuteSubject;
    const teamMuteSubject = teamMuteStream.getSubject() as Observable<string[]>;
    this.teamMuteSubject = teamMuteSubject;

    sessionSubject
      .pipe(
        map(list => list.filter(item => lodashGet(item, 'unread', 0) !== 0)),
        combineLatestWith(p2pMuteSubject, teamMuteSubject),
        // 筛掉在静音列表中的的会话
        map(args => {
          const [sessionList, p2pMuteList, teamMuteList] = args;
          return sessionList.filter(item => {
            if (item.scene === 'p2p') {
              return !p2pMuteList.includes(item.to);
            }
            return !teamMuteList.includes(item.to);
          });
        }),
        map(list => list.reduce((total, current) => total + current.unread, 0))
      )
      .subscribe(count => {
        this.pushApi!.triggerNotificationInfoChange({
          action: 'new_im_msg_num',
          num: count,
          content: '',
          title: '',
        });
      });
  }

  subscribeMuteStatus($sessionId: Observable<string>, _ = false): Observable<boolean> {
    return $sessionId.pipe(
      combineLatestWith(this.p2pMuteSubject, this.teamMuteSubject),
      map(([sessionId, p2pMuteList, teamMuteList]) => {
        const id = sessionId.replace(/^(p2p|team)-/, '');
        if (/^p2p/.test(sessionId)) {
          return p2pMuteList.includes(id);
        }
        return teamMuteList.includes(id);
      }),
      startWith(_)
    );
  }
}

export const imnotifyInstance = new IMNotify();
