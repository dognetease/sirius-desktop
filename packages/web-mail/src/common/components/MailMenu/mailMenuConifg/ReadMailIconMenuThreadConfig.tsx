/**
 * 聚合邮件-顶部的icon操作菜单配置
 */
import React from 'react';
import ReadListIcons from '@web-common/components/UI/Icons/svgs/ReadListSvgs';
import DefaultMailMenuConfig from './DefaultMailMenuConfig';
import { FLOLDER, MAIL_MENU_ITEM } from '../../../constant';
import { apiHolder as api, MailEntryModel } from 'api';
import { MailMenuOnClickCallBack, CommonMailMenuConfig, MailMenuIsShowCallBack } from '../../../../types';

import { findAndMergeDefaultMenuConfig, getShowByFolder, proxyTaskMailClick, taskMailMenuShow } from '../util';
import { getIn18Text } from 'api';
import { getMailFromMails } from '@web-mail/util';
import IconCard from '@web-common/components/UI/IconCard';

const eventApi = api.api.getEventApi();

const ReadMailIconMenuThreadConfig: CommonMailMenuConfig[] = [
  {
    key: MAIL_MENU_ITEM.BACK,
    icon: <IconCard type="arrowDown" stroke="#3C3F47" />,
    group: '1',
  },
  {
    key: MAIL_MENU_ITEM.REPLAY,
    icon: undefined,
    group: '1',
  },
  {
    key: MAIL_MENU_ITEM.REPLAY_ALL,
    icon: undefined,
    group: '1',
  },
  {
    key: MAIL_MENU_ITEM.FORWARD,
    icon: undefined,
    group: '1',
    subMenus: findAndMergeDefaultMenuConfig(
      [
        {
          key: MAIL_MENU_ITEM.FORWARD,
          icon: undefined,
        },
        // {
        //   key: MAIL_MENU_ITEM.FORWARD_BY_ATTACH,
        // icon: undefined,
        // },
        {
          key: MAIL_MENU_ITEM.DELIVERY,
          icon: undefined,
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
                way: 'mailTop', // 打点需要使用到的参数，表示从邮件详情顶部触发
              },
              eventStrData: 'delivery',
            });
            // 触发默认onclick
            defaultClickFn && defaultClickFn(mail);
          },
        },
      ],
      DefaultMailMenuConfig
    ),
  },
  {
    key: MAIL_MENU_ITEM.MARK,
    icon: undefined,
    group: '1',
    name: getIn18Text('BIAOJI'),
    // 仅打开配置，用于文字按钮下，仅作为展开按钮，例如：标记为、更多
    onlyUnfold: true,
    show: mails => {
      const mail = getMailFromMails(mails);
      return !getShowByFolder(mail, [FLOLDER.DRAFT]);
    },
    subMenus: findAndMergeDefaultMenuConfig(
      [
        {
          key: MAIL_MENU_ITEM.RED_FLAG,
          icon: undefined,
        },
        {
          key: MAIL_MENU_ITEM.READ,
          icon: undefined,
        },
        {
          key: MAIL_MENU_ITEM.TAG,
          icon: undefined,
        },
      ],
      DefaultMailMenuConfig
    ),
  },
  {
    key: MAIL_MENU_ITEM.MOVE,
    icon: undefined,
    group: '1',
    onClick: proxyTaskMailClick,
  },
  {
    key: MAIL_MENU_ITEM.TOP,
    icon: undefined,
    group: '1',
    onClick: proxyTaskMailClick as MailMenuOnClickCallBack,
  },
  {
    key: MAIL_MENU_ITEM.DELETE,
    icon: undefined,
    group: '1',
    onClick: proxyTaskMailClick,
  },
  {
    key: 'more',
    icon: undefined,
    group: '1',
    name: getIn18Text('GENGDUO'),
    // 仅打开配置，用于文字按钮下，仅作为展开按钮，例如：标记为、更多
    onlyUnfold: true,
    // icon: <ReadListIcons.MoreSvg_Cof />,
    show: mails => {
      const mail = getMailFromMails(mails);
      return !getShowByFolder(mail, [FLOLDER.DRAFT]);
    },
    subMenus: findAndMergeDefaultMenuConfig(
      [
        {
          key: MAIL_MENU_ITEM.SEARCH_IN_CONTENT,
          icon: undefined,
          group: '1',
        },
        {
          key: MAIL_MENU_ITEM.OPEN_IN_WINDOW,
          icon: undefined,
          group: '2',
        },
        {
          key: MAIL_MENU_ITEM.EXPORT,
          icon: undefined,
          group: '2',
        },
      ],
      DefaultMailMenuConfig
    ),
  },
];

// 返回与基础菜单信息混合后的配置信息
export default findAndMergeDefaultMenuConfig(ReadMailIconMenuThreadConfig, DefaultMailMenuConfig);
