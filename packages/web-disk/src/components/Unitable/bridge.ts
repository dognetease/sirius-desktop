export enum ToolbarItem {
  Hidden = 'hidden',
  Filter = 'filter',
  AddRecord = 'add-record',
  Group = 'group',
  Sort = 'sort',
  LineHeight = 'line-height',
  Find = 'find',
  Divider = 'divider',
}

export interface ContactInfo {
  uid: string;
  name: string;
  photoUrl: string;
  deptNameList: string[];
  tel?: string;
  email?: string;
  // 根据账户id计算得到的用户展示颜色
  avatarColor?: string;
  // ContactModel,作为sendReceiveMail的参数
  model: any;
}
export type FileType = 'excel' | 'doc' | 'unitable';
export type BlankFileTemplateUseDataTrackParams = {
  kind: 'Recommend' | 'My';
  title: string;
  type: FileType;
  way: 'more' | 'blank_page';
};
export type GetContactListParams =
  | {
      /**通过uid 精准匹配 */
      type: 'uid';
      uid: string[];
    }
  | {
      /**模糊搜索 */
      type: 'search';
      prefix: string;
    }
  | {
      /**获取当前app协作者list */
      type: 'collaborator';
    };

// TODO: 这部分抽离为公共库, 避免同时维护多个文件, 降低复杂度
const BridgeTypeEnum = {
  UPDATE_TITLE: 'updateTitle',
  OPEN_SHARE_POPUP: 'openSharePopup',
  OPEN_TEMPLATE_POPUP: 'openTemplatePopup',
  OPEN_USER_CARD_POPUP: 'openUserCardPopup',
  OPEN_CREATE_FILE_POPUP: 'openCreateFilePopup',
  GO_BACK: 'goBack',
  GOODBYE: 'goodbye',
  PERMISSION: 'permission',
  BLUR: 'blur',
  CREATE_FILE: 'createFile',
  DELETE_FILE: 'deleteFile',
  GET_FILE_INFO: 'getFileInfo',
  COORDINATOR: 'coordinator',
  SHOW_RECOMMOND_BAR: 'showRecommondBar',
  HIDE_RECOMMOND_BAR: 'hideRecommondBar',
  UNITABLE_RELOAD: 'unitableReload',
  COVER_CONTENT_BY_TEMPLATE: 'coverContentByTemplate',
  HIDE_BACK_BTN: 'hideBackBtn',
  OPEN_BROWSER: 'openBrowser', // 浏览器中打开

  /**周报日报 汇报填写页，form 提交后，会发送这个message 通知办公 */
  FORM_COLLECT_SUBMITTED: 'formCollectSubmitted',
  /**周报日报 汇报填写页，form 取消填写后，会发送这个message 通知办公 */
  FORM_COLLECT_CANCEL: 'formCollectCancel',
  /**周阿日报 模板编辑页，保存成功后，会发送这个message通知办公 */
  FORM_TEMPLATE_EDIT_SUBMITTED: 'formTemplateEditSubmitted',
  /**周阿日报 模板编辑页，取消编辑，会发送这个message通知办公 */
  FORM_TEMPLATE_EDIT_CANCEL: 'formTemplateEditCancel',
  /**获取用户List */
  GET_CONTACT_LIST: 'getContactList',
  /**获取当前登录用户信息 */
  GET_CURRENT_USER_INFO: 'getCurrentUserInfo',
  /**选择联系人 */

  CHANGE_VIEW: 'changeView',
  SET_TABLE_CONFIG: 'setTableConfig',
  SEND_MAIL: 'sendMail',
} as const;
const BridgeTypeArr = Object.values(BridgeTypeEnum);

type BridgePayload = {
  [BridgeTypeEnum.UPDATE_TITLE]: {
    title: string;
  };
  [BridgeTypeEnum.OPEN_SHARE_POPUP]: {
    rect: {
      left: number;
      top: number;
      width: number;
      height: number;
    };
  };
  [BridgeTypeEnum.OPEN_TEMPLATE_POPUP]: null;
  [BridgeTypeEnum.OPEN_CREATE_FILE_POPUP]: {
    rect: {
      left: number;
      top: number;
      width: number;
      height: number;
    };
  };
  [BridgeTypeEnum.OPEN_USER_CARD_POPUP]: {
    rect: {
      left: number;
      top: number;
      width: number;
      height: number;
    };
    userId: string;
  };
  [BridgeTypeEnum.GO_BACK]: null;
  [BridgeTypeEnum.GOODBYE]: {
    reason: string;
  };
  [BridgeTypeEnum.PERMISSION]: null;
  [BridgeTypeEnum.BLUR]: null;
  [BridgeTypeEnum.CREATE_FILE]: {
    fileType: 'excel' | 'doc' | 'unitable';
  };
  [BridgeTypeEnum.DELETE_FILE]: null;
  [BridgeTypeEnum.GET_FILE_INFO]: null;
  [BridgeTypeEnum.COORDINATOR]: {
    userIds: string[];
  };
  [BridgeTypeEnum.SHOW_RECOMMOND_BAR]: {
    /**
     * 视图菜单栏的显示隐藏，影响灵犀办公unitable详情页的模板推荐组件的位置，因此变更需要通知办公
     * true 视图菜单栏显示,false 视图菜单栏隐藏
     * */
    viewMenuBarVisible: boolean;
  };
  [BridgeTypeEnum.HIDE_RECOMMOND_BAR]: null;
  [BridgeTypeEnum.UNITABLE_RELOAD]: null;
  [BridgeTypeEnum.COVER_CONTENT_BY_TEMPLATE]: {
    docType: string;
    identity: string;
    templateId: number;
    /**埋点数据 */
    dataTrackParams: BlankFileTemplateUseDataTrackParams;
  };
  [BridgeTypeEnum.HIDE_BACK_BTN]: null;
  [BridgeTypeEnum.OPEN_BROWSER]: null;
  [BridgeTypeEnum.GET_CURRENT_USER_INFO]: null;
  [BridgeTypeEnum.FORM_COLLECT_SUBMITTED]: null;
  [BridgeTypeEnum.FORM_COLLECT_CANCEL]: null;
  [BridgeTypeEnum.FORM_TEMPLATE_EDIT_SUBMITTED]: null;
  [BridgeTypeEnum.FORM_TEMPLATE_EDIT_CANCEL]: null;
  [BridgeTypeEnum.GET_CONTACT_LIST]: GetContactListParams;
  [BridgeTypeEnum.CHANGE_VIEW]: {
    viewId: string;
    tableId: string;
    options: {
      filter: any | null;
    } | null;
  };
  [BridgeTypeEnum.SET_TABLE_CONFIG]: {
    tableId: string;
    config: {
      customToolbarList?: ToolbarItem[];
    };
  };
  [BridgeTypeEnum.SEND_MAIL]: {
    mails: string[];
  };
};
type BridgeReturnPayload = {
  [BridgeTypeEnum.UPDATE_TITLE]: boolean;
  [BridgeTypeEnum.OPEN_SHARE_POPUP]: boolean;
  [BridgeTypeEnum.GO_BACK]: boolean;
  [BridgeTypeEnum.GOODBYE]: boolean;
  [BridgeTypeEnum.PERMISSION]: boolean;
  [BridgeTypeEnum.OPEN_TEMPLATE_POPUP]: boolean;
  [BridgeTypeEnum.OPEN_USER_CARD_POPUP]: boolean;
  [BridgeTypeEnum.OPEN_CREATE_FILE_POPUP]: boolean;
  [BridgeTypeEnum.BLUR]: boolean;
  [BridgeTypeEnum.CREATE_FILE]: boolean;
  [BridgeTypeEnum.DELETE_FILE]: boolean;
  [BridgeTypeEnum.GET_FILE_INFO]: {
    createTime: number;
    updateTime: number;
    identity: string;
    docType: string;
    title: string;
    username: string;
  } | null;
  [BridgeTypeEnum.COORDINATOR]: boolean;
  [BridgeTypeEnum.SHOW_RECOMMOND_BAR]: boolean;
  [BridgeTypeEnum.HIDE_RECOMMOND_BAR]: boolean;
  [BridgeTypeEnum.UNITABLE_RELOAD]: boolean;
  [BridgeTypeEnum.COVER_CONTENT_BY_TEMPLATE]: void;
  [BridgeTypeEnum.HIDE_BACK_BTN]: boolean;
  [BridgeTypeEnum.OPEN_BROWSER]: boolean;
  [BridgeTypeEnum.FORM_COLLECT_SUBMITTED]: void;
  [BridgeTypeEnum.FORM_COLLECT_CANCEL]: void;
  [BridgeTypeEnum.FORM_TEMPLATE_EDIT_SUBMITTED]: void;
  [BridgeTypeEnum.FORM_TEMPLATE_EDIT_CANCEL]: void;
  [BridgeTypeEnum.GET_CONTACT_LIST]: ContactInfo[];
  [BridgeTypeEnum.GET_CURRENT_USER_INFO]: undefined | ContactInfo;
  [BridgeTypeEnum.CHANGE_VIEW]: boolean;
  [BridgeTypeEnum.SET_TABLE_CONFIG]: boolean;
  [BridgeTypeEnum.SEND_MAIL]: boolean;
};
const DefaultBridgeReturnPayload: {
  [key in BridgeType]: BridgeReturnPayload[key];
} = {
  [BridgeTypeEnum.UPDATE_TITLE]: false,
  [BridgeTypeEnum.OPEN_SHARE_POPUP]: false,
  [BridgeTypeEnum.GO_BACK]: false,
  [BridgeTypeEnum.GOODBYE]: false,
  [BridgeTypeEnum.PERMISSION]: false,
  [BridgeTypeEnum.OPEN_TEMPLATE_POPUP]: false,
  [BridgeTypeEnum.OPEN_USER_CARD_POPUP]: false,
  [BridgeTypeEnum.OPEN_CREATE_FILE_POPUP]: false,
  [BridgeTypeEnum.BLUR]: false,
  [BridgeTypeEnum.CREATE_FILE]: false,
  [BridgeTypeEnum.DELETE_FILE]: false,
  [BridgeTypeEnum.GET_FILE_INFO]: null,
  [BridgeTypeEnum.COORDINATOR]: false,
  [BridgeTypeEnum.SHOW_RECOMMOND_BAR]: false,
  [BridgeTypeEnum.HIDE_RECOMMOND_BAR]: false,
  [BridgeTypeEnum.UNITABLE_RELOAD]: false,
  [BridgeTypeEnum.COVER_CONTENT_BY_TEMPLATE]: undefined,
  [BridgeTypeEnum.HIDE_BACK_BTN]: false,
  [BridgeTypeEnum.OPEN_BROWSER]: false,
  [BridgeTypeEnum.FORM_COLLECT_SUBMITTED]: undefined,
  [BridgeTypeEnum.FORM_COLLECT_CANCEL]: undefined,
  [BridgeTypeEnum.FORM_TEMPLATE_EDIT_SUBMITTED]: undefined,
  [BridgeTypeEnum.FORM_TEMPLATE_EDIT_CANCEL]: undefined,
  [BridgeTypeEnum.GET_CONTACT_LIST]: [],
  [BridgeTypeEnum.GET_CURRENT_USER_INFO]: undefined,
  [BridgeTypeEnum.CHANGE_VIEW]: false,
  [BridgeTypeEnum.SET_TABLE_CONFIG]: false,
  [BridgeTypeEnum.SEND_MAIL]: false,
};

type BridgeType = (typeof BridgeTypeEnum)[keyof typeof BridgeTypeEnum];
type PayloadType<T extends BridgeType> = BridgePayload[T];
type ReturnPayloadType<T extends BridgeType> = BridgeReturnPayload[T];
type MessageType<T extends BridgeType> = {
  type: T;
  payload: PayloadType<T>;
};
export type HandlerType<T extends BridgeType> = (payload: PayloadType<T>) => void | Promise<ReturnPayloadType<T>>;
type Message = MessageType<BridgeType>;
type Handler = HandlerType<BridgeType>;

export interface BridgeApi {
  on: <T extends BridgeType>(type: T, handler: HandlerType<T>) => void;
  emit: <T extends BridgeType>(type: T, payload: PayloadType<T>) => void;
  exec: <T extends BridgeType>(type: T, payload: PayloadType<T>) => Promise<ReturnPayloadType<T>>;
  remove: <T extends BridgeType>(type: T, handler: HandlerType<T>) => void;
}
export const fakeBridgeApi: BridgeApi = {
  on: () => {
    console.debug(`fakeBridgeApi.on()`);
  },
  emit: () => {
    console.debug(`fakeBridgeApi.emit()`);
  },
  remove: () => {
    console.debug(`fakeBridgeApi.remove()`);
  },
  exec: async type => {
    console.debug(`fakeBridgeApi.exec()`);
    return DefaultBridgeReturnPayload[type];
  },
};
// TODO: bridge ready check
export class Bridge implements BridgeApi {
  private handlers: { [key: string]: Array<Handler> } = {};

  public iframeEl: HTMLIFrameElement | null = null;

  public checkReceiveMessage: ((message: Message) => boolean) | null = null;

  public checkPostMessage: ((message: Message) => boolean) | null = null;

  constructor(private logType: string = 'bridge') {
    this.init();
  }

  private init = () => {
    window.addEventListener('message', this.receiveMessage, false);
  };

  private receiveMessage = async (event: MessageEvent) => {
    const message = event.data as Message;
    if (!BridgeTypeArr.includes(message?.type)) {
      console.warn(`[${this.logType}] unknown message type: ${message?.type}`);
      return;
    }
    if (this.checkReceiveMessage && !this.checkReceiveMessage(message)) {
      console.warn(`[${this.logType}] receive message check failed: ${JSON.stringify(message)}`);
      return;
    }
    const { ports } = event;
    const needReturnValue = ports && ports.length > 0;
    console.debug(`[${this.logType}] receive message: ${JSON.stringify(message)}, origin: ${event.origin}, isFromCurrentWindow: ${event.source === window}`);
    const handlers = this.handlers[message.type] ?? [];
    // TODO: 这块逻辑看下优化下, 例如限制某些方法只能声明一次, 避免定不下使用哪个返回值
    const firstHandler = handlers?.[0];
    if (needReturnValue && firstHandler) {
      let res: any = firstHandler(message.payload);
      if (res instanceof Promise) {
        res = await res;
      }
      ports[0].postMessage(res);
      return;
    }
    handlers.forEach(handler => {
      handler(message.payload);
    });
  };

  private postMessage = (message: Message, transfer?: Transferable): boolean => {
    const { type, payload } = message;
    if (this.checkPostMessage && !this.checkPostMessage(message)) {
      console.warn(`[${this.logType}] post message check failed: ${JSON.stringify(message)}`);
      return false;
    }
    const targetOrigin = '*';
    console.log(`[${this.logType}] post message: ${JSON.stringify(message)}, targetOrigin: ${targetOrigin}`);
    const postWindow = this.iframeEl?.contentWindow ?? window.parent;
    postWindow?.postMessage(
      {
        type,
        payload: {
          ...payload,
          fromSite: window?.location?.href,
        },
      },
      targetOrigin,
      transfer ? [transfer] : []
    );
    return true;
  };

  on = <T extends BridgeType>(type: T, handler: HandlerType<T>) => {
    if (!this.handlers[type]) {
      this.handlers[type] = [];
    }
    this.handlers[type].push(handler as Handler);
  };

  remove = <T extends BridgeType>(type: T, handler: HandlerType<T>) => {
    if (!this.handlers[type]) {
      return;
    }
    const index = this.handlers[type].indexOf(handler as Handler);
    if (index !== -1) {
      this.handlers[type].splice(index, 1);
    }
  };

  emit = <T extends BridgeType>(type: T, payload: PayloadType<T>) => {
    this.postMessage({
      type,
      payload,
    });
  };

  exec = <T extends BridgeType>(type: T, payload: PayloadType<T>) => {
    const channel = new MessageChannel();
    const deferred = new Deferred<ReturnPayloadType<T>>();
    channel.port1.onmessage = e => {
      deferred.resolve(e.data);
    };
    const postSuccess = this.postMessage(
      {
        type,
        payload,
      },
      channel.port2
    );
    if (!postSuccess) {
      deferred.reject(new Error('post message failed'));
    }
    return deferred.promise;
  };

  destory = () => {
    this.handlers = {};
    window.removeEventListener('message', this.receiveMessage, false);
  };
}

class Deferred<T> {
  public resolve!: (value: T | PromiseLike<T>) => void;

  public reject!: (reason?: any) => void;

  public promise: Promise<T>;

  private timer?: number;

  private finished = false;

  private onTimeoutHandler?: () => void;

  constructor(timeout = 5000) {
    this.promise = new Promise<T>((resolve, reject) => {
      if (timeout > 0) {
        this.timer = window.setTimeout(() => {
          reject(new Error('Timeout'));
          this.finished = true;
          if (this.onTimeoutHandler) {
            this.onTimeoutHandler();
          }
        }, timeout);
      }
      this.resolve = (...args) => {
        if (this.finished) {
          return;
        }
        this.clearTimeout();
        resolve.apply(this.promise, args);
        this.finished = true;
      };
      this.reject = (...args) => {
        if (this.finished) {
          return;
        }
        this.clearTimeout();
        reject.apply(this.promise, args);
        this.finished = true;
      };
    });
  }

  clearTimeout() {
    if (this.timer) {
      clearTimeout(this.timer);
    }
  }

  onTimeout(handler: () => void) {
    this.onTimeoutHandler = handler;
  }

  isFinished() {
    return this.finished;
  }
}
