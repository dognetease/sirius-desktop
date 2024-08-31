/**
 * 邮件多选列表-操作配置
 */

import { MailEntryModel, apiHolder as api, SystemApi, getIn18Text } from 'api';
import DefaultMailMenuConfig from './DefaultMailMenuConfig';
import { FLOLDER, MAIL_MENU_ITEM } from '../../../constant';
import { CommonMailMenuConfig, MailMenuIsShowCallBack } from '../../../../types';
import { findAndMergeDefaultMenuConfig, getShowByFolder } from '../util';
const systemApi = api.api.getSystemApi() as SystemApi;
const isCorpMail = systemApi.getIsCorpMailMode();
import { getMailFromMails } from '@web-mail/util';

const MailListMenuMultConfig: CommonMailMenuConfig[] = [
  {
    key: MAIL_MENU_ITEM.RED_FLAG,
    group: '1',
  },
  {
    key: MAIL_MENU_ITEM.READ,
    group: '1',
  },
  {
    key: MAIL_MENU_ITEM.TAG,
    group: '1',
  },
  {
    key: MAIL_MENU_ITEM.MOVE,
    group: '2',
  },
  {
    key: MAIL_MENU_ITEM.DELETE,
    group: '2',
  },
  {
    key: MAIL_MENU_ITEM.TOP,
    group: '2',
  },
  {
    key: MAIL_MENU_ITEM.FORWARD_BY_ATTACH,
    group: '2',
  },
  {
    key: MAIL_MENU_ITEM.EXPORT,
    group: '2',
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
export default findAndMergeDefaultMenuConfig(MailListMenuMultConfig, DefaultMailMenuConfig);
