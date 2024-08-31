/**
 *  邮件卡片
 */
import { MailEntryModel, MailFileAttachModel, apiHolder, SystemApi, apis, MailConfApi as MailConfApiType, ProductAuthApi, DataTrackerApi, AccountApi } from 'api';
import React, { useMemo } from 'react';
import { FLOLDER, TASK_MAIL_STATUS } from '../../../constant';
import { MailCardComProps, stringMap } from '../../../../types';
import {
  defaultComAvatar,
  defaultDesc,
  defaultSender,
  defaultFromFlagAfter,
  defaultTaskDeadLine,
  defaultComTime,
  defaultCardLongComSummary,
  defaultComSummaryPreExtra,
  defaultComSummaryExtra,
  defaultComStatus,
  // defaultTag,
  defaultAllTag,
  defaultSendReadStatus,
  defaultComSummaryTask,
  receiverComAvatar,
  defaultCustomerLabelAfter,
} from './defaultComs';
import { defaultComAttachmentLong } from './DefaultAttachment';
import './MailCard.scss';
import IconCard from '@web-common/components/UI/IconCard';
import ReadListIcons from '@web-common/components/UI/Icons/svgs/ReadListSvgs';
import { Checkbox } from 'antd';
// import { isMainAccount } from '@web-mail/util';

import ontimeIcon from '@/images/icons/todomail/ontime.svg';
import timeoutIcon from '@/images/icons/todomail/timeout.svg';
import { Tooltip } from 'antd';
import MailCardStateIcon from './MailCardStateIcon';
import { getIn18Text } from 'api';
import moment from 'moment';

const systemApi = apiHolder.api.getSystemApi() as SystemApi;
const productAuthApi = apiHolder.api.requireLogicalApi(apis.productAuthApiImpl) as ProductAuthApi;
const mailConfApi = apiHolder.api.requireLogicalApi(apis.mailConfApiImpl) as MailConfApiType;
const trackApi = apiHolder.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;
const accountApi = apiHolder.api.requireLogicalApi(apis.accountApiImpl) as AccountApi;

// 获取可展示的参数
// eslint-disable-next-line max-len
const getComponent = (props: MailCardComProps, DefaultCom: React.FC<MailCardComProps> | null, Com?: React.FC<MailCardComProps> | null) =>
  Com != null ? <Com {...props} /> : DefaultCom != null ? <DefaultCom {...props} /> : null;

// 卡片结构的静态高度,原来的高度映射表
// const structHeightMap = {
//   from: 27,
//   summary: 26,
//   desc: 20,
//   // 以下为可变行的高度
//   attachments: 30,
//   sendStatus: 24,
//   readStatus: 24,
//   taskDeadline: 20
// };
// 卡片结构的高度：宽松
const structHeightMap1 = {
  from: 32, // 32
  summary: 32, // 32
  desc: 32, // 32
  // 以下为可变行的高度
  attachments: 28,
  // UI确认
  sendStatus: 24,
  readStatus: 24,
  taskDeadline: 20,
};
// 卡片结构的高度：适中
const structHeightMap2 = {
  from: 32, // 32
  summary: 32, // 32
  desc: 32, // 32
  // 以下为可变行的高度
  attachments: 28,
  // UI确认
  sendStatus: 24,
  readStatus: 24,
  taskDeadline: 20,
};
// 卡片结构的高度：紧凑
const structHeightMap3 = {
  from: 32, // 32
  summary: 32, // 32
  desc: 32, // 32
  // 以下为可变行的高度
  attachments: 24, // 紧凑：附件-4
  // UI确认
  sendStatus: 24,
  readStatus: 24,
  taskDeadline: 20,
};
// 新的高度映射表，数组结构
const structHeightMap = [structHeightMap1, structHeightMap2, structHeightMap3];

// 卡片结构的显示策略
const getVisibleStructHeight = (data: MailEntryModel, forceShowAttachment?: boolean): stringMap => {
  const isCorpMail = systemApi.getIsCorpMailMode();
  const isFree = productAuthApi.doGetProductVersionId() === 'free';
  const isSirius = productAuthApi.doGetProductVersionId() === 'sirius';
  const isOther = productAuthApi.doGetProductVersionId() !== 'free' && productAuthApi.doGetProductVersionId() !== 'sirius';
  const tightness = mailConfApi.getMailListTightness();
  const dayLimit = mailConfApi.getMailDayLimit();
  const { from, summary, desc, attachments, sendStatus, readStatus, taskDeadline } = structHeightMap[+tightness - 1];
  // const isMainAcc = isMainAccount(data?._account);
  // 固定显示的部分
  const res: stringMap = {
    from,
    summary,
    desc,
  };
  // 判断是否显示附件行
  if (data && data.entry.attachment?.length) {
    let attachment: MailFileAttachModel[] = [];
    attachment = data.entry.attachment?.filter(item => item.inlined === false && item.fileType !== 'ics' && item.type !== 'netfolder');
    if (attachment.length) {
      res.attachments = attachments;
    }
  }
  // 判断是否显示发送状态行
  if (!isCorpMail && data && data.entry.sendStatus) {
    res.sendStatus = sendStatus;
  }
  // 是否显示已读状态
  const accountAlias = systemApi.getCurrentUser(data?._account)?.prop?.accountAlias || [];
  const accountAliasArray = Array.isArray(accountAlias) ? accountAlias : [accountAlias];
  const senderEmail = data?.sender?.contact?.contact?.accountName || '';
  // 在发件箱 || 别名邮箱里面包含发件人 || 发件人 == 归属账号， 认为是自己发出的
  const isSend =
    data?.entry?.folder === FLOLDER.SENT ||
    accountAliasArray.some(account => accountApi.getIsSameSubAccountSync(account, senderEmail)) ||
    accountApi.getIsSameSubAccountSync(senderEmail, data._account);
  const dateArr = data.entry.sendTime?.trim()?.split(/\s+/);
  let isBeforeday = false; // 发送时间超过30天的
  if (!data.entry?.sendTime || !dateArr || dateArr?.length < 2) {
    isBeforeday = true; // 取不到时间默认超过30天，不展示
  } else {
    const utcStr = dateArr[0] + 'T' + dateArr[1] + '+08:00';
    const sendValue = moment(utcStr);
    if (moment().add(-dayLimit.thirdDayLimit, 'day').isAfter(sendValue, 'day')) {
      isBeforeday = true;
    } else {
      isBeforeday = false;
    }
  }
  // 展示打开记录，是三方账号的发信并且没有超过30天
  const showOpenRecord = data.authAccountType && data.authAccountType !== '0' && !isBeforeday;
  if (
    !isCorpMail &&
    // (isMainAcc || data?.emailType === 'NeteaseQiYeMail') &&
    !isFree &&
    data &&
    isSend &&
    !data.taskId &&
    // 尊享版 看 已读数， 旗舰版 看 域内数量
    ((isSirius && (data.entry.rcptCount || data.entry.readCount)) || (isOther && (data.entry.rcptCount || data.entry.innerRead)) || showOpenRecord)
  ) {
    res.readStatus = readStatus;
  }
  // task的截止时间占位
  if (!isCorpMail && data && data.taskId && data.taskInfo) {
    // 如果是置顶 或者任务列表中的任务邮件时
    res.taskDeadline = taskDeadline;
    res.desc = null;
  }
  const showDesc = mailConfApi.getMailShowDesc();
  const showAttachment = forceShowAttachment || mailConfApi.getMailShowAttachment();
  if (!showDesc) {
    res.desc = null;
  }
  if (!showAttachment) {
    res.attachments = null;
  }
  return res;
};

// 根据文本，字体，获取文本的宽度
// const getTextWidth = (text: string, font?: string): number => {
//     var canvas = getTextWidth.canvas || (getTextWidth.canvas = document.createElement("canvas"));
//     var context = canvas.getContext("2d");
//     context.font = font || '12px 苹方-简,sans-serif'; // 默认主题的css样式
//     // 不需要在画布上输出就可以计算文字的宽度
//     var metrics = context.measureText(text);
//     return metrics.width;
// }

const MailCard: React.FC<MailCardComProps> = props => {
  const {
    data,
    active = false,
    // 卡片上的checkbox是否选中
    checked = false,
    className = '',
    // 自定义结构
    avatar,
    desc,
    from,
    fromFlagAfter,
    customerLabelAfter,
    deadLine,
    time,
    summary,
    summaryExtra,
    attachments,
    status,
    tag,
    summaryPreExtra,
    sendReadStatus,
    onChecked,
    // 当前列表是否是多选状态
    isMultiple,
    // 列表是否展示头像
    showAvator = true,
    // 是否显示checkbox功能
    showCheckbox = false,
    // 是否需要hover才展示checkbox
    hoverCheckbox = false,
    forceShowAttachment = false,
    // 卡片的宽度
    width,
  } = props;
  const {
    isThread,
    isTpMail,
    entry: { readStatus, eTeamType, attachment, folder, title, brief, isDefer, deferTime, memo },
  } = data;
  const key2Heigt = getVisibleStructHeight(data, forceShowAttachment);
  const isRead = readStatus === 'read';
  const isDraft = folder === FLOLDER.DRAFT;
  const isSent = folder === FLOLDER.SENT;
  // 获取可显示的组件，当props传递对应组件的时候则覆盖
  const tightness = mailConfApi.getMailListTightness();
  const avatorSize = +tightness === 3 ? 20 : +tightness === 2 ? 28 : 32;
  let comAvatar = getComponent({ ...props, size: avatorSize }, defaultComAvatar, avatar);
  // 发件箱展示收件人头像
  if (isSent && data?.receiver?.length > 0) {
    comAvatar = getComponent({ ...props, size: avatorSize }, receiverComAvatar, avatar);
  }
  const comDesc = getComponent(props, defaultDesc, desc);
  const comFrom = getComponent(props, defaultSender, from);
  const comFromFlagAfter = getComponent(props, defaultFromFlagAfter, fromFlagAfter);
  const comCustomerLabelAfter = getComponent(props, defaultCustomerLabelAfter, customerLabelAfter);
  const comTaskDeadLine = getComponent(props, defaultTaskDeadLine, deadLine);

  const comTime = getComponent(props, defaultComTime, time);
  const comSummary = getComponent(props, defaultCardLongComSummary, summary);
  const comSummaryTask = getComponent(props, defaultComSummaryTask, summary);
  const comSummaryExtra = getComponent(props, defaultComSummaryExtra, summaryExtra);
  const comSummaryPreExtra = getComponent(props, defaultComSummaryPreExtra, summaryPreExtra);
  const comAttachments = getComponent(props, defaultComAttachmentLong, attachments);
  const comStatus = getComponent(props, defaultComStatus, status);
  const comTag = getComponent(props, defaultAllTag, tag);
  const comSendReadStatus = getComponent(props, defaultSendReadStatus, sendReadStatus);
  // 附件icon
  const attachmentList = attachment?.filter(item => !item.inlined && item.fileType !== 'ics' && item.type !== 'netfolder');
  // 是否展示附件icon
  const showAttachmentIcon = attachmentList && attachmentList.length && !mailConfApi.getMailShowAttachment();
  // 邮件待办是否逾期
  const isOverdue = useMemo(() => {
    return moment(deferTime, 'YYYY-MM-DD HH:mm:ss').valueOf() < moment().valueOf();
  }, [deferTime]);

  // const summaryRef = useRef(null);
  // const [summaryWidth, setSummaryWidth] = useState(0);
  // 渲染主题和摘要,支持tooltip
  // const renderSummaryAndDesc = () => {
  //   // 主题宽度
  //   const summaryStrWidth = getTextWidth(`${title || '无主题'}`);
  //   // 摘要宽度
  //   const emptyBriefReg = /^\s*$/;
  //   let briefStr = (!brief || emptyBriefReg.test(brief)) ? '（无文字内容）' : brief;
  //   const descWidth = getTextWidth(briefStr);
  //   const summaryTotalWidth = summaryStrWidth + descWidth + 15; // 15是-占据的宽度
  //   const tooltipTitle = Boolean(key2Heigt.desc) ? `${title || '无主题'} - ${briefStr}` : `${title || '无主题'}`;
  //   return (<>
  //     {title ? <span dangerouslySetInnerHTML={{ __html: title }} /> : <span>无主题</span>}
  //     {Boolean(key2Heigt.desc) && <span className="desc-text"> - <span dangerouslySetInnerHTML={{ __html: briefStr}} /></span>}
  //     {/* Tooltip热区 */}
  //     { summaryTotalWidth > summaryWidth && (
  //       <Tooltip title={tooltipTitle.length > 100 ? tooltipTitle.substring(0, 100) : tooltipTitle} trigger={['hover']} placement="bottomRight" autoAdjustOverflow>
  //           <span style={{ position: 'absolute', width: '20px', height: '20px', right: 0 }}></span>
  //       </Tooltip>
  //     )}
  //   </>)
  // }

  // useEffect(() => {
  //   if (summaryRef.current?.offsetWidth) {
  //     setSummaryWidth(summaryRef.current?.offsetWidth)
  //   }
  // }, [])
  // 进行中的任务邮件, 禁用选中
  const cardCheckboxDisabled = data?.taskInfo?.status === TASK_MAIL_STATUS.PROCESSING;
  // const cardCheckboxDisabled = data?.taskId;
  // 是否外贸环境
  const inEdm = systemApi.inEdm();
  // 通栏渲染卡片

  const renderLongCard = () => (
    <div className={`mail-list-item mail-list-item-long ${active ? 'active' : ''}`}>
      <div className={`avatar-wrap-out ${showCheckbox && hoverCheckbox ? 'avatar-wrap-hover' : ''} ${isMultiple && showCheckbox ? 'avatar-wrap-showbox' : ''}`}>
        <div className="avatar-wrap">
          {cardCheckboxDisabled ? (
            <Tooltip title={getIn18Text('RENWUYOUJIANBU')} autoAdjustOverflow>
              {showCheckbox && (
                <Checkbox
                  style={{ marginRight: showAvator ? '7px' : '0px' }}
                  className="avatar-checkbox"
                  checked={checked}
                  disabled={true}
                  onClick={e => {
                    e.stopPropagation();
                    try {
                      const element: HTMLElement | null = document.querySelector('#mailboxhotkey');
                      if (element) {
                        element.focus();
                      }
                    } catch (e) {
                      console.error('[error]: mailCard $focus error');
                    }
                    onChecked && onChecked(!checked);
                    trackApi.track('pcMail_click_checkbox');
                  }}
                />
              )}
            </Tooltip>
          ) : (
            <Checkbox
              style={{ marginRight: showAvator ? '7px' : '0px' }}
              className="avatar-checkbox"
              checked={checked}
              onClick={e => {
                e.stopPropagation();
                try {
                  const element: HTMLElement | null = document.querySelector('#mailboxhotkey');
                  if (element) {
                    element.focus();
                  }
                } catch (e) {
                  console.error('[error]: mailCard $focus error');
                }
                onChecked && onChecked(!checked);
                trackApi.track('pcMail_click_checkbox');
              }}
            />
          )}
          {showAvator && comAvatar}
        </div>
        <div className="from-wrap" style={{ width: inEdm ? '212px' : '172px' }}>
          <div className="from-name-wrap">
            <div className="from-flag-warp">
              <MailCardStateIcon data={data} active />
            </div>
            <div className={`from-name ${isRead || isDraft || isTpMail ? '' : 'font-active'}`}>{comFrom}</div>
            <div className="from-flag-after-wrap">{comFromFlagAfter}</div>
            {process.env.BUILD_ISEDM ? <div className="from-flag-after-wrap">{comCustomerLabelAfter}</div> : null}
          </div>
        </div>
      </div>

      {/* 红旗 */}
      <div className="flag-wrap">{comSummaryExtra}</div>
      <div className="content-warp">
        <div className="summary-warp">
          {comSummaryPreExtra}
          {/* 任务 */}
          {comSummaryTask}
          <div className="summary" style={{ fontWeight: isRead || isDraft ? '400' : 'bolder' }}>
            {/* 主题 */}
            {comSummary}
            {/* 摘要 */}
            {key2Heigt.desc && !!data.entry?.brief && !!data.entry?.brief.trim() ? <span className="desc-text">&nbsp;-&nbsp;{comDesc}</span> : ''}
            {/* 标签icon */}
            {comTag}
            {/* {renderSummaryAndDesc()} */}
          </div>
          <div className="summary-extra-warp">
            {/* 有无讨论组 */}
            {eTeamType === 1 && (
              <span style={{ marginLeft: '10px', height: '16px', display: 'flex' }}>
                <IconCard style={{ marginLeft: '4px' }} type="chat" />
              </span>
            )}
            {/* 邮件备注 */}
            {memo && !isThread && (
              <Tooltip
                title={() => {
                  return <div className="mail-card-comment-tooltip">{memo}</div>;
                }}
              >
                <IconCard type="mailComment" />
              </Tooltip>
            )}
            {/* 附件icon */}
            {showAttachmentIcon ? (
              <span className="dark-svg-invert" style={{ marginLeft: '7px', height: '16px', display: 'flex' }}>
                <ReadListIcons.AttachSvg color="#37435C" />
              </span>
            ) : (
              <></>
            )}
            {/* 任务截止时间和头像 */}
            {key2Heigt.taskDeadline ? <div className="deadline-warp">{comTaskDeadLine}</div> : ''}
            {/* 邮件待办 */}
            {isDefer && !isThread ? <img src={isOverdue ? timeoutIcon : ontimeIcon} width="14" height="14" style={{ marginLeft: '10px' }} /> : null}
          </div>
        </div>
        {key2Heigt.attachments ? <div className="attachments-warp long-attachments-warp">{comAttachments}</div> : ''}
        {key2Heigt.sendStatus ? <div className="status-wrap">{comStatus}</div> : ''}
        {key2Heigt.readStatus ? <div className="status-wrap">{comSendReadStatus}</div> : ''}
      </div>
      <div className="time">{comTime}</div>
    </div>
  );
  const tightnessClassName = `tightness${tightness}`;
  return (
    <div className={`mail-card-wrap ${className} ${tightnessClassName}`} style={{ marginLeft: '16px' }}>
      {renderLongCard()}
    </div>
  );
};
// 卡片的计算
export const getCardHeight = (data: MailEntryModel, forceShowAttachment?: boolean): number => {
  if (data) {
    // 边距等基础高度，宽松16，适中8，紧凑0
    let baseHeight = 0;
    const tightness = mailConfApi.getMailListTightness();
    if (+tightness === 1) {
      baseHeight = 16;
    } else if (+tightness === 2) {
      baseHeight = 8;
    } else if (+tightness === 3) {
      baseHeight = 0;
    }
    let sumHeight = baseHeight;
    // 根据显示策略获取高度
    const heightMap = getVisibleStructHeight(data, forceShowAttachment);
    // Object.values(heightMap).forEach(height => {
    //   sumHeight += height;
    // });
    // 通栏存在很多内容同一行，不能简单相加
    const keys = Object.keys(heightMap);
    // 第一行
    if (keys.includes('from') || keys.includes('desc') || keys.includes('summary')) {
      sumHeight += heightMap.from;
    }
    // 第二行,附件
    sumHeight += heightMap.attachments || 0;
    // 剩余
    sumHeight += heightMap.sendStatus || 0;
    sumHeight += heightMap.readStatus || 0;
    return sumHeight > 32 ? sumHeight : 32;
  }
  return 0;
};
export default MailCard;
