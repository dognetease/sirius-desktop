import { inWindow } from 'api';

interface DocItem {
  /** true 文档编辑器处于 演示模式 */
  editorUIFullscreen: boolean;
  /** iframe 父标签 */
  editorPrarentEL: any;
  editorParentWindowEl: any;
  docComponentID: string;
  docTitle: string;
  // 多页签唯一标识
  hash: string;
}

export function requestFullScreen(el) {
  const document = window.parent?.document || window.document;
  const docRoot: any = el || document.documentElement;
  const requestFullScreenFn = docRoot.requestFullScreen || docRoot.msRequestFullscreen || docRoot.webkitRequestFullScreen || docRoot.mozRequestFullScreen;
  try {
    requestFullScreenFn.call(docRoot);
  } catch (e) {
    // tslint:disable-next-line:no-console
    console.error({ message: `requestFullScreen:${e.message}`, optionalOutputs: [e] });
  }
}

export function exitFullScreen() {
  // const document = window.parent?.document || window.document
  const docRoot: any = document;
  const exitFullScreenFn = docRoot.exitFullscreen || docRoot.webkitExitFullscreen || docRoot.mozCancelFullScreen;
  try {
    const isFullScreen = docRoot.fullscreen || docRoot.mozFullScreen || docRoot.webkitIsFullScreen;
    if (isFullScreen) {
      exitFullScreenFn.call(docRoot);
    }
  } catch (e) {
    // tslint:disable-next-line:no-console
    console.error({ message: `exitFullScreen:${e.message}`, optionalOutputs: [e] });
  }
}

export class PresenTationManage {
  store = new Map<string, DocItem>();

  lockedCache = [];

  private locked = false;

  private lockTimer: any = null;

  private preIsfullscreen = false;

  private watchTimer: any = null;

  /**
   * fullscreenchange 事件不生效
   * 因此使用hack方式解决。
   */
  watchFullscreenChange() {
    clearTimeout(this.watchTimer);
    this.watchTimer = setTimeout(() => {
      if (this.preIsfullscreen && !this.documentFullscreen && this.store.size) {
        this.exitFullScreen();
      }
      this.preIsfullscreen = !!this.documentFullscreen;

      // console.log('full-screen:', "循环");

      if (this.store.size) {
        this.watchFullscreenChange();
      }
    }, 200);
  }

  unWatchFullscreenChange() {
    // console.log('full-screen:', "取消循环");
    clearTimeout(this.watchTimer);
  }

  initLock() {
    clearTimeout(this.lockTimer);
    this.locked = true;
    this.lockTimer = setTimeout(() => {
      this.locked = false;
    }, 600);
  }

  /**
   * true document 处于 fullscreen 模式
   */
  get documentFullscreen() {
    return inWindow() ? !!window.document.fullscreenElement : false;
  }

  addDocItem(params: DocItem) {
    this.store.set(params.docComponentID, params);
    // console.log('full-screen:', "新增");
    this.watchFullscreenChange();
  }

  /**
   * Doc 组件卸载要执行的函数
   * @param params
   */
  removeDocItem(params: Pick<DocItem, 'docComponentID'>) {
    this.store.delete(params.docComponentID);
  }

  setDocTitle(docComponentID: string, docTitle: string) {
    const doc = this.store.get(docComponentID);
    if (doc) {
      doc.docTitle = docTitle;
    }
  }

  /**
   * editor 内部触发退出 或者 ESC 退出 直接执行这个函数
   */
  exitFullScreen() {
    if (this.locked) {
      return;
    }

    // console.log('执行退出--------',this.lockedCache.length)
    const docs = this.store.values();
    for (const val of docs) {
      const value = val as unknown as DocItem;
      if (value.editorUIFullscreen) {
        try {
          value.editorParentWindowEl.current?.contentWindow?.postMessage(
            {
              type: 'closePresentationMode',
            },
            '*'
          );
        } catch (error) {}
        value.editorPrarentEL.current.removeAttribute('style');
        value.editorUIFullscreen = false;
      }
    }

    const winOperateBarEl = window.document.getElementById('global-window-operate-bar');
    if (winOperateBarEl) {
      winOperateBarEl.removeAttribute('style');
    }

    exitFullScreen();
  }

  /**
   * 点击 演示模式 icon 执行的函数
   * @param docComponentID
   */
  invokeFullscreen(docComponentID: DocItem['docComponentID']) {
    this.invokeFullScreenImpl(docComponentID);
  }
  /**
   * 当前文档在多页签中失去焦点
   * @param hash
   * @param isLostFocus 是否失去焦点
   */
  sendVisibleChangeMsg(hash: DocItem['hash'], isLostFocus: boolean) {
    this._sendMsgByHash(hash, { type: 'visiblechange', value: isLostFocus });
  }

  _sendMsgByHash(hash: DocItem['hash'], data: any) {
    const docs = this.store.values();
    for (const val of docs) {
      const value = val as unknown as DocItem;
      if (value.hash === hash) {
        try {
          console.warn('_sendMsgByHash data', data);
          value.editorParentWindowEl.current?.contentWindow?.postMessage(data, '*');
        } catch (error) {
          console.warn('_sendMsgByHash error', error);
        }
      }
    }
  }
  invokeFullScreenImpl(docComponentID: DocItem['docComponentID']) {
    const doc = this.store.get(docComponentID)!;
    const docs = this.store.values();

    // 唤起fullscreen;
    if (!document.fullscreenElement) {
      requestFullScreen(document.documentElement);
      const winOperateBarEl = window.document.getElementById('global-window-operate-bar');
      if (winOperateBarEl) {
        winOperateBarEl.setAttribute('style', 'z-index:1;');
      }
    }

    // 关闭其它editor 演示模式
    for (const val of docs) {
      // val 为 演示模式UI
      if (val.editorUIFullscreen && val.docComponentID !== docComponentID) {
        try {
          val.editorParentWindowEl.current?.contentWindow?.postMessage(
            {
              type: 'closePresentationMode',
            },
            '*'
          );
        } catch (error) {}
        // 上面消息发送后，会收到 完成退出演示模式的 消息，这时候会再次执行exitFullsreen方法。
        // 因此：启用一个500毫秒的有效的🔒，用于忽略500毫秒内的exitFullscreen执行。
        this.initLock();
        val.editorPrarentEL.current.removeAttribute('style');
        val.editorUIFullscreen = false;
      }
    }

    // 唤起当前文档展示演示模式UI
    try {
      doc.editorParentWindowEl.current?.contentWindow?.postMessage(
        {
          type: 'openPresentationMode',
          docTitle: doc.docTitle,
        },
        '*'
      );
    } catch (error) {
      console.log(error);
    }
    doc.editorPrarentEL.current.setAttribute(
      'style',
      `            
        position: fixed;
        width: 100%;
        height: 100%;
        z-index: 100;
        top: 0;
        left: 0;`
    );
    doc.editorUIFullscreen = true;
  }
}
export const presentationManagr = new PresenTationManage();
