/**
 * 邮件读信页-顶部的icon菜单展示的按钮操作配置
 */
import React, { useState, useEffect, useMemo } from 'react';
import ResizeObserver from 'resize-observer-polyfill';
import ReadListIcons from '@web-common/components/UI/Icons/svgs/ReadListSvgs';
import { apiHolder as api, MailEntryModel } from 'api';
import DefaultMailMenuConfig from './DefaultMailMenuConfig';
import { FLOLDER, MAIL_MENU_ITEM } from '../../../constant';
import { CommonMailMenuConfig, MailMenuOnClickCallBack, MailMenuIsShowCallBack } from '../../../../types';
import { findAndMergeDefaultMenuConfig, getShowByFolder, taskMailMenuShow } from '../util';
import lodashGet from 'lodash/get';
import useDebounceForEvent from '@web-mail/hooks/useDebounceForEvent';
import { getIn18Text } from 'api';
import { getMailFromMails } from '@web-mail/util';
import IconCard from '@web-common/components/UI/IconCard';

const eventApi = api.api.getEventApi();

/**
 * 读信页顶部的icon操作按钮配置
 * warn： 对于任务邮件，在icon按钮中，对不支持的操作不做隐藏，只做操作拦截。这样做是为了避免在不同邮件之间切换的时候，操作按钮跳动的问题。
 */
const ReadMailIconMenuConfig: CommonMailMenuConfig[] = findAndMergeDefaultMenuConfig(
  [
    {
      key: MAIL_MENU_ITEM.BACK,
      icon: <IconCard type="arrowDown" stroke="#3C3F47" />,
      group: '1',
    },
    {
      key: MAIL_MENU_ITEM.RE_EDIT,
      icon: undefined,
      group: '2',
    },
    {
      key: MAIL_MENU_ITEM.MAIL_WITHDRAW,
      icon: undefined,
      group: '2',
    },
    {
      key: MAIL_MENU_ITEM.MAIL_WITHDRAW_RES,
      icon: undefined,
      group: '2',
    },
    {
      key: MAIL_MENU_ITEM.REPLAY,
      icon: undefined,
      group: '3',
      subMenus: findAndMergeDefaultMenuConfig(
        [
          {
            key: MAIL_MENU_ITEM.REPLAY,
            icon: undefined,
          },
          {
            key: MAIL_MENU_ITEM.REPLAY_ATTACH,
            icon: undefined,
          },
        ],
        DefaultMailMenuConfig
      ),
    },
    {
      key: MAIL_MENU_ITEM.REPLAY_ALL,
      icon: undefined,
      group: '3',
      subMenus: findAndMergeDefaultMenuConfig(
        [
          {
            key: MAIL_MENU_ITEM.REPLAY_ALL,
            icon: undefined,
          },
          {
            key: MAIL_MENU_ITEM.REPLAY_ATTACH_ALL,
            icon: undefined,
          },
        ],
        DefaultMailMenuConfig
      ),
    },
    {
      key: MAIL_MENU_ITEM.FORWARD,
      icon: undefined,
      group: '3',
      subMenus: findAndMergeDefaultMenuConfig(
        [
          {
            key: MAIL_MENU_ITEM.FORWARD,
            icon: undefined,
          },
          {
            key: MAIL_MENU_ITEM.FORWARD_BY_ATTACH,
            icon: undefined,
          },
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
      key: MAIL_MENU_ITEM.DELIVERY,
      icon: undefined,
      group: '3',
      show: (mails, defaultShow) => {
        const mail = getMailFromMails(mails);
        if (process.env.BUILD_ISEDM) {
          return !!defaultShow && defaultShow(mail);
        }
        return false;
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
            way: 'mailTop', // 打点需要使用到的参数，表示从邮件详情顶部触发
          },
          eventStrData: 'delivery',
        });
        // 触发默认onclick
        defaultClickFn && defaultClickFn(mail);
      },
    },
    {
      key: MAIL_MENU_ITEM.MARK,
      icon: undefined,
      group: '4',
      name: getIn18Text('BIAOJI'),
      // 仅打开配置，用于文字按钮下，仅作为展开按钮，例如：标记为、更多
      onlyUnfold: true,
      show: true,
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
          // {
          //   key: MAIL_MENU_ITEM.PREFERRED
          // },
          // {
          //   key: MAIL_MENU_ITEM.TOP, icon: undefined,
          //   show: taskMailMenuShow,
          // },
          {
            key: MAIL_MENU_ITEM.DEFER,
            icon: undefined,
          },
          {
            key: MAIL_MENU_ITEM.COMMENT,
            icon: undefined,
          },
        ],
        DefaultMailMenuConfig
      ),
    },
    {
      key: MAIL_MENU_ITEM.MOVE,
      icon: undefined,
      group: '4',
    },
    {
      key: MAIL_MENU_ITEM.TOP,
      icon: undefined,
      group: '4',
    },
    {
      key: MAIL_MENU_ITEM.DELETE,
      icon: undefined,
      group: '4',
    },
    {
      key: MAIL_MENU_ITEM.REPORT_TRUST,
      icon: undefined,
      group: '6',
    },
    {
      key: MAIL_MENU_ITEM.REPORT,
      icon: undefined,
      group: '6',
      show: taskMailMenuShow,
    },
    {
      key: MAIL_MENU_ITEM.TRANSLATE,
      icon: undefined,
      group: '6',
    },
    {
      key: MAIL_MENU_ITEM.SEARCH_IN_CONTENT,
      icon: undefined,
      group: '6',
    },
    {
      key: MAIL_MENU_ITEM.SHARE,
      icon: undefined,
      group: '7',
    },
    {
      key: MAIL_MENU_ITEM.DISCUSSION,
      icon: undefined,
      group: '7',
    },
  ],
  DefaultMailMenuConfig
);

const MoreMenuConfig = [
  {
    key: MAIL_MENU_ITEM.SET_FROM_GROUP,
    icon: undefined,
    group: '8',
  },
  {
    key: MAIL_MENU_ITEM.CREATE_PERSONAL_GROUP,
    icon: undefined,
    group: '8',
  },
  {
    key: MAIL_MENU_ITEM.OPEN_IN_WINDOW,
    icon: undefined,
    group: '9',
  },
  {
    key: MAIL_MENU_ITEM.PRINT_MAIL_PREVIEW,
    icon: undefined,
    group: '9',
  },
  {
    key: MAIL_MENU_ITEM.PRINT_MAIL,
    icon: undefined,
    group: '9',
  },
  {
    key: MAIL_MENU_ITEM.EXPORT,
    icon: undefined,
    group: '9',
  },
  {
    key: MAIL_MENU_ITEM.ENCODING,
    icon: undefined,
    group: '9',
  },
  {
    key: MAIL_MENU_ITEM.EMAIL_HEADER,
    icon: undefined,
    group: '9',
  },
];

/**
 * 估算宽度
 */
const estimateWidth = (mails: MailEntryModel | MailEntryModel[], config: CommonMailMenuConfig): number => {
  const paddingWidth = 12;
  const sunMenuIconWidth = 22;
  const otherWidth = paddingWidth * 2 + (config?.subMenus ? sunMenuIconWidth : 0);
  if (config) {
    let name = '';
    if (typeof config?.name === 'function') {
      name = config.name(mails) + '';
    } else {
      name = config.name + '';
    }

    if (typeof name === 'string') {
      return `${name}`.length * 12 + otherWidth;
    }
  }
  return 0;
};

/**
 * 估算宽度并返回新的配置
 *
 */
const getAndMergeConfigWidth = (mails: MailEntryModel | MailEntryModel[], config: CommonMailMenuConfig[]): CommonMailMenuConfig[] => {
  if (config && config.length) {
    return config.map((item: CommonMailMenuConfig) => {
      let isShow = true;
      if (typeof item.show === 'function') {
        isShow = item.show(mails);
      } else {
        isShow = !!item.show;
      }
      // 估算宽度
      return {
        ...item,
        _width: estimateWidth(mails, item),
        _isShow: isShow,
      };
    });
  }
  return [];
};

/**
 * 根据宽度获取菜单配置
 */
const formatMenuAuto = (width: number, mails: MailEntryModel | MailEntryModel[], noMore?: boolean): CommonMailMenuConfig[] => {
  const btnSpace = 8;
  const configList = [];
  // const moreConfigList = [...MoreMenuConfig];
  const tempMoreConfigList = [];
  // 根据名称估算每个按钮的宽度
  const menuConfig = getAndMergeConfigWidth(mails, ReadMailIconMenuConfig);
  // 根据按钮之间的分割，计算可以容纳的最大按钮数量
  if (menuConfig) {
    let sumWidth = 0;
    for (let i = 0; i < menuConfig.length; i++) {
      const curConfig = menuConfig[i];
      if (curConfig._isShow) {
        const curWidth = (curConfig._width || 0) + btnSpace;
        if (sumWidth + curWidth < width) {
          configList.push(curConfig);
        } else {
          tempMoreConfigList.push(curConfig);
        }
        sumWidth += curWidth;
      }
    }
  }
  // 计算第一排的额按钮，剩下的全部怼到更多中
  // if (tempMoreConfigList.length) {
  configList.push({
    key: 'more',
    icon: undefined,
    group: '10',
    name: getIn18Text('GENGDUO'),
    // 仅打开配置，用于文字按钮下，仅作为展开按钮，例如：标记为、更多
    onlyUnfold: true,
    // icon: <ReadListIcons.MoreSvg_Cof />,
    show: true,
    subMenus: findAndMergeDefaultMenuConfig([...tempMoreConfigList, ...MoreMenuConfig], DefaultMailMenuConfig),
  });
  // }
  return configList;
};

/**
 * hook,用于在组件中根据宽度获取对应的菜单配置
 */
const useReadMailIconMenuConfig = (toobarbox: HTMLElement | null, mails: MailEntryModel | MailEntryModel[], noMore?: boolean) => {
  const [menuConfig, setMenuConfig] = useState<CommonMailMenuConfig[]>([]);
  const [toobarWidth, setToobarWidth] = useState<number>(0);
  // const widthRange = useMemo(() => (toobarWidth >= 620 ? '0' : toobarWidth >= 570 ? '1' : toobarWidth >= 520 ? '2' : '3'), [toobarWidth]); // 0: 大于620， 1: 大于等于570小于620，2：大于520小于570，3：小于520
  // const widthRange = useMemo(
  //   () => (toobarWidth >= 900 ? '0' : toobarWidth >= 725 ? '1' : toobarWidth >= 584 ? '2' : toobarWidth >= 530 ? '3' : toobarWidth >= 473 ? '4' : '5'),
  //   [toobarWidth]
  // );
  const mergeDefaultMenuConfig = useMemo(() => findAndMergeDefaultMenuConfig(menuConfig, DefaultMailMenuConfig), [menuConfig]);

  const debouceSetToobarWidth = useDebounceForEvent(setToobarWidth, 500, { leading: false });

  useEffect(() => {
    if (!toobarbox) {
      return;
    }
    const resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width } = entry.contentRect;
        debouceSetToobarWidth(width);
      }
    });
    resizeObserver.observe(toobarbox);
    return () => {
      resizeObserver.unobserve(toobarbox);
    };
  }, [lodashGet(toobarbox, 'tagName', '')]);

  useEffect(() => {
    // 必须保证计算的时候，配置是有值的。
    if (mails) {
      setMenuConfig(formatMenuAuto(toobarWidth, mails, noMore));
    }
  }, [toobarWidth, mails]);

  return mergeDefaultMenuConfig;
};

// 返回与基础菜单信息混合后的配置信息
// export const defaultReadMailIconMenuConfig = formatMenu(10000);
// export default findAndMergeDefaultMenuConfig(ReadMailIconMenuConfig, DefaultMailMenuConfig);

// 有缩放逻辑的菜单配置信息
export default useReadMailIconMenuConfig;
