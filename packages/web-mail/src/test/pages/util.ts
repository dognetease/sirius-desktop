import { MailEntryModel } from 'api';
import lodash from 'lodash';

const defaultMailModel = {
  isThread: false,
  id: 'AMgA-wDvAMoCVth*r2TT44qg',
  createTime: 1683176411539,
  _account: 'admin@devtest.com',
  entry: {
    title: '系统退信/The email is returned',
    folder: 1,
    attachmentCount: 2,
    threadMessageCount: 0,
    replayed: false,
    forwarded: false,
    directForwarded: false,
    system: false,
    popRead: false,
    rcptSucceed: false,
    rcptFailed: false,
    content: {
      content: '',
      contentId: '',
    },
    id: 'AMgA-wDvAMoCVth*r2TT44qg',
    requestReadReceipt: false,
    sendTime: '2023-04-23 17:22:44',
    receiveTime: '2023-04-23 17:22:44',
    brief: '尊敬的用户： 您的邮箱账号（admin@devtest.com）发送的邮件被系统退回。以下是退信相关信息： 原邮件信息 发送时间： Sun, 23 Apr 2023 17:21:43 +0800 (G',
    priority: 3,
    isScheduleSend: false,
    tid: '0a87ad69cf200009kutq187acb9debc.B49inj',
    langType: '',
    langListMap: {},
    linkAttached: false,
    suspiciousSpam: false,
    size: 20412,
    top: true,
    mark: 'redFlag',
    readStatus: 'read',
    canRecall: 0,
    threadMessageIds: [],
    threadMessageFirstId: '',
    preferred: 0,
    eTeamType: 0,
    isDefer: false,
    deferTime: '',
    deferNotice: false,
    attachment: [
      {
        realId: 0,
        fileMime: 'message/delivery-status',
        fileName: '(message/delivery-status)',
        fileType: 'other',
        fileSize: 593,
        type: 'url',
        contentId: null,
        id: '3',
        inlined: false,
        contentLocation: null,
        fileUrl:
          'https://su-desktop-web.cowork.netease.com:8000/js6/s?_host=su-desktop-web.cowork.netease.com%3A8000&func=mbox%3AgetMessageData&sid=L0NAL9I630*0c0T96dRkfNMtNyAY7B2W&mode=download&part=3&mid=AMgA-wDvAMoCVth*r2TT44qg&_session=&email=',
        fileOriginUrl: '/js6/s?_host=su-desktop-web.cowork.netease.com%3A8000&func=mbox%3AgetMessageData&mid=AMgA-wDvAMoCVth*r2TT44qg&Part=3&email=',
        deleted: false,
        ready: true,
        filePreviewUrl:
          '/mailpreview/api/pub/preview?_host=su-desktop-web.cowork.netease.com%3A8000&product=MAIL&fullFileName=(message%2Fdelivery-status)&url=https%3A%2F%2Fsu-desktop-web.cowork.netease.com%3A8000%2Fjs6%2Fs%3F_host%3Dsu-desktop-web.cowork.netease.com%253A8000%26func%3Dmbox%253AgetMessageData%26sid%3De0YAJ9t66010P0S9zEcf7oZ9khSsLTgF%26mode%3Ddownload%26part%3D3%26mid%3DAMgA-wDvAMoCVth*r2TT44qg%26_session%3D%26email%3D&uid=admin%40devtest.com&sid=L0NAL9I630*0c0T96dRkfNMtNyAY7B2W&mid=AMgA-wDvAMoCVth*r2TT44qg&part=3&host=maildev.qiye.163.com&_session=',
        fileSourceType: 1,
        fileSourceKey: 'AMgA-wDvAMoCVth*r2TT44qg;3',
        fid: -500000,
      },
      {
        realId: 0,
        fileMime: 'message/rfc822',
        fileName: '4月20日改.eml',
        fileType: 'eml',
        fileSize: 1810,
        type: 'url',
        contentId: null,
        id: '4',
        inlined: false,
        contentLocation: null,
        fileUrl:
          'https://su-desktop-web.cowork.netease.com:8000/js6/s?_host=su-desktop-web.cowork.netease.com%3A8000&func=mbox%3AgetMessageData&sid=L0NAL9I630*0c0T96dRkfNMtNyAY7B2W&mode=download&part=4&mid=AMgA-wDvAMoCVth*r2TT44qg&_session=&email=',
        fileOriginUrl: '/js6/s?_host=su-desktop-web.cowork.netease.com%3A8000&func=mbox%3AgetMessageData&mid=AMgA-wDvAMoCVth*r2TT44qg&Part=4&email=',
        deleted: false,
        ready: true,
        filePreviewUrl:
          '/mailpreview/api/pub/preview?_host=su-desktop-web.cowork.netease.com%3A8000&product=MAIL&fullFileName=4%E6%9C%8820%E6%97%A5%E6%94%B9.eml&url=https%3A%2F%2Fsu-desktop-web.cowork.netease.com%3A8000%2Fjs6%2Fs%3F_host%3Dsu-desktop-web.cowork.netease.com%253A8000%26func%3Dmbox%253AgetMessageData%26sid%3De0YAJ9t66010P0S9zEcf7oZ9khSsLTgF%26mode%3Ddownload%26part%3D4%26mid%3DAMgA-wDvAMoCVth*r2TT44qg%26_session%3D%26email%3D&uid=admin%40devtest.com&sid=L0NAL9I630*0c0T96dRkfNMtNyAY7B2W&mid=AMgA-wDvAMoCVth*r2TT44qg&part=4&host=maildev.qiye.163.com&_session=',
        fileSourceType: 1,
        fileSourceKey: 'AMgA-wDvAMoCVth*r2TT44qg;4',
        fid: -500001,
      },
    ],
    isIcs: false,
  },
  threadId: '47755220',
  updateTime: 1683700850586,
  tags: ['ToMe', 'new'],
  headers: {
    Sender: null,
    'Reply-To': null,
    'List-Unsubscribe': null,
    'Resent-From': null,
    Original_Account: null,
  },
  convFids: [],
  receiver: [
    {
      originName: 'admin',
      mailMemberType: 'to',
      contactItem: {
        contactItemVal: 'admin@devtest.com',
        contactItemRefer: '',
        contactItemType: 'EMAIL',
        emailType: 1,
        isDefault: 1,
        contactId: '513070001',
        enterpriseId: 2828641,
        updateTime: 1683163416991,
        id: '2f669fc2e56ae4ed5c5c1a97e8c132e7',
        type: 'enterprise',
        source: 'core',
        _lastUpdateTime: 1683163413119,
      },
      contact: {
        contact: {
          displayEmail: 'admin@devtest.com',
          contactName: '测试-cy42414',
          accountName: 'admin@devtest.com',
          accountId: 'admin@devtest.com_',
          accountOriginId: '513070001',
          contactPYName: 'ceshi-cy42414',
          contactPYLabelName: 'cs-cy42414',
          enterpriseId: 2828641,
          accountVisible: 0,
          accountStatus: 0,
          accountType: -1,
          position: [],
          enableIM: false,
          avatar: '',
          avatarPendant: '',
          visibleCode: 0,
          id: '513070001',
          contactLabel: 'C',
          type: 'enterprise',
          updateTime: '2023-05-04T01:23:36.991Z',
          _lastUpdateTime: 1683163413119,
          source: 'core',
          color: '#00CCAA',
          hitQueryEmail: 'admin@devtest.com',
        },
        contactInfo: [null],
      },
      inContactBook: true,
    },
  ],
  sender: {
    inContactBook: false,
    contact: {
      contact: {
        contactName: 'postmaster',
        contactPYName: 'postmaster',
        contactLabel: 'P',
        contactPYLabelName: 'postmaster',
        accountStatus: -1,
        accountVisible: 0,
        id: '',
        accountId: 'postmaster@devtest.com',
        accountName: 'postmaster@devtest.com',
        type: 'external',
        color: '#FE6C5E',
        visibleCode: 0,
        enableIM: false,
      },
      contactInfo: [
        {
          type: 'external',
          contactId: 'postmaster@devtest.com',
          contactItemRefer: '',
          contactItemType: 'EMAIL',
          contactItemVal: 'postmaster@devtest.com',
          createTime: 0,
          id: '',
          emailType: -1,
          isDefault: 0,
          unreadItemCount: 0,
          updateTime: 0,
          useFrequency: 0,
          _lastUpdateTime: 1683793279667,
        },
      ],
    },
    mailMemberType: '',
    originName: 'postmaster',
  },
  senders: [null],
};

/**
 * 获取一个空的邮件model
 */
export const createEmptyMailEntry = (): MailEntryModel => {
  return lodash.cloneDeep(defaultMailModel);
};

/**
 * 获取一个随机单封邮件的id
 */

function getDefaultMailId(): string {
  const idLength = 21;
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < idLength; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

/**
 * 获取一个带有所有标记属性的测试mailmodel信息
 */
export const getModelHasAllTag = (): MailEntryModel => {
  const model = createEmptyMailEntry();
  model.id = getDefaultMailId();

  // todo
  return model;
};

/**
 * 随机生成附件model
 */
const getRandomAttach = () => {
  const randomNum = Math.floor(Math.random() * 10000);
  const extensionList = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'zip', 'txt', 'jpg', 'png', 'gif'];
  const randomExtension = extensionList[Math.floor(Math.random() * extensionList.length)];
  const randomFileName = `file_${randomNum}.${randomExtension}`;

  return {
    realId: randomNum,
    fileMime: 'message/delivery-status',
    fileName: randomFileName,
    fileType: randomExtension,
    fileSize: randomNum,
    type: Math.random() < 0.5 ? 'url' : 'attachment',
    contentId: null,
    id: `${randomNum}`,
    inlined: false,
    contentLocation: null,
    fileUrl: `https://example.com/test/${randomNum}`,
    fileOriginUrl: `/test/${randomNum}`,
    deleted: false,
    ready: true,
    filePreviewUrl: `/preview/${randomNum}`,
    fileSourceType: 1,
    fileSourceKey: `${randomNum};3`,
    fid: -500000,
  };
};
/**
 * 根据传入的配置，构造对应的邮件卡片信息
 */

export const getModelByConfig = (params): MailEntryModel => {
  const model = createEmptyMailEntry();
  const {
    redFlag,
    read,
    trheadNumber,
    tag,
    isScheduleSend,
    userType,
    readCount,
    isIcs,
    sendStatus,
    praiseId,
    taskId,
    eTeamType,
    isDefer,
    jinji,
    system,
    yihuifu,
    YIZHUANFA,
    HUIFUQIEZHUANFA,
    POPREAD,
    RCPT_SUCCEED,
    PARTIAL_RCPT_SUCCEED,
    RCPT_FAILED,
    WITHDRAW_SUCC,
    PARTIAL_WITHDRAW_SUCC,
    WITHDRAW_FAIL,
    SUSPICIOUS_MAIL,

    // =-----
    txt_title,
    txt_desc,
    txt_att_number,
    txt_folder,
    txt_time,
  } = params;

  if (redFlag != null) {
    model.entry.mark = redFlag ? 'redFlag' : 'none';
  }
  if (read != null) {
    model.entry.readStatus = !read ? 'read' : 'unread';
  }

  if (trheadNumber != null) {
    model.isThread = trheadNumber;
    model.entry.threadMessageCount = 9999;
  }

  if (tag != null) {
    model.tags = tag ? ['hahahah', '特兰公仆', '23232323fdsd打开is阿金费'] : [];
  }

  if (isScheduleSend != null) {
    model.entry.isScheduleSend = isScheduleSend;
  }

  if (isIcs != null) {
    model.entry.isIcs = isIcs;
  }

  if (praiseId != null) {
    model.entry.praiseId = praiseId;
  }

  if (taskId != null) {
    model.taskId = taskId ? 123123 : undefined;
  }

  if (eTeamType != null) {
    model.entry.eTeamType = eTeamType ? 1 : 0;
  }

  if (isDefer != null) {
    model.entry.isDefer = isDefer;
  }

  if (userType != null) {
    model.taskInfo = userType
      ? {
          deadline: new Date().getTime(),
          overdue: false,
          userType: 4,
          type: 1,
          contactList: [],
          completed: 1000,
          total: 99999,
        }
      : null;
  }

  if (sendStatus != null) {
    model.entry.sendStatus = sendStatus ? 'sending' : undefined;
  }

  if (readCount != null) {
    if (readCount) {
      model.entry.readCount = 100;
      model.entry.rcptCount = 100;
      model.entry.innerCount = 100;
      model.entry.innerRead = 100;
      model.entry.folder = 3;
    } else {
      model.entry.readCount = undefined;
      model.entry.rcptCount = undefined;
      model.entry.innerCount = undefined;
      model.entry.innerRead = undefined;
      model.entry.folder = 1;
    }
  }

  if (jinji != null) {
    model.entry.priority = jinji ? 1 : 3;
  }

  if (system != null) {
    model.entry.system = system;
  }

  if (yihuifu != null) {
    model.entry.replayed = yihuifu;
    // model.entry.forwarded = !yihuifu ;
  }

  if (YIZHUANFA != null) {
    model.entry.forwarded = YIZHUANFA;
    // model.entry.replayed = YIZHUANFA;
  }

  if (HUIFUQIEZHUANFA) {
    model.entry.forwarded = HUIFUQIEZHUANFA;
    model.entry.replayed = HUIFUQIEZHUANFA;
  }

  if (POPREAD != null) {
    model.entry.popRead = POPREAD;
    // model.entry.readStatus = POPREAD ? 'unread' : undefined;
  }

  if (RCPT_SUCCEED != null) {
    model.entry.rcptSucceed = RCPT_SUCCEED;
    // model.entry.rcptFailed = !RCPT_SUCCEED ;
  }

  // if(PARTIAL_RCPT_SUCCEED != null) {
  //   model.entry.rcptSucceed = PARTIAL_RCPT_SUCCEED ;
  //   // model.entry.rcptFailed = PARTIAL_RCPT_SUCCEED ;
  // }

  if (RCPT_FAILED != null) {
    model.entry.rcptFailed = RCPT_FAILED;
    // model.entry.rcptSucceed = !RCPT_FAILED ;
  }

  if (WITHDRAW_SUCC) {
    model.entry.rclStatus = WITHDRAW_SUCC ? 3 : undefined;
  } else if (PARTIAL_WITHDRAW_SUCC) {
    model.entry.rclStatus = PARTIAL_WITHDRAW_SUCC ? 5 : undefined;
  } else if (WITHDRAW_FAIL) {
    model.entry.rclStatus = WITHDRAW_FAIL ? 4 : undefined;
  } else {
    model.entry.rclStatus = undefined;
  }

  if (SUSPICIOUS_MAIL != null) {
    model.entry.suspiciousSpam = SUSPICIOUS_MAIL;
  }

  /**
   * --------------------------------------------------------------------
   */
  if (txt_title) {
    model.entry.title = txt_title;
  }

  if (txt_desc) {
    model.entry.brief = txt_desc;
  }

  if (txt_att_number != null) {
    model.entry.attachmentCount = txt_att_number;
    if (txt_att_number) {
      let list = [];
      for (let i = 0; i < txt_att_number; i++) {
        list.push(getRandomAttach());
      }
      model.entry.attachment = list;
    } else {
      model.entry.attachment = [];
    }
  }

  if (txt_folder != null) {
    model.entry.folder = txt_folder;
  }

  if (txt_time != null) {
    model.entry.sendTime = txt_time;
  }

  // todo
  return model;
};

export const DefaultCardConfig = {
  redFlag: true,
  read: false,
  trheadNumber: false,
  tag: true,
  isScheduleSend: false,
  isIcs: true,
  praiseId: true,
  taskId: true,
  eTeamType: true,
  isDefer: true,
  userType: true,
  sendStatus: true,
  readCount: true,
  jinji: true,
  system: true,
  yihuifu: true,
  YIZHUANFA: true,
  HUIFUQIEZHUANFA: true,
  POPREAD: true,
  RCPT_SUCCEED: true,
  PARTIAL_RCPT_SUCCEED: true,
  RCPT_FAILED: true,
  WITHDRAW_SUCC: true,
  PARTIAL_WITHDRAW_SUCC: true,
  WITHDRAW_FAIL: true,
  SUSPICIOUS_MAIL: true,

  txt_title: defaultMailModel.entry.title,
  txt_desc: defaultMailModel.entry.brief,
  txt_att_number: defaultMailModel.entry.attachment.length,
  txt_folder: defaultMailModel.entry.folder,
  txt_time: defaultMailModel.entry.sendTime,

  //  'activeCrad': false,
};

/**
 * 返回随机数据
 */

export const getRandomConfig = () => {
  let obj = { ...DefaultCardConfig };
  // 要随机化的属性列表
  const properties = [
    'redFlag',
    'read',
    'trheadNumber',
    'tag',
    'isScheduleSend',
    'isIcs',
    'praiseId',
    'taskId',
    'eTeamType',
    'isDefer',
    'userType',
    'sendStatus',
    'readCount',
    'jinji',
    'system',
    'yihuifu',
    'YIZHUANFA',
    'HUIFUQIEZHUANFA',
    'POPREAD',
    'RCPT_SUCCEED',
    'PARTIAL_RCPT_SUCCEED',
    'RCPT_FAILED',
    'WITHDRAW_SUCC',
    'PARTIAL_WITHDRAW_SUCC',
    'WITHDRAW_FAIL',
    'SUSPICIOUS_MAIL',
  ];

  // 循环遍历属性列表，为每个属性设置随机值
  for (const prop of properties) {
    if (typeof obj[prop] === 'boolean') {
      // 如果属性是布尔类型，随机设置为 true 或 false
      obj[prop] = Math.random() < 0.5;
    } else {
      // 如果属性不是布尔类型，随机设置为一个整数值
      obj[prop] = Math.floor(Math.random() * 100);
    }
  }

  // 返回随机化后的对象
  return obj;
};
