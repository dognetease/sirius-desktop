/**
 *  邮件卡片邮件状态图标
 */
import React, { useMemo } from 'react';
import { MailEntryModel, apiHolder as api, apis, MailConfApi } from 'api';
import { FLOLDER } from '../../../constant';
import ReadListIcons from '@web-common/components/UI/Icons/svgs/ReadListSvgs';
import cloneDeep from 'lodash/cloneDeep';
import { Tooltip } from 'antd';
import { getIn18Text } from 'api';

const eventApi = api.api.getEventApi();
const mailConfApi = api.api.requireLogicalApi(apis.mailConfApiImpl) as MailConfApi;

const MyTooltip: React.FC<{ type: string; handleIconClick?: React.MouseEventHandler<HTMLSpanElement>; wrapClass?: string }> = props => {
  const { type, wrapClass = '', handleIconClick = () => {} } = props;
  const className = 'from-flag-warp-svg' + `${wrapClass ? ' ' + wrapClass : ''}`;
  if (!type) {
    return (
      <span className={className} onClick={handleIconClick}>
        {props.children}
      </span>
    );
  }
  const title = getIn18Text(type);
  return (
    <Tooltip title={title} mouseEnterDelay={0.3} mouseLeaveDelay={0.15}>
      <span className={className} onClick={handleIconClick}>
        {props.children}
      </span>
    </Tooltip>
  );
};

const filterArr = (originalData: MAIL_STATE_ICON[], filterConfig: MAIL_STATE_ICON[]): MAIL_STATE_ICON[] => {
  const res: MAIL_STATE_ICON[] = [];
  originalData.forEach((icon: MAIL_STATE_ICON) => {
    if (filterConfig.includes(icon)) {
      res.push(icon);
    }
  });
  let _res = [...new Set(res)];
  return _res;
};

const sortArr = (originalData: MAIL_STATE_ICON[], filterConfig: MAIL_STATE_ICON[]): MAIL_STATE_ICON[] => {
  const _originalData = cloneDeep(originalData);
  let res: MAIL_STATE_ICON[] = [];
  filterConfig.forEach((icon: MAIL_STATE_ICON) => {
    if (_originalData.includes(icon)) {
      res.push(icon);
      _originalData.splice(_originalData.indexOf(icon), 1);
    }
  });
  res = res.concat(_originalData);
  return res;
};

export enum MAIL_STATE_ICON {
  /**
   * 紧急
   */
  PRIORITY = 'PRIORITY',
  /**
   * 系统
   */
  SYSTEM = 'SYSTEM',
  /**
   * 未读
   */
  UNREAD = 'UNREAD',
  /**
   * 已回复
   */
  REPLAYED = 'REPLAYED',
  /**
   * 已转发
   */
  FORWARDED = 'FORWARDED',
  /**
   * 回复且转发
   */
  REPLAYED_AND_FORWARDED = 'REPLAYED_AND_FORWARDED',
  /**
   * 已被POP收取
   */
  POPREAD = 'POPREAD',
  /**
   * 发送成功
   */
  RCPT_SUCCEED = 'RCPT_SUCCEED',
  /**
   * 部分发送成功
   */
  PARTIAL_RCPT_SUCCEED = 'PARTIAL_RCPT_SUCCEED',
  /**
   * 发送失败
   */
  RCPT_FAILED = 'RCPT_FAILED',
  /**
   * 撤回成功
   */
  WITHDRAW_SUCC = 'WITHDRAW_SUCC',
  /**
   * 部分撤回成功
   */
  PARTIAL_WITHDRAW_SUCC = 'PARTIAL_WITHDRAW_SUCC',
  /**
   * 撤回失败
   */
  WITHDRAW_FAIL = 'WITHDRAW_FAIL',
  /**
   * 可疑邮件
   */
  SUSPICIOUS_MAIL = 'SUSPICIOUS_MAIL',
}

const iconConfig: { [key in MAIL_STATE_ICON]: { show: (data: MailEntryModel) => boolean; icon: JSX.Element | ((active: boolean) => JSX.Element); tooltip: string } } = {
  [MAIL_STATE_ICON.PRIORITY]: {
    show: (data: MailEntryModel) => {
      const { priority } = data.entry || {};
      return typeof priority === 'number' && priority < 2;
    },
    icon: (active: boolean) => {
      return <ReadListIcons.AlarmSvg />;
    },
    tooltip: 'JINJIYOUJIAN',
  },
  [MAIL_STATE_ICON.SYSTEM]: {
    show: (data: MailEntryModel) => {
      const { system } = data.entry || {};
      return system;
    },
    icon: <ReadListIcons.SystemSvg />,
    tooltip: 'WANGYIXITONGYOUJIAN',
  },
  [MAIL_STATE_ICON.UNREAD]: {
    show: (data: MailEntryModel) => {
      const { readStatus } = data.entry || {};
      const { isTpMail } = data;
      // 三方邮件不显示已读状态
      return readStatus === 'unread' && !isTpMail;
    },
    icon: <div className="dot" />,
    tooltip: '',
  },
  [MAIL_STATE_ICON.REPLAYED]: {
    show: (data: MailEntryModel) => {
      const { replayed, forwarded } = data.entry || {};
      return replayed && !forwarded;
    },
    icon: <ReadListIcons.ReplyFullActiveSvg />,
    tooltip: 'YIHUIFU',
  },
  [MAIL_STATE_ICON.FORWARDED]: {
    show: (data: MailEntryModel) => {
      const { replayed, forwarded } = data.entry || {};
      return forwarded && !replayed;
    },
    icon: <ReadListIcons.ForwardedSvg />,
    tooltip: 'YIZHUANFA',
  },
  [MAIL_STATE_ICON.REPLAYED_AND_FORWARDED]: {
    show: (data: MailEntryModel) => {
      const { replayed, forwarded } = data.entry || {};
      return replayed && forwarded;
    },
    icon: <ReadListIcons.ReplayedForwardedSvg />,
    tooltip: 'HUIFUQIEZHUANFA',
  },
  [MAIL_STATE_ICON.POPREAD]: {
    show: (data: MailEntryModel) => {
      const { readStatus, popRead } = data.entry || {};
      return readStatus === 'unread' && popRead;
    },
    icon: <ReadListIcons.PopSvg />,
    tooltip: 'POP',
  },
  [MAIL_STATE_ICON.RCPT_SUCCEED]: {
    show: (data: MailEntryModel) => {
      const { rcptSucceed, rcptFailed } = data.entry || {};
      return rcptSucceed && !rcptFailed;
    },
    icon: <ReadListIcons.RcptSuccSvg />,
    tooltip: 'FASONGCHENGGONG',
  },
  [MAIL_STATE_ICON.PARTIAL_RCPT_SUCCEED]: {
    show: (data: MailEntryModel) => {
      const { rcptSucceed, rcptFailed } = data.entry || {};
      return rcptSucceed && rcptFailed;
    },
    icon: <ReadListIcons.PartialRcptSuccSvg />,
    tooltip: 'BUFENFASONGCHENGGONG',
  },
  [MAIL_STATE_ICON.RCPT_FAILED]: {
    show: (data: MailEntryModel) => {
      const { rcptSucceed, rcptFailed } = data.entry || {};
      return rcptFailed && !rcptSucceed;
    },
    icon: <ReadListIcons.RcptFailSvg />,
    tooltip: 'FASONGSHIBAI',
  },
  [MAIL_STATE_ICON.WITHDRAW_SUCC]: {
    show: (data: MailEntryModel) => {
      // rclStatus  3 表示成功撤回，4表示撤回失败，5表示部分成功
      const { rclStatus } = data.entry || {};
      return rclStatus === 3;
    },
    icon: <ReadListIcons.WithdrawSuccSvg />,
    tooltip: 'CHEHUICHENGGONG',
  },
  [MAIL_STATE_ICON.PARTIAL_WITHDRAW_SUCC]: {
    show: (data: MailEntryModel) => {
      const { rclStatus } = data.entry || {};
      return rclStatus === 5;
    },
    icon: <ReadListIcons.PartialWithdrawSuccSvg />,
    tooltip: 'BUFENCHEHUICHENGGONG',
  },
  [MAIL_STATE_ICON.WITHDRAW_FAIL]: {
    show: (data: MailEntryModel) => {
      const { rclStatus } = data.entry || {};
      return rclStatus === 4;
    },
    icon: <ReadListIcons.WithdrawFailSvg />,
    tooltip: 'CHEHUISHIBAI',
  },
  [MAIL_STATE_ICON.SUSPICIOUS_MAIL]: {
    show: (data: MailEntryModel) => {
      const { suspiciousSpam } = data.entry || {};
      return !!suspiciousSpam;
    },
    icon: (active: boolean) => {
      return <ReadListIcons.SuspiciousSvg />;
    },
    tooltip: 'KEYIYOUJIAN',
  },
};

/**
 * 依据文件夹筛选图标
 * @param folder 邮件fid
 * @param iconList 图标列表原始数据
 * @returns 筛选后的数据
 */
const filterIconListByFid = (folder: number, iconList: MAIL_STATE_ICON[]): MAIL_STATE_ICON[] => {
  if ([FLOLDER.SENT].includes(folder)) {
    // 发件箱可以展示的图标
    const sendFidIcon: MAIL_STATE_ICON[] = [
      MAIL_STATE_ICON.PRIORITY,
      MAIL_STATE_ICON.RCPT_SUCCEED,
      MAIL_STATE_ICON.PARTIAL_RCPT_SUCCEED,
      MAIL_STATE_ICON.RCPT_FAILED,
      MAIL_STATE_ICON.WITHDRAW_SUCC,
      MAIL_STATE_ICON.PARTIAL_WITHDRAW_SUCC,
      MAIL_STATE_ICON.WITHDRAW_FAIL,
    ];
    return filterArr(iconList, sendFidIcon);
  } else if ([FLOLDER.DRAFT].includes(folder)) {
    const otherFidIcon: MAIL_STATE_ICON[] = [MAIL_STATE_ICON.PRIORITY];
    return filterArr(iconList, otherFidIcon);
  }
  // 其他
  const otherFidIcon: MAIL_STATE_ICON[] = [
    MAIL_STATE_ICON.PRIORITY,
    MAIL_STATE_ICON.SYSTEM,
    MAIL_STATE_ICON.UNREAD,
    MAIL_STATE_ICON.REPLAYED,
    MAIL_STATE_ICON.FORWARDED,
    MAIL_STATE_ICON.REPLAYED_AND_FORWARDED,
    MAIL_STATE_ICON.POPREAD,
    MAIL_STATE_ICON.SUSPICIOUS_MAIL,
  ];
  return filterArr(iconList, otherFidIcon);
};

/**
 * 依据接口状态返回值筛选图标
 * @param data 邮件Model
 * @param iconList 图标列表原始数据
 * @returns 筛选后的数据
 */
const filterIconListByMailState = (data: MailEntryModel, iconList: MAIL_STATE_ICON[]): MAIL_STATE_ICON[] => {
  const res = iconList.filter((icon: MAIL_STATE_ICON) => {
    return !!iconConfig[icon].show(data);
  });
  return res;
};

/**
 * 依据不同文件夹图标优先级排序
 * @param folder 邮件fid
 * @param iconList 图标列表原始数据
 * @returns 排序后的数据
 */
const sortIconListByPriority = (folder: number, iconList: MAIL_STATE_ICON[]): MAIL_STATE_ICON[] => {
  if ([FLOLDER.SENT].includes(folder)) {
    // 发件箱优先级
    const sendFilePriority: MAIL_STATE_ICON[] = [
      MAIL_STATE_ICON.PRIORITY,
      MAIL_STATE_ICON.WITHDRAW_FAIL,
      MAIL_STATE_ICON.PARTIAL_WITHDRAW_SUCC,
      MAIL_STATE_ICON.WITHDRAW_SUCC,
      MAIL_STATE_ICON.RCPT_FAILED,
      MAIL_STATE_ICON.PARTIAL_RCPT_SUCCEED,
      MAIL_STATE_ICON.RCPT_SUCCEED,
    ];
    return sortArr(iconList, sendFilePriority);
  }
  // 其他
  const otherFilePriority: MAIL_STATE_ICON[] = [
    MAIL_STATE_ICON.UNREAD,
    MAIL_STATE_ICON.SUSPICIOUS_MAIL,
    MAIL_STATE_ICON.PRIORITY,
    MAIL_STATE_ICON.SYSTEM,
    MAIL_STATE_ICON.REPLAYED_AND_FORWARDED,
    MAIL_STATE_ICON.REPLAYED,
    MAIL_STATE_ICON.FORWARDED,
    MAIL_STATE_ICON.POPREAD,
  ];
  return sortArr(iconList, otherFilePriority);
};

/**
 * 依据图标互斥关系筛选图标
 * @param iconList 图标列表原始数据
 * @returns 筛选后数据
 */
const filterIconByMutex = (iconList: MAIL_STATE_ICON[]): MAIL_STATE_ICON[] => {
  const _iconList = [...new Set(iconList)];
  const mutexconfig: MAIL_STATE_ICON[][] = [
    [
      MAIL_STATE_ICON.WITHDRAW_FAIL,
      MAIL_STATE_ICON.PARTIAL_WITHDRAW_SUCC,
      MAIL_STATE_ICON.WITHDRAW_SUCC,
      MAIL_STATE_ICON.RCPT_FAILED,
      MAIL_STATE_ICON.PARTIAL_RCPT_SUCCEED,
      MAIL_STATE_ICON.RCPT_SUCCEED,
    ],
    [MAIL_STATE_ICON.REPLAYED, MAIL_STATE_ICON.FORWARDED, MAIL_STATE_ICON.REPLAYED_AND_FORWARDED],
    [MAIL_STATE_ICON.PRIORITY, MAIL_STATE_ICON.SYSTEM],
  ];
  let isExist = false;
  mutexconfig.forEach(item => {
    isExist = false;
    item.forEach(_ => {
      if (_iconList.includes(_)) {
        if (isExist) {
          _iconList.splice(_iconList.indexOf(_), 1);
        } else {
          isExist = true;
        }
      }
    });
  });
  return _iconList;
};

/**
 * 依据不同文件夹图标最多展示个数截取
 * @param folder 邮件fid
 * @param iconList 图标列表原始数据
 * @returns 截取后的数据
 */
const filterIconListByMax = (folder: number, iconList: MAIL_STATE_ICON[]): MAIL_STATE_ICON[] => {
  if ([FLOLDER.SENT].includes(folder)) {
    return iconList.slice(0, 2);
  }
  // 其他
  return iconList.slice(0, 3);
};

/**
 * 依据UI稿展示先后顺序排序
 * @param folder 邮件fid
 * @param iconList 图标列表原始数据
 * @returns 排序后的数据
 */
const sortIconListByUi = (folder: number, iconList: MAIL_STATE_ICON[]): MAIL_STATE_ICON[] => {
  if ([FLOLDER.SENT].includes(folder)) {
    // 发件箱优先级
    const sendFileUi: MAIL_STATE_ICON[] = [
      MAIL_STATE_ICON.WITHDRAW_FAIL,
      MAIL_STATE_ICON.PARTIAL_WITHDRAW_SUCC,
      MAIL_STATE_ICON.WITHDRAW_SUCC,
      MAIL_STATE_ICON.RCPT_FAILED,
      MAIL_STATE_ICON.PARTIAL_RCPT_SUCCEED,
      MAIL_STATE_ICON.RCPT_SUCCEED,
      MAIL_STATE_ICON.PRIORITY,
    ];
    return sortArr(iconList, sendFileUi);
  }
  // 其他
  const otherFileUi: MAIL_STATE_ICON[] = [
    MAIL_STATE_ICON.UNREAD,
    MAIL_STATE_ICON.SUSPICIOUS_MAIL,
    MAIL_STATE_ICON.POPREAD,
    MAIL_STATE_ICON.PRIORITY,
    MAIL_STATE_ICON.SYSTEM,
    MAIL_STATE_ICON.REPLAYED,
    MAIL_STATE_ICON.FORWARDED,
    MAIL_STATE_ICON.REPLAYED_AND_FORWARDED,
  ];
  return sortArr(iconList, otherFileUi);
};

const rulesHandler = (data: MailEntryModel, iconList: MAIL_STATE_ICON[]): MAIL_STATE_ICON[] => {
  const { folder } = data.entry || {};
  // 依据文件夹筛选图标
  const fidRes = filterIconListByFid(folder, iconList);
  // 依据接口的状态返回值筛选图标
  const mailStateRes = filterIconListByMailState(data, fidRes);
  // 依据文件夹图标优先级排序
  const priorityRes = sortIconListByPriority(folder, mailStateRes);
  // 依据图标互斥关系筛选图标
  const mutexRes = filterIconByMutex(priorityRes);
  // 依据文件夹图标最多展示个数截取
  const maxRes = filterIconListByMax(folder, mutexRes);
  // 依据UI稿展示先后顺序排序
  const uiRes = sortIconListByUi(folder, maxRes);
  return uiRes;
};

const PriorityTag: React.FC<{ iconList: MAIL_STATE_ICON[]; active: boolean; mid: string; _account?: string }> = props => {
  const { iconList, active = false, mid, _account } = props;
  const shouldAutoReadMail = mailConfApi.getShouldAutoReadMailSync();
  const handleUnreadIconClick = (ev: React.MouseEvent) => {
    if (ev) {
      ev.preventDefault();
      ev.stopPropagation();
    }
    if (mid) {
      eventApi.sendSysEvent({
        eventName: 'mailStatesChanged',
        eventData: {
          mark: true,
          id: [mid],
          type: 'read',
        },
        _account: _account || '',
        eventStrData: 'read',
      });
    }
  };
  return (
    <>
      {iconList.map((icon: MAIL_STATE_ICON) => {
        const iconImg = iconConfig[icon].icon;
        const resEle = typeof iconImg === 'function' ? (iconImg as (active: boolean) => JSX.Element)(active) : iconImg;
        const iconTip = iconConfig[icon].tooltip;
        const isUnreadIconAndShouldAutoReadMail = icon === MAIL_STATE_ICON.UNREAD && !shouldAutoReadMail;
        return (
          <MyTooltip
            type={iconTip}
            key={icon}
            wrapClass={isUnreadIconAndShouldAutoReadMail ? 'mark-read-icon' : ''}
            handleIconClick={isUnreadIconAndShouldAutoReadMail ? handleUnreadIconClick : undefined}
          >
            {resEle}
          </MyTooltip>
        );
      })}
    </>
  );
};

export interface MailCardStateIconComProps {
  data: MailEntryModel;
  active: boolean;
}
const MailCardStateIcon: React.FC<MailCardStateIconComProps> = props => {
  const { data, active } = props;
  const allIconList: MAIL_STATE_ICON[] = Object.values(MAIL_STATE_ICON);
  const iconList = useMemo(() => rulesHandler(data, allIconList), [data]);
  return (
    <>
      <PriorityTag iconList={iconList} active={active} mid={data.entry.id} _account={data._account} />
    </>
  );
};
export default MailCardStateIcon;
