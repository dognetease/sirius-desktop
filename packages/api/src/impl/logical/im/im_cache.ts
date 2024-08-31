// import { map, withLatestFrom, single, tap } from 'rxjs/operators';
import { filter, map, withLatestFrom } from 'rxjs/operators';
import { fromEventPattern, Observable, fromEvent } from 'rxjs';
import { ApiResponse } from '@/api/data/http';

// import lodashGet from 'lodash/get';
import { NIMApi, IMMessage } from '@/api/logical/im';
import { IM_STREAM, IMCacheInterface, ServerEmoji } from '@/api/logical/im_stream';
import { api as masterApi } from '@/api/api';
import { inWindow, isElectron } from '@/config';

// THUMBNAIL_SIZE以上使用缩略图
export const THUMBNAIL_SIZE = 3 * 1024 * 1024;
/**
 * IM默认缓存功能
 * 第一期(v1.12.x)先做简单的图片默认缓存功能(这样用户在前台查看图片的时候就会走本地缓存——用户不感知这个功能)
 * 先只做推送过来的图片消息(之后可以给有未读消息的会话里面的图片信息做缓存or more)
 */
export class IM_Cache implements Omit<IM_STREAM, 'getSubject'>, IMCacheInterface {
  private sdk: NIMApi | null = null;

  private systemApi = masterApi.getSystemApi();

  private httpApi = masterApi.getDataTransApi();

  private serverEmojiList: ServerEmoji[] = [];

  init(sdk: NIMApi) {
    this.sdk = sdk;
    // 注册当前API

    if (!inWindow() || window.isBridgeWorker || window.isAccountBg) {
      return;
    }

    // 只有切换到IM模块之后才执行
    setTimeout(() => {
      this.fetchServerEmojiList();
    }, 1500);
  }

  onmsg() {
    const onmsg = (handler: (msg: IMMessage) => void) => {
      this.sdk!.subscrible('onmsg', handler);
    };
    const offmsg = (handler: (msg: IMMessage) => void) => {
      this.sdk!.unSubcrible('onmsg', handler);
    };
    const $curSession = this.sdk!.currentSession.getSubject() as Observable<string>;
    // 只需要team一个stream 个人聊天信息里面包括mute字段
    const $teamMuteStream = this.sdk!.teamMuteStream.getSubject() as Observable<string[]>;
    const $event = fromEventPattern(onmsg, offmsg) as Observable<IMMessage>;
    const $visibleChange = fromEvent(document, 'visibilitychange').pipe(map(() => document.visibilityState));

    $event
      .pipe(
        // 只关注图片消息
        filter(msg => msg.type === 'image'),
        // 已经屏蔽的会话不缓存
        filter(msg => !msg.isMuted),
        withLatestFrom($curSession, $visibleChange),
        // 当前会话(可视)不缓存
        filter(([msg, sessionId, visibilityState]) => {
          if (visibilityState === 'hidden') {
            return isElectron();
          }
          return msg.sessionId !== sessionId && isElectron();
        }),
        map(([msg]) => msg),
        withLatestFrom($teamMuteStream),
        // 免打扰的会话不展示
        filter(([msg, teamMuteList]) => {
          if (msg.scene === 'team') {
            return !teamMuteList.includes(msg.to);
          }
          return !msg.isMuted;
        }),
        map(([msg]) => msg)
      )
      .subscribe(msg => {
        const { size, w, h } = (msg as unknown as IMMessage).file as {
          url: string;
          size: number;
          w: number;
          h: number;
        };
        let { url } = (msg as unknown as IMMessage).file!;
        // 如果大于3M 缓存缩率图
        if (size > THUMBNAIL_SIZE) {
          url = this.getThumbnailImg(url as string, {
            width: Math.min(300, Math.max(w, h)),
            height: Math.min(300, Math.max(w, h)),
          });
        } else {
          url = this.getThumbnailImg(url as string);
        }

        if (window.bridgeApi && window.bridgeApi.master) {
          window.bridgeApi.master.requestData({
            namespace: 'common',
            apiname: 'cacheImage',
            args: [url],
          });
        }
      });
  }

  // 获取图片缩略图
  getThumbnailImg(url: string, thumbnailConfig?: Record<'width' | 'height', number>) {
    const params = {
      url,
      strip: true,
      interlace: true, // 渐变清晰
      thumbnail: { ...thumbnailConfig, mode: 'contain' },
    };
    const newImgUrl = this.sdk!.getInstance()!.viewImageSync(params);
    return newImgUrl;
  }

  private async fetchServerEmojiList() {
    const url = this.systemApi.getUrl('getCustomEmoji');
    const res = (await this.httpApi.get(url)) as ApiResponse<ServerEmoji[]>;
    this.serverEmojiList = res.data!.data as ServerEmoji[];
  }

  getServerEmojis() {
    return this.serverEmojiList.filter(item => item.valid);
  }
}
