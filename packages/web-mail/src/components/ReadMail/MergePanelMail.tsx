import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';

import { Collapse, Tooltip, Pagination, BackTop, Dropdown, Menu } from 'antd';
const { Panel } = Collapse;
import Header from './Header';
import AvatarTag from '@web-common/components/UI/Avatar/avatarTag';
import { MAIL_MENU_ITEM, THREAD_MAIL_PAGE_SIZE } from '../../common/constant';
import ContentTips from './ContentTips';
import useState2RM from '../../hooks/useState2ReduxMock';
import {
  apiHolder as api,
  apis,
  MailEntryModel,
  MailConfApi,
  MailOperationType,
  SystemApi,
  inWindow,
  MailApi,
  MailEmoticonInfoModel,
  apiHolder,
  HtmlApi,
  TranslatStatusInfo,
  getIn18Text,
  AccountApi,
  DataStoreApi,
  MailDeliverStatusItem,
} from 'api';
import { MailStatus, formatDigitalTime, changeContentByLocal, systemIsWindow, OpenRecord, OpenRecordData, formatReadStatus, MailItemStatus } from '../../util';
import Content, { ContentRef } from './content/Content';
import IconCard from '@web-common/components/UI/IconCard';
import ReadListIcons from '@web-common/components/UI/Icons/svgs/ReadListSvgs';
import lodashGet from 'lodash/get';
import ReplyWrap from './ReplyWrap';
import { TreadMailPageConfig, FeatureConfig } from '../../types';
import { FLOLDER } from '@web-mail/common/constant';
import useDebounceForEvent from '@web-common/hooks/useDebounceForEvent';
import useStateRef from '@web-mail/hooks/useStateRef';
import useGetReadStatus from '@web-mail/components/ReadMail/hooks/useGetReadStatus';
import useCreateCallbackForEvent from '@web-mail/hooks/useCreateCallbackForEvent';

interface Props {
  activeKey: string[];
  handleSignlDelete: (mailId: string) => void;
  // handleWithDraw(mid: string): void;
  readOnly?: boolean;
  content: MailEntryModel;
  forceUpdate?: boolean;
  featureConfig?: FeatureConfig;
  senderContactMap: Record<string, string>;
  showAttachCount: number;
  ckey: number;
  // refreshData(): void;
  handleRemark(mark: boolean, mid: string | string[], type: MailOperationType, isThread?: boolean): void;
  handleTranslateLang(value: string): void;
  translateInfoMidMap: { [key: string]: TranslatStatusInfo };
  unlockMail?: (unlockCont: MailEntryModel) => void;
  replayFixed?: boolean;
  // listData?: MailStatus;
}

const systemApi = api.api.getSystemApi() as SystemApi;
const mailManagerApi = api.api.requireLogicalApi(apis.mailConfApiImpl) as MailConfApi;
const htmlApi = apiHolder.api.requireLogicalApi(apis.htmlApi) as HtmlApi;
const eventApi = api.api.getEventApi();
const mailApi = api.api.requireLogicalApi(apis.mailApiImpl) as MailApi;
const accountApi = api.api.requireLogicalApi(apis.accountApiImpl) as AccountApi;
const storeApi: DataStoreApi = api.api.getDataStoreApi();
const productAuthApi = api.api.requireLogicalApi(apis.productAuthApiImpl) as ProductAuthApi;

const MergePanelMail: React.FC<Props> = props => {
  const {
    activeKey,
    handleSignlDelete,
    // handleWithDraw,
    readOnly,
    content,
    featureConfig,
    senderContactMap,
    showAttachCount,
    handleRemark,
    ckey,
    // listData,
    // refreshData,
    handleTranslateLang,
    translateInfoMidMap,
    unlockMail,
    forceUpdate,
    vScrolling,
    setContentWidth,
    HorizontalScrollWrapComponent,
    replayFixed,
  } = props;

  // 邮件是否点赞
  const [emotionInfo, setEmotionInfo] = useState<MailEmoticonInfoModel>();

  // 是否展示邮件信头
  const [showMailHead, setShowMailHead] = useState<boolean>(false);
  // 是否展示邮件头像
  const [showAvator] = useState2RM('configMailListShowAvator');
  // 是否自动标记邮件已读
  const shouldAutoReadMail = mailManagerApi.getShouldAutoReadMailSync();
  // 当前邮件的额所属账号
  const account = useMemo(() => {
    return content?._account || systemApi.getCurrentUser()?.id;
  }, [content]);
  // 邮件正文容器的ref
  const contentRef = useRef<ContentRef[]>([]);

  const MailContentRef = useStateRef(content);

  // 当前容器是否激活
  const isActive = useMemo(() => {
    return activeKey.indexOf(`${content.entry.id}`) > -1;
  }, [activeKey, content]);

  // // 当前邮件的阅读状态
  // const mailAccountRef = useStateRef(content?._account);

  // 设置邮件点赞信息
  const handleEmoticon = (data: MailEmoticonInfoModel, mid: string) => {
    setEmotionInfo(data);
  };

  // 标记邮件已读
  const handleMailMarkRead = (mid: string, _account?: string) => {
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

  // 获取邮件点赞信息
  const getEmotionInfoByKey = async () => {
    if (!emotionInfo && content) {
      const emotionInfo = await mailApi.getThumbUpInfo(content?.id, content.entry.tid || '');
      setEmotionInfo(emotionInfo);
    }
  };

  // 请求邮件点赞信息
  useEffect(() => {
    if (isActive) {
      getEmotionInfoByKey();
    }
  }, [isActive]);

  const { setOpenRecordData, readStatus, debounceGetStatusOrDetail, getStatusOrDetail } = useGetReadStatus(content);

  // 刷新阅读、撤回列表
  const refreshData = useCreateCallbackForEvent(() => {
    const id = content?.id;
    if (!id) return;
    getStatusOrDetail(content);
  });

  // // 获取邮件阅读状态
  // const [openRecordData, setOpenRecordData] = useState<OpenRecordData>();
  // //
  // const [readStatus, setReadStatus] = useState<MailStatus>();

  // // 根据版本获取阅读状态
  // const formatReadStatusByProduct = (list: MailDeliverStatusItem[]) => {
  //   const listData = formatReadStatus(list);
  //   const versionId = productAuthApi.doGetProductVersionId();
  //   // 尊享版
  //   if (versionId === 'sirius') {
  //     const stateTrack = storeApi.getSync('stateTrack').data;
  //     // 域外追踪如果关闭 域外的阅读状态视为未知
  //     if (stateTrack === 'OFF') {
  //       // 内域列表
  //       const domainList = lodashGet(systemApi.getCurrentUser(), 'prop.domainList', []);
  //       listData.data = (listData.data || []).map((listItem: MailItemStatus) => {
  //         const item = { ...listItem };
  //         const { email } = item;
  //         if (email) {
  //           const suffix = email.split('@')[1];
  //           // 外域
  //           if (suffix && !domainList.includes(suffix)) {
  //             item.status = 'outdomain';
  //             item.text = getIn18Text('EMAIL_READ_STATUS_SERVER_RECEIVE');
  //             item.color = '';
  //           }
  //         }
  //         return item;
  //       });
  //     }
  //     return listData;
  //   }
  //   if (versionId === 'free') {
  //     if (listData.data) {
  //       listData.data.forEach(item => {
  //         item.status = 'unkown';
  //         if (item.result === 109) {
  //           item.text = getIn18Text('EMAIL_READ_STATUS_SERVER_RECEIVE');
  //         }
  //         item.color = '';
  //       });
  //     }
  //   } else {
  //     if (listData.data) {
  //       listData.data.forEach(item => {
  //         if (!item?.inner) {
  //           item.status = 'unkown';
  //           if (item.result === 109) {
  //             item.text = getIn18Text('EMAIL_READ_STATUS_SERVER_RECEIVE');
  //           }
  //           item.color = '';
  //         }
  //       });
  //     }
  //   }
  //   return listData;
  // };

  // const getMailReadCount = async (content: MailEntryModel) => {
  //   const { id, entry, sender } = content;
  //   const { tid } = entry;
  //   try {
  //     // setCurrentAccount(mailAccount);
  //     const res = await mailApi.doGetMailReadCount({
  //       mid: id,
  //       tid,
  //       fromEmail: sender.contact.contact.accountName,
  //       _account: mailAccountRef.current,
  //     });
  //     console.log('getMailReadCount', res);
  //     const { code, data, message } = res;
  //     if (code === 0) {
  //       if (data.count === 1) {
  //         getMailReadDetail(content);
  //       } else {
  //         setOpenRecordData({
  //           count: data.count || 0,
  //           records: [],
  //         });
  //       }
  //       return;
  //     }
  //     console.log('doGetMailReadCount fail', message);
  //     setOpenRecordData({ count: 0, records: [] });
  //   } catch (error) {
  //     console.log('doGetMailReadCount error', error);
  //     setOpenRecordData({ count: 0, records: [] });
  //   }
  // };

  // const getMailReadDetail = async (content: MailEntryModel) => {
  //   const { id, entry, sender } = content;
  //   const { tid } = entry;
  //   try {
  //     // setCurrentAccount(mailAccount);
  //     const res = await mailApi.doGetMailReadDetail({
  //       mid: id,
  //       tid,
  //       fromEmail: sender.contact.contact.accountName,
  //       _account: mailAccountRef.current,
  //     });
  //     console.log('getMailReadDetail', res);
  //     const { code, data, message } = res;
  //     if (code === 0) {
  //       const systemTimeZone = systemApi.getSystemTimeZone();
  //       if (systemTimeZone) {
  //         const records = data.readList || [];
  //         const dealedRecords: OpenRecord[] = [];
  //         const now = moment();
  //         records.forEach((item: OpenRecord) => {
  //           let settingTime = '';
  //           if (item.currentLocalTime) {
  //             const settingMoment = systemApi.timeZoneTrans(item.currentLocalTime, 8, systemTimeZone.key);
  //             // 同一年展示月日
  //             if (now.year() === settingMoment?.year()) {
  //               settingTime = settingMoment?.format('MM-DD HH:mm') || '';
  //               // 远端时间一起改
  //               item.remoteLocalTime = item.remoteLocalTime ? moment(item.remoteLocalTime).format('MM-DD HH:mm') || '' : '';
  //             } else {
  //               // 跨年 展示年月日
  //               settingTime = settingMoment?.format('YYYY-MM-DD HH:mm') || '';
  //             }
  //           }
  //           dealedRecords.push({
  //             ...item,
  //             settingTime,
  //             settingTimeZone: systemTimeZone?.value,
  //           });
  //         });
  //         setOpenRecordData({
  //           count: dealedRecords.length,
  //           records: dealedRecords,
  //         });
  //         return;
  //       }
  //     }
  //     console.log('doGetMailReadDetail fail', message);
  //     setOpenRecordData({ count: 0, records: [] });
  //   } catch (error) {
  //     console.log('doGetMailReadDetail error', error);
  //     setOpenRecordData({ count: 0, records: [] });
  //   }
  // };

  // const getReadStatus = async (mailEntry: MailEntryModel) => {
  //   try {
  //     // 获取当前用户账户别名
  //     const currentUser = systemApi.getCurrentUser(mailEntry?._account);
  //     const accountAlias = currentUser?.prop?.accountAlias || [];
  //     const accountAliasArray = Array.isArray(accountAlias) ? accountAlias : [accountAlias];

  //     // 检查邮件是否由当前用户发送
  //     const sender = mailEntry?.sender;
  //     const isMySend = accountAliasArray.some(item => {
  //       return accountApi.getIsSameSubAccountSync(item, sender?.contact?.contact?.accountName);
  //     });

  //     // 确定用于检查阅读状态的电子邮件 ID
  //     let emailId = mailEntry.id;
  //     if (isMySend) {
  //       emailId = mailEntry?.entry?.sentMailId || mailEntry.id;
  //     }

  //     // 获取阅读状态信息
  //     const readStatusData = await mailApi.doCheckReadStatus(emailId, mailAccountRef.current);
  //     const formattedReadStatus = formatReadStatusByProduct(readStatusData.detail);
  //     setReadStatus(formattedReadStatus);
  //   } catch (error) {
  //     console.error(`获取邮件阅读状态失败：${error}`);
  //   }
  // };

  // const getStatusOrDetail = (content: MailEntryModel) => {
  //   if (!content) return;
  //   const { isTpMail, authAccountType } = content;
  //   // 发信箱(只要是发件即可) 非Tp
  //   const accountAlias = systemApi.getCurrentUser(content?._account)?.prop?.accountAlias || [];
  //   const accountAliasArray = Array.isArray(accountAlias) ? accountAlias : [accountAlias];
  //   const senderEmail = content?.sender?.contact?.contact?.accountName || '';
  //   // 在发件箱 || 别名邮箱里面包含发件人 || 发件人 == 归属账号， 认为是自己发出的
  //   const isSend =
  //     content?.entry?.folder === FLOLDER.SENT ||
  //     accountAliasArray.some(account => accountApi.getIsSameSubAccountSync(account, senderEmail)) ||
  //     accountApi.getIsSameSubAccountSync(senderEmail, content._account);
  //   if (isSend && !isTpMail) {
  //     // 非正式
  //     if (authAccountType && authAccountType !== '0') {
  //       getMailReadCount(content);
  //       return;
  //     }
  //     // 其他
  //     getReadStatus(content);
  //   }
  // };

  // const debounceGetStatusOrDetail = useDebounceForEvent((content: MailEntryModel | null) => {
  //   if (!content) return;
  //   getStatusOrDetail(content);
  // }, 500);

  useEffect(() => {
    if (isActive) {
      // 等待邮件正文加载完成
      setTimeout(() => {
        setOpenRecordData({ count: 0, records: [] });
        debounceGetStatusOrDetail(MailContentRef.current);
      }, 1000);
    }
  }, [isActive]);

  // 过滤掉props中的一些属性，防止透传到dom上
  const otherProps = useMemo(() => {
    return {
      ...props,
      // activeKey: undefined,
      handleSignlDelete: undefined,
      readOnly: undefined,
      content: undefined,
      featureConfig: undefined,
      senderContactMap: undefined,
      showAttachCount: undefined,
      handleRemark: undefined,
      ckey: undefined,
      listData: undefined,
      refreshData: undefined,
      handleTranslateLang: undefined,
      translateInfoMidMap: undefined,
      unlockMail: undefined,
      forceUpdate: undefined,
      vScrolling: undefined,
      setContentWidth: undefined,
      HorizontalScrollWrapComponent: undefined,
      replayFixed: undefined,
    };
  }, [props]);

  return (
    <Panel
      // 必须透传props才能正常工作
      {...otherProps}
      showArrow={false}
      header={
        isActive ? (
          <Header
            // 聚合模式下的head按照聚合展示
            isMerge={true}
            content={content}
            handleDelete={handleSignlDelete}
            // handleWithDraw={handleWithDraw}
            readOnly={readOnly}
            showMailDiscuss={featureConfig?.mailDiscuss}
            mailTagCloseAble={featureConfig?.mailTagIsCloseAble}
            menu={[
              {
                key: MAIL_MENU_ITEM.MAIL_WITHDRAW_RES,
                show: false,
              },
              {
                key: MAIL_MENU_ITEM.MAIL_WITHDRAW,
                show: false,
              },
              {
                key: MAIL_MENU_ITEM.EMAIL_HEADER,
                name: mail => {
                  return showMailHead ? '查看邮件' : '查看信头';
                },
                onClick: mails => {
                  setShowMailHead(!showMailHead);
                },
              },
            ]}
          />
        ) : (
          <div className="u-item-block">
            {showAvator ? (
              <AvatarTag
                size={32}
                contactId={content?.sender?.contact?.contact?.id}
                user={{
                  color: content?.sender?.contact?.contact?.color,
                  name: content?.sender?.contact?.contact?.contactName,
                  avatar: content?.sender?.contact?.contact?.avatar,
                }}
              />
            ) : (
              <></>
            )}
            <div className="u-item-block-content" style={{ width: content.taskId ? '50px' : '82px', marginRight: content.taskId ? '4px' : '16px' }}>
              {shouldAutoReadMail && <div className="u-item-block-read" hidden={content.entry.readStatus === 'read'} />}
              {!shouldAutoReadMail && (
                <div
                  className="u-item-block-markread"
                  onClick={ev => {
                    handleMailMarkRead(content.entry.id, content._account);
                    if (ev) {
                      ev.preventDefault();
                      ev.stopPropagation();
                    }
                  }}
                  hidden={content.entry.readStatus === 'read'}
                >
                  <div className="u-item-block-markread-dot"></div>
                </div>
              )}
              {content.entry.suspiciousSpam && (
                <div className="u-item-block-suspicious">
                  <ReadListIcons.SuspiciousSvg />
                </div>
              )}
              {typeof content.entry.priority === 'number' && content.entry.priority < 2 && (
                <Tooltip title={getIn18Text('JINJIYOUJIAN')} placement="top">
                  <div className="u-item-block-alarm">
                    <IconCard type="alarm" />
                  </div>
                </Tooltip>
              )}
              {account === content?.sender?.contact?.contact?.accountName
                ? getIn18Text('WO')
                : lodashGet(senderContactMap, content?.sender?.contact?.contact?.accountName, content?.sender?.contact?.contact?.contactName)}
            </div>
            <span className="u-item-block-task" hidden={!content.taskId}>
              {getIn18Text('RENWU')}
            </span>
            <div className="u-item-block-text">{content?.entry?.brief ? htmlApi.decodeHtml(content?.entry?.brief.trim()) : ''}</div>
            <div className="u-item-block-svg">
              {content?.entry?.eTeamType === 1 && <IconCard type="chat" />}
              {showAttachCount > 0 ? <ReadListIcons.AttachSvgLarge /> : ''}
              {content.entry.mark === 'redFlag' ? (
                <span
                  style={{ display: 'flex', alignItems: 'center' }}
                  onClick={e => {
                    e.stopPropagation();
                    !readOnly && handleRemark(false, content?.id, 'redFlag');
                  }}
                >
                  <ReadListIcons.RedFlagSvg />
                </span>
              ) : (
                <span
                  style={{ display: 'flex', alignItems: 'center' }}
                  onClick={e => {
                    e.stopPropagation();
                    !readOnly && handleRemark(true, content?.id, 'redFlag');
                  }}
                  className="flag"
                >
                  <ReadListIcons.FlagSvg />
                </span>
              )}
            </div>
            <div className="u-item-block-time">{formatDigitalTime(content?.entry.sendTime)}</div>
          </div>
        )
      }
      key={content.entry.id}
      id={'collapse' + content.entry.id}
      data-test-id={`mail-thread-panel-${ckey}`}
    >
      <div className="mail-read-content-wrap">
        {readOnly ? (
          <></>
        ) : (
          <ContentTips
            listData={readStatus}
            refreshData={refreshData}
            emoticonInfo={emotionInfo}
            handleEmoticon={handleEmoticon}
            // content={localContent}
            content={content}
            featureConfig={featureConfig}
            handleTranslateLang={value => {
              handleTranslateLang(content?.entry?.id, value);
            }}
            translateInfo={translateInfoMidMap[content?.entry?.id]}
            unlockMail={unlockMail}
            style={{ marginTop: '8px' }}
            showMailHead={showMailHead}
            onShowMailHeadChange={setShowMailHead}
            forceUpdate={forceUpdate}
          />
        )}
        {vScrolling ? <div className="mail-read-content-mask" /> : <></>}
        <Content
          merge
          showWrap
          ref={re => {
            if (re) {
              contentRef.current[ckey] = re;
              re.key = content.entry.id;
            }
          }}
          content={content}
          listData={readStatus}
          // mid={id}
          forceUpdate={forceUpdate}
          HorizontalScrollWrapComponent={HorizontalScrollWrapComponent}
          onIframeInitMinWidth={width => {
            setContentWidth(content.entry.id, width);
          }}
          onIframeWidthChange={width => {
            setContentWidth(content.entry.id, width);
          }}
        />
        {readOnly ? <></> : <ReplyWrap content={content} mid={content?.entry?.id} nofix={replayFixed} handleEmoticon={handleEmoticon} emoticonInfo={emotionInfo} />}
      </div>
    </Panel>
  );
};

export default MergePanelMail;
