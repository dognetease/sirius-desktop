// import { map, withLatestFrom, single, tap } from 'rxjs/operators';
import { filter, tap, withLatestFrom, map, switchMap, timeout, catchError, take, toArray } from 'rxjs/operators';
import { fromEventPattern, Observable, forkJoin, of, iif, fromEvent } from 'rxjs';
import lodashGet from 'lodash/get';
import { NIMApi, IMMessage, IMQuickComment, IMUser, emojiTypeNameMap } from '@/api/logical/im';
import { IM_STREAM } from '@/api/logical/im_stream';
import { util } from '@/api/util/index';
import { api as masterApi } from '@/api/api';
import { apis } from '@/config';
import { PushHandleApi } from '@/api/logical/push';

type QuickCommentHandler = (params: [IMMessage, IMQuickComment]) => void;

interface CustomContentApi {
  type: number;
  data: Record<'header' | 'body' | 'footer', string> | string | unknown;
  alt?: Record<'header' | 'body' | 'footer', string> | string;
}

const customMessageType = {
  1: '[石头剪刀布]',
  2: '[阅后即焚]',
  3: '[表情]',
  1010: '权限变更',
};

const getCustomContent = (msg: IMMessage) => {
  let content: CustomContentApi;
  try {
    content = JSON.parse(msg.content as string) as CustomContentApi;
  } catch (ex) {
    content = {} as CustomContentApi;
  }

  if (lodashGet(content, 'type', -99) === -99) {
    return '[当前版本暂不支持查看此消息类型]';
  }

  const { type: contentType, data, alt } = content;
  return [
    () => lodashGet(customMessageType, contentType, false),
    () => {
      // 服务端返回消息解析(data中的header字段)
      const dataObj = typeof data === 'string' ? JSON.parse(data) : data;
      const headerStr = lodashGet(dataObj, 'header', false);
      return typeof headerStr === 'string' ? headerStr : false;
    },
    () => {
      // 服务端兜底消息
      const backupContent = typeof alt === 'string' ? JSON.parse(alt) : alt;
      return lodashGet(backupContent, 'header', false);
    },
    () => '[当前版本暂不支持查看此消息类型]',
  ].reduce((total, current) => {
    if (lodashGet(total, 'length', 0) === 0) {
      return current();
    }
    return total;
  }, '');
};

const convertMsgContent = (msg: IMMessage) => {
  if (lodashGet(msg, 'text.length', 0) !== 0) {
    return msg.text as string;
  }

  if (Object.keys(IM_PushNotify.MsgTypeDesc).includes(msg.type)) {
    return [`[${IM_PushNotify.MsgTypeDesc[msg.type as 'image']}]`, msg.type === 'file' ? msg.file!.name : ''].join('');
  }

  if (msg.type === 'tip') {
    return msg.tip as string;
  }

  // 自定义消息
  if (msg.type === 'custom') {
    return getCustomContent(msg);
  }

  return '[当前版本暂不支持查看此消息类型]';
};

export class IM_PushNotify implements Omit<IM_STREAM, 'getSubject'> {
  static MsgTypeDesc = {
    image: '图片',
    video: '视频',
    audio: '音频',
    file: '文件',
  };

  private sdk: NIMApi | null = null;

  private pushApi = masterApi.requireLogicalApi(apis.pushApiImpl) as unknown as PushHandleApi;

  init(sdk: NIMApi) {
    this.sdk = sdk;
    this.onmsg(sdk);
    this.onquickcomment(sdk);
  }

  /**
   * @description:1.7.0版本先只迁移是否展示推送的逻辑。消息体还是先沿用老代码。下个版本(1.8.0+)在替换
   * @author:guochao03@qy.163.com
   * @param sdk:
   */
  onmsg(sdk: NIMApi) {
    const onmsg = (handler: (msg: IMMessage) => void) => {
      this.sdk!.subscrible('onmsg', handler);
    };
    const offmsg = (handler: (msg: IMMessage) => void) => {
      this.sdk!.unSubcrible('onmsg', handler);
    };
    const $event = fromEventPattern(onmsg, offmsg) as Observable<IMMessage>;

    const $curSession = sdk.currentSession.getSubject() as Observable<string>;
    // 只需要team一个stream 个人聊天信息里面包括mute字段
    const $teamMuteStream = sdk.teamMuteStream.getSubject() as Observable<string[]>;

    const $visibleChange = fromEvent(document, 'visibilitychange').pipe(map(() => document.visibilityState));

    $event
      .pipe(
        // 自己发送的消息不推送
        filter(msg => msg.flow !== 'out'),
        // 已经屏蔽的消息不推送(只针对p2p消息生效)
        filter(msg => !msg.isMuted),
        withLatestFrom($curSession, $visibleChange),
        // 当前会话不推送消息 & 通知类消息不同送(群消息变更)
        // 如果当前窗口隐藏 推送
        filter(([msg, sessionId, visibilityState]) => {
          if (msg.type === 'notification') {
            return false;
          }

          if (visibilityState === 'hidden') {
            return true;
          }
          return msg.sessionId !== sessionId;
        }),
        map(([msg]) => msg),
        withLatestFrom($teamMuteStream),
        // 在静音列表内的消息不给推送
        filter(([msg, teamMuteList]) => {
          if (msg.scene === 'team') {
            return !teamMuteList.includes(msg.to);
          }
          return true;
        }),
        map(([msg]) => msg),
        //
        switchMap(msg => this.assemblePushContent(msg))
      )
      .subscribe(({ title, content, link }) => {
        this.pushApi.triggerNotificationInfoChange({
          action: 'new_im_msg',
          num: 1,
          content,
          title,
          data: link,
        });
      });
  }

  private onquickcomment(sdk: NIMApi) {
    const onquickcomment = (handler: QuickCommentHandler) => {
      this.sdk!.subscrible('onQuickComment', handler);
    };
    const offquickcomment = (handler: QuickCommentHandler) => {
      sdk.unSubcrible('onQuickComment', handler);
    };
    const $event = fromEventPattern(onquickcomment, offquickcomment) as Observable<[IMMessage, IMQuickComment]>;
    const $curSession = sdk.currentSession.getSubject() as Observable<string>;
    // 只需要team一个stream 个人聊天信息里面包括mute字段
    const $teamMuteStream = sdk.teamMuteStream.getSubject() as Observable<string[]>;
    const $p2pMuteStream = sdk.p2pMuteStream.getSubject() as Observable<string[]>;

    const $selfStream = sdk.imself.getSubject() as Observable<IMUser>;
    const $visibleChange = fromEvent(document, 'visibilitychange').pipe(map(() => document.visibilityState));

    $event
      .pipe(
        tap(args => {
          console.log('[im.pushmsg]oncomment', args);
        }),
        withLatestFrom($selfStream),
        filter(([commentArgs, myinfo]) => {
          const [msg, comment] = commentArgs;

          // 不是自己消息的comment 过滤掉
          if (msg.from !== myinfo.account) {
            return false;
          }
          return comment.from !== myinfo.account;
        }),
        // 返回的msg数据没有sessionId 需要自己补全
        map(([commentArgs]) => {
          const msg = commentArgs[0];
          commentArgs[0] = {
            ...msg,
            sessionId: [msg.scene, msg.to].join('-'),
          };
          return commentArgs;
        })
      )
      .pipe(
        withLatestFrom($curSession, $visibleChange),
        // 当前会话不推送消息
        // 如果窗口隐藏 直接推送
        filter(([commentArgs, sessionId, visibilityState]) => {
          if (visibilityState === 'hidden') {
            return true;
          }

          const [msg] = commentArgs;
          if (msg.scene === 'team') {
            return [msg.scene, msg.to].join('-') !== sessionId;
          }
          return ![`${msg.scene}-${msg.to}`, `${msg.scene}-${msg.from}`].includes(sessionId);
        }),
        map(([commentArgs]) => commentArgs)
      )
      .pipe(
        // 免打扰消息不推送
        withLatestFrom($teamMuteStream, $p2pMuteStream),
        filter(([commentArgs, teamMutelist, p2pMuteList]) => {
          const [msg] = commentArgs;
          const [scene, to] = msg.sessionId.split('-') as [string, string];
          if (scene === 'p2p') {
            return !p2pMuteList.includes(to);
          }
          return !teamMutelist.includes(to);
        }),
        map(args => {
          const [msg, comment] = args[0];

          const commentedId = msg.from;
          const text = emojiTypeNameMap[comment.body] || '[未知表情]';
          return {
            ...msg,
            type: 'text',
            text,
            flow: 'in',
            from: comment.from,
            commentTo: commentedId,
          } as IMMessage;
        }),
        tap(commentArgs => {
          console.log('[im.pushmsg]oncomment.handled', commentArgs);
        }),
        switchMap(msg => this.assemblePushContent(msg))
      )
      .subscribe(({ content, link, title }) => {
        this.pushApi.triggerNotificationInfoChange({
          action: 'new_im_msg',
          num: 1,
          content,
          title,
          data: link,
        });
      });
  }

  // 手动拼装推送数据
  private assemblePushContent(msg: IMMessage, isCommentMsg = false) {
    const $msgContent = of(msg).pipe(
      map(msg => {
        const msgContent = convertMsgContent(msg);
        return util.chopStrToSize(msgContent, 70);
      })
    );
    return iif(
      () => msg.scene === 'p2p',
      forkJoin({
        msgScene: of('p2p'),
        fromNick: this.getContactName(msg.from),
        teamName: of(''),
        msgContent: $msgContent,
      }).pipe(
        map(result => ({
          title: ['消息', result.fromNick].join(':'),
          content: [isCommentMsg ? '回应' : '', result.msgContent].filter(item => item.length >= 1).join(':'),
          link: `sessionId=p2p-${msg.from}&mode=normal&source=push`,
        }))
      ),
      forkJoin({
        msgScene: of('team'),
        fromNick: this.getContactName(msg.from),
        teamName: this.getTeamName(msg.to),
        msgContent: $msgContent,
      }).pipe(
        map(result => ({
          title: ['群消息', result.teamName].join(':'),
          content: [result.fromNick + (isCommentMsg ? '回应' : ''), result.msgContent].join(':'),
          link: `sessionId=team-${msg.to}&mode=normal&source=push`,
        }))
      )
    );
  }

  // 获取群名
  private getTeamName(teamId: string): Observable<string> {
    this.sdk!.imteamStream.requestTeamById(teamId);
    const $params = of(teamId, 'customTeamName').pipe(toArray()) as Observable<[string, string]>;
    const $name = this.sdk!.imteamStream.getTeamField($params) as Observable<string>;
    return $name.pipe(
      take(1),
      timeout(200),
      catchError(() => of('team'))
    );
  }

  // 获取联系人信息
  private getContactName(userId: string): Observable<string> {
    this.sdk!.imusers.requestUser(userId);
    const $name = this.sdk!.imusers.getUserProp(of(userId), of('nick')) as Observable<string>;
    return $name.pipe(take(1));
  }
}
