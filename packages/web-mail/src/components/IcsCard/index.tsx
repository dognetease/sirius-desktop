import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  apis,
  apiHolder as api,
  SystemApi,
  IcsApi,
  IcsModel,
  DataTrackerApi,
  IcsEvent,
  FreeBusyModel,
  IcsInvitee,
  AccountApi,
  CatalogApi,
  CatalogUnionApi,
  ScheduleModel,
  EventApi,
} from 'api';
import './index.scss';
import { Skeleton } from 'antd';
import { navigate } from 'gatsby';
import classNames from 'classnames';
import { getDurationText } from '@web-schedule/util';
import EventDesc from '@web-schedule/components/EventContent/EventDesc';
import { navigateToSchedule } from '@/layouts/Main/util';
import { useScheduleReviewMoreContact } from '@web-schedule/components/EventContent/EventDetail';
import { ScheduleActions, useActions, useAppSelector } from '@web-common/state/createStore';
import SiriusMessage from '@web-common/components/UI/Message/SiriusMessage';
import { transInviteData } from './util';
import { getIn18Text } from 'api';
import EventAttachment from '@web-schedule/components/EventContent/EventAttachment';
import { getEventDetailByUid } from '@web-schedule/service';
import { CatalogPrivilege } from '@web-schedule/data';
import EventDelete from '@web-schedule/components/EventContent/EventDelete';
import useCreateCallbackForEvent from '@web-common/hooks/useCreateCallbackForEvent';
import ScheduleTimezoneSelect from '@web-common/components/ScheduleTimeZoneSelect/scheduleTimeZoneSelect';
const icsApi: IcsApi = api.api.requireLogicalApi(apis.icsApiImpl) as unknown as IcsApi;
const catalogApi: CatalogUnionApi = api.api.requireLogicalApi(apis.catalogApiImpl) as CatalogUnionApi;
const systemApi = api.api.getSystemApi() as SystemApi;
const dataTracker = api.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;
const accountApi = api.api.requireLogicalApi(apis.accountApiImpl) as AccountApi;
const eventApi = api.api.getEventApi() as EventApi;

// const htmlApi = api.api.requireLogicalApi(apis.htmlApi) as HtmlApi;
interface Props {
  senderEmail: string;
  mid: string;
  attachmentsIds: number[];
  setIcsSuccess: React.Dispatch<React.SetStateAction<boolean>>;
}
interface UIIcsEvent extends IcsEvent {
  partStat: PartStat;
}
interface UIIcsModel extends IcsModel {
  event: UIIcsEvent;
}
interface SubTitleProps {
  icsModel: IcsModel;
  senderEmail: string;
  isIcsReply?: boolean;
  sender?: IcsInvitee;
  changeIcsModel?: (icsModel: IcsModel) => void;
  currentMail?: string;
  isSubCount?: boolean;
}
interface InviteeInfo {
  partStat: PartStat;
  email: string;
  nickname: string;
}
export type PartStat = 'NEEDS-ACTION' | 'ACCEPTED' | 'DECLINED' | 'TENTATIVE' | 'DELEGATED';
const partStatMap = {
  'NEEDS-ACTION': getIn18Text('CAOZUO'),
  ACCEPTED: getIn18Text('JIESHOU'),
  DECLINED: getIn18Text('JUJUE'),
  TENTATIVE: getIn18Text('DAIDING'),
  DELEGATED: getIn18Text('YIWEIPAI'),
};
const SubTitle: React.FC<SubTitleProps> = props => {
  const { senderEmail, isIcsReply = false, sender, icsModel: _propsIcsModel, changeIcsModel, currentMail = '', isSubCount = false } = props;
  const propsIcsModel = _propsIcsModel as UIIcsModel;
  const [inviteeInfo, setInviteeInfo] = useState<InviteeInfo>();
  const [partStat, setPartStat] = useState<PartStat>(propsIcsModel.event.partStat);
  const [isSender, setIsSender] = useState(false);
  const [visibleOrganizer, setVisibleOrganizer] = useState(false);
  const [organizerName, setOrganizerName] = useState('');
  const [icsModel, setIcsModel] = useState<UIIcsModel>(propsIcsModel);

  useEffect(() => {
    if (!isIcsReply) {
      const user = systemApi.getCurrentUser(currentMail)!;
      const defaultInviteeInfo: InviteeInfo = {
        partStat: 'NEEDS-ACTION',
        email: user.id,
        nickname: user.nickName,
      };
      const { organizer, attachments } = propsIcsModel.event;
      const isOrganizer = organizer.extDesc === user.id;
      const isSenderEmail = senderEmail === user.id;
      setVisibleOrganizer(isOrganizer);
      setOrganizerName(organizer.extNickname || '');
      setIsSender(isSenderEmail);
      if (!isOrganizer) {
        setPartStat(propsIcsModel.event ? propsIcsModel.event.partStat : 'NEEDS-ACTION');
      }
      if ((isOrganizer && !isSenderEmail) || !isOrganizer) {
        const { invitees } = propsIcsModel.event;
        let curInviteeInfo;
        if (invitees?.length) {
          curInviteeInfo = invitees.find(item => item.email === senderEmail);
        }
        curInviteeInfo = curInviteeInfo || defaultInviteeInfo;
        setInviteeInfo(curInviteeInfo as InviteeInfo);
      }
      setIcsModel(propsIcsModel);
    }
  }, [propsIcsModel, isIcsReply]);
  const doAction = async (partStatAction: PartStat) => {
    dataTracker.track('pc_click_mail_schedule', { category: partStatMap[partStatAction] });
    if (icsModel.event) {
      // accountApi.setCurrentAccount({ email: currentMail });
      const data = (await icsApi.doOperateIcs({
        // 日程id
        uid: icsModel.event.uid,
        // 日程版本
        sequence: icsModel.event.sequence,
        // 日程最后修改时间
        lastModified: icsModel.event.lastModified!,
        // 组织者邮件地址
        organizer: icsModel.event.organizer.extDesc,
        // 被邀请者邮件地址
        attendee: systemApi.getCurrentUser(currentMail)!.id,
        // 参与类型
        partStat: partStatAction,
        // 循环ID（如有）
        recurrenceId: icsModel.event.recurrenceId,
        // 账号
        _account: currentMail,
      })) as UIIcsModel;
      // 主动更新本地提醒日程
      setTimeout(() => {
        catalogApi.initScheduleNotice();
      }, 2000);
      if (!data.event) {
        // todo换成最新的值
        const { event } = icsModel;
        const curInvitee = event.invitees.find(invitee => invitee.email === systemApi.getCurrentUser(currentMail)!.id);
        if (curInvitee != null) {
          curInvitee.partStat = partStatAction;
        }
        event.partStat = partStatAction;
        data.event = event;
      }
      setIcsModel(data);
      changeIcsModel && changeIcsModel(data);
      setPartStat(partStatAction);
    }
  };
  const organizerRender = () => {
    const { cancel, change } = icsModel;
    let action;
    if (cancel) {
      action = getIn18Text('QUXIAOLECIRI');
    } else if (change) {
      action = getIn18Text('GENGXINLECIRI');
    } else if (isSender) {
      action = getIn18Text('DERICHENGYAOQING');
    } else {
      action = partStatMap[inviteeInfo!.partStat] + getIn18Text('LECIRICHENGYAO');
    }
    const user = cancel || change || isSender ? getIn18Text('NIN') : inviteeInfo?.nickname;
    return icsModel.expired ? (
      <div>
        <span>{getIn18Text('RICHENGYIGUOQI')}</span>
      </div>
    ) : (
      <div>
        <span>{user}</span>
        <span>{action}</span>
      </div>
    );
  };
  const getSubTitleCom = (resCom: JSX.Element | null) => {
    if (resCom) {
      return <div className="sub-title">{resCom}</div>;
    } else {
      return <></>;
    }
  };
  const inviteeRender = () => {
    const { expired, cancel, change } = icsModel;
    const action = cancel ? getIn18Text('YIQUXIAOCIRI') : getIn18Text('YIGENGXINCIRI');
    let renderDom = null;
    if (isSubCount) {
      return renderDom;
    }

    if (cancel || change) {
      renderDom = (
        <div>
          <span>{organizerName}</span>
          <span>{action}</span>
        </div>
      );
    } else if (expired) {
      renderDom = (
        <div>
          <span>{getIn18Text('RICHENGYIGUOQI')}</span>
        </div>
      );
    } else if (partStat === 'NEEDS-ACTION') {
      renderDom = (
        <div className="action-btn-group">
          <button
            type="button"
            onClick={() => {
              doAction('ACCEPTED');
            }}
          >
            {getIn18Text('JIESHOU')}
          </button>
          <button
            type="button"
            onClick={() => {
              doAction('DECLINED');
            }}
          >
            {getIn18Text('JUJUE')}
          </button>
          <button
            type="button"
            onClick={() => {
              doAction('TENTATIVE');
            }}
          >
            {getIn18Text('DAIDING')}
          </button>
        </div>
      );
    } else if (partStatMap[partStat]) {
      renderDom = (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <i
            className={classNames('action-icon', {
              'action-icon-accept': partStat === 'ACCEPTED',
              'action-icon-reject': partStat === 'DECLINED',
              'action-icon-attentive': partStat === 'TENTATIVE',
            })}
          />
          <span>{getIn18Text('YI') + partStatMap[partStat] + getIn18Text('CIRICHENG')}</span>
        </div>
      );
    }
    return renderDom;
  };
  if (isIcsReply && sender) {
    return getSubTitleCom(
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <i
          className={classNames('action-icon', {
            'action-icon-accept': sender.partStat === 'ACCEPTED',
            'action-icon-reject': sender.partStat === 'DECLINED',
            'action-icon-attentive': sender.partStat === 'TENTATIVE',
          })}
        />
        <span>{sender?.nickname || ''}</span>
        <span>{getIn18Text('YI') + partStatMap[sender.partStat as PartStat] + getIn18Text('CIRICHENG')}</span>
      </div>
    );
  }
  return getSubTitleCom(visibleOrganizer ? organizerRender() : inviteeRender());
};
const IcsCard: React.FC<Props | undefined> = props => {
  const { mid, attachmentsIds, senderEmail, setIcsSuccess } = props;
  const [icsModel, setIcsModel] = useState<IcsModel>();
  const [title, setTitle] = useState<string>('');
  const [scheduleTime, setScheduleTime] = useState<string>('');
  const [totalTime, setTotalTime] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [eventDetail, setEventDetail] = useState<ScheduleModel>();
  const mailEntities = useAppSelector(state => state.mailReducer.mailEntities);
  const { changeScheduleEvent, setScheduleEditFrom } = useActions(ScheduleActions);
  const { scheduleSync, showSecondaryZone } = useAppSelector(state => state.scheduleReducer);
  const currentMail = mailEntities[mid]?._account || '';
  // 判断是否发送人逻辑修改下，需要考虑别名邮箱
  const isSender = senderEmail === systemApi.getCurrentUser(currentMail)!.id || systemApi.getCurrentUser(currentMail)!.prop?.accountAlias?.includes(senderEmail);
  const [isOrg, setIsOrg] = useState<boolean | undefined>();
  const [editable, setEditable] = useState<boolean>(false);
  const { showMore, contextHolder } = useScheduleReviewMoreContact();
  // 邀请人数信息
  const [icsReplyInviteInfo, setIcsReplyInviteInfo] = useState('');
  const eventData = icsModel?.event;
  const isSubCount = systemApi.getCurrentUser(currentMail)!.id !== currentMail && !systemApi.getCurrentUser(currentMail)!.prop?.accountAlias?.includes(currentMail);
  const handleEdit = async () => {
    // 直接使用eventData，此处已是从详情接口获取的
    changeScheduleEvent(eventDetail);
    setScheduleEditFrom('mail');
    // onEdit && onEdit();
    // scheduleTracker.pc_schedule_detail_show('edit');
  };
  const handleOnDelete = async () => {
    refreshIcs();
  };
  // 独立窗口更新日程数据 同步刷新ics
  useEffect(() => {
    const eid = eventApi.registerSysEventObserver('syncSchedule', {
      func: () => {
        refreshIcs();
      },
    });
    return () => {
      eventApi.unregisterSysEventObserver('syncSchedule', eid);
    };
  }, []);
  useEffect(() => {
    // 日程编辑提交，窗口关闭会有变化
    if (scheduleSync?.type === 'update') {
      console.log('ics card modal close');
      refreshIcs();
    }
  }, [scheduleSync]);
  // 记录一下发出请求的mid，防止接口返回时序问题导致的信息错乱
  const requestMid = useRef<string>('');
  const setState = useCreateCallbackForEvent((res: IcsModel) => {
    if (requestMid.current == mid) {
      const organizer = res.event.organizer.extDesc;
      const recurrenceId = res.event.recurrenceId;
      const email = systemApi.getCurrentUser(currentMail)!.id;
      const isMainAccount = systemApi.getIsMainAccount(email);
      const userIsInvitees = res.event.invitees.some(inviter => inviter?.email === email);
      // 判断是否是主账号/为邀请人/为受邀人/非回执邮件/未取消/未过期/返回数据有event/ 不是循环日程的实例(recurrenceId为null 或者 recurrenceId < 0)
      const editable = !!(
        isMainAccount &&
        res.method !== 'REPLY' &&
        res.cancel === 0 &&
        res.hasEvent &&
        !(recurrenceId && recurrenceId > 0) &&
        (organizer === email || userIsInvitees)
      );
      setIcsModel(res);
      setTitle(organizer !== email && userIsInvitees ? getIn18Text('NINSHOUDAOYIGE') : getIn18Text('RICHENGYAOQING'));
      setIsOrg(organizer === email);

      // setTitle("您收到一个日程邀请");
      const { startStr, endStr, affixStr } = getDurationText(new Date(res.event!.startTime), new Date(res.event!.endTime), !!res.event?.allDay, true, true);
      setScheduleTime(startStr + endStr);
      setTotalTime(affixStr);
      setLoading(false);
      setEditable(editable);
      // 获取编辑详情
      if (editable) {
        getEventDetailByUid(res.event.uid).then(([res]) => {
          setEventDetail(res);
        });
      }
    }
  });
  const refreshIcs = useCreateCallbackForEvent(() => {
    const user = systemApi.getCurrentUser(currentMail)!;
    setLoading(true);
    // 设置当前 mail id
    // accountApi.setCurrentAccount({ email: currentMail });
    // requestMid.current = mid;
    icsApi
      .doGetIcsInfo({
        attendee: senderEmail,
        // 当前用户的sid
        sid: user.sessionId,
        // 邮件id
        mid: requestMid.current,
        // attachments Id
        partId: attachmentsIds[0],
        // 邮箱地址
        domain: user.domain,
        // 当前时间戳
        _: new Date().getTime(),
        _account: user.id,
      })
      .then(setState)
      .catch(e => {
        console.error('doGetIcsInfo Error', e);
        setIcsSuccess(false);
      });
  });
  useEffect(() => {
    requestMid.current = mid;
    refreshIcs();
  }, [mid]);
  // 计算邀请人数
  useEffect(() => {
    const visibleInvite = eventData && eventData.invitees && eventData.invitees.length > 0;
    if (icsModel && visibleInvite && !icsModel.cancel && eventData) {
      const { invitees } = eventData;
      let refuseCounts = 0;
      let tentativeCounts = 0;
      invitees.forEach(item => {
        if (item.partStat === 'DECLINED') {
          refuseCounts += 1;
        } else if (item.partStat === 'TENTATIVE') {
          tentativeCounts += 1;
        }
      });
      const memberSet = new Set([eventData.organizer.extDesc, ...invitees.map(e => e.email), systemApi.getCurrentUser(currentMail)!.id]);
      const accepetMemberSet = new Set([eventData.organizer.extDesc, ...invitees.filter(e => e.partStat === 'ACCEPTED').map(e => e.email)]);
      const noReply = memberSet.size - accepetMemberSet.size - refuseCounts - tentativeCounts;
      const icsReplyInviteInfo = [
        `共${memberSet.size}人，${accepetMemberSet.size}人接受`,
        `${refuseCounts}人不接受`,
        `${tentativeCounts}人待定`,
        `${noReply > 0 ? noReply : 0}人暂未回复`,
      ].join('、');
      setIcsReplyInviteInfo(icsReplyInviteInfo);
    }
  }, [icsModel, currentMail]);

  if (!icsModel || !eventData) {
    return null;
  }
  // 如果invitees为空返回null,过滤钉钉的日程ics，认为ics解析失败，展示附件
  if (!eventData.invitees || isSubCount) {
    setIcsSuccess(false);
    return null;
  }
  const visibleLocation = eventData.meetingInfo || eventData.location;
  const visibleRemark = Boolean(eventData.description && eventData.description !== '<p></p>');
  const visibleConflict = !isSender && !isOrg && !icsModel.cancel; // 既不是邀请的发送者，也不是邀请的组织者（可能是回执），即：别人邀请我的邮件
  const isIcsReply = !isSender && isOrg;
  const sender = eventData.invitees.find(item => item.email === senderEmail);
  const attachments = eventData.attachments;
  const recurInfoDesc = eventData.recurInfo;

  const handleReviewMore = () => {
    showMore(transInviteData(icsModel));
  };
  return (
    <div
      className={classNames('ics-card', {
        'ics-card-reply': isIcsReply,
      })}
    >
      {loading ? (
        <Skeleton paragraph={{ rows: 7 }} active loading={loading} />
      ) : (
        <div className="ics-card-wrap">
          {contextHolder}
          <div className={`card-header ${(icsModel.expired || icsModel.cancel) && !isIcsReply ? 'cancel' : 'normal'}`}>
            <div className="title">{!isIcsReply ? title : getIn18Text('RICHENGHUIZHI')}</div>
            {/* 第三方账号日历不可编辑删除 */}
            {/* {!catalogInfo.syncAccountId && (catalogInfo.isOwner || catalogInfo.privilege === CatalogPrivilege.OPREATE) && (
              <div className={styles.toolbar}>
                <i onClick={handleEdit} style={{ marginRight: 16 }} className={classnames(styles.icon, styles.editWhite)} />
                <EventDelete onDelete={handleOnDelete} item={eventData} />
              </div>
            )} */}
            {editable && !!eventDetail && (
              <div className={'toolbar'}>
                <i onClick={handleEdit} style={{ marginRight: 16 }} className={'icon edit-white'} />
                <EventDelete onDelete={handleOnDelete} scheduleDeleteFromMail={true} item={eventDetail} />
              </div>
            )}
          </div>
          <SubTitle
            sender={sender}
            isIcsReply={isIcsReply}
            icsModel={icsModel}
            changeIcsModel={setIcsModel}
            senderEmail={senderEmail}
            currentMail={currentMail}
            isSubCount={isSubCount}
          />
          <div className="card-content">
            <div className="summary">{eventData.summary || getIn18Text('WUZHUTI')}</div>
            {/* 时间 */}
            {!isSubCount && (
              <>
                <div
                  className={`time ics-card-row ${showSecondaryZone ? 'ics-time-select-row' : ''}`}
                  onClick={() => {
                    if (systemApi.isElectron() && !systemApi.isMainPage()) {
                      SiriusMessage.info(getIn18Text('QINGZAIZHUCHUANGKOUDJYTZRL'));
                      return;
                    }
                    navigateToSchedule(() => {
                      navigate('/#schedule');
                    });
                  }}
                >
                  <div className="time-row-item">
                    <i className="icon timeIcon" />
                    <div className="text1">{scheduleTime}</div>
                    {totalTime && <div className="text2">{totalTime}</div>}
                  </div>
                  <div
                    className="ics-time-select-item"
                    onClick={e => {
                      e.stopPropagation();
                      e.preventDefault();
                    }}
                  >
                    <ScheduleTimezoneSelect
                      bordered={false}
                      showTimeDiffLabel={true}
                      labelBreakLine={true}
                      localZoneStartTime={new Date(icsModel.event!.startTime)}
                      localZoneEndTime={new Date(icsModel.event!.endTime)}
                      allDay={!!icsModel.event?.allDay}
                    />
                  </div>
                </div>
              </>
            )}
            {/* 日程回执 除了时间主题外 只显示具体人员参与详情 */}
            {isIcsReply ? (
              <>
                <div className="organize ics-card-row">
                  <i className="icon ics-reply" />
                  <div onClick={handleReviewMore} className="ics-reply-info">
                    <span>{icsReplyInviteInfo}</span>
                    <i className="arrow-right" />
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* 循环规则 */}
                {!!recurInfoDesc && (
                  <div className="time ics-card-row">
                    <i className="icon rruleIcon" />
                    <div className="text1">{recurInfoDesc}</div>
                  </div>
                )}
                {/* 冲突（忙闲） */}
                {visibleConflict && (
                  <div
                    className="conflict ics-card-row"
                    onClick={() => {
                      navigateToSchedule(() => {
                        navigate('/#schedule');
                      });
                    }}
                  >
                    <i className="icon conflictIcon" />
                    <div>
                      <div className={`time-conflict ${eventData.conflict?.length > 0 ? 'red-color' : ''}`}>
                        {eventData.conflict?.length > 0 ? getIn18Text('YUYIXIARICHENG') : getIn18Text('YUNINDERICHENG')}
                      </div>
                      {eventData.conflict &&
                        (eventData.conflict as FreeBusyModel['freeBusyItems']).map(e => {
                          const { startStr, endStr } = getDurationText(new Date(e.start), new Date(e.end), !!e.allDay, false);
                          return (
                            <p className="event-conflict" key={e.scheduleId}>
                              <span className="event-conflict-title" title={e.summary}>
                                {e.summary || getIn18Text('WUZHUTI')}
                              </span>
                              <br />
                              <span className="event-conflict-time">
                                {`${startStr} ${endStr}`}
                                {e.allDay ? getIn18Text('(QUANTIAN)') : ''}
                              </span>
                            </p>
                          );
                        })}
                    </div>
                  </div>
                )}
                {/* 地点 */}
                {visibleLocation && (
                  <div className="location ics-card-row">
                    <i className="icon locationIcon" />
                    <div className="location-text">{eventData.meetingInfo ? eventData.meetingInfo.name + ',' + eventData.meetingInfo.addr_name : eventData.location}</div>
                  </div>
                )}
                {visibleRemark && (
                  <div className="remark ics-card-row">
                    <i className="icon remarkIcon" />
                    <div className="remark-text">
                      <EventDesc desc={eventData.description} />
                    </div>
                  </div>
                )}
                {/* 组织者 */}
                <div className="organize ics-card-row">
                  <i className="icon organizeIcon" />
                  <div className="text1">
                    {eventData.organizer.extNickname}
                    &nbsp;
                    <span className="light-text">{eventData.organizer.extDesc}</span>
                  </div>
                  <div className="text2">{getIn18Text('FAQIZHE')}</div>
                </div>
                {/* 受邀者 */}
                {/* {visibleInvite && (<div className="invite ics-card-row">
              <i className="icon inviteIcon" />
              <div className="invite-list-wrap">
                <div className="invite-list">
                  {eventData.invitees.map(item => (<div key={item.email} className="text1">
                    {`${item?.nickname}`}
                    &nbsp;
                    <span className="light-text">{item.email}</span>
                  </div>))}
                </div>
              </div>
            </div>)} */}

                {!icsModel.cancel && (
                  <div className="organize ics-card-row">
                    <i className="icon ics-reply" />
                    <div onClick={handleReviewMore} className="ics-reply-info">
                      <span>{icsReplyInviteInfo}</span>
                      <i className="arrow-right" />
                    </div>
                  </div>
                )}
                {attachments && attachments?.length > 0 && (
                  <div className="organize ics-card-row">
                    <i className="icon ics-attachment" />
                    <div className="text1">
                      <EventAttachment attachmentList={attachments} />
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
export default IcsCard;
