import React, { useMemo } from 'react';
import { MailEntryModel, MailConfApi, apiHolder, SystemApi, ContactAndOrgApi, apis, ContactModel, MailBoxEntryContactInfoModel, DataStoreApi, AccountApi } from 'api';
import { Tooltip } from 'antd';
import { formatTime, formatDigitalTime, scheduleSendFormatTime, dateFormat, formatTimeWithHM } from '../../../../util';
import AvatarTag from '@web-common/components/UI/Avatar/avatarTag';
import ReadListIcons from '@web-common/components/UI/Icons/svgs/ReadListSvgs';
import ReceiverAvatar from '@/images/mail/receiver_avatar.svg';
import MailTag from '../../MailTag/MailTag';
import { MailCardComProps } from '../../../../types';
// import { SpaceContext } from 'antd/lib/space';
import cloneDeep from 'lodash/cloneDeep';
import { useGetProductAuth } from '@web-common/hooks/useGetProductAuth';
import CustomerLabel from '@web-mail/components/ReadMail/component/CustomerLabel';
import RevokeCountDown from '@web-mail/components/RevokeCountDown/RevokeCountDown';
import { useAppSelector } from '@web-common/state/createStore';
import useState2RM from '@web-mail/hooks/useState2ReduxMock';
import PersonalMark from '@web-common/components/UI/SiriusContact/personalMark/mark';
import { useContactModel, useUpdateContactModel, useContactModelNames, useContactModelList } from '@web-common/hooks/useContactModel';
import { getIn18Text } from 'api';
import IconCard from '@web-common/components/UI/IconCard';
import moment from 'moment';
import { debounce } from 'lodash';

const mailManagerApi = apiHolder.api.requireLogicalApi('mailConfApiImpl') as unknown as MailConfApi;
const systemApi = apiHolder.api.getSystemApi() as SystemApi;
const accountApi = apiHolder.api.requireLogicalApi(apis.accountApiImpl) as AccountApi;
const contactApi = apiHolder.api.requireLogicalApi(apis.contactApiImpl) as ContactAndOrgApi;
const storeApi: DataStoreApi = apiHolder.api.getDataStoreApi();

export const renderContacts = (
  item: MailEntryModel,
  config?: {
    extraData?: string;
    model?: ContactModel;
    nameMap?: Record<string, string>;
    isSender?: boolean;
  }
) => {
  const { isThread: isMerging = false, _account } = item || {};
  const { extraData, model: storeContact, nameMap, isSender } = config || {};
  const titleArray: string[] = [];
  // 草稿箱 和 发信箱
  const inSenderFolder = item.entry.folder === 2 || item.entry.folder === 3;
  const showSender = isSender || inSenderFolder || extraData === 'localDraft';
  const set: Set<String> = new Set<String>();
  function addItem(citem: MailBoxEntryContactInfoModel, findNameFromRedux = false) {
    if (citem?.contactItem?.contactItemVal && !set.has(citem?.contactItem?.contactItemVal)) {
      const _contact = citem?.contact?.contact;
      if (!_contact) {
        return;
      }
      const email = contactApi.doGetModelDisplayEmail(citem?.contact);
      let name = '';
      if (findNameFromRedux && nameMap && Reflect.has(nameMap, email)) {
        name = nameMap[email];
      } else {
        name = _contact?.type !== 'external' && _contact.contactName ? _contact.contactName : citem.originName || _contact.contactName;
      }
      // todo: 需要获取当前账户
      titleArray.push(_account === email ? getIn18Text('WO') : name);
      set.add(citem?.contactItem?.contactItemVal);
    }
  }
  function addItemByStoreContact(citem: MailBoxEntryContactInfoModel, storeItem: ContactModel) {
    if (citem?.contactItem?.contactItemVal && !set.has(citem.contactItem.contactItemVal)) {
      const _contact = storeItem.contact;
      if (_contact) {
        const email = contactApi.doGetModelDisplayEmail(storeItem?.contact);
        const name = _contact?.type !== 'external' && _contact.contactName ? _contact.contactName : citem?.originName || _contact?.contactName;
        // todo: 需要获取当前账户
        titleArray.push(_account === email ? getIn18Text('WO') : name);
        set.add(citem?.contactItem?.contactItemVal);
      }
    }
  }
  // 展示收件人的文件夹 or 本地草稿
  if (showSender) {
    if (item.receiver && item.receiver.length > 0) {
      item.receiver.forEach(it => {
        addItem(it, true);
      });
    }
  } else if (item.senders && item.senders.length > 0) {
    if (item.senders.length == 1) {
      if (storeContact) {
        addItemByStoreContact(item?.senders[0], storeContact);
      } else {
        addItem(item?.senders[0]);
      }
    } else {
      item.senders.forEach(it => {
        addItem(it, true);
      });
    }
  } else {
    if (storeContact) {
      addItemByStoreContact(item?.sender, storeContact);
    } else {
      addItem(item?.sender);
    }
  }
  return (showSender && !isMerging ? getIn18Text('ZHI\uFF1A') : '') + titleArray.join('、');
};

export const defaultComAvatar = (props: MailCardComProps) => {
  const { data, size = 32 } = props;
  const senderContact = data?.sender?.contact?.contact;
  const { id, contactName, color } = senderContact || {};
  const email = contactApi.doGetModelDisplayEmail(senderContact);
  return (
    <AvatarTag
      className="avatar-item"
      size={size}
      contactId={id}
      propEmail={email}
      user={{
        avatar: senderContact?.avatar,
        name: contactName,
        color,
        email,
      }}
    />
  );
};

// 邮件列表 发件人
export const receiverComAvatar = (props: MailCardComProps) => {
  const { sendingMails } = useAppSelector(state => state.mailReducer);
  const { data, size = 32 } = props;
  const { entry } = data;
  const { id } = entry;
  const sendingMail = sendingMails.find(item => item.id === id);
  let defaultReceiver = data.receiver[0];

  let contactId;
  let email;
  const receiverContact = defaultReceiver?.contact?.contact;
  if (receiverContact) {
    contactId = receiverContact.id;
    email = contactApi.doGetModelDisplayEmail(receiverContact);
  }
  return (
    <AvatarTag
      className="avatar-item"
      size={size}
      contactId={contactId}
      propEmail={email}
      user={{
        avatar: data?.receiver?.length > 1 ? ReceiverAvatar : defaultReceiver?.contact?.contact?.avatar,
        name: receiverContact?.contactName,
        color: receiverContact?.color,
        email,
      }}
    >
      {/* 发信倒计时 */}
      {sendingMail && (
        <RevokeCountDown
          id={id}
          createTime={sendingMail.createTime}
          attrs={{
            strokeColor: '#94A6FF',
            strokeLinecap: 'butt',
            trailColor: 'rgba(0, 0, 0, 0.5)',
            strokeWidth: 7.5,
            width: 32,
          }}
          leftSecStyle={{
            width: '27px',
            height: '27px',
            fontWeight: 400,
            fontSize: '12px',
            color: 'white',
            background: 'rgba(0, 0, 0, 0.5)',
            lineHeight: '27px',
            display: 'block',
            borderRadius: '999px',
            overflow: 'hidden',
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        />
      )}
    </AvatarTag>
  );
};

export const defaultDesc = (props: MailCardComProps) => {
  const {
    data: { entry },
  } = props;
  let brief = '';
  const entryBrief = entry.brief || '';
  // 改成一个空格，是因为服务端目前无法配合提供摘要生成中的状态，所以暂时展示这个，让用户体验好一点 SIRIUS-2571
  const wuzhuti = ' ';
  // todo: 该正则带测试，看看是否能够正确工作
  const emptyBriefReg = /^\s*$/;
  // brief为空 或者 空白
  if (!entryBrief || emptyBriefReg.test(entryBrief)) {
    brief = wuzhuti;
  } else {
    brief = entryBrief;
  }
  return <span dangerouslySetInnerHTML={{ __html: brief }} />;
};

export const defaultDescFun = (props: MailCardComProps, contentReservable?: boolean) => {
  const {
    data: { entry },
  } = props;
  let brief = '';
  const entryBrief = entry.brief || '';
  const entryContent = entry?.content?.content || '';
  // 改成一个空格，是因为服务端目前无法配合提供摘要生成中的状态，所以暂时展示这个，让用户体验好一点 SIRIUS-2571
  const wuzhuti = ' ';
  // todo: 该正则带测试，看看是否能够正确工作
  const emptyBriefReg = /^\s*$/;
  // brief为空 或者 空白
  if (!entryBrief || emptyBriefReg.test(entryBrief)) {
    // 可用正文备用
    if (contentReservable) {
      const tmpDoc: Document = new DOMParser().parseFromString(entryContent, 'text/html');
      const tmpDocText = (tmpDoc.documentElement.innerText || '').substring(0, 30);
      if (tmpDocText) {
        brief = tmpDocText;
      } else {
        brief = wuzhuti;
      }
    } else {
      brief = wuzhuti;
    }
  } else {
    brief = entryBrief;
  }
  return <span dangerouslySetInnerHTML={{ __html: brief }} />;
};

export const defaultSender = (props: MailCardComProps) => {
  const { data, extraData } = props;
  const email = contactApi.doGetModelDisplayEmail(data?.sender?.contact);
  const model = useContactModel({
    contactId: data?.sender?.contact?.contact?.id,
    email: email,
    name: data?.sender?.contact?.contact?.contactName,
    needFull: false,
  });
  // 更新redux联系人数据
  // useUpdateContactModel({ email, name: data?.sender?.contact?.contact?.contactName, model });

  // 两种场景下需要同时去查询更新多个通讯录数据信息(聚合模式下有多个收件人/发件箱草稿箱有多个收件人)
  const isSender = useMemo(() => {
    if (data) {
      const accountAlias = systemApi.getCurrentUser(data?._account)?.prop?.accountAlias || [];
      const accountAliasArray = Array.isArray(accountAlias) ? accountAlias : [accountAlias];
      const senderEmail = contactApi.doGetModelDisplayEmail(data?.sender?.contact);
      return (
        accountAliasArray.some(account => accountApi.getIsSameSubAccountSync(account, senderEmail)) || accountApi.getIsSameSubAccountSync(senderEmail, data._account)
      );
    } else {
      return false; // 如果当前邮件是空，则不是我发出的
    }
  }, [data]);
  // const showSender = [2, 3].includes(data.entry.folder) || extraData === 'localDraft';
  const showSender = isSender || extraData === 'localDraft';
  const multipleContactModel = showSender ? data.receiver : data.senders && data.senders.length > 1 ? data.senders! : [];

  const nameMap = useContactModelNames({
    emails: multipleContactModel.map(item => {
      return item.contact?.contact?.accountName;
    }),
    enableQuery: showSender || (data.senders && data.senders.length > 1),
  });

  const empty = data?.entry.folder === 2 || data?.entry.folder === 3 ? getIn18Text('WUSHOUJIANREN') : getIn18Text('WUFAJIANREN');
  const senderInfo: string = renderContacts(data, { extraData, model, nameMap, isSender }) || empty;
  return <span dangerouslySetInnerHTML={{ __html: senderInfo }} />;
};

// 发件箱子文件夹
// export const SubFolderSender = (props: MailCardComProps) => {
//   const { data, extraData } = props;
//   const email = contactApi.doGetModelDisplayEmail(data?.sender?.contact);
//   const model = useContactModel({
//     contactId: data?.sender?.contact?.contact?.id,
//     email: email,
//     name: data?.sender?.contact?.contact?.contactName,
//     needFull: false,
//   });
//   const nameMap = useContactModelNames({
//     emails: data.receiver.map(item => {
//       return item.contact?.contact?.accountName;
//     }),
//     enableQuery: true,
//   });

//   const senderInfo: string = renderContacts(data, { extraData, model, nameMap, isSender: true }) || getIn18Text('WUSHOUJIANREN');
//   return <span dangerouslySetInnerHTML={{ __html: senderInfo }} />;
// };

export const defaultReceiver = (props: MailCardComProps) => {
  const { data, extraData } = props;
  const email = contactApi.doGetModelDisplayEmail(data?.sender?.contact);
  const model = useContactModel({
    contactId: data?.sender?.contact?.contact?.id,
    email: email,
    name: data?.sender?.contact?.contact?.contactName,
    needFull: false,
  });
  // 更新redux联系人数据
  // useUpdateContactModel({ email, name: data?.sender?.contact?.contact?.contactName, model });

  const senderInfo: string = renderContacts(data, { extraData, model }) || getIn18Text('WUSHOUJIANREN');
  return <span dangerouslySetInnerHTML={{ __html: senderInfo }} />;
};

export const defaultFromFlagAfter = (props: MailCardComProps) => {
  const { data } = props;
  const { isThread = false, taskId } = data || {};
  const { threadMessageCount } = data.entry || {};
  // const { status, total, completed, userType } = data.taskInfo || {};
  const { id, displayEmail, accountName } = data?.sender?.contact?.contact || {};
  return (
    <>
      {isThread && threadMessageCount > 1 ? <div className="from-count">{`${threadMessageCount > 99 ? '99+' : threadMessageCount}封`}</div> : <></>}
      <PersonalMark
        size={16}
        contactId={id}
        email={displayEmail || accountName}
        canOperate={false}
        visibleHover={false}
        // visibleToolTip
        noMarkedHidden={true}
        style={{ marginLeft: 4, width: 16, height: 16 }}
      />
      {/* 任务icon换到主题行，展示 */}
      {/* {taskId ?
            <span className="from-task">
             <span className="from-task-text">
              {
                [1,3,4,5,6,7].includes(userType) ? `任务${completed}/${total}` : '任务'
              }
             </span>
            </span> : <></>} */}
    </>
  );
};
// 任务放到主题行，主题前展示
// 1-创建人，2-执行人，3-创建人兼执行人，4-关注人，5-创建人兼关注人，6-执行人兼关注人，7-创建人兼关注人兼执行人
export const defaultComSummaryTask = (props: MailCardComProps) => {
  const { data } = props;
  const { taskId } = data || {};
  const { total, completed, userType } = data.taskInfo || {};
  return taskId ? (
    <div className="summary-extra-pre-warp">
      <span className="from-task-text">
        <ReadListIcons.TaskMailSvg />
        {[1, 3, 4, 5, 6, 7].includes(userType) ? `任务${completed}/${total}` : getIn18Text('RENWU')}
      </span>
    </div>
  ) : (
    <></>
  );
};
const setDeadLine = (type: number, overdue: boolean, deadline: number) => {
  switch (type) {
    case 0:
      return getIn18Text('WUJIEZHISHIJIAN');
      break;
    case 2:
      if (overdue) {
        return (
          <span style={{ color: '#F74F4F' }}>
            {dateFormat('YYYY-mm-dd', deadline * 1000, false)}
            {getIn18Text('JIEZHI')}
          </span>
        );
      } else {
        return dateFormat('YYYY-mm-dd', deadline * 1000, false);
      }
      break;
    case 1:
      if (overdue) {
        return (
          <span style={{ color: '#F74F4F' }}>
            {dateFormat('YYYY-mm-dd HH:MM', deadline * 1000, false)}
            {getIn18Text('JIEZHI')}
          </span>
        );
      } else {
        return dateFormat('YYYY-mm-dd HH:MM', deadline * 1000, false);
      }
      break;
  }
};
export const defaultTaskDeadLine = (props: MailCardComProps) => {
  const { data } = props;
  const { taskId } = data || {};
  // const { taskId } = data.entry || {};
  let { deadline, type, overdue, userType, contactList, executorList } = data.taskInfo || {};
  if (executorList) {
    if (executorList.length <= 6) {
      executorList = cloneDeep(executorList).reverse();
    } else {
      executorList = executorList.slice(0, 5).reverse();
    }
  }
  return (
    <>
      {taskId && userType != 4 ? (
        <>
          {
            <>
              <span className="progress-time-wrap">{setDeadLine(type, overdue, deadline)}</span>
              {[1, 3, 5, 7].includes(userType) && (
                <div style={{ marginRight: '6px', marginLeft: '10px' }}>
                  <div className="progress-user">
                    <div className="progress-user-item" hidden={executorList.length < 6}>
                      <i></i>
                      <i></i>
                      <i></i>
                    </div>
                    {executorList.map(_ => {
                      const contact = contactList.get(_.accId);
                      if (!contact) return null;
                      return (
                        <div className="progress-user-item">
                          <AvatarTag
                            size={20}
                            user={{
                              name: contact?.contact?.contactName,
                              avatar: contact?.contact?.avatar,
                              color: contact?.contact?.color,
                            }}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          }
        </>
      ) : (
        <></>
      )}
    </>
  );
};
// 列表 时间
export const defaultComTime = (props: MailCardComProps) => {
  const { data, active } = props;
  const [showConcreteTime] = useState2RM('configMailListShowConcreteTime');
  const { sendTime, isScheduleSend } = data.entry || {};
  return isScheduleSend ? (
    <span className="schedule-icon">
      {active ? <ReadListIcons.ScheduleSvgCof color="#7D8085" /> : <ReadListIcons.ScheduleSvgCof color="#386EE7" />}
      <span style={{ color: active ? '#7D8085' : '#386EE7' }}>{scheduleSendFormatTime(sendTime)}</span>
    </span>
  ) : (
    <>{showConcreteTime ? formatTimeWithHM(sendTime) : formatDigitalTime(sendTime)}</>
  );
};

export const defaultComSummary = (props: MailCardComProps) => {
  const { data } = props;
  const { title } = data.entry || {};
  return <>{title ? <span dangerouslySetInnerHTML={{ __html: title }} /> : <span>{getIn18Text('WUZHUTI')}</span>}</>;
};

export const defaultCardLongComSummary = (props: MailCardComProps) => {
  const { data, width } = props;
  const { title } = data.entry || {};
  /**
   *  是否对title进行最大宽度进行限制
   *  业务逻辑如下：
   *    通栏下，邮件列表需要尽量展示所有邮件标签，不限制标签的个数
   *    所已，会不断挤占摘要的空间
   *    但title可能会很长，为了给标签留出空间，需要必要的时候对title的宽度进行最大值限制。
   *    title不够畅的情况下，则
   *
   */
  const widthClassName = useMemo(() => {
    const titleMinWidth = 240;
    if (title && title.length * 12 > titleMinWidth) {
      // 预估文字宽度是否超过最大宽度
      // 463 为列表宽度与正文宽度的差值
      const warpWidth = width - 463;
      const tagWidth = 62;
      const tagNum = data?.tags?.length || 0;
      const tagMrgin = 11;
      const tagsWidth = (tagWidth + tagMrgin) * tagNum;
      // 如果标签宽度大于摘要最小宽度，则需要限制摘要的最大宽度
      return warpWidth - tagsWidth < titleMinWidth ? 'summary-content-maxwidth' : '';
    }
    // title不可缩小
    return 'summary-content-shirnk';
  }, [width, data]);

  return <>{title ? <span className={`summary-content ${widthClassName}`} dangerouslySetInnerHTML={{ __html: title }} /> : <span>{getIn18Text('WUZHUTI')}</span>}</>;
};
export const defaultComSummaryPreExtra = (props: MailCardComProps) => {
  const { data, active } = props;
  const { isIcs, praiseId } = data.entry || {};
  return isIcs || praiseId ? (
    <div className="summary-extra-pre-warp">
      {/* {active ? (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                // eslint-disable-next-line max-len
                d="M4.4 3.2V4H5.6V3.2H10.4V4H11.6V3.2H13.3V5.4H2.7V3.2H4.4ZM2.7 6.6V12.8H13.3V6.6H2.7ZM5.6 2H10.4V1H11.6V2H13.7C14.1418 2 14.5 2.35817 14.5 2.8V13.2C14.5 13.6418 14.1418 14 13.7 14H2.3C1.85817 14 1.5 13.6418 1.5 13.2V2.8C1.5 2.35817 1.85817 2 2.3 2H4.4V1H5.6V2Z"
                fill="#ffffff"
              />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                // eslint-disable-next-line max-len
                d="M4.4 3.2V4H5.6V3.2H10.4V4H11.6V3.2H13.3V5.4H2.7V3.2H4.4ZM2.7 6.6V12.8H13.3V6.6H2.7ZM5.6 2H10.4V1H11.6V2H13.7C14.1418 2 14.5 2.35817 14.5 2.8V13.2C14.5 13.6418 14.1418 14 13.7 14H2.3C1.85817 14 1.5 13.6418 1.5 13.2V2.8C1.5 2.35817 1.85817 2 2.3 2H4.4V1H5.6V2Z"
                fill="#386EE7"
              />
            </svg>
          )} */}
      {praiseId ? (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="8.00002" cy="9.33333" r="5.33333" stroke="#AA90F4" />
          <circle cx="7.99998" cy="9.33335" r="2.66667" stroke="#AA90F4" />
          <path
            d="M12.6227 3.41017L13.0568 3.65824L12.6227 3.41017ZM5.10077 5.41858L3.81135 3.1621L2.94311 3.65824L4.23252 5.91472L5.10077 5.41858ZM3.83331 3.24479V1.66665H2.83331V3.24479H3.83331ZM3.66665 1.83331H12.3333V0.833313H3.66665V1.83331ZM12.1666 1.66665V3.24479H13.1666V1.66665H12.1666ZM12.1886 3.1621L10.8992 5.41858L11.7674 5.91472L13.0568 3.65824L12.1886 3.1621ZM12.1666 3.24479C12.1666 3.21579 12.1742 3.18728 12.1886 3.1621L13.0568 3.65824C13.1288 3.53233 13.1666 3.38981 13.1666 3.24479H12.1666ZM12.3333 1.83331C12.2413 1.83331 12.1666 1.75869 12.1666 1.66665H13.1666C13.1666 1.20641 12.7936 0.833313 12.3333 0.833313V1.83331ZM3.83331 1.66665C3.83331 1.75869 3.75869 1.83331 3.66665 1.83331V0.833313C3.20641 0.833313 2.83331 1.20641 2.83331 1.66665H3.83331ZM3.81135 3.1621C3.82574 3.18728 3.83331 3.21579 3.83331 3.24479H2.83331C2.83331 3.38981 2.87116 3.53233 2.94311 3.65824L3.81135 3.1621Z"
            fill="#AA90F4"
          />
          <path d="M6 1V4.33333" stroke="#AA90F4" />
          <path d="M10 1V4.33333" stroke="#AA90F4" />
        </svg>
      ) : (
        <></>
      )}
      {isIcs ? (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            // eslint-disable-next-line max-len
            d="M4.4 3.2V4H5.6V3.2H10.4V4H11.6V3.2H13.3V5.4H2.7V3.2H4.4ZM2.7 6.6V12.8H13.3V6.6H2.7ZM5.6 2H10.4V1H11.6V2H13.7C14.1418 2 14.5 2.35817 14.5 2.8V13.2C14.5 13.6418 14.1418 14 13.7 14H2.3C1.85817 14 1.5 13.6418 1.5 13.2V2.8C1.5 2.35817 1.85817 2 2.3 2H4.4V1H5.6V2Z"
            fill="#386EE7"
          />
        </svg>
      ) : (
        <></>
      )}
    </div>
  ) : null;
};
// 默认只展示红旗，没有功能
export const defaultComSummaryExtra = (props: MailCardComProps) => {
  const { data } = props;
  const { mark } = data.entry || {};
  return <div className="red-flag">{mark === 'redFlag' ? <ReadListIcons.RedFlagSvg /> : ''}</div>;
};
// 有提示的红旗展示
export const CardOperRedFlag = (props: MailCardComProps) => {
  const { data, active } = props;
  const { mark } = data.entry || {};
  return (
    <div className="flag">
      {mark === 'redFlag' ? (
        <Tooltip title={getIn18Text('QUXIAOHONGQI')} mouseEnterDelay={0.3} mouseLeaveDelay={0.15}>
          <span className="red">
            <ReadListIcons.RedFlagSvg />
          </span>
        </Tooltip>
      ) : (
        <Tooltip title={getIn18Text('BIAOWEIHONGQI')} mouseEnterDelay={0.3} mouseLeaveDelay={0.15}>
          <span className="grey flag-icon">
            <ReadListIcons.FlagSvg />
          </span>
        </Tooltip>
      )}
    </div>
  );
};
// 默认状态展示组件
export const defaultComStatus = (props: MailCardComProps) => {
  const { data } = props;
  // const isCorpMail = systemApi.getIsCorpMailMode();
  const { sendStatus } = data.entry || {};
  // if (isCorpMail) return null;
  return sendStatus ? (
    <span className={`${sendStatus === 'sending' ? 'sending' : ''}`}>
      {sendStatus == 'sending' ? getIn18Text('FASONGZHONG..') : ''}
      {sendStatus == 'sentFailed' ? getIn18Text('YOUJIANFASONGSHI11') : ''}
      {sendStatus == 'sentNetworkFailed' ? getIn18Text('YOUJIANFASONGSHI12') : ''}
    </span>
  ) : null;
};
// 简略标签 - 暂无使用。1.29版本标记
export const defaultSimpleTag = (props: MailCardComProps) => {
  const { data, hideTagName } = props;
  const { tags, isTpMail } = data || {};
  const _tags = tags?.filter(item => item !== hideTagName);
  const color = _tags?.map(tag => mailManagerApi.getTagColor(tag) || '#d9d9d9');
  return color && color.length && !isTpMail ? (
    <span style={{ marginLeft: '3px', height: '16px' }}>
      <ReadListIcons.MailTagSvg color={color} />
    </span>
  ) : (
    <></>
  );
};

// 正常标签-分栏通栏都使用在这个 1.29版本标记
export const defaultTag = (props: MailCardComProps) => {
  const { data, hideTagName } = props;
  const { tags } = data || {};
  const _tags = tags?.filter(item => item !== hideTagName);
  // todo: 标签的颜色，应该在数据组装的时候就携带，现在查询的方式有问题
  return _tags && _tags.length ? (
    <>
      {[
        <MailTag style={{ marginLeft: '7px' }} fontColor={mailManagerApi.getTagFontColor(_tags[0])} limit color={mailManagerApi.getTagColor(_tags[0], true)}>
          {_tags[0]}
        </MailTag>,
        _tags.length > 1 ? (
          <MailTag style={{ marginLeft: '5px' }} more fontColor="#6F7485">
            ...
          </MailTag>
        ) : (
          ''
        ),
      ]}{' '}
    </>
  ) : (
    <></>
  );
};

// 平铺展示所有标签
export const defaultAllTag = (props: MailCardComProps) => {
  const { data, hideTagName } = props;
  const { tags } = data || {};
  const _tags = tags?.filter(item => item !== hideTagName);
  // todo: 标签的颜色，应该在数据组装的时候就携带，现在查询的方式有问题
  return _tags && _tags.length ? (
    <div style={{ display: 'flex', flex: '1', alignItems: 'center' }}>
      {_tags.map(tag => {
        return (
          <MailTag style={{ marginLeft: '7px' }} fontColor={mailManagerApi.getTagFontColor(tag)} limit color={mailManagerApi.getTagColor(tag, true)}>
            {tag}
          </MailTag>
        );
      })}
    </div>
  ) : (
    <></>
  );
};

// 阅读状态追踪是否开启（内存方式返回比storage快）
let stateTrackOpen: null | boolean = null;

// 防抖方式重置
const debounceResetStateTrackOpen = debounce(() => (stateTrackOpen = null), 1000);

// 尊享版获取追踪状态
export const getSiriusStateTrack = () => {
  if (typeof stateTrackOpen === 'boolean') {
    debounceResetStateTrackOpen();
    return stateTrackOpen;
  }
  try {
    const stateTrack = storeApi.getSync('stateTrack').data;
    if (stateTrack === 'OFF') {
      stateTrackOpen = false;
    } else {
      stateTrackOpen = true;
    }
    return stateTrackOpen;
  } catch (error) {
    console.log('getSiriusStateTrack error', error);
    return true;
  }
};

// 发件箱已读未读状态展示
export const defaultSendReadStatus = (props: MailCardComProps) => {
  const {
    productVersionInfo: { productVersionId },
  } = useGetProductAuth();
  // 免费版不显示已读未读状态
  if (productVersionId === 'free') {
    return null;
  }
  const { data } = props;
  const { authAccountType } = data;
  const {
    innerCount = 0, // 域内收件人数
    rcptCount = 0, // 总收件人数
    innerRead = 0, // 域内已读数
    readCount = 0, // 总已读数
    openCount = 0,
  } = data.entry || {};
  // 三方账号发信，展示打开记录
  if (authAccountType && authAccountType !== '0') {
    const dateArr = data.entry.sendTime?.trim()?.split(/\s+/);
    const dayLimit = mailManagerApi.getMailDayLimit();
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
    // 发送时间超过30天的，直接不展示
    if (isBeforeday) {
      return <></>;
    } else {
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center' }}>
          <IconCard type="tongyong_yuedu" />
          <span style={{ marginLeft: 4 }}>{getIn18Text('DAKAICI', { openCount: openCount || 0 })}</span>
        </span>
      );
    }
  }
  let readCont = '';
  // 尊享版
  if (productVersionId === 'sirius') {
    if (readCount != null && rcptCount != null) {
      const stateTrackOpen = getSiriusStateTrack();
      let [readedCount, unreadCount] = [0, 0];
      if (stateTrackOpen) {
        readedCount = +readCount;
        unreadCount = +rcptCount - +readCount;
      } else {
        readedCount = +innerRead;
        unreadCount = +rcptCount - +innerRead;
      }
      readCont = `${readedCount} ${getIn18Text('YIDU')} · ${unreadCount} ${getIn18Text('WEIDU')} `;
    }
  } else {
    // 其他版本
    if (innerRead != null && innerRead != null) {
      readCont = `${+innerRead} ${getIn18Text('YIDU')} · ${+rcptCount - +innerRead} ${getIn18Text('WEIDU')} `;
    }
  }
  return (rcptCount || readCount) && readCont ? <span>{readCont}</span> : null;
};
// edm邮件列表标签
export const defaultCustomerLabelAfter = (props: MailCardComProps) => {
  const { data } = props;
  const { isThread = false, _account } = data || {};
  const { threadMessageCount } = data.entry || {};
  const isSent = useMemo(() => {
    if (data) {
      const accountAlias = systemApi.getCurrentUser(data?._account)?.prop?.accountAlias || [];
      const accountAliasArray = Array.isArray(accountAlias) ? accountAlias : [accountAlias];
      const senderEmail = contactApi.doGetModelDisplayEmail(data?.sender?.contact);
      return (
        accountAliasArray.some(account => accountApi.getIsSameSubAccountSync(account, senderEmail)) || accountApi.getIsSameSubAccountSync(senderEmail, data._account)
      );
    } else {
      return false; // 如果当前邮件是空，则不是我发出的
    }
  }, [data]);
  const marginLeft = isThread && threadMessageCount > 1 ? '-4px' : '4px';
  const style = {
    marginRight: '6px',
    marginLeft,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  };
  return isSent ? <CustomerLabelAfterCom {...props} /> : <CustomerLabel style={style} contact={data?.sender?.contact} curAccount={_account} />;
};

// edm邮件列表客户标签,我发出的信的标签规则
const CustomerLabelAfterCom = (props: MailCardComProps) => {
  const { data } = props;
  const { receiver, _account, isThread = false } = data;
  const { threadMessageCount } = data.entry || {};
  // 发信的标签判断仅仅基于收信
  const emails = receiver?.filter(item => item.mailMemberType === 'to')?.map(item => contactApi.doGetModelDisplayEmail(item.contact));
  const receiversContactModels = useContactModelList(emails, _account);
  // 我的客户
  const myCustomer = useMemo(() => receiversContactModels.find(item => item?.customerOrgModel?.role === 'myCustomer'), [receiversContactModels]);
  // 同事客户
  const colleagueCustomer = useMemo(
    () => receiversContactModels.find(item => item?.customerOrgModel?.role === 'colleagueCustomer' || item?.customerOrgModel?.role === 'colleagueCustomerNoAuth'),
    [receiversContactModels]
  );
  // 公海客户
  const openSeaCustomer = useMemo(() => receiversContactModels.find(item => item?.customerOrgModel?.role === 'openSeaCustomer'), [receiversContactModels]);
  // 我的线索
  const myClue = useMemo(() => receiversContactModels.find(item => item?.customerOrgModel?.role === 'myClue'), [receiversContactModels]);
  // 同事线索
  const colleagueClue = useMemo(
    () => receiversContactModels.find(item => item?.customerOrgModel?.role === 'colleagueClue' || item?.customerOrgModel?.role === 'colleagueClueNoAuth'),
    [receiversContactModels]
  );
  // 公海线索
  const openSeaClue = useMemo(() => receiversContactModels.find(item => item?.customerOrgModel?.role === 'openSeaClue'), [receiversContactModels]);
  // 最终展示的联系人
  const contactModel = useMemo(() => myCustomer || myClue || colleagueCustomer || colleagueClue || openSeaCustomer || openSeaClue || null, [receiversContactModels]);
  const marginLeft = isThread && threadMessageCount > 1 ? '-4px' : '4px';
  const style = {
    marginRight: '6px',
    marginLeft,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  };
  return contactModel ? <CustomerLabel style={style} contact={contactModel} curAccount={_account} /> : null;
};
