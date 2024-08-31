/**
 * 邮件操作菜单的默认逻辑配置
 * 包含其展示，操作，显示的title，icon等信息
 *
 * 什么配置项该写到默认中？
 *  -只跟邮件有关的操作，而跟其菜单所处位置没有关系的
 * 它是如何工作的？
 *  -邮件的操作菜单，其形态根据业务所处的位置，可能是菜单，可能是按钮，可能是icon按钮，无论其展示形态如何，其行为总体上是一致的
 *   所以，一个菜单就由两部分组成。确定菜单如何展示的渲染组件和描述按钮行为逻辑的配置文件。
 *   但不同业务场景下，邮件操作按钮的多少是不同的，这就需要将配置文件拆解为两部分，一部分定义有哪些按钮，一部分定义按钮的具体行为。
 *   即DefaultMailMenuConfig 是定义所有按钮行为的默认配置文件
 *   其他菜单只包含key，通过融合工具函数，组合成一个用于渲染的最终配置文件。
 *
 * 配置文件的融合机制？
 *  首先，解释为什么按钮的配置要进行融合。因为按钮的行为，状态，未必只依赖静态的变量，有一些是只有运行时在组件中才能获取到的。这就需要一种手段，可以干预菜单的行为。
 *  所以，菜单的配置融合策略被设计为，自顶（渲染组件）向下，层层合并。如果是方法，则下一层的方法会作为第二个参数传递给上层的方法。由具体使用环境确定，是否调用默认的菜单行为。
 *
 */
import React from 'react';
import {
  MailEntryModel,
  apiHolder as api,
  apis,
  MailApi,
  SystemApi,
  DataTrackerApi,
  NIMApi,
  LoaderResult,
  FsSaveRes,
  MailConfApi,
  ContactApi,
  ProductAuthApi,
} from 'api';
import message from '@web-common/components/UI/Message/SiriusMessage';
import get from 'lodash/get';
import ReadListIcons from '@web-common/components/UI/Icons/svgs/ReadListSvgs';
import { isMac, openMailInWinow, isMainAccount, getMailFromMails, getCorpMessageIdsByMailItem } from '@web-mail/util';
import { FLOLDER, MAIL_MENU_ITEM, TASK_MAIL_STATUS } from '../../../constant';
import { DefaultMailMenuConfigMap } from '../../../../types';
// todo: 该组件需要提升到通用组件中
import MailTagMenu from '../../../../components/MailTag/Menu/Menu';
import { getShowByFolder, taskMailMenuShow } from '../util';
import SiriusModal from '@web-common/components/UI/Modal/SiriusModal';
import MailEncoding from '@web-mail/components/MailEncoding';
import { getIn18Text } from 'api';
import Toast from '@web-common/components/UI/Message/SiriusMessage';

const trackApi: DataTrackerApi = api.api.requireLogicalApi(apis.dataTrackerApiImp) as unknown as DataTrackerApi;
const mailApi = api.api.requireLogicalApi(apis.mailApiImpl) as MailApi;
const mailConfApi = api.api.requireLogicalApi(apis.mailConfApiImpl) as MailConfApi;
const productAuthApi = api.api.requireLogicalApi(apis.productAuthApiImpl) as ProductAuthApi;
const systemApi = api.api.getSystemApi() as SystemApi;
const eventApi = api.api.getEventApi();
const storeApi = api.api.getDataStoreApi();
const nimApi = api.api.requireLogicalApi('NIM') as NIMApi;
const contactApi = api.api.requireLogicalApi('contactApi') as ContactApi;
// todo: 确认该属性在全局的有效性，有可能在切换账号的情况下该值还是固定的
const isCorpMail = systemApi.getIsCorpMailMode();
const EXEMPTION_OF_REPLY_MAILIDS = 'EXEMPTION_OF_REPLY_MAILIDS';
const MAIL_EXPORT_LIMIT = 100;

// 获取可用的邮件id
const getOperMailId = (mail: MailEntryModel) => {
  const {
    entry: { id, threadMessageIds },
    isThread = false,
  } = mail || { entry: {} };
  let mailId = id;
  if (isThread && threadMessageIds && threadMessageIds[0]) {
    mailId = threadMessageIds[0];
  }
  return mailId;
};
const permRecallMail = () => mailConfApi.getPermRecallMail();

/**
 * warn: 由于多账号需求，邮件的多有api层操作，一定要提前设置所属账号。
 * 1.由于于菜单的显示结构, 顺序不同，依赖于该key来识别对应的菜单，如果要添加菜单项，请在 枚举 MAIL_MENU_ITEM 中添加对应的key
 * 2.默认配置中的菜单是否显示，取决于api层的设置与邮件本身的属性，其他业务行状态由外部覆盖实现
 *
 */
// 回复前置校验
const replyPreCheck = async (mail: MailEntryModel) => {
  const senderEmail = mail?.sender?.contact?.contact?.accountName;
  const curMailId = mail?.id;
  const replyToArr = mail?.headers ? mail?.headers['Reply-To'] : [];
  // 存在replyTo
  if (replyToArr && replyToArr.length) {
    // 回复地址 与 发信地址 不同
    let isDiff = false;
    try {
      // isDiff = replyToArr[0].replace(/^(\s|<)+|(\s|>)+$/g, '') !== senderEmail;
      const replyToParsedEmail = mailApi.handleEmailListStringToParsedContent(replyToArr[0], { origin: [], parsed: [] });
      const senderParsedEmail = mailApi.handleEmailListStringToParsedContent(senderEmail, { origin: [], parsed: [] });
      if (replyToParsedEmail.parsed.length && senderParsedEmail.parsed.length) {
        isDiff = replyToParsedEmail.parsed[0].email !== senderParsedEmail.parsed[0].email;
      }
    } catch (e) {
      console.error('[Error reg]', e);
    }
    if (isDiff) {
      // 免检字符串
      const res = await storeApi.get(EXEMPTION_OF_REPLY_MAILIDS);
      const { suc, data: mailIds } = res;
      const mailIdArr = mailIds ? mailIds.split(',') : [];
      if (suc) {
        // 免检
        if (mailIdArr?.includes(curMailId)) return true;
      }
      const content = (
        <span>
          原邮件发送地址：{senderEmail}
          <br />
          回复地址：{replyToArr[0]}
        </span>
      );
      // 召唤弹窗
      return new Promise(resolve => {
        SiriusModal.confirm({
          title: getIn18Text('NINHUIFUDEDIZHYYJFSDZBYZ，QZYSB'),
          content,
          okText: '继续回复',
          onOk: () => {
            // 加入免检字符串
            storeApi.put(EXEMPTION_OF_REPLY_MAILIDS, [...mailIdArr, curMailId].join(','));
            resolve(true);
          },
          onCancel: () => resolve(false),
        });
      });
    }
  }
  return true;
};

const getShouldShowPrintByEmails = (mails: MailEntryModel[] | MailEntryModel): boolean => {
  const mail = getMailFromMails(mails);
  if (mail?.isTpMail) {
    return false;
  }
  const { isThread } = mail;
  return !isThread;
};

const handleMailPrint = (mails: MailEntryModel[] | MailEntryModel, isPreview?: boolean) => {
  const mail = getMailFromMails(mails);
  const { isThread, _account, isEncryptedMail } = mail;
  const { id } = mail.entry;
  if (isEncryptedMail) {
    Toast.info({ content: getIn18Text('JIAMIYOUJIANZANBZCDY') });
    return;
  }
  eventApi.sendSysEvent({
    eventName: 'mailMenuOper',
    eventData: {
      mailId: id,
      isThread,
      isPreview: !!isPreview,
    },
    eventStrData: 'print',
    _account,
  });
};

const DefaultMailMenuConfig: DefaultMailMenuConfigMap = {
  [MAIL_MENU_ITEM.BACK]: {
    key: MAIL_MENU_ITEM.BACK,
    // group: '1',
    name: getIn18Text('FANHUI'),
    show: mails => {
      const mail = getMailFromMails(mails);
      // 独立窗体没有返回按钮
      return systemApi.isMainPage();
    },
    onClick: mails => {
      const mail = getMailFromMails(mails);
      const { _account } = mail;
      eventApi.sendSysEvent({
        eventName: 'mailMenuOper',
        eventData: mail,
        eventStrData: 'back',
        _account,
      });
    },
  },
  // todo 需要重新爬路径
  [MAIL_MENU_ITEM.RE_EDIT]: {
    key: MAIL_MENU_ITEM.RE_EDIT,
    // group: '1',
    name: getIn18Text('ZHONGXINBIANJI'),
    icon: <ReadListIcons.MailEditSvg_Cof />,
    show: mails => {
      const mail = getMailFromMails(mails);
      if (mail?.isTpMail) {
        return false;
      }
      return getShowByFolder(mail, [FLOLDER.DRAFT, FLOLDER.SENT]);
    },
    onClick: mails => {
      console.log('mailsmails', mails);
      const mail = getMailFromMails(mails);
      const { folder } = mail.entry;
      const { _account } = mail;
      // setCurrentAccount(_account);
      return mailApi.doEditMail(getOperMailId(mail), { draft: folder === FLOLDER.DRAFT, _account });
    },
  },
  // 回复
  [MAIL_MENU_ITEM.REPLAY]: {
    key: MAIL_MENU_ITEM.REPLAY,
    // group: '2',
    name: getIn18Text('HUIFU'),
    icon: <ReadListIcons.ReplySvgCof />,
    show: mails => {
      const mail = getMailFromMails(mails);
      if (mail?.isTpMail) {
        if (mail?.mailFrom === 'subordinate') {
          return true;
        }
        return false;
      }
      return !getShowByFolder(mail, [FLOLDER.DRAFT]);
    },
    onClick: async mails => {
      const mail = getMailFromMails(mails);
      const ckRes = await replyPreCheck(mail);
      if (!ckRes) return;
      const { _account, owner, mailFrom } = mail;
      eventApi.sendSysEvent({
        eventName: 'mailMenuOper',
        eventData: { opt: 'replay' },
        eventStrData: 'closeCurReadTab_before',
        _account,
      });
      // setCurrentAccount(_account);
      return mailApi.doReplayMail(getOperMailId(mail), false, undefined, undefined, _account, mailFrom === 'subordinate' ? owner : '').then(res => {
        eventApi.sendSysEvent({
          eventName: 'mailMenuOper',
          eventData: { opt: 'replay' },
          eventStrData: 'closeCurReadTab_after',
          _account,
        });
        return res;
      });
    },
  },
  // 回复全部
  [MAIL_MENU_ITEM.REPLAY_ALL]: {
    key: MAIL_MENU_ITEM.REPLAY_ALL,
    // group: '2',
    name: getIn18Text('HUIFUQUANBU'),
    icon: <ReadListIcons.ReplyAllSvgCof />,
    show: mails => {
      const mail = getMailFromMails(mails);
      if (mail?.isTpMail) {
        if (mail?.mailFrom === 'subordinate') {
          return true;
        }
        return false;
      }
      return !getShowByFolder(mail, [FLOLDER.DRAFT]);
    },
    onClick: async mails => {
      const mail = getMailFromMails(mails);
      const ckRes = await replyPreCheck(mail);
      if (!ckRes) return;
      const { _account, mailFrom, owner } = mail;
      eventApi.sendSysEvent({
        eventName: 'mailMenuOper',
        eventData: { opt: 'replayAll' },
        eventStrData: 'closeCurReadTab_before',
        _account,
      });
      // setCurrentAccount(_account);
      return mailApi.doReplayMail(getOperMailId(mail), true, undefined, undefined, _account, mailFrom === 'subordinate' ? owner : '').then(res => {
        eventApi.sendSysEvent({
          eventName: 'mailMenuOper',
          eventData: { opt: 'replayAll' },
          eventStrData: 'closeCurReadTab_after',
          _account,
        });
        return res;
      });
    },
  },
  [MAIL_MENU_ITEM.FORWARD]: {
    key: MAIL_MENU_ITEM.FORWARD,
    // group: '2',
    name: getIn18Text('ZHUANFA'),
    icon: <ReadListIcons.TransmitSvg_Cof />,
    show: mails => {
      const mail = getMailFromMails(mails);
      if (mail?.isTpMail) {
        if (mail?.mailFrom === 'subordinate') {
          return true;
        }
        return false;
      }
      return !getShowByFolder(mail, [FLOLDER.DRAFT]);
    },
    onClick: mails => {
      const mail = getMailFromMails(mails);
      const { _account, owner, mailFrom } = mail;
      eventApi.sendSysEvent({
        eventName: 'mailMenuOper',
        eventData: { opt: 'forward' },
        eventStrData: 'closeCurReadTab_before',
        _account,
      });
      // setCurrentAccount(_account); 发信统一处理
      return mailApi.doForwardMail(getOperMailId(mail), { _account, owner: mailFrom === 'subordinate' ? owner : '' }).then(res => {
        eventApi.sendSysEvent({
          eventName: 'mailMenuOper',
          eventData: { opt: 'forward' },
          eventStrData: 'closeCurReadTab_after',
          _account,
        });
        return res;
      });
    },
  },
  [MAIL_MENU_ITEM.DELIVERY]: {
    key: MAIL_MENU_ITEM.DELIVERY,
    name: getIn18Text('deliveryMail'),
    show: mails => {
      const mail = getMailFromMails(mails);
      return !mail?.isTpMail;
    },
    onClick: mails => {
      const mail = getMailFromMails(mails);
      // console.log('邮件分发', mail);
    },
  },
  // 作为附件转发
  [MAIL_MENU_ITEM.FORWARD_BY_ATTACH]: {
    key: MAIL_MENU_ITEM.FORWARD_BY_ATTACH,
    name: getIn18Text('ZUOWEIFUJIANZHUAN'),
    show: mails => {
      const mail = getMailFromMails(mails);
      if (mail?.isTpMail) {
        if (mail?.mailFrom === 'subordinate') {
          return true;
        }
        return false;
      }
      if (isCorpMail) return false;
      const { isThread } = mail;
      return !isThread && !getShowByFolder(mail, [FLOLDER.DRAFT]);
    },
    onClick: async mails => {
      const mailArr = Array.isArray(mails) ? mails : [mails];
      const mail = getMailFromMails(mails);
      const { _account, owner, mailFrom, entry } = mail;
      const totalSize = mailArr.reduce((total, mail) => {
        return total + (mail?.size || 0);
      }, 0);
      // 本地默认 本地附件大小限制 （单个 + 整体）
      const mailLimit = mailConfApi.getMailLimit({ _account });
      // 附件总大小超限
      if (totalSize > mailLimit.upload_total_size) {
        const curVersionId = await productAuthApi.asyncGetProductVersionId({ _account });
        // 免费版 提示升级
        if (curVersionId === 'free') {
          eventApi.sendSysEvent({ eventName: 'mailMenuOper', eventStrData: 'freeVerionSizeOver' });
        } else {
          message.error(getIn18Text('ZONGDAXIAOCHAOXIAN，WFZF'));
        }
        return;
      }
      eventApi.sendSysEvent({
        eventName: 'mailMenuOper',
        eventData: { opt: 'forwardAsAttach' },
        eventStrData: 'closeCurReadTab_before',
        _account,
      });
      // setCurrentAccount(_account);
      // 转发id数组
      const asAttachIds = mailArr.map((item: MailEntryModel) => item.entry.id);
      return mailApi
        .doForwardMailAsAttach(asAttachIds.join('&and&'), {
          asAttach: true,
          asAttachIds,
          _account,
          owner: mailFrom === 'subordinate' ? owner : '',
          title: entry?.title || '',
        })
        .then(res => {
          // return mailApi.doForwardMailAsAttach(getOperMailId(mail), { asAttach: true, _account }).then(res => {
          eventApi.sendSysEvent({
            eventName: 'mailMenuOper',
            eventData: { opt: 'forwardAsAttach' },
            eventStrData: 'closeCurReadTab_after',
            _account,
          });
          return res;
        });
    },
  },
  // 带附件回复
  [MAIL_MENU_ITEM.REPLAY_ATTACH]: {
    key: MAIL_MENU_ITEM.REPLAY_ATTACH,
    // group: '2',
    name: getIn18Text('DAIFUJIANHUIFU11'),
    show: mails => {
      const mail = getMailFromMails(mails);
      if (mail?.isTpMail && mail?.mailFrom !== 'subordinate') {
        return false;
      }
      const { isThread } = mail;
      const { attachment } = mail.entry;
      const isShowAttachBtn = attachment && attachment.some(attach => !attach.inlined && attach.fileType !== 'ics');
      return !!isShowAttachBtn && !(getShowByFolder(mail, [FLOLDER.DRAFT]) || isCorpMail || isThread);
    },
    onClick: async mails => {
      const mail = getMailFromMails(mails);
      const ckRes = await replyPreCheck(mail);
      if (!ckRes) return;
      const { _account, mailFrom, owner } = mail;
      eventApi.sendSysEvent({
        eventName: 'mailMenuOper',
        eventData: { opt: 'replyAttach' },
        eventStrData: 'closeCurReadTab_before',
        _account,
      });
      setTimeout(() => {
        eventApi.sendSysEvent({
          eventName: 'mailMenuOper',
          eventData: { opt: 'replyAttach' },
          eventStrData: 'closeCurReadTab_after',
          _account,
        });
      }, 500);
      return mailApi.doReplayMailWithAttach(getOperMailId(mail), false, undefined, undefined, _account, mailFrom === 'subordinate' ? owner : '');
    },
  },
  // 带附件回复全部
  [MAIL_MENU_ITEM.REPLAY_ATTACH_ALL]: {
    key: MAIL_MENU_ITEM.REPLAY_ATTACH_ALL,
    // group: '2',
    name: getIn18Text('DAIFUJIANHUIFU'),
    show: mails => {
      const mail = getMailFromMails(mails);
      if (mail?.isTpMail && mail?.mailFrom !== 'subordinate') {
        return false;
      }
      const { isThread } = mail;
      const { attachment } = mail.entry;
      const isShowAttachBtn = attachment && attachment.some(attach => !attach.inlined && attach.fileType !== 'ics');
      return !!isShowAttachBtn && !(getShowByFolder(mail, [FLOLDER.DRAFT]) || isCorpMail || isThread);
    },
    onClick: async mails => {
      const mail = getMailFromMails(mails);
      const ckRes = await replyPreCheck(mail);
      if (!ckRes) return;
      const { _account, owner, mailFrom } = mail;
      eventApi.sendSysEvent({
        eventName: 'mailMenuOper',
        eventData: { opt: 'replyAttachAll' },
        eventStrData: 'closeCurReadTab_before',
        _account,
      });
      setTimeout(() => {
        eventApi.sendSysEvent({
          eventName: 'mailMenuOper',
          eventData: { opt: 'replyAttachAll' },
          eventStrData: 'closeCurReadTab_after',
          _account,
        });
      }, 500);
      return mailApi.doReplayMailWithAttach(getOperMailId(mail), true, undefined, undefined, _account, mailFrom === 'subordinate' ? owner : '');
    },
  },
  // todo 需要重新爬路径 end
  // [MAIL_MENU_ITEM.PREFERRED]: {
  //   key: MAIL_MENU_ITEM.PREFERRED,
  //   // group: '3',
  //   name: mail => {
  //     const {preferred} = mail.entry;
  //     const isPreferred = preferred == 0;
  //     return isPreferred
  //       ? typeof window !== 'undefined'
  //         ? getIn18Text('QUXIAOYOUXIAN')
  //         : ''
  //       : typeof window !== 'undefined'
  //         ? getIn18Text('SHEWEIYOUXIAN')
  //         : '';
  //   },
  //   show: mails => {
  //   const mail = getMailFromMails(mails);
  //     if(mail?.isTpMail){
  //       return false;
  //     }
  //     if (!isMainAccount(mail._account)) {
  //       return false;
  //     }
  //     if (isCorpMail && mail.entry.threadMessageIds && mail.entry.threadMessageIds.length > 1) {
  //       return false;
  //     }
  //     // 如果不是收件箱或者自定义文件夹则不展示
  //     const {folder} = mail?.entry || {};
  //     if (!isCustomFolder(folder) && folder !== FLOLDER.DEFAULT) {
  //       return false;
  //     }
  //     return true;
  //   },
  //   onClick: mails => {
  //   const mail = getMailFromMails(mails);
  //     const {
  //       entry: {id, preferred}
  //     } = mail || {entry: {}};
  //     const isPreferred = preferred == 0;
  //     const {_account} = mail;
  //     // setCurrentAccount(_account);
  //     eventApi.sendSysEvent({
  //       eventName: 'mailStatesChanged',
  //       eventData: {
  //         mark: !isPreferred,
  //         id,
  //         type: 'preferred'
  //       },
  //       eventStrData: isPreferred ? 'preferred' : 'unpreferred',
  //       _account
  //     });
  //   }
  // },
  [MAIL_MENU_ITEM.DEFER]: {
    key: MAIL_MENU_ITEM.DEFER,
    name: mails => {
      const mail = getMailFromMails(mails);
      const { isDefer } = mail.entry;
      return !isDefer ? getIn18Text('SHAOHOUCHULI') : getIn18Text('BIAOWEIYICHULI');
    },
    show: mails => {
      const mail = getMailFromMails(mails);
      if (mail?.isTpMail) {
        return false;
      }
      if (!isMainAccount(mail._account)) {
        return false;
      }
      if (isCorpMail || mail.entry.isScheduleSend || (!taskMailMenuShow(mail) && mail.taskInfo?.status === 0)) {
        // corp邮箱、草稿箱中的定时发送邮件、未完成的任务邮件
        return false;
      }
      return true;
    },
    onClick: mails => {
      const mail = getMailFromMails(mails);
      const { id, isDefer, deferTime, deferNotice } = mail.entry;
      const { _account } = mail;
      eventApi.sendSysEvent({
        eventName: 'mailStatesChanged',
        eventData: {
          id,
          isDefer,
          deferTime,
          deferNotice,
        },
        eventStrData: isDefer ? 'undefer' : 'defer',
        _account,
      });
    },
  },
  [MAIL_MENU_ITEM.RED_FLAG]: {
    key: MAIL_MENU_ITEM.RED_FLAG,
    // group: '3',
    icon: mails => {
      const mail = getMailFromMails(mails);
      const { mark } = mail.entry;
      const isMark = mark == 'redFlag';
      return isMark ? <ReadListIcons.RedFlagSvg /> : <ReadListIcons.FlagSvg_Cof />;
    },
    name: mails => {
      if (Array.isArray(mails)) {
        const flagList = mails?.filter(item => {
          if (item && item.entry) {
            return item.entry.mark == 'redFlag';
          }
          return false;
        });
        return mails?.length === flagList?.length ? getIn18Text('QUXIAOHONGQI') : getIn18Text('BIAOWEIHONGQI');
      } else {
        const mail = getMailFromMails(mails);
        const { mark } = mail.entry;
        const isMark = mark == 'redFlag';
        return isMark ? getIn18Text('QUXIAOHONGQI') : getIn18Text('BIAOWEIHONGQI');
      }
    },
    show: mails => {
      const mail = getMailFromMails(mails);
      if (mail?.isTpMail) {
        return false;
      }
      if (isCorpMail && mail.entry.threadMessageIds && mail.entry.threadMessageIds.length > 1) {
        return false;
      }
      if (getShowByFolder(mail, [FLOLDER.DELETED, FLOLDER.SPAM, FLOLDER.ADVITISE])) {
        return false;
      }
      return true;
    },
    onClick: mails => {
      // 支持多选
      if (Array.isArray(mails)) {
        const flagList = mails?.filter(item => item.entry.mark == 'redFlag');
        const redFlaged = mails?.length == flagList?.length;
        if (mails.length) {
          let ids: string[] = [];
          mails?.map(item => {
            if (isCorpMail) {
              ids.push(...getCorpMessageIdsByMailItem(item));
            } else {
              ids.push(item.entry.id);
            }
          });
          ids = Array.from(new Set(ids));
          eventApi.sendSysEvent({
            eventName: 'mailStatesChanged',
            eventData: {
              mark: !redFlaged,
              id: ids,
              type: 'redFlag',
            },
            _account: mails && mails[0]?._account,
            eventStrData: redFlaged ? 'mark' : 'unmark',
          });
        }
      } else {
        const mail = getMailFromMails(mails);
        const {
          entry: { id, mark },
        } = mail || { entry: {} };
        const isMark = mark == 'redFlag';
        const { _account } = mail;
        eventApi.sendSysEvent({
          eventName: 'mailStatesChanged',
          eventData: {
            mark: !isMark,
            id,
            type: 'redFlag',
          },
          eventStrData: mark ? 'mark' : 'unmark',
          _account,
        });
      }
    },
  },
  [MAIL_MENU_ITEM.READ]: {
    key: MAIL_MENU_ITEM.READ,
    // group: '3',
    name: mails => {
      if (Array.isArray(mails)) {
        const readList = mails?.filter(item => item.entry.readStatus == 'read');
        return mails?.length === readList?.length ? getIn18Text('BIAOWEIWEIDU') : getIn18Text('BIAOWEIYIDU');
      } else {
        const mail = getMailFromMails(mails);
        const isRead = mail.entry.readStatus == 'read';
        return isRead ? getIn18Text('BIAOWEIWEIDU') : getIn18Text('BIAOWEIYIDU');
      }
    },
    show: mails => {
      const mail = getMailFromMails(mails);
      if (mail?.isTpMail) {
        return false;
      }
      // 聚合邮件，全都展示已读未读，不受文件夹限制
      const { isThread } = mail;
      if (isCorpMail && mail.entry.threadMessageIds && mail.entry.threadMessageIds.length > 1) {
        return false;
      }
      if (isThread || !getShowByFolder(mail, [FLOLDER.DELETED, FLOLDER.SPAM, FLOLDER.DRAFT, FLOLDER.SENT])) {
        return true;
      }
      return false;
    },
    onClick: mails => {
      // 支持多选
      if (Array.isArray(mails)) {
        const readList = mails?.filter(item => item.entry.readStatus == 'read');
        const readed = mails?.length == readList?.length;
        if (mails.length) {
          let ids: string[] = [];
          mails?.map(item => {
            if (isCorpMail) {
              ids.push(...getCorpMessageIdsByMailItem(item));
            } else {
              ids.push(item.entry.id);
            }
          });
          ids = Array.from(new Set(ids));
          eventApi.sendSysEvent({
            eventName: 'mailStatesChanged',
            eventData: {
              mark: !readed,
              id: ids,
              type: 'read',
            },
            _account: mails && mails[0]?._account,
            eventStrData: !readed ? 'read' : 'unread',
          });
        }
      } else {
        const mail = getMailFromMails(mails);
        const isRead = mail.entry.readStatus == 'read';
        const { _account } = mail;
        eventApi.sendSysEvent({
          eventName: 'mailStatesChanged',
          eventData: {
            mark: !isRead,
            id: mail.entry.id,
            type: 'read',
          },
          eventStrData: !isRead ? 'read' : 'unread',
          _account,
        });
      }
    },
  },
  [MAIL_MENU_ITEM.TAG]: {
    key: MAIL_MENU_ITEM.TAG,
    // group: '3',
    name: getIn18Text('DABIAOQIAN'),
    icon: <ReadListIcons.TagSvg_Cof />,
    show: mails => {
      const mail = getMailFromMails(mails);
      if (mail?.isTpMail) {
        return false;
      }
      // if (!isMainAccount(mail._account)) {
      //   return false;
      // }
      if (isCorpMail || getShowByFolder(mail, [FLOLDER.DRAFT, FLOLDER.SPAM, FLOLDER.ADVITISE, FLOLDER.DELETED])) {
        return false;
      }
      return true;
    },
    subMenus: (mails, onMenuClick) => {
      return (
        <div>
          <MailTagMenu
            mailList={Array.isArray(mails) ? mails : [mails]}
            Close={() => onMenuClick && onMenuClick(false)}
            account={Array.isArray(mails) ? mails[0]?._account : mails?._account}
          />
        </div>
      );
    },
  },
  [MAIL_MENU_ITEM.TOP]: {
    key: MAIL_MENU_ITEM.TOP,
    // group: '3',
    name: mails => {
      const mail = getMailFromMails(mails);
      const {
        entry: { id, top },
      } = mail || { entry: {} };

      // 只要多选的邮件中有未置顶的，就展示置顶
      let showTop = top;
      if (Array.isArray(mails)) {
        showTop = !mails?.some(item => !item.entry.top);
      }

      return showTop ? getIn18Text('QUXIAOZHIDING') : getIn18Text('ZHIDING');
    },
    icon: mails => {
      const mail = getMailFromMails(mails);
      const {
        entry: { id, top },
      } = mail || { entry: {} };
      return top ? <ReadListIcons.MailUnTopSvg /> : <ReadListIcons.MailTopSvg />;
    },
    show: mails => {
      const mail = getMailFromMails(mails);
      if (mail?.isTpMail) {
        return false;
      }
      if (!isMainAccount(mail._account)) {
        return false;
      }
      // todo： 改逻辑似乎已经过时，需要排查
      // if (isCorpMail && mail.entry.threadMessageIds && mail.entry.threadMessageIds.length > 1) {
      //   return false;
      // }
      if (getShowByFolder(mail, [FLOLDER.REDFLAG, FLOLDER.UNREAD, FLOLDER.DELETED, FLOLDER.SPAM, FLOLDER.ADVITISE, FLOLDER.DRAFT, FLOLDER.DEFER])) {
        return false;
      }
      return true;
    },
    onClick: mails => {
      const mail = getMailFromMails(mails);
      const {
        entry: { id, top },
        isThread = false,
        _account,
      } = mail || { entry: {} };
      let ids: string[] = [id];
      if (Array.isArray(mails)) {
        ids = mails?.map(item => item?.entry?.id);
      }

      // 只要多选的邮件中有未置顶的，就展示置顶
      let showTop = top;
      if (Array.isArray(mails)) {
        showTop = !mails?.some(item => !item.entry.top);
      }

      eventApi.sendSysEvent({
        eventName: 'mailStatesChanged',
        eventData: {
          mark: !showTop,
          id: ids,
          isThread,
        },
        _account,
        eventStrData: !top ? 'top' : 'unTop',
      });
    },
  },
  [MAIL_MENU_ITEM.COMMENT]: {
    key: MAIL_MENU_ITEM.COMMENT,
    name: mails => {
      const mail = getMailFromMails(mails);
      const {
        entry: { memo },
      } = mail || { entry: {} };
      return memo ? getIn18Text('XIUGAIBEIZHU') : getIn18Text('BEIZHU');
    },
    // icon: mail => {
    //   const {
    //     entry: { memo },
    //   } = mail || { entry: {} };
    //   return memo ? <ReadListIcons.MailUnTopSvg /> : <ReadListIcons.MailTopSvg />;
    // },
    show: mails => {
      // if (mail?.isTpMail) {
      //   return false;
      // }
      const mail = getMailFromMails(mails);
      const { isThread } = mail;
      if (isThread) {
        return false;
      }
      if (mail?.isTpMail) {
        return false;
      }
      // if (!isMainAccount(mail._account)) {
      //   return false;
      // }
      // if (isCorpMail && mail.entry.threadMessageIds && mail.entry.threadMessageIds.length > 1) {
      //   return false;
      // }
      // if (getShowByFolder(mail, [FLOLDER.REDFLAG, FLOLDER.UNREAD, FLOLDER.DELETED, FLOLDER.SPAM, FLOLDER.ADVITISE, FLOLDER.DRAFT, FLOLDER.DEFER])) {
      //   return false;
      // }
      return true;
    },
    onClick: mails => {
      const mail = getMailFromMails(mails);
      const {
        entry: { memo },
        isThread = false,
        _account,
      } = mail || { entry: {} };
      const { id } = mail.entry;
      eventApi.sendSysEvent({
        eventName: 'mailMenuOper',
        eventData: {
          memo,
          mailId: id,
          accountId: _account,
        },
        _account,
        eventStrData: 'comment',
      });
    },
  },
  [MAIL_MENU_ITEM.MOVE]: {
    key: MAIL_MENU_ITEM.MOVE,
    // group: '4',
    name: getIn18Text('YIDONG'),
    icon: <ReadListIcons.MoveSvg_Cof />,
    show: mails => {
      const mail = getMailFromMails(mails);
      if (mail?.isTpMail) {
        return false;
      }
      // 1.10版本，2022-4.2确认，聚合邮件可以整体移动
      return !getShowByFolder(mail, [FLOLDER.DRAFT, FLOLDER.WAITINGISSUE, FLOLDER.READYISSUE]);
    },
    onClick: mails => {
      // 支持多选
      const mail = getMailFromMails(mails);
      const { id, folder } = mail.entry;
      const { _account } = mail;
      const ids = Array.isArray(mails) ? mails.map(item => item?.entry?.id) : id;
      eventApi.sendSysEvent({
        eventName: 'mailMenuOper',
        eventData: {
          mailId: ids,
          folderId: folder,
          accountId: _account,
        },
        _account,
        eventStrData: 'move',
      });
    },
  },
  [MAIL_MENU_ITEM.REPORT]: {
    key: MAIL_MENU_ITEM.REPORT,
    // group: '4',
    name: getIn18Text('JUBAO'),
    show: mails => {
      const mail = getMailFromMails(mails);
      if (mail?.isTpMail) {
        return false;
      }
      if (!isMainAccount(mail._account)) {
        return false;
      }
      return !isCorpMail && !mail.isThread && !getShowByFolder(mail, [FLOLDER.DRAFT, FLOLDER.SENT]);
    },
    onClick: mails => {
      const mail = getMailFromMails(mails);
      const {
        entry: { id, folder },
        isThread = false,
        _account,
      } = mail || { entry: {} };
      const senderEmail = get(mail, ['sender', 'contactItem', 'contactItemVal'], '');
      const hasReport = false;
      eventApi.sendSysEvent({
        eventName: 'mailMenuOper',
        eventData: {
          mailId: id,
          hasReport,
          senderEmail,
        },
        eventStrData: 'report',
        _account,
      });
    },
  },
  [MAIL_MENU_ITEM.REPORT_TRUST]: {
    key: MAIL_MENU_ITEM.REPORT_TRUST,
    // group: '4',
    name: getIn18Text('XINREN'),
    show: mails => {
      const mail = getMailFromMails(mails);
      if (mail?.isTpMail) {
        return false;
      }
      if (!isMainAccount(mail._account)) {
        return false;
      }
      return !isCorpMail && !mail.isThread && !getShowByFolder(mail, [FLOLDER.DRAFT]) && getShowByFolder(mail, [FLOLDER.SPAM]);
    },
    onClick: mails => {
      const mail = getMailFromMails(mails);
      const {
        entry: { id, folder },
        isThread = false,
        _account,
      } = mail || { entry: {} };
      const senderEmail = get(mail, ['sender', 'contactItem', 'contactItemVal'], '');
      const hasReport = true;
      // if (!getShowByFolder(mail, [FLOLDER.DRAFT, FLOLDER.SENT])) {
      //   hasReport = folder === FLOLDER.SPAM;
      // }
      eventApi.sendSysEvent({
        eventName: 'mailMenuOper',
        eventData: {
          mailId: id,
          hasReport,
          senderEmail,
        },
        eventStrData: 'report',
        _account,
      });
    },
  },
  [MAIL_MENU_ITEM.DELETE]: {
    key: MAIL_MENU_ITEM.DELETE,
    // group: '4',
    // tip: <DeleteIcon />,
    icon: <ReadListIcons.RecycleSvg_Cof />,
    name: mails => {
      const mail = getMailFromMails(mails);
      if (getShowByFolder(mail, [FLOLDER.DELETED])) {
        return getIn18Text('CHEDISHANCHU');
      }
      return getIn18Text('SHANCHU');
    },
    show: mails => {
      const mail = getMailFromMails(mails);
      if (mail?.isTpMail) {
        return false;
      }
      return true;
    },
    onClick: mails => {
      // 支持邮件多选操作
      if (Array.isArray(mails)) {
        const mail = getMailFromMails(mails);
        const { isThread, _account } = mail;
        const { folder } = mail.entry;
        let hasScheduleSend = false;
        const ids = mails.map(item => {
          if (item?.entry?.isScheduleSend) {
            hasScheduleSend = true;
          }
          return item?.entry?.id;
        });
        const params = {
          // 如果属于已删除文件夹，显示二次确认弹窗
          detail: folder === FLOLDER.DELETED,
          // 聚合邮件的删除，显示全局阻塞弹窗
          showGlobalLoading: isThread,
          showLoading: true,
          isScheduleSend: !isThread && !!hasScheduleSend,
        };
        eventApi.sendSysEvent({
          eventName: 'mailMenuOper',
          eventData: {
            mailId: ids,
            isThread,
            params,
            folderId: folder,
          },
          eventStrData: 'delete',
          _account,
        });
      } else {
        const mail = getMailFromMails(mails);
        const { isThread, _account } = mail;
        const { id, folder, isScheduleSend } = mail.entry;
        // 邮件的删除操作根据其类型不同，有不同的弹窗及提示
        const params = {
          // 如果属于已删除文件夹，显示二次确认弹窗
          detail: folder === FLOLDER.DELETED,
          // 聚合邮件的删除，显示全局阻塞弹窗
          showGlobalLoading: isThread,
          showLoading: true,
          isScheduleSend: !isThread && !!isScheduleSend,
        };
        eventApi.sendSysEvent({
          eventName: 'mailMenuOper',
          eventData: {
            mailId: id,
            isThread,
            params,
            folderId: folder,
          },
          eventStrData: 'delete',
          _account,
        });
      }
    },
  },
  [MAIL_MENU_ITEM.SHARE]: {
    key: MAIL_MENU_ITEM.SHARE,
    name: getIn18Text('FENXIANGDAOHUIHUA'),
    show: mails => {
      const mail = getMailFromMails(mails);
      if (mail?.isTpMail) {
        return false;
      }
      if (!isMainAccount(mail._account)) {
        return false;
      }
      const { isThread, entry, _account } = mail;
      const excludeFolders = [FLOLDER.SPAM, FLOLDER.DRAFT, FLOLDER.DELETED, FLOLDER.ADVITISE];
      const { folder } = entry;
      return !isThread && !excludeFolders.includes(folder) && nimApi.getIMAuthConfig();
    },
    onClick: mails => {
      const mail = getMailFromMails(mails);
      const { _account } = mail;
      eventApi.sendSysEvent({
        eventName: 'mailMenuOper',
        eventData: mail,
        eventStrData: 'share',
        _account,
      });
    },
  },
  [MAIL_MENU_ITEM.TRANSLATE]: {
    key: MAIL_MENU_ITEM.TRANSLATE,
    // group: '5',
    name: mails => {
      const mail = getMailFromMails(mails);
      const {
        entry: { langType },
      } = mail || { entry: {} };
      return langType !== '' && langType !== 'origin' ? getIn18Text('QUXIAOFANYI') : getIn18Text('FANYI');
    },
    show: mails => {
      const mail = getMailFromMails(mails);
      if (mail?.isTpMail) {
        return false;
      }
      const { isThread } = mail;
      // warn：独立的读信窗体，屏蔽新窗口打开
      const { folder } = mail.entry;
      return (folder != FLOLDER.DRAFT && !isCorpMail) || !isThread;
    },
    onClick: mails => {
      const mail = getMailFromMails(mails);
      // openMailInWinow(mail?.entry?.id)
      const {
        entry: { langType, id },
        _account,
        isEncryptedMail,
      } = mail || { entry: {}, isEncryptedMail: false };
      if (isEncryptedMail) {
        Toast.info({ content: getIn18Text('JIAMIYOUJIANZANBZCFY') });
        return;
      }
      eventApi.sendSysEvent({
        eventName: 'mailTranslateChanged',
        eventData: {
          type: 'translate',
          id,
        },
        eventStrData: langType !== '' && langType !== 'origin' ? 'cancelTranslate' : 'translate',
        _account,
      });
    },
  },
  [MAIL_MENU_ITEM.SEARCH_IN_CONTENT]: {
    key: MAIL_MENU_ITEM.SEARCH_IN_CONTENT,
    // group: '5',
    tip: mails => (isMac() ? '⌘F' : 'Ctrl+F'),
    name: getIn18Text('SOUSUOZHENWENNEIRONG'),
    // show: () => true,
    show: mails => {
      const mail = getMailFromMails(mails);
      if (mail?.isTpMail) {
        return false;
      }
      return true;
    },
    onClick: mails => {
      const mail = getMailFromMails(mails);
      if (mail.isEncryptedMail) {
        Toast.info({ content: getIn18Text('JIAMIYOUJIANZANBZCZWSS') });
        return;
      }
      eventApi.sendSysEvent({
        eventName: 'mailMenuOper',
        eventStrData: 'searchInContent',
      });
    },
  },
  [MAIL_MENU_ITEM.OPEN_IN_WINDOW]: {
    key: MAIL_MENU_ITEM.OPEN_IN_WINDOW,
    // group: '5',
    tip: mail => (isMac() ? '⌘R' : 'Ctrl+R'),
    name: getIn18Text('XINCHUANGKOUDAKAI'),
    // show: mails => {
    //   const mail = getMailFromMails(mails);
    //   // warn：独立的读信窗体，屏蔽新窗口打开
    //   // const { folder } = mail.entry;
    //   return !isCorpMail;
    // },
    show: mails => {
      const mail = getMailFromMails(mails);
      if (mail?.isTpMail) {
        return false;
      }
      return !isCorpMail;
    },
    onClick: mails => {
      const mail = getMailFromMails(mails);
      openMailInWinow(mail);
    },
  },
  [MAIL_MENU_ITEM.SET_FROM_GROUP]: {
    key: MAIL_MENU_ITEM.SET_FROM_GROUP,
    group: '5',
    name: getIn18Text('SHEZHILAIXINFEN'),
    show: mails => {
      const mail = getMailFromMails(mails);
      // 如果邮件所属类型，是三方账号，则不显示
      // 主要处理以下情况：登录的主账号是三方挂载账号
      if (mail?.authAccountType != null && mail?.authAccountType != '0') {
        return false;
      }
      if (mail?.isTpMail) {
        return false;
      }
      if (!isMainAccount(mail._account)) {
        return false;
      }
      if (mail.isThread) {
        return false;
      }
      if (isCorpMail) return false;
      // 不支持聚合邮件，不支持单独的读信页，支持其他读信页
      const { taskInfo } = mail;
      // const { folder } = mail.entry;
      return systemApi.isMainPage() && taskInfo?.status !== TASK_MAIL_STATUS.PROCESSING;
    },
    onClick: mails => {
      const mail = getMailFromMails(mails);
      const { isThread, _account } = mail;
      const { id, folder, title } = mail.entry;
      const eventData: {
        title: string;
        senderEmail?: string;
      } = {
        title,
      };
      const senderEmail = get(mail, ['sender', 'contactItem', 'contactItemVal'], '');
      // 非聚合邮件才传入发送者邮件地址
      if (!isThread) {
        eventData.senderEmail = senderEmail;
      }
      eventApi.sendSysEvent({
        eventName: 'mailMenuOper',
        eventData,
        eventStrData: 'setFromGroup',
        _account,
      });
      trackApi.track('pcMail_view_mailClassificationNewPage', { type: 'singleMail' });
      // navigate('#setting?' + qs.stringify({id, title: encodeURIComponent(title), senderEmail, type:'classifiedSetting'}));
    },
  },
  [MAIL_MENU_ITEM.EXPORT]: {
    key: MAIL_MENU_ITEM.EXPORT,
    // group: '5',
    name: mails => {
      const mail = getMailFromMails(mails);
      const { isThread } = mail;
      return isThread ? getIn18Text('DAOCHUJUHEYOU') : getIn18Text('DAOCHUYOUJIAN');
    },
    show: mails => {
      const mail = getMailFromMails(mails);
      if (mail?.isTpMail) {
        return false;
      }
      return !isCorpMail;
    },
    onClick: mails => {
      if (Array.isArray(mails)) {
        if (mails.length > MAIL_EXPORT_LIMIT) {
          message.error(getIn18Text('DAOCHUSHULIANGCHAO1', { count: MAIL_EXPORT_LIMIT }));
          return;
        }
        const ids = mails.map(mail => mail.id || mail.entry.id);
        const title = mails.length === 1 ? mails[0]?.entry?.title : ''; // 批量title不起作用
        // setCurrentAccount(mails[0]?._account);
        mailApi
          .doExportMail(ids, title, getIn18Text('YOUJIANDAOCHUZHONG'), mails[0]?._account)
          .then(res => {
            if ((res as LoaderResult)?.succ || (res as FsSaveRes)?.success) {
              message.success({ content: getIn18Text('YOUJIANDAOCHUCHENG') });
            } else {
              message.error({ content: getIn18Text('YOUJIANDAOCHUSHI') });
            }
          })
          .catch(e => {
            console.error('[mail export error]', e);
            message.error({ content: e.message });
          });
      } else {
        const mail = getMailFromMails(mails);
        const { _account, isEncryptedMail } = mail;
        if (isEncryptedMail) {
          Toast.info({ content: getIn18Text('JIAMIYOUJIANZANBZCDC') });
          return;
        }
        const { id, title } = mail.entry;
        // setCurrentAccount(_account);
        mailApi
          .doExportMail(id, title, getIn18Text('YOUJIANDAOCHUZHONG'), _account)
          .then(res => {
            ((res as LoaderResult)?.succ || (res as FsSaveRes)?.success) && message.success({ content: getIn18Text('YOUJIANDAOCHUCHENG') });
          })
          .catch(e => {
            console.error('[mail export error]', e);
            message.error({ content: '导出失败' });
          });
      }
    },
  },
  [MAIL_MENU_ITEM.ENCODING]: {
    key: MAIL_MENU_ITEM.ENCODING,
    name: getIn18Text('XUANZEBIANMA'),
    show: mails => {
      const mail = getMailFromMails(mails);
      if (mail?.isTpMail) {
        return false;
      }
      if (mail.isThread) {
        return false;
      }
      if (isCorpMail) return false;
      return true;
    },
    subMenus: (mails, onMenuClick) => {
      const mail = getMailFromMails(mails);
      return (
        <div>
          <MailEncoding
            disable={mail?.isEncryptedMail}
            disableTip={getIn18Text('JIAMIYOUJIANZANBZCXZBM')}
            mid={mail.entry.id}
            encodingValue={mail.entry.content.encoding}
            account={mail._account}
            close={() => onMenuClick && onMenuClick(false)}
          />
        </div>
      );
    },
  },
  [MAIL_MENU_ITEM.MAIL_WITHDRAW]: {
    // 撤回是默认不显示的，因为其显示状态，依赖于外部接口查询，不依赖邮件模型本身的属性
    // warn: 撤回功能的展示，必须依赖于外部接口查询邮件的撤回状态
    key: MAIL_MENU_ITEM.MAIL_WITHDRAW,
    // group: '5',
    name: getIn18Text('CHEHUIYOUJIAN1'),
    show: mails => {
      const mail = getMailFromMails(mails);
      if (mail?.isTpMail) {
        return false;
      }
      if (!isMainAccount(mail._account)) {
        return false;
      }
      const { isThread } = mail;
      return getShowByFolder(mail, [FLOLDER.SENT]) && !isThread && permRecallMail();
    },
    onClick: mails => {
      const mail = getMailFromMails(mails);
      eventApi.sendSysEvent({
        eventName: 'mailMenuOper',
        eventData: {
          mailData: mails,
          showRes: false,
        },
        eventStrData: 'retractEmail',
        _account: mail?._account,
      });
    },
  },
  [MAIL_MENU_ITEM.MAIL_WITHDRAW_RES]: {
    // 撤回是默认不显示的，因为其显示状态，依赖于外部接口查询，不依赖邮件模型本身的属性
    key: MAIL_MENU_ITEM.MAIL_WITHDRAW_RES,
    // group: '5',
    name: getIn18Text('CHEHUIJIEGUO'),
    show: mails => {
      const mail = getMailFromMails(mails);
      if (mail?.isTpMail) {
        return false;
      }
      if (!isMainAccount(mail._account)) {
        return false;
      }
      const { isThread } = mail;
      return getShowByFolder(mail, [FLOLDER.SENT]) && !isThread && permRecallMail();
    },
    onClick: mails => {
      const mail = getMailFromMails(mails);
      eventApi.sendSysEvent({
        eventName: 'mailMenuOper',
        eventData: {
          mailData: mails,
          showRes: true,
        },
        eventStrData: 'retractEmail',
        _account: mail?._account,
      });
    },
  },
  [MAIL_MENU_ITEM.PRINT_MAIL_PREVIEW]: {
    key: MAIL_MENU_ITEM.PRINT_MAIL_PREVIEW,
    name: getIn18Text('PRINT_EMAIL_PREVIEW'),
    show: mails => {
      if (!process.env.BUILD_ISELECTRON) return false;
      return getShouldShowPrintByEmails(mails);
    },
    onClick: mails => {
      handleMailPrint(mails, true);
    },
  },
  [MAIL_MENU_ITEM.PRINT_MAIL]: {
    key: MAIL_MENU_ITEM.PRINT_MAIL,
    // group: '5',
    name: !process.env.BUILD_ISELECTRON ? getIn18Text('DAYINYOUJIAN') : getIn18Text('DAYIN'),
    show: mails => {
      return getShouldShowPrintByEmails(mails);
    },
    onClick: mails => {
      handleMailPrint(mails, false);
    },
  },
  [MAIL_MENU_ITEM.CREATE_PERSONAL_GROUP]: {
    key: MAIL_MENU_ITEM.CREATE_PERSONAL_GROUP,
    name: getIn18Text('XINJIANGERENFENZ'),
    show: mails => {
      const mail = getMailFromMails(mails);
      if (!isMainAccount(mail._account)) {
        return false;
      }
      if (mail?.isTpMail) {
        return false;
      }

      const { isThread } = mail;
      return !isThread && !!mail?.receiver?.length;
    },
    onClick: mails => {
      const mail = getMailFromMails(mails);
      const { isThread, _account } = mail;
      const { id } = mail.entry;

      //判断是否有收件人，获取收件人的email
      let receiverEmails: { name?: string; email: string }[] = [];
      if (mail.receiver.length) {
        receiverEmails = mail.receiver?.map(item => {
          return {
            name: item?.originName,
            email: contactApi.doGetModelDisplayEmail(item.contact),
          };
        });
      }
      eventApi.sendSysEvent({
        eventName: 'mailMenuOper',
        eventData: {
          mailId: id,
          receiverEmails,
        },
        eventStrData: 'createPersonalGroup',
        _account,
      });
    },
  },
  [MAIL_MENU_ITEM.DISCUSSION]: {
    key: MAIL_MENU_ITEM.DISCUSSION,
    name: getIn18Text('YOUJIANTAOLUN'),
    show: mails => {
      const mail = getMailFromMails(mails);
      if (mail?.isTpMail) {
        return false;
      }
      if (!isMainAccount(mail._account)) {
        return false;
      }
      const { isThread, entry, _account } = mail;
      const excludeFolders = [FLOLDER.SPAM, FLOLDER.DRAFT, FLOLDER.DELETED, FLOLDER.ADVITISE];
      const { folder } = entry;
      return !isThread && !excludeFolders.includes(folder) && nimApi.getIMAuthConfig();
    },
    onClick: mails => {
      const mail = getMailFromMails(mails);
      const { isThread, _account } = mail;
      const { id, tid } = mail.entry;

      eventApi.sendSysEvent({
        eventName: 'mailMenuOper',
        eventData: {
          mailId: id,
          tid,
        },
        eventStrData: 'discussion',
        _account,
      });
    },
  },
  [MAIL_MENU_ITEM.EMAIL_HEADER]: {
    key: MAIL_MENU_ITEM.EMAIL_HEADER,
    name: getIn18Text('CHAKANXINTOU'),
    show: mails => {
      const mail = getMailFromMails(mails);
      if (mail?.isTpMail) {
        return false;
      }
      const { isThread } = mail;
      return !isThread;
    },
    onClick: mails => {},
  },
};
export default DefaultMailMenuConfig;
