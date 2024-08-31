import React, { useState, useMemo, useEffect } from 'react';
import { EntityScheduleAndContact, ScheduleModel, util } from 'api';
import { Popover, Tabs, Modal } from 'antd';
import classnames from 'classnames';
import { usePopper } from 'react-popper';
import { VirtualElement } from '@popperjs/core/lib';
import styles from './eventcontent.module.scss';
import createBoxStyles from '../CreateBox/createbox.module.scss';
import { getDurationText, getPartTextByStatus, getReminderText, isPoorSchedule } from '../../util';
// import { getCharAvatar } from '../../../Contacts/util';
import { CatalogPrivilege, EnumRange, InviteType, PartStatus, ScheduleClazz } from '../../data';
import { getEventDetail, reactionEvent } from '../../service';
import { contactApi } from '@web-contact/_mock_';
import EventDelete from './EventDelete';
import siriusMessage from '@web-common/components/UI/Message/SiriusMessage';
import ScheduleTimezoneSelect from '@web-common/components/ScheduleTimeZoneSelect/scheduleTimeZoneSelect';
import { RangeContent } from '../CreateBox/PopContent';
import scheduleTracker from '../../tracker';
import AvatarTag from '@web-common/components/UI/Avatar/avatarTag';
import { ScheduleActions, useActions } from '@web-common/state/createStore';
import EventDesc from './EventDesc';
import EventAttachment from './EventAttachment';
// import { getRecurIntro } from '../CreateBox/customRepeat';
// import moment from 'moment';

// import DOMPurify from 'dompurify';
import { getIn18Text } from 'api';
const { TabPane } = Tabs;
export interface EventExtraDate {
  startDate: Date;
  endDate: Date;
}
export interface EventDetailProps {
  onDelete?(): void;
  onAction?(): void;
  onEdit?(): void;
  initEventData: ScheduleModel;
  onResetData?(): void;
}
export interface EventDetailPopoverProps extends EventDetailProps {
  virtualReference: VirtualElement;
  onClose?(): void;
}
const EventItem: React.FC<{
  iconClass?: string;
  display?: boolean;
  className?: string;
}> = ({ iconClass, children, className, display = true }) => {
  if (!display) {
    return null;
  }
  return (
    <div
      className={classnames(styles.item, className, {
        [styles.itemWithoutIcon]: iconClass === undefined,
      })}
    >
      {iconClass !== undefined && <i style={{ marginRight: 8, cursor: 'default' }} className={classnames(styles.icon, iconClass)} />}
      <div className={styles.itemContent}>{children}</div>
    </div>
  );
};
const InviteesContactItem: React.FC<{
  item: EntityScheduleAndContact;
}> = ({ item }) => {
  const contactName = item.simpleInfo.extNickname || item.simpleInfo.extDesc;
  // const charAvatar = getCharAvatar(contactName)
  // todo
  const avatarColor = contactApi.getColor(item.simpleInfo.extDesc);
  return (
    <div className={styles.contactItem}>
      <AvatarTag
        size={32}
        style={{ marginLeft: '4px' }}
        propEmail={item.simpleInfo.extDesc}
        user={{
          name: contactName,
          email: item.simpleInfo.extDesc,
          color: avatarColor,
        }}
      />
      <div className={styles.contactDesc}>
        <p>
          {contactName} {!!item.isOrganizer && <span className={styles.durationTag}>{getIn18Text('FAQIZHE')}</span>}{' '}
        </p>
        <p>{item.simpleInfo.extDesc}</p>
      </div>
      <div className={styles.contactStatus}>
        {/* todo */}
        {/* <span>item.partStat</span> */}
        <span>{item.isOrganizer ? getIn18Text('JIESHOU') : getPartTextByStatus(item.partStat)}</span>
      </div>
    </div>
  );
};
const PartActions: React.FC<{
  item: ScheduleModel;
  onAction?: EventDetailProps['onAction'];
}> = ({ item, onAction }) => {
  const { syncSchedule } = useActions(ScheduleActions);
  const [rangeVisible, setRangeVisible] = useState<{
    visible: boolean;
    stat?: PartStatus;
  }>({ visible: false });
  const handleAction = async (t: PartStatus, range?: EnumRange) => {
    if (item.scheduleInfo.recurrenceId && !rangeVisible.visible) {
      setRangeVisible({
        visible: !0,
        stat: t,
      });
      return;
    }
    setRangeVisible({
      visible: false,
    });
    siriusMessage.loading({ content: getIn18Text('HUIFUZHONG'), duration: 999 });
    try {
      const res = await reactionEvent(t, item, range);
      siriusMessage.destroy();
      if (Number(res.data?.code) === 200) {
        siriusMessage.success({ content: getIn18Text('HUIFUCHENGGONG11') });
        onAction && onAction();
        syncSchedule({
          type: 'update',
          data: {
            ...item,
            scheduleInfo: {
              ...item.scheduleInfo,
              partStat: t,
            },
          },
        });
      } else {
        siriusMessage.error({ content: `操作失败 ${res.data ? res.data.err_msg : ''}` });
      }
    } catch (error) {
      siriusMessage.destroy();
      siriusMessage.error({ content: getIn18Text('CAOZUOSHIBAI') });
    }
  };
  const actions = [
    {
      label: getIn18Text('JIESHOU'),
      stat: PartStatus.EVENT_ACCEPTED,
      conditionClassName: styles.actionPartAccept,
      iconClassName: styles.partIconAccept,
      iconConditonClassName: styles.partIconAcceptConfirm,
    },
    {
      label: getIn18Text('JUJUE'),
      stat: PartStatus.EVENT_DECLINED,
      conditionClassName: styles.actionPartReject,
      iconClassName: styles.partIconReject,
      iconConditonClassName: styles.partIconRejectConfirm,
    },
    {
      label: getIn18Text('DAIDING'),
      stat: PartStatus.EVENT_TENTATIVE,
      conditionClassName: styles.actionPartAttentive,
      iconClassName: styles.partIconAttentive,
      iconConditonClassName: styles.partIconAttentiveConfirm,
    },
  ];
  const contentStatusLabel = actions.find(e => e.stat === rangeVisible.stat)?.label || '';
  return (
    <Popover
      overlayClassName={createBoxStyles.confirmOverlay}
      trigger={['click']}
      visible={rangeVisible.visible}
      title={getIn18Text('CIWEIZHONGFUSHOU')}
      onVisibleChange={v => {
        if (!v) {
          setRangeVisible({
            visible: v,
          });
        }
      }}
      getPopupContainer={() => document.querySelector('div.fc-popover.fc-more-popover') || document.body}
      content={
        <RangeContent
          updateThisText={`仅${contentStatusLabel}本次日程`}
          updateAllText={`${contentStatusLabel}全部日程`}
          updateThisAndFutureText={`${contentStatusLabel}本次及其后续日程`}
          hideThisAndFuture={item.scheduleInfo.inviteeType === InviteType.INVITEE}
          onCancel={() => setRangeVisible({ visible: false })}
          onConfirm={e => {
            if (rangeVisible.stat !== undefined) {
              handleAction(rangeVisible.stat, e);
            }
          }}
        />
      }
    >
      <div className={styles.actionParts}>
        {actions.map(ac => (
          <div
            key={ac.label}
            onClick={async () => {
              if (rangeVisible.visible) {
                return;
              }
              handleAction(ac.stat);
            }}
            className={classnames(styles.actionPart, {
              [ac.conditionClassName]: ac.stat === item.scheduleInfo.partStat,
            })}
          >
            {ac.stat === item.scheduleInfo.partStat && <span>{getIn18Text('YI')}</span>}
            <span>{ac.label}</span>
          </div>
        ))}
      </div>
    </Popover>
  );
};
export const getContactGroups = (contactInfo: ScheduleModel['contactInfo']) => {
  const accepts: EntityScheduleAndContact[] = [];
  const rejects: EntityScheduleAndContact[] = [];
  const tentatives: EntityScheduleAndContact[] = [];
  const needsActions: EntityScheduleAndContact[] = [];
  contactInfo.forEach(e => {
    if (e.isOrganizer) {
      accepts.unshift(e);
      return;
    }
    switch (e.partStat) {
      case PartStatus.EVENT_ACCEPTED:
        accepts.push(e);
        break;
      case PartStatus.EVENT_DECLINED:
        rejects.push(e);
        break;
      case PartStatus.EVENT_TENTATIVE:
        tentatives.push(e);
        break;
      case PartStatus.EVENT_NEEDS_ACTION:
        needsActions.push(e);
        break;
      default:
        break;
    }
  });
  return {
    all: {
      // 把组织者提到第一个
      value: contactInfo.slice().sort(a => (a.isOrganizer ? -1 : 0)),
      label: `全部${contactInfo.length}人`,
    },
    accepts: {
      value: accepts,
      label: `接受${accepts.length}人`,
    },
    rejects: {
      value: rejects,
      label: `拒绝${rejects.length}人`,
    },
    tentatives: {
      value: tentatives,
      label: `待定${tentatives.length}人`,
    },
    needsActions: {
      value: needsActions,
      label: `未回复${needsActions.length}人`,
    },
  };
};
export const useScheduleReviewMoreContact = () => {
  const [modal, contextHolder] = Modal.useModal();
  const [contactInfo, setContactInfo] = useState<ScheduleModel['contactInfo']>();
  const showMore = (c: ScheduleModel['contactInfo']) => {
    setContactInfo(new Array(...c));
  };
  useEffect(() => {
    if (contactInfo) {
      const contactGroups = getContactGroups(contactInfo);
      const md = modal.info({
        zIndex: 1032,
        width: 490,
        className: styles.modal,
        onCancel: () => {
          md.destroy();
        },
        icon: null,
        okButtonProps: {
          style: {
            display: 'none',
          },
        },
        content: (
          <>
            <i onClick={() => md.destroy()} style={{ position: 'absolute', right: 24 }} className={classnames(styles.icon, styles.close)} />
            <p className={styles.modalTitle}>{getIn18Text('SHOUYAOCHENGYUAN')}</p>
            <Tabs
              // tabBarGutter={24}
              tabBarGutter={24}
              className={styles.modalTab}
            >
              {Object.entries(contactGroups).map(([key, { value, label }]) => (
                <TabPane tab={label} key={key}>
                  {value.map((e: EntityScheduleAndContact) => (
                    <InviteesContactItem key={e.id} item={e} />
                  ))}
                </TabPane>
              ))}
            </Tabs>
          </>
        ),
        maskClosable: true,
      });
    }
  }, [contactInfo]);
  return {
    contextHolder,
    showMore,
  };
};
const EventDetail: React.FC<EventDetailProps> = ({ onDelete, onAction, onEdit, initEventData, onResetData }) => {
  const [eventData, setEventData] = useState<ScheduleModel>(initEventData);
  const {
    scheduleInfo: {
      summary,
      color,
      allDay,
      location,
      reminders,
      description,
      start,
      end,
      attachments,
      // creator,
      clazz,
      transp,
      recur,
      meetingInfo,
      recurIntro,
    },
    contactInfo,
    catalogInfo,
  } = eventData;
  const invitees = contactInfo.filter(e => !e.isOrganizer);
  const organizer = contactInfo.find(e => e.isOrganizer);
  const { changeScheduleEvent, setScheduleEditFrom } = useActions(ScheduleActions);
  const contactGroups = getContactGroups(contactInfo);
  const { contextHolder, showMore } = useScheduleReviewMoreContact();
  const handleEdit = async () => {
    // 直接使用eventData，此处已是从详情接口获取的
    // 如果再次调用详情接口获取数据，由于列表和详情中的catalogId不一致问题（服务端问题）会引发报错
    changeScheduleEvent(eventData);
    setScheduleEditFrom('');
    onEdit && onEdit();
    scheduleTracker.pc_schedule_detail_show('edit');
  };
  const handleOnDelete = () => {
    onDelete && onDelete();
  };
  const renderDuration = () => {
    const { startStr, endStr, affixStr } = getDurationText(new Date(start), new Date(end), !!allDay);
    return (
      <div>
        <span className={styles.durationText}>{`${startStr}${endStr}`}</span>
        {affixStr !== '' && <span className={styles.durationTag}>{affixStr}</span>}
      </div>
    );
  };
  const renderMember = () => {
    const acceptNum = contactGroups.accepts.value.length;
    const rejectNum = contactGroups.rejects.value.length;
    const tentativesNum = contactGroups.tentatives.value.length;
    const needsActionNum = contactGroups.needsActions.value.length;
    if (eventData.scheduleInfo.inviteeType === InviteType.ORGANIZER && invitees.length === 0) {
      return null;
    }
    return (
      <div>
        <div
          className={classnames(styles.memberTextContainer, {
            [styles.hasInvitee]: invitees.length > 0,
          })}
        >
          {contextHolder}
          <span className={styles.memberText}>
            <span title={organizer?.simpleInfo.extDesc}>{organizer?.simpleInfo.extNickname || organizer?.simpleInfo.extDesc}</span>
            <span className={styles.durationTag}>{getIn18Text('FAQIZHE')}</span>
            <span>{invitees.map(e => e.simpleInfo.extNickname || e.simpleInfo.extDesc).join('、')}</span>
          </span>
          {invitees.length > 0 && <span>{`共${contactInfo.length}人`}</span>}
        </div>
        {invitees.length > 0 && (
          <div
            onClick={() => {
              showMore(contactInfo);
            }}
          >
            <span className={styles.memberMoreLink}>{`${acceptNum}人接受、${rejectNum}人拒绝、${tentativesNum}人待定、${needsActionNum}人未回复`}</span>
          </div>
        )}
      </div>
    );
  };
  const lowestPrivilege = useMemo(() => isPoorSchedule(eventData), [eventData]);
  const showOperate =
    eventData.scheduleInfo.inviteeType !== InviteType.ORGANIZER &&
    (!!catalogInfo.isOwner || catalogInfo.privilege === CatalogPrivilege.OPREATE) &&
    !catalogInfo.syncAccountId;
  useEffect(() => {
    getEventDetail(initEventData).then(([res]) => {
      // 重复规则客户端生成一次
      // if (res.scheduleInfo?.recur) {
      //   const rruleUntil = res.scheduleInfo?.recur?.until ? moment(util.getTime(res.scheduleInfo?.recur?.until)) : undefined;
      //   res.scheduleInfo.recur.recurIntro = getRecurIntro({...res.scheduleInfo.recur, enmuRecurrenceRule: res.scheduleInfo.recur.freq, rruleUntil })
      // }
      setEventData(res);
    });
  }, []);
  useEffect(() => {
    onResetData?.();
  }, [eventData]);
  return (
    <div className={styles.content} onClick={e => e.stopPropagation()}>
      <div className={styles.header} style={{ backgroundColor: color }}>
        <div className={styles.title}>
          <span>{getIn18Text('RICHENGXIANGQING')}</span>
        </div>
        {/* 第三方账号日历不可编辑删除 */}
        {!catalogInfo.syncAccountId && (catalogInfo.isOwner || catalogInfo.privilege === CatalogPrivilege.OPREATE) && (
          <div className={styles.toolbar}>
            <i onClick={handleEdit} style={{ marginRight: 16 }} className={classnames(styles.icon, styles.editWhite)} />
            <EventDelete onDelete={handleOnDelete} item={eventData} />
          </div>
        )}
      </div>
      <div
        className={classnames(styles.body, {
          [styles.bodyWithOutOperate]: !showOperate,
        })}
      >
        <EventItem className={styles.summary}>
          <span title={summary}>{summary || getIn18Text('WUZHUTI')}</span>
        </EventItem>
        {/* 时间 */}
        <EventItem iconClass={styles.clock}>
          {renderDuration()}
          <ScheduleTimezoneSelect
            bordered={false}
            labelBreakLine={true}
            showTimeDiffLabel={true}
            localZoneStartTime={new Date(start)}
            localZoneEndTime={new Date(end)}
            allDay={!!allDay}
          />
        </EventItem>
        {/* 重复规则 */}
        <EventItem iconClass={styles.sync} display={recur?.recurIntro !== undefined || recurIntro !== undefined}>
          <span>{recur?.recurIntro || recurIntro}</span>
        </EventItem>
        {/* 参会人员 */}
        <EventItem iconClass={styles.member} display={!lowestPrivilege && !(eventData.scheduleInfo.inviteeType === InviteType.ORGANIZER && invitees.length === 0)}>
          {renderMember()}
        </EventItem>
        {/* 地点 */}
        <EventItem iconClass={styles.location} display={!lowestPrivilege && location !== undefined && location !== ''}>
          <span
            className={classnames(styles.locationText, {
              [styles.locationDeleted]: meetingInfo?.status === 2,
              [styles.locationForbidden]: meetingInfo?.status === 0,
            })}
          >
            {meetingInfo !== undefined ? [meetingInfo.name, meetingInfo.addr_name].filter(e => !!e).join('，') : location}
          </span>
          {meetingInfo?.status === 0 && <span className={classnames(styles.durationTag, styles.durationTagWarn)}>{getIn18Text('JINYONG')}</span>}
        </EventItem>
        {/* 提醒规则 */}
        <EventItem iconClass={styles.bell} display={!lowestPrivilege && Array.isArray(reminders) && reminders.length > 0}>
          <span>{Array.isArray(reminders) && Array.from(new Set(reminders.map(r => getReminderText(r, !!allDay)))).join('，')}</span>
        </EventItem>
        {/* 所属日历名称 */}
        <EventItem iconClass={styles.calendar} display={!lowestPrivilege && catalogInfo.status !== 0}>
          <span title={catalogInfo.name} className={styles.ellipsis}>
            {catalogInfo.name}
          </span>
        </EventItem>
        {/* 可见范围 */}
        <EventItem iconClass={styles.eyes} display={!lowestPrivilege && clazz !== ScheduleClazz.DEFAULT}>
          <span>{clazz === ScheduleClazz.PUBLIC ? getIn18Text('GONGKAI') : getIn18Text('BUGONGKAI')}</span>
        </EventItem>
        <EventItem iconClass={styles.coffee} display={!lowestPrivilege && transp === 1}>
          <span>{getIn18Text('KONGXIAN')}</span>
        </EventItem>
        {/* 日历简介 */}
        <EventItem
          iconClass={styles.message}
          display={!lowestPrivilege && description !== undefined && description !== '' && description !== '<p></p>'}
          className={styles.itemMessage}
        >
          {/* <span dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(description) }} ></span> */}
          <EventDesc desc={description} />
        </EventItem>
        <EventItem iconClass={styles.attachment} display={!lowestPrivilege && attachments && !!attachments.length} className={styles.itemMessage}>
          <EventAttachment attachmentList={attachments} />
        </EventItem>
        {/* 接受、拒绝、待定邀请 */}
        {showOperate && <PartActions onAction={onAction} item={eventData} />}
      </div>
    </div>
  );
};
export const EventDetailPopover: React.FC<EventDetailPopoverProps> = ({ virtualReference, onClose, initEventData, onAction, onDelete, onEdit }) => {
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(null);
  const {
    styles: popperStyles,
    attributes,
    update,
  } = usePopper(virtualReference, popperElement, {
    placement: 'right-start',
    modifiers: [
      {
        name: 'preventOverflow',
        options: {
          altAxis: true, // false by default
        },
      },
    ],
  });
  const handleClose = () => {
    onClose && onClose();
  };
  const handleDelete = () => {
    onDelete && onDelete();
    handleClose();
  };
  const handleAction = () => {
    onAction && onAction();
    handleClose();
  };
  const handleEdit = () => {
    onEdit && onEdit();
    handleClose();
  };
  return (
    <>
      {/* <div className={styles.mask} onClick={handleClose} /> */}
      <div ref={setPopperElement} style={popperStyles.popper} className={styles.detailOverlay} {...attributes.popper}>
        {/* eslint-disable-next-line react/jsx-props-no-spreading */}
        <EventDetail
          onDelete={handleDelete}
          onAction={handleAction}
          onEdit={handleEdit}
          initEventData={initEventData}
          onResetData={() => {
            update && update();
          }}
        />
      </div>
    </>
  );
};
export default EventDetail;
