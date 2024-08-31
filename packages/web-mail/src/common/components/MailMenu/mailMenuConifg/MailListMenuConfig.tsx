/**
 * 单封模型-邮件列表-邮件菜单配置
 */
import { apiHolder as api, MailEntryModel } from 'api';
import DefaultMailMenuConfig from './DefaultMailMenuConfig';
import { FLOLDER, MAIL_MENU_ITEM } from '../../../constant';
import { CommonMailMenuConfig, MailMenuIsShowCallBack } from '../../../../types';
import { findAndMergeDefaultMenuConfig, getShowByFolder, taskMailMenuShow } from '../util';
import { getIn18Text } from 'api';
import { getMailFromMails } from '@web-mail/util';

const eventApi = api.api.getEventApi();
// todo: 确认该属性在全局的有效性，有可能在切换账号的情况下该值还是固定的
const MailListMenuConfig: CommonMailMenuConfig[] = [
  {
    key: MAIL_MENU_ITEM.RE_EDIT,
    group: '2',
  },
  {
    key: MAIL_MENU_ITEM.REPLAY,
    group: '2',
    show: mails => {
      const mail = getMailFromMails(mails);
      if (mail?.isTpMail) {
        return false;
      }
      return !getShowByFolder(mail, [FLOLDER.DRAFT]);
    },
  },
  {
    key: MAIL_MENU_ITEM.REPLAY_ALL,
    group: '2',
    show: mails => {
      const mail = getMailFromMails(mails);
      if (mail?.isTpMail) {
        return false;
      }
      return !getShowByFolder(mail, [FLOLDER.DRAFT]);
    },
  },
  {
    key: MAIL_MENU_ITEM.REPLAY_ATTACH,
    group: '2',
    show: mails => {
      const mail = getMailFromMails(mails);
      if (mail?.isTpMail) {
        return false;
      }
      const { isThread } = mail;
      const { attachment } = mail.entry;
      const isShowAttachBtn = attachment && attachment.some(attach => !attach.inlined && attach.fileType !== 'ics');
      return !!isShowAttachBtn && !(getShowByFolder(mail, [FLOLDER.DRAFT]) || isThread);
    },
  },
  {
    key: MAIL_MENU_ITEM.REPLAY_ATTACH_ALL,
    group: '2',
    show: mails => {
      const mail = getMailFromMails(mails);
      if (mail?.isTpMail) {
        return false;
      }
      const { isThread } = mail;
      const { attachment } = mail.entry;
      const isShowAttachBtn = attachment && attachment.some(attach => !attach.inlined && attach.fileType !== 'ics');
      return !!isShowAttachBtn && !(getShowByFolder(mail, [FLOLDER.DRAFT]) || isThread);
    },
  },
  {
    key: MAIL_MENU_ITEM.FORWARD,
    group: '2',
    show: mails => {
      const mail = getMailFromMails(mails);
      if (mail?.isTpMail) {
        return false;
      }
      return !getShowByFolder(mail, [FLOLDER.DRAFT]);
    },
  },
  {
    key: MAIL_MENU_ITEM.RED_FLAG,
    show: taskMailMenuShow,
    group: '3',
  },
  {
    key: MAIL_MENU_ITEM.READ,
    group: '3',
  },
  {
    key: MAIL_MENU_ITEM.TAG,
    show: taskMailMenuShow,
    group: '3',
  },
  {
    key: MAIL_MENU_ITEM.DEFER,
    show: (mails: MailEntryModel | MailEntryModel[], defaultShow?: MailMenuIsShowCallBack) => {
      const mail = getMailFromMails(mails);
      const { isThread } = mail;
      return !isThread && (defaultShow ? defaultShow(mail) : true);
    },
    group: '3',
  },
  {
    key: MAIL_MENU_ITEM.COMMENT,
    group: '3',
  },
  {
    key: MAIL_MENU_ITEM.MOVE,
    group: '4',
    show: taskMailMenuShow,
  },
  {
    key: MAIL_MENU_ITEM.TOP,
    group: '4',
    show: taskMailMenuShow,
  },
  {
    key: MAIL_MENU_ITEM.DELETE,
    group: '4',
    show: taskMailMenuShow,
  },
  {
    key: MAIL_MENU_ITEM.REPORT,
    group: '4',
  },

  {
    key: MAIL_MENU_ITEM.REPORT_TRUST,
    group: '4',
    show: taskMailMenuShow,
  },
  {
    key: MAIL_MENU_ITEM.SHARE,
    group: '5',
  },
  {
    key: MAIL_MENU_ITEM.DISCUSSION,
    group: '5',
  },
  {
    key: 'more',
    group: '6',
    // 仅打开配置，用于文字按钮下，仅作为展开按钮，例如：标记为、更多
    onlyUnfold: true,
    name: getIn18Text('GENGDUO'),
    show: true,
    subMenus: findAndMergeDefaultMenuConfig(
      [
        {
          key: MAIL_MENU_ITEM.FORWARD_BY_ATTACH,
          group: '1',
          show: mails => {
            const mail = getMailFromMails(mails);
            if (mail?.isTpMail) {
              return false;
            }
            const { isThread } = mail;
            return !isThread && !getShowByFolder(mail, [FLOLDER.DRAFT]);
          },
        },
        {
          key: MAIL_MENU_ITEM.DELIVERY,
          group: '1',
          show: (mails, defaultShow?: MailMenuIsShowCallBack) => {
            const mail = getMailFromMails(mails);
            return !!defaultShow && defaultShow(mail);
          },
          onClick: (mails, defaultClickFn) => {
            const mail = getMailFromMails(mails);
            const {
              entry: { id, threadMessageFirstId },
              _account,
              isThread,
            } = mail;
            let mailId = id;
            if (isThread) {
              mailId = threadMessageFirstId as string;
            }
            eventApi.sendSysEvent({
              eventName: 'mailMenuOper',
              eventData: {
                mailId,
                account: _account,
                way: 'mailList', // 打点需要使用到的参数，表示从邮件列表右键触发
              },
              eventStrData: 'delivery',
            });
            // 触发默认onclick
            defaultClickFn && defaultClickFn(mail);
          },
        },
        {
          key: MAIL_MENU_ITEM.SET_FROM_GROUP,
          group: '2',
        },
        {
          key: MAIL_MENU_ITEM.CREATE_PERSONAL_GROUP,
          group: '2',
        },
        {
          key: MAIL_MENU_ITEM.OPEN_IN_WINDOW,
          group: '3',
          show: () => {
            return true;
          },
        },
        {
          key: MAIL_MENU_ITEM.PRINT_MAIL_PREVIEW,
          group: '3',
        },
        {
          key: MAIL_MENU_ITEM.PRINT_MAIL,
          group: '3',
        },

        {
          key: MAIL_MENU_ITEM.EXPORT,
          group: '3',
        },
      ],
      DefaultMailMenuConfig
    ),
  },
];
// 返回与基础菜单信息混合后的配置信息
export default findAndMergeDefaultMenuConfig(MailListMenuConfig, DefaultMailMenuConfig);
