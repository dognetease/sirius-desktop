/**
 *  邮件卡片
 */
import { apiHolder, apis, DataTrackerApi, MailConfApi as MailConfApiType, ProductAuthApi, SystemApi } from 'api';
import React, { useMemo, useState } from 'react';
import { FLOLDER, TASK_MAIL_STATUS } from '../../../constant';
import { MailCardComProps } from '../../../../types';
import {
  defaultComAvatar,
  defaultComStatus,
  defaultComSummary,
  defaultComSummaryExtra,
  defaultComSummaryPreExtra,
  defaultComSummaryTask,
  defaultComTime,
  defaultDesc,
  defaultFromFlagAfter,
  defaultSender,
  defaultSendReadStatus,
  defaultTag,
  defaultTaskDeadLine,
  receiverComAvatar,
  defaultCustomerLabelAfter,
} from './defaultComs';
import { defaultComAttachment } from './DefaultAttachment';
import './MailCard.scss';
import IconCard from '@web-common/components/UI/IconCard';
import ReadListIcons from '@web-common/components/UI/Icons/svgs/ReadListSvgs';
import { Checkbox, Tooltip } from 'antd';

import ontimeIcon from '@/images/icons/todomail/ontime.svg';
import timeoutIcon from '@/images/icons/todomail/timeout.svg';
import MailCardStateIcon from './MailCardStateIcon';
import { getVisibleStructHeight } from '@web-mail/utils/mailCardUtil';
import { getIn18Text } from 'api';

const systemApi = apiHolder.api.getSystemApi() as SystemApi;
const mailConfApi = apiHolder.api.requireLogicalApi(apis.mailConfApiImpl) as MailConfApiType;
// const productAuthApi = apiHolder.api.requireLogicalApi(apis.productAuthApiImpl) as ProductAuthApi;
const trackApi = apiHolder.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;

// 获取可展示的参数
// eslint-disable-next-line max-len
const getComponent = (props: MailCardComProps, DefaultCom: React.FC<MailCardComProps> | null, Com?: React.FC<MailCardComProps> | null) =>
  Com != null ? <Com {...props} /> : DefaultCom != null ? <DefaultCom {...props} /> : null;

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
    summaryTask,
    attachments,
    status,
    tag,
    summaryPreExtra,
    sendReadStatus,
    onChecked,
    // 当前列表是否是多选状态
    isMultiple,
    // 是否显示checkbox
    showCheckbox = false,
    // 是否支持hover显示checkbox功能
    hoverCheckbox = false,
    showAvator = true,
    forceShowAttachment = false,
  } = props;
  const {
    isThread,
    isTpMail,
    entry: { readStatus, eTeamType, attachment, folder, isDefer, deferTime, memo, id },
  } = data;
  const key2Heigt = getVisibleStructHeight(data, forceShowAttachment);
  const isRead = readStatus === 'read';
  const isDraft = folder === FLOLDER.DRAFT;
  // 发件箱
  const isSent = folder === FLOLDER.SENT;
  // 获取可显示的组件，当props传递对应组件的时候则覆盖
  let comAvatar = getComponent(props, defaultComAvatar, avatar);
  // 发件箱展示收件人头像
  if (isSent && data?.receiver?.length > 0) {
    comAvatar = getComponent(props, receiverComAvatar, avatar);
  }
  const comDesc = getComponent(props, defaultDesc, desc);
  const comFrom = getComponent(props, defaultSender, from);
  const comFromFlagAfter = getComponent(props, defaultFromFlagAfter, fromFlagAfter);
  const comCustomerLabelAfter = getComponent(props, defaultCustomerLabelAfter, customerLabelAfter);
  const comTaskDeadLine = getComponent(props, defaultTaskDeadLine, deadLine);
  const comTime = getComponent(props, defaultComTime, time);
  const comSummary = getComponent(props, defaultComSummary, summary);
  const comSummaryTask = getComponent(props, defaultComSummaryTask, summaryTask);
  const comSummaryExtra = getComponent(props, defaultComSummaryExtra, summaryExtra);
  const comSummaryPreExtra = getComponent(props, defaultComSummaryPreExtra, summaryPreExtra);
  const comAttachments = getComponent(props, defaultComAttachment, attachments);
  const comStatus = getComponent(props, defaultComStatus, status);
  const comTag = getComponent(props, defaultTag, tag);
  const comSendReadStatus = getComponent(props, defaultSendReadStatus, sendReadStatus);

  // 邮件待办是否逾期
  const isOverdue = useMemo(() => {
    return moment(deferTime, 'YYYY-MM-DD HH:mm:ss').valueOf() < moment().valueOf();
  }, [deferTime]);
  // 附件icon
  const attachmentList = attachment?.filter(item => !item.inlined && item.fileType !== 'ics' && item.type !== 'netfolder');
  // 是否展示附件icon
  const showAttachmentIcon = attachmentList && attachmentList.length && !mailConfApi.getMailShowAttachment();
  // 进行中的任务邮件, 禁用选中
  const cardCheckboxDisabled = data?.taskInfo?.status === TASK_MAIL_STATUS.PROCESSING;
  // const cardCheckboxDisabled = data?.taskId;
  const layoutClassName = `layout1`; // 此处没有必要再获取布局了，因为肯定是左右布局才会使用此组件
  const tightnessClassName = `tightness${mailConfApi.getMailListTightness()}`;
  // 是否外贸环境

  return (
    <div className={`mail-card-wrap ${className} ${tightnessClassName}`} data-test-id={`mail-list-card`}>
      <div className={`mail-list-item ${active ? 'active' : ''}`}>
        <div className={`avatar-wrap-out ${showCheckbox && hoverCheckbox ? 'avatar-wrap-hover' : ''} ${isMultiple && showCheckbox ? 'avatar-wrap-showbox' : ''}`}>
          <div
            className="avatar-wrap"
            style={{
              height: showAvator ? '32px' : '16px',
              width: showAvator && hoverCheckbox ? '32px' : 'auto',
              marginRight: showAvator ? '8px' : '8px',
              marginLeft: hoverCheckbox ? '12px' : '12px',
            }}
          >
            {showCheckbox ? (
              cardCheckboxDisabled ? (
                <Tooltip title={getIn18Text('RENWUYOUJIANBU')} autoAdjustOverflow>
                  <Checkbox
                    data-test-id="mail-list-card-checkbox"
                    style={{ marginRight: showAvator ? '3px' : '0px' }}
                    className="avatar-checkbox"
                    checked={checked}
                    disabled={true}
                    onClick={e => {
                      e.stopPropagation();
                      // 临时解决 快捷焦点协调问题
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
                </Tooltip>
              ) : (
                <Checkbox
                  data-test-id="mail-list-card-checkbox"
                  style={{ marginRight: showAvator ? '3px' : '0px' }}
                  className="avatar-checkbox"
                  checked={checked}
                  onClick={e => {
                    // 临时解决 快捷焦点协调问题
                    try {
                      const element: HTMLElement | null = document.querySelector('#mailboxhotkey');
                      if (element) {
                        element.focus();
                      }
                    } catch (e) {
                      console.error('[error]: mailCard $focus error');
                    }
                    e.stopPropagation();
                    onChecked && onChecked(!checked);
                    trackApi.track('pcMail_click_checkbox');
                  }}
                />
              )
            ) : null}
            {showAvator && comAvatar}
          </div>
        </div>
        <div className="content-warp">
          <div className="from-wrap">
            <div className="from-name-wrap">
              <div className="from-flag-warp">
                <MailCardStateIcon data={data} active />
              </div>
              <div className={`from-name ${isRead || isDraft || isTpMail ? '' : 'font-active'} ${layoutClassName}`} data-test-id="mail-list-card-reacive">
                {comFrom}
              </div>
              <div className="from-flag-after-wrap">{comFromFlagAfter}</div>
              {process.env.BUILD_ISEDM ? <div className="from-flag-after-wrap from-customer-label-after-wrap">{comCustomerLabelAfter}</div> : null}
            </div>
            <div className="time" data-test-id="mail-list-card-receive-time">
              {comTime}
            </div>
          </div>
          <div className="summary-warp">
            {comSummaryPreExtra}
            {/* 任务 */}
            {comSummaryTask}
            {/** TODO 如果未读需要加粗 */}
            <div className={`summary ${!isRead && !isTpMail ? 'unread-summary' : ''}`} data-test-id="mail-list-card-summary">
              {comSummary}
            </div>
            <div className="summary-extra-warp">
              {comSummaryExtra}
              {/* 有无讨论组 */}
              {eTeamType === 1 && (
                <span style={{ marginLeft: '3px', height: '16px' }}>
                  <IconCard type="chat" />
                </span>
              )}
              {/* 标签icon */}
              {/* {comTag} */}
              {/* 邮件备注 */}
              {memo && !isThread && (
                <span style={{ marginLeft: '3px', marginTop: '2px' }}>
                  <Tooltip
                    title={() => {
                      return <div className="mail-card-comment-tooltip">{memo}</div>;
                    }}
                  >
                    <IconCard type="mailComment" />
                  </Tooltip>
                </span>
              )}
              {/* 邮件待办 */}
              {isDefer && !isThread ? <img src={isOverdue ? timeoutIcon : ontimeIcon} width="14" height="14" style={{ marginLeft: '3px' }} /> : null}
              {/* 附件icon */}
              {showAttachmentIcon ? (
                <span className="dark-svg-invert" style={{ marginLeft: '3px', height: '16px' }}>
                  <ReadListIcons.AttachSvg color="#37435C" />
                </span>
              ) : (
                <></>
              )}
            </div>
          </div>
          {key2Heigt.desc ? (
            <div className="desc-wrap">
              <div className="desc" data-test-id="mail-list-card-desc">
                {comDesc}
              </div>
              {/* 标签改为icon展示 */}
              <div className="mail-tag-warp">{comTag}</div>
            </div>
          ) : (
            ''
          )}
          {key2Heigt.attachments ? <div className="attachments-warp">{comAttachments}</div> : ''}
          {/* 位置调整到附件下面 */}
          {key2Heigt.taskDeadline ? <div className="deadline-warp">{comTaskDeadLine}</div> : ''}
          {key2Heigt.sendStatus ? <div className="status-wrap">{comStatus}</div> : ''}

          {key2Heigt.readStatus ? <div className="status-wrap">{comSendReadStatus}</div> : ''}
        </div>
      </div>
    </div>
  );
};
export default MailCard;
