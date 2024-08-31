/**
 * 读信页-head中的快捷操作icon按钮-配置
 */
import React from 'react';
import ReadListIcons from '@web-common/components/UI/Icons/svgs/ReadListSvgs';
import { MailEntryModel } from 'api';
import lodashGet from 'lodash/get';
import IconCard from '@web-common/components/UI/IconCard';
import DefaultMailMenuConfig from './DefaultMailMenuConfig';
import { FLOLDER, MAIL_MENU_ITEM } from '../../../constant';
import { MailMenuIsShowCallBack, CommonMailMenuConfig } from '../../../../types';
import { findAndMergeDefaultMenuConfig, getShowByFolder } from '../util';
import { getMailFromMails } from '@web-mail/util';

const ReadMailIconMenuRightConfig: CommonMailMenuConfig[] = [
  {
    key: MAIL_MENU_ITEM.RED_FLAG,
    group: '1',
  },
  {
    key: MAIL_MENU_ITEM.TAG,
    group: '1',
  },
  {
    key: MAIL_MENU_ITEM.REPLAY,
    group: '1',
    //   show: (mails, defaultShow?: MailMenuIsShowCallBack) => {
    //     const mail = getMailFromMails(mails);
    //     if (lodashGet(mail, 'receiver.length', 0) > 1) {
    //       return false;
    //     }
    //     return !!defaultShow && defaultShow(mail);
    //   },
  },
  {
    key: MAIL_MENU_ITEM.REPLAY_ALL,
    group: '1',
    // show: (mails, defaultShow?: MailMenuIsShowCallBack) => {
    //   const mail = getMailFromMails(mails);
    //   if (lodashGet(mail, 'receiver.length', 0) === 1) {
    //     return false;
    //   }
    //   return !!defaultShow && defaultShow(mail);
    // },
  },
  // {
  //   key: MAIL_MENU_ITEM.SHARE,
  //   group: '1',
  //   icon: <IconCard type="share" />,
  // // },
  // {
  //   key: 'discuss',
  //   group: '1',
  // },
  {
    key: 'extend',
    group: '1',
    icon: <ReadListIcons.MoreSvg_Cof />,
    show: (mails: MailEntryModel | MailEntryModel[]) => {
      const mail = getMailFromMails(mails);
      return true;
    },
    subMenus: [],
  },
];

// 返回与基础菜单信息混合后的配置信息
export default findAndMergeDefaultMenuConfig(ReadMailIconMenuRightConfig, DefaultMailMenuConfig);
