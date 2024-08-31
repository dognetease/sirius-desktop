import { getIn18Text } from 'api';
import { getPostEditable, SnsCalendarUiEvent } from '../utils';
import React, { useState } from 'react';
import moment from 'moment';
import { Button } from 'antd';
import classnames from 'classnames';
import Avatar from './Avatar';
import { TongyongCuowutishiMian, TongyongShuru } from '@sirius/icons';

import style from './calendarEventContent.module.scss';
import { Popover, Skeleton } from 'antd';
import { SnsCalendarEvent, SnsPostStatus } from 'api';
import { TongyongRili, TongyongShijianXian } from '@sirius/icons';
import PostPreview from './PostPreview';
import { PrivilegeCheck } from '@/components/UI/PrivilegeEnhance';

export interface SnsCalendarEventContentOptions {
  getContainer?: (triggerNode: HTMLElement) => HTMLElement;
  onEditPost?: (e: SnsCalendarEvent) => void;
}

export const SnsCalendarEventContent = (e: { event: SnsCalendarUiEvent }, options: SnsCalendarEventContentOptions) => {
  const renderPopOver = () => {
    return <PostContentPreview event={e.event.extendedProps} onEditPost={options.onEditPost} />;
  };
  const extendedProps = e.event.extendedProps;
  let postContent: string | React.ReactNode = extendedProps.postContent;
  if (!postContent) {
    if (extendedProps.postStatus === SnsPostStatus.GENERATING) {
      postContent = '正在生成...';
    } else if (extendedProps.postStatus === SnsPostStatus.FAILED_GENERATE) {
      postContent = (
        <span className={style.errorTip}>
          <TongyongCuowutishiMian />
          {getIn18Text('SHENGCHENGSHIBAI!')}
        </span>
      );
    }
  }

  return (
    <Popover placement="rightTop" content={renderPopOver} trigger="click" getPopupContainer={options.getContainer} zIndex={999} destroyTooltipOnHide>
      <div className={classnames(style.eventContentItem, extendedProps.platform)}>
        <Avatar size={24} platform={extendedProps.platform} avatar={extendedProps.accountAvatar} avatarBorderColor="#1A77F2" />
        <div className={style.eventContentSummary}>{postContent}</div>
        <div className={style.sendTime}>{moment(extendedProps.date).format('hh:mm')}</div>
      </div>
    </Popover>
  );
};

const PostContentPreview = ({ event, onEditPost }: { event: SnsCalendarEvent; onEditPost?: (e: SnsCalendarEvent) => void }) => {
  const isLoading = SnsPostStatus.GENERATING === event.postStatus;
  const titleText =
    event.postStatus === SnsPostStatus.GENERATING ? getIn18Text('ZHENGZAISHENGCHENGZHONG..') : event.taskName ? event.taskName : getIn18Text('SHOUDONGFATIE');
  const statusText = getStatusText(event.postStatus);
  const editable = getPostEditable(event.postStatus);

  const handleEditPost = () => {
    onEditPost && onEditPost(event);
  };

  return (
    <div className={style.postPreview}>
      <div className={style.header}>
        <div className={style.postTitle}>{titleText}</div>
        <div className={style.postMeta}>
          {statusText && <span className={classnames(style.postStatus, event.postStatus)}>{getStatusText(event.postStatus)}</span>}
          <div className={style.date}>
            <TongyongRili />
            {moment(event.date).format('YYYY-MM-DD')}
          </div>
          <div className={style.time}>
            <TongyongShijianXian />
            {moment(event.date).format('hh:mm')}
          </div>
        </div>
        <div className={style.creator}>
          {getIn18Text('CHUANGJIANREN：')}
          {event.creator}
        </div>
      </div>
      {isLoading && (
        <>
          <Skeleton paragraph={{ rows: 6 }} />
          <Skeleton.Image />
        </>
      )}
      {!isLoading && <PostPreview mode="mobile" postDbId={event.postDbId} className={style.calendarPostPreview} showSendTime={false} />}
      {!isLoading && editable && (
        <PrivilegeCheck resourceLabel="SOCIAL_MEDIA" accessLabel="OP">
          <Button icon={<TongyongShuru />} block onClick={handleEditPost}>
            {getIn18Text('BIANJITIEZI')}
          </Button>
        </PrivilegeCheck>
      )}
    </div>
  );
};

function getStatusText(status: SnsPostStatus) {
  switch (status) {
    case SnsPostStatus.PAUSE:
      return getIn18Text('YIZANTING');
    case SnsPostStatus.WAITING:
    case SnsPostStatus.PENDING:
      return getIn18Text('DAIFABU');
    case SnsPostStatus.SUCCEED:
      return getIn18Text('YIFASONG');
    case SnsPostStatus.EXPIRES:
      return getIn18Text('YIGUOQI');
    default:
      return '';
  }
}
