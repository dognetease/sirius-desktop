/**
 * 邮件读信页-head中“...”的icon的邮件下拉操作菜单
 */
import { apiHolder as api, MailEntryModel } from 'api';
import DefaultMailMenuConfig from './DefaultMailMenuConfig';
import { MAIL_MENU_ITEM } from '../../../constant';
import { MailMenuOnClickCallBack, MailMenuIsShowCallBack, CommonMailMenuConfig } from '../../../../types';
import { findAndMergeDefaultMenuConfig, taskMailMenuShow } from '../util';
import { getIn18Text } from 'api';
import { getMailFromMails } from '@web-mail/util';

const eventApi = api.api.getEventApi();
const MailListMenuConfig: CommonMailMenuConfig[] = [
  {
    key: MAIL_MENU_ITEM.RE_EDIT,
    group: '2',
  },
  {
    key: MAIL_MENU_ITEM.MAIL_WITHDRAW,
    group: '2',
  },
  {
    key: MAIL_MENU_ITEM.MAIL_WITHDRAW_RES,
    group: '2',
  },
  {
    key: MAIL_MENU_ITEM.REPLAY,
    group: '2',
  },
  {
    key: MAIL_MENU_ITEM.REPLAY_ALL,
    group: '2',
  },
  {
    key: MAIL_MENU_ITEM.REPLAY_ATTACH,
    group: '2',
  },
  {
    key: MAIL_MENU_ITEM.REPLAY_ATTACH_ALL,
    group: '2',
  },
  {
    key: MAIL_MENU_ITEM.FORWARD,
    group: '2',
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
    key: MAIL_MENU_ITEM.TRANSLATE,
    group: '5',
  },
  {
    key: MAIL_MENU_ITEM.SEARCH_IN_CONTENT,
    group: '5',
  },
  {
    key: MAIL_MENU_ITEM.SHARE,
    group: '6',
  },
  {
    key: MAIL_MENU_ITEM.DISCUSSION,
    group: '6',
  },
  {
    key: 'more',
    group: '7',
    // 仅打开配置，用于文字按钮下，仅作为展开按钮，例如：标记为、更多
    onlyUnfold: true,
    name: getIn18Text('GENGDUO'),
    show: true,
    subMenus: findAndMergeDefaultMenuConfig(
      [
        {
          key: MAIL_MENU_ITEM.FORWARD_BY_ATTACH,
          group: '1',
        },
        {
          key: MAIL_MENU_ITEM.DELIVERY,
          group: '1',
          show: (mails, defaultShow?: MailMenuIsShowCallBack) => {
            const mail = getMailFromMails(mails);
            if (!process.env.BUILD_ISEDM) {
              return !!defaultShow && defaultShow(mail);
            }
            return false;
          },
          onClick: (mails, defaultClickFn?: MailMenuOnClickCallBack) => {
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
                way: 'mailDetail', // 打点需要使用到的参数，表示从邮件读信页...里面触发
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
        {
          key: MAIL_MENU_ITEM.ENCODING,
          group: '3',
        },
        {
          key: MAIL_MENU_ITEM.EMAIL_HEADER,
          group: '3',
        },
      ],
      DefaultMailMenuConfig
    ),
  },
];
// 返回与基础菜单信息混合后的配置信息
export default findAndMergeDefaultMenuConfig(MailListMenuConfig, DefaultMailMenuConfig);
