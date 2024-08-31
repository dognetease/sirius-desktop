import React, { ReactNode, useState, useEffect, useCallback } from 'react';
import { Button } from 'antd';
import { ReactComponent as CloseIcon } from '@/images/icons/disk/notification_close.svg';
import { ReactComponent as NoticeBgIcon } from '@/images/icons/disk/notification_notice_bg.svg';
import { useAppSelector } from '@web-common/state/createStore';
import styles from './index.module.scss';
import { Like } from './like';

import { ContentItem, ContentItemType, FooterActionType, NotificationConfigV1 } from './types';
import { apiHolder, apis, NetStorageApi, ResponseGetAnnouncement, DataTrackerApi, AnnouncementOperateTypeEnum } from 'api';
import Feature from '@/images/disk/notification-feature.png';
import Notice from '@/images/disk/notification-notice.png';
import Tips from '@/images/disk/notification-tips.png';
import { DiskTipKeyEnum } from '../../disk';

const trackerApi = apiHolder.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;
const diskApi = apiHolder.api.requireLogicalApi(apis.netStorageImpl) as NetStorageApi;
const NOTIFICATION_EVENT_ID = 'pcDisk_popover';
enum NotificationOperaType {
  Show = 'Show', // 弹窗展示
  ClickLink = 'clickLink', // 点链接
  ClickImage = 'clickImage', // 点图片
  ClickClose = 'clickClose', // 点关闭
  ClickButton = 'clickButton', // 点按钮
  ClickLike = 'clickLike', // 点赞
}

function renderContent(list: ContentItem[], category: string, popoverID: number): ReactNode {
  return list.map(item => {
    switch (item.type) {
      case ContentItemType.Text:
        return (
          <div key={item.id} className={styles['notification__content_item']}>
            {item.text}
          </div>
        );
      case ContentItemType.Link:
        return (
          <div key={item.id} className={styles['notification__content_item']}>
            <a
              href={item.href}
              target="_blank"
              onClick={() => {
                trackerApi.track(NOTIFICATION_EVENT_ID, {
                  operaType: NotificationOperaType.ClickLink,
                  category,
                  popoverID,
                  link: item.href,
                });
                diskApi.operateAnnouncement({
                  announcementId: popoverID,
                  operateType: AnnouncementOperateTypeEnum.CLICK_LINK,
                });
              }}
            >
              {item.text}
            </a>
          </div>
        );
      case ContentItemType.Image: {
        let img = (
          // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
          <img
            className={styles['notification__image']}
            src={item.src}
            alt={item.alt}
            onClick={() => {
              trackerApi.track(NOTIFICATION_EVENT_ID, {
                operaType: NotificationOperaType.ClickImage,
                category,
                popoverID,
              });
            }}
          />
        );
        if (item.href) {
          img = (
            <a href={item.href} target="_blank">
              {img}
            </a>
          );
        }
        return (
          <div key={item.id} className={styles['notification__content-centerItem']}>
            {img}
          </div>
        );
      }
      default:
        return null;
    }
  });
}

interface Props {}

const getNotificationIcon = (priority: number) => {
  switch (priority) {
    case 100:
    case 200:
      return Feature;
    case 300:
      return Notice;
    case 1000:
    default:
      return Tips;
  }
};

export function Notification(props: Props) {
  const guideTipsInfo = useAppSelector(state => state.diskReducer.guideTipsInfo);
  const [visible, setVisible] = useState(false);
  const [isWelcomeTipVisiable, setIsWelcomeTipVisiable] = useState(false);
  const [announcement, setAnnouncement] = useState<ResponseGetAnnouncement | null>(null);

  const [liked, setLiked] = useState(false);

  const announcementId = announcement?.id ?? 0;
  const category = announcement?.type;

  useEffect(() => {
    // TODO: 对运营通知窗口做个弹窗限制，要求在新手弹窗之后。后续梳理下涉及弹窗的地方，统一做个弹窗优先级的逻辑处理
    setIsWelcomeTipVisiable(guideTipsInfo[DiskTipKeyEnum.WELCOME_TIP].visiable);
  }, [guideTipsInfo]);

  useEffect(() => {
    if (announcement && !isWelcomeTipVisiable) {
      setVisible(true);
    }
  }, [isWelcomeTipVisiable, announcement]);

  useEffect(() => {
    window.showDiskNps = visible;
  }, [visible]);

  useEffect(() => {
    diskApi
      .getAnnouncement({
        clientType: 'DESK_TOP',
        clientVersion: window.siriusVersion,
        target: 'LIST',
      })
      .then(res => {
        // nps场景走nps组件
        if (!res || ['nps_score', 'nps_yes_or_no'].includes(res?.type)) return;
        setAnnouncement(res);
      });
  }, []);

  useEffect(() => {
    if (!announcement) {
      return;
    }
    trackerApi.track(NOTIFICATION_EVENT_ID, {
      operaType: NotificationOperaType.Show,
      category,
      popoverID: announcementId,
    });
  }, [announcement]);

  const close = useCallback(() => {
    setVisible(false);
    setAnnouncement(null);
  }, []);

  const handleLikedClick = useCallback(() => {
    if (liked) return;
    setLiked(true);
    setTimeout(() => {
      setVisible(false);
      setAnnouncement(null);
    }, 1000);

    diskApi.feedBackNps({
      announcementId,
      feedBack: JSON.stringify({ like: true }),
    });

    trackerApi.track(NOTIFICATION_EVENT_ID, {
      operaType: NotificationOperaType.ClickLike,
      category,
      popoverID: announcementId,
    });
  }, [announcement, liked]);

  if (!visible) return null;

  if (!announcement) return null;

  const config: NotificationConfigV1 = JSON.parse(announcement.content);

  if (config.version !== 1) return null;

  const { title, closable, priority, contentItemList, footerActionType, footerButtonText, footerButtonHref } = config.payload;

  let footer = null as ReactNode;
  switch (footerActionType) {
    case FooterActionType.ACK:
      footer = (
        <div style={{ textAlign: 'right' }}>
          <Button
            type="primary"
            onClick={() => {
              close();
              trackerApi.track(NOTIFICATION_EVENT_ID, {
                operaType: NotificationOperaType.ClickButton,
                category,
                popoverID: announcementId,
              });
              diskApi.operateAnnouncement({
                announcementId,
                operateType: AnnouncementOperateTypeEnum.SEEN,
              });
            }}
          >
            {footerButtonText}
          </Button>
        </div>
      );
      break;
    case FooterActionType.Link:
      footer = (
        <div style={{ textAlign: 'right' }}>
          <Button
            type="primary"
            onClick={() => {
              window.open(footerButtonHref, '_blank');
              close();
              trackerApi.track(NOTIFICATION_EVENT_ID, {
                operaType: NotificationOperaType.ClickButton,
                category,
                popoverID: announcementId,
              });
            }}
          >
            {footerButtonText}
          </Button>
        </div>
      );
      break;
    case FooterActionType.Like:
      footer = <Like liked={liked} text={footerButtonText} onClick={handleLikedClick} />;
      break;
    default:
      break;
  }

  return (
    <div className={styles['notification']}>
      {priority === 300 && <NoticeBgIcon className={styles['notification__notice_bg']} />}
      <div className={styles['notification__header']}>
        <div className={styles['notification__title']}>
          <img src={getNotificationIcon(priority ?? 0)} className={styles['notification__icon']} />
          {title}
        </div>
        {closable && (
          <div
            className={styles['notification__close']}
            onClick={() => {
              diskApi.operateAnnouncement({
                announcementId,
                operateType: AnnouncementOperateTypeEnum.CLOSE,
              });
              trackerApi.track(NOTIFICATION_EVENT_ID, {
                operaType: NotificationOperaType.ClickClose,
                category,
                popoverID: announcementId,
              });
              close();
            }}
          >
            <CloseIcon />
          </div>
        )}
      </div>
      <div className={styles['notification__body']}>{renderContent(contentItemList, announcement.type, announcementId)}</div>
      <div className={styles['notification__footer']}>{footer}</div>
    </div>
  );
}
