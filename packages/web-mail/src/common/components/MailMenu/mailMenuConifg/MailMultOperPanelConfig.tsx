/**
 * 邮件多选窗体-icon操作按钮配置
 * 注意：多选与单选配置中，静态部分相同，动态部分参数为多个
 * show方法参数不变，取多个邮件中的第一个
 * click方法由上层代理实现。
 */

import { MailEntryModel } from 'api';
import DefaultMailMenuConfig from './DefaultMailMenuConfig';
import { MAIL_MENU_ITEM } from '../../../constant';
import { CommonMailMenuConfig, MailMenuIsShowCallBack } from '../../../../types';
import { findAndMergeDefaultMenuConfig } from '../util';
import { getIn18Text } from 'api';
import { getMailFromMails } from '@web-mail/util';
import { apis, apiHolder, MailApi } from 'api';

const mailApi = apiHolder.api.requireLogicalApi(apis.mailApiImpl) as unknown as MailApi;

const MailMultOperPanelConfig: CommonMailMenuConfig[] = [
  // 标记为
  {
    key: MAIL_MENU_ITEM.MARK,
    group: '1',
    name: getIn18Text('BIAOJIWEI'),
    icon: undefined,
    // 仅打开配置，用于文字按钮下，仅作为展开按钮，例如：标记为、更多
    onlyUnfold: true,
    show: mails => {
      return true;
      // const mail = getMailFromMails(mails);
      // return !getShowByFolder(mail, [FLOLDER.DRAFT]);
    },
    subMenus: findAndMergeDefaultMenuConfig(
      [
        {
          key: MAIL_MENU_ITEM.RED_FLAG,
          icon: undefined,
          group: '2',
        },
        {
          key: MAIL_MENU_ITEM.READ,
          icon: undefined,
          group: '2',
        },
        {
          key: MAIL_MENU_ITEM.TAG,
          icon: undefined,
          group: '2',
        },
      ],
      DefaultMailMenuConfig
    ),
  },
  {
    key: MAIL_MENU_ITEM.MOVE,
    icon: undefined,
    group: '1',
  },
  {
    key: MAIL_MENU_ITEM.DELETE,
    icon: undefined,
    group: '1',
  },
  {
    key: MAIL_MENU_ITEM.TOP,
    icon: undefined,
    group: '1',
  },
  {
    key: MAIL_MENU_ITEM.FORWARD_BY_ATTACH,
    icon: undefined,
    group: '1',
    show: (mails, defaultShow?: MailMenuIsShowCallBack) => {
      const mail = getMailFromMails(mails);
      // 多选时聚合模式下不展示
      const { isThread } = mail;
      if (isThread) {
        return false;
      }
      return !!defaultShow && defaultShow(mail);
    },
  },
  {
    key: MAIL_MENU_ITEM.EXPORT,
    icon: undefined,
    group: '1',
    show: (mails, defaultShow?: MailMenuIsShowCallBack) => {
      const mail = getMailFromMails(mails);
      // 多选时聚合模式下不展示导出
      const { isThread } = mail;
      if (isThread) {
        return false;
      }
      return !!defaultShow && defaultShow(mail);
    },
  },
];

// 返回与基础菜单信息混合后的配置信息
export default findAndMergeDefaultMenuConfig(MailMultOperPanelConfig, DefaultMailMenuConfig);
