/* eslint-disable react/jsx-pascal-case */
import React, { useState, useRef, useEffect, ReactElement, useMemo, useCallback } from 'react';
import dayjs from 'dayjs';
import { Tooltip } from 'antd';
import {
  apiHolder as api,
  SystemApi,
  apiHolder,
  MailEntryModel,
  apis,
  inWindow,
  ProductTagEnum,
  HtmlApi,
  // DataStoreApi,
  // locationHelper,
  // NIMApi,
  // edmMailHelper,
  DataTrackerApi,
  MailConfApi,
  MailBoxEntryContactInfoModel,
  ContactAndOrgApi,
  AccountApi,
} from 'api';
import classnames from 'classnames';
import ReadListIcons from '@web-common/components/UI/Icons/svgs/ReadListSvgs';
// import { MailActions } from '@web-common/state/reducer';
import AvatarTag from '@web-common/components/UI/Avatar/avatarTag';
import TitleRightContextMenu from '@web-common/components/UI/ContextMenu/TextContextMenu';
import IconCard from '@web-common/components/UI/IconCard';
import { useAppSelector } from '@web-common/state/createStore';
import ProductAuthTag from '@web-common/components/UI/ProductAuthTag/ProductAuthTag';
// import HollowOutGuide from '@web-common/components/UI/HollowOutGuide/hollowOutGuide';
import CustomerLabel from '@web-mail/components/ReadMail/component/CustomerLabel';
import MailMenuIcon from '@web-mail/common/components/MailMenu/MailMenuIcon/MailMenuIcon';
import ReadMailIconMenuRightConfig from '@web-mail/common/components/MailMenu/mailMenuConifg/ReadMailIconMenuRightConfig';
import ReadMailSignMenuConfig from '@web-mail/common/components/MailMenu/mailMenuConifg/ReadMailSignMenuConfig';
import { mergeMenuConfig } from '@web-mail/common/components/MailMenu/util';
import { dateFormat, MailStatus, getMailAliasArr, getMailFromMails, getTreeStatesByAccount } from '@web-mail/util';
import ItemCard from '../ItemCard';
import MailTag from '../../common/components/MailTag/MailTag';
import TimeZone from './component/TimeZone';
import styles from './index.module.scss';
import { CommonMailMenuConfig } from '../../types';
import useDebounceLocalData from '../../hooks/useDebounceLocalData';
import MailDiscuss from './component/MailDiscuss/mailDiscuss';
import HeaderAttachment from './HeaderAttachment';
import { MAIL_MENU_ITEM, MAIL_DISCUSS_EXCLUDE_FOLDERS, FLOLDER } from '../../common/constant';
import useState2RM from '../../hooks/useState2ReduxMock';
import { getIn18Text } from 'api';
import useCreateCallbackForEvent from '@web-mail/hooks/useCreateCallbackForEvent';
import Comment from './component/Comment/Comment';
import { useState2SubordinateSlice } from '@web-mail/hooks/useState2SliceRedux';

const trackApi: DataTrackerApi = api.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;

const eventApi = api.api.getEventApi();
// const storeApi: DataStoreApi = api.api.getDataStoreApi();
const mailManagerApi = apiHolder.api.requireLogicalApi('mailConfApiImpl') as unknown as MailConfApi;
const htmlApi = apiHolder.api.requireLogicalApi(apis.htmlApi) as unknown as HtmlApi;
const systemApi = api.api.getSystemApi() as SystemApi;
// const nimApi = api.api.requireLogicalApi('NIM') as NIMApi;
const mailConfApi = api.api.requireLogicalApi(apis.mailConfApiImpl) as unknown as MailConfApi;
const contactApi = api.api.requireLogicalApi(apis.contactApiImpl) as ContactAndOrgApi;
const accountApi = api.api.requireLogicalApi(apis.accountApiImpl) as AccountApi;
// let mailAliasArrCache: Array<string> | null = null;
const inEdm = process.env.BUILD_ISEDM;
// const contactApi = api.api.requireLogicalApi('contactApi') as unknown as ContactApi;

// function getMailAliasArr() {
//   const accountAlias = systemApi.getCurrentUserAccountAlias();
//   if (accountAlias && accountAlias.length > 0) {
//     return Promise.resolve(accountAlias);
//   }
//   if (mailAliasArrCache && mailAliasArrCache.length) {
//     return Promise.resolve(mailAliasArrCache || []);
//   }
//   return mailConfApi
//     .getMailSenderInfo()
//     .then(res => {
//       if (res && res.length) {
//         return res.map(item => {
//           return item.id;
//         });
//       }
//       return [];
//     })
//     .then(arr => {
//       mailAliasArrCache = arr;
//       return mailAliasArrCache;
//     });
// }

interface Props {
  sliceId?: string;
  content: MailEntryModel;
  /**
   * 功能：显示标记是否处于聚合模式
   *  邮件的head组件在单封邮件和聚合邮件的显示中都会用到。
   *  所以其显示，除了依赖邮件content中的聚合字段，作为聚合邮件的额子邮件时，还受到所属邮件聚合状态的影响。
   *
   */
  isMerge?: boolean;
  listData?: MailStatus;
  handleDelete?: (mid: string | undefined, isThread?: boolean, params?: object) => void;
  // handleWithDraw(mid: any, showRes: boolean, account?: string): void;
  // // onScrollToAttacth?(): void;
  menu?: CommonMailMenuConfig[];
  readOnly?: boolean;
  mailTagCloseAble?: boolean;
  showMailDiscuss?: boolean;
  showTag?: boolean;
  showTitle?: boolean;
}
const _index = ['to', 'cc', 'bcc'];
const _array = [getIn18Text('FAGEI'), getIn18Text('CHAOSONG'), getIn18Text('MISONG')];
const _detail = [getIn18Text('SHOUJIANREN'), getIn18Text('CHAO\u3000SONG'), getIn18Text('MI\u3000SONG')];

const _oneRcpt = getIn18Text('QUNFADANXIAN');
const Header: React.FC<Props> = ({
  sliceId,
  content,
  isMerge = false,
  listData,
  handleDelete,
  // handleWithDraw,
  // onScrollToAttacth = () => {},
  menu,
  readOnly = false,
  showMailDiscuss = true,
  mailTagCloseAble = true,
  showTag = true,
  showTitle = true,
}) => {
  const [isShowDetail, setDetailShow] = useState<boolean>(false);
  const [mid, setMid] = useState<string>('');
  const [memo, setMemo] = useState('');
  // const mailTagListStore = useAppSelector(state => state.mailReducer.mailTagList);
  const mailTreeStateMap = useAppSelector(state => state.mailReducer.mailTreeStateMap);

  const mailTagListStore = useMemo(() => {
    const folderState = getTreeStatesByAccount(mailTreeStateMap, content?._account || '');
    if (folderState && folderState?.mailTagList) {
      return folderState?.mailTagList;
    }
    return [];
  }, [mailTreeStateMap, content?._account]);
  const [mailMenuItemState, setMailMenuItemState] = useState2RM('mailMenuItemState');
  const [showAvator, setShowAvator] = useState2RM('configMailListShowAvator', 'doUpdateConfigMailListShowAvator');
  // 邮件+下属选中
  const [selectedKeys] = useState2SubordinateSlice('selectedKeys');

  const handleDeleteRef = useCreateCallbackForEvent(handleDelete);

  // 右侧边栏在发件箱下，选中联系人的详情数据
  const [rightSideSelectedDetail, setRightSideSelectedDetail] = useState2RM('rightSideSelectedDetail');
  // 是我发出的邮件
  // const isSendMail = useMemo(() => content.entry.folder === FLOLDER.SENT, [content]);
  const isSendMail = useMemo(() => {
    if (content) {
      const accountAlias = systemApi.getCurrentUser(content?._account)?.prop?.accountAlias || [];
      const accountAliasArray = Array.isArray(accountAlias) ? accountAlias : [accountAlias];
      const senderEmail = contactApi.doGetModelDisplayEmail(content?.sender?.contact);
      return (
        accountAliasArray.some(account => accountApi.getIsSameSubAccountSync(account, senderEmail)) || accountApi.getIsSameSubAccountSync(senderEmail, content._account)
      );
    } else {
      return false; // 如果当前邮件是空，则不是我发出的
    }
  }, [content]);
  // 有没有试过唤醒
  // const [triedAwakeGuide, setTriedAwakeGuide] = useState<boolean>(false);
  // const hollowOutGuideRef = useRef<any>(null);
  // 本地的content缓存,邮件正文快速切换优化, 当有邮件正文的时候，绕过本次防抖
  const localContent = useDebounceLocalData<MailEntryModel>(content, {
    exception: data => !!data?.entry?.content?.content,
  });

  const domPropsRender = useCallback((mails: MailEntryModel, menuConfig: CommonMailMenuConfig) => {
    return {
      'data-test-id': 'mail-menu-readmail-head-' + menuConfig?.key,
    };
  }, []);

  const isThreadMode = useMemo(() => {
    // 显式标记有最高优先级
    if (isMerge) {
      return isMerge;
    }
    const { isThread } = content || {};
    return !!isThread;
  }, [isMerge, content]);
  const [priority, setPriority] = useState<number>();
  const [suspicious, setSuspiciousSpam] = useState<boolean>(false);
  /** 自定义文件夹、已删除、收件箱、垃圾邮件都显示安全提醒 */
  // const boxShowReminder = [1, 5, 4].includes(folder) || folder >= 100;
  // 群发单显邮件只在收件箱和草稿箱的收件人详情展示，其他位置还是正常的收件人
  // const showOneRcpt = [2, 3].includes(content?.entry?.folder) && content?.isOneRcpt;
  // const isCorpMail = useAppSelector(state => state.loginReducer.loginInfo.isCorpMailMode);
  const decodeTitle = useMemo(() => {
    try {
      if (content?.entry.title) {
        const regex = /<\/?b>/g; // 匹配 <b> 和 </b> 标签
        const decoded = htmlApi.decodeHtml(content.entry.title.replace(regex, '')); // 去掉 <b> 和 </b> 标签并解码
        return decoded;
      }
      return '';
    } catch (e) {
      console.error('[Error reg]', e);
      return '';
    }
  }, [content?.entry.title]);
  // mid 和 tid
  const keyIds = useMemo(() => {
    const { entry } = content;
    const { tid, id } = entry;
    return { tid, mid: id };
  }, [content]);
  const mailDiscussIsShow = useMemo(() => {
    const { entry } = content;
    const { folder } = entry;
    // return !!isThreadMode && !MAIL_DISCUSS_EXCLUDE_FOLDERS.includes(folder) && showMailDiscuss;
    return !MAIL_DISCUSS_EXCLUDE_FOLDERS.includes(folder) && showMailDiscuss;
  }, [isThreadMode, content, showMailDiscuss]);
  // 邮件讨论新手引导
  // const mailDiscussGuides = useMemo(
  //   () => (mid && nimApi.getIMAuthConfig()
  //     ? [
  //       {
  //         id: `toobar-mail-discuss${mid}`,
  //         title: getIn18Text('YOUJIANTAOLUN'),
  //         intro: getIn18Text('ZHENDUIYOUJIANFA')
  //       },
  //       {
  //         id: `share-toon-btn${mid}`,
  //         title: getIn18Text('YOUJIANFENXIANG'),
  //         intro: getIn18Text('JIANGYOUJIANFENXIANG')
  //       }
  //     ]
  //     : null),
  //   [mid]
  // );
  useEffect(() => {
    setMid(localContent?.entry?.id);
    setMemo(localContent?.entry?.memo || '');
    setPriority(localContent?.entry?.priority);
    setSuspiciousSpam(!!localContent?.entry?.suspiciousSpam);
  }, [localContent]);
  // 新手引导展示回调
  // const guideShowCallback = () => {
  //   setCurrentAccount();
  //   return storeApi.put('mailDiscussGuideHasShowed', 'true');
  // };
  // 唤起引导
  // const awakeGuide = () => {
  //   if (triedAwakeGuide) return;
  //   setTriedAwakeGuide(true);
  //   setCurrentAccount();
  //   const mailDiscussGuideHasShowedStore = storeApi.getSync('mailDiscussGuideHasShowed');
  //   const { data, suc } = mailDiscussGuideHasShowedStore;
  //   // 已展示
  //   if (suc && data === 'true') return;
  //   setTimeout(() => {
  //     // 拿到分享按钮
  //     const shareToolBtn = document.getElementById(`share-toon-btn${mid}`);
  //     if (shareToolBtn) {
  //       setTimeout(() => {
  //         hollowOutGuideRef.current?.showSelf(guideShowCallback);
  //       }, 1000);
  //     }
  //   });
  // };
  // 点击头像卡片展开回调
  const handleVisible = (visible: boolean) => {
    // 外贸读信展开头像卡片同时展开侧边栏
    if (systemApi.inEdm() && visible) {
      eventApi.sendSysEvent({
        eventName: 'mailMenuOper',
        eventStrData: 'headerCardVisible',
        eventData: {},
      });
    }
  };

  // 点击收件人
  const handleReceiverVisible = (visible: boolean, item: MailBoxEntryContactInfoModel) => {
    if (systemApi.inEdm() && visible && isSendMail) {
      setRightSideSelectedDetail({ email: contactApi.doGetModelDisplayEmail(item.contact), name: item?.originName || '' });
    }
  };
  // useLayoutEffect(() => {
  //   if (mailDiscussIsShow && mid) {
  //     awakeGuide();
  //   }
  // }, [mailDiscussIsShow, mid]);
  // 邮件内容切换的时候收齐详情
  useEffect(() => {
    setDetailShow(false);
  }, [content?.entry?.id]);
  // useEffect(() => {
  //   if (isCorpMail) return;
  //   if (locationHelper.isMainPage()) {
  //     setCurrentAccount();
  //     mailManagerApi.requestTaglist();
  //   }
  // }, []);
  useEffect(() => {
    if (inWindow() && content?.entry?.title && window?.location?.pathname?.includes('readMail')) {
      window.document.title = getIn18Text('DUXIN-') + decodeTitle;
    }
  }, [content?.entry.title]);
  const account = content?._account || systemApi.getCurrentUser()?.id;
  const formatReceiver = (type: string, returnType?: string) => {
    const showOneRcpt = [2, 3].includes(content?.entry?.folder) && content?.isOneRcpt;
    const receiver: ReactElement[] = [];
    if (content && content.receiver) {
      content.receiver.forEach(item => {
        if (item.mailMemberType === type || type === 'all') {
          // 是否是发件箱文件夹邮件，选中的收件人
          const isSelected =
            rightSideSelectedDetail.email &&
            isSendMail &&
            accountApi.getIsSameSubAccountSync(rightSideSelectedDetail.email, contactApi.doGetModelDisplayEmail(item.contact));
          // const accountShowName = account === item.contact?.contact?.accountName
          //   ? typeof window !== 'undefined'
          //     ? getIn18Text('WO')
          //     : ''
          //   : item?.originName || item?.contact?.contact?.contactName || item?.contact?.contact?.accountName;
          // if (returnType === 'name') {
          //   receiver.push(accountShowName);
          // } else
          if (returnType === 'nameCard') {
            receiver.push(
              // 无收件不需要展示联系人卡片 TODO: 用item.originName === '无收件人'判断，如果收件人name就是“无收件人”这个地方就会产生bug
              // 不要进行多语言翻译
              item.originName !== '无收件人' ? (
                <>
                  <ItemCard
                    contact={item.contact}
                    showAccount={false}
                    trigger="click"
                    originName={item.originName}
                    disabled={readOnly}
                    curAccount={account}
                    isSelected={!!isSelected}
                    handleVisible={visible => handleReceiverVisible(visible, item)}
                    customerLabel={process.env.BUILD_ISEDM ? <CustomerLabel contact={item.contact} simpleStyle={true} curAccount={account} /> : null}
                  >
                    {process.env.BUILD_ISEDM ? <CustomerLabel contact={item.contact} curAccount={account} simpleStyle /> : null}
                    {/*{accountShowName}*/}
                  </ItemCard>
                </>
              ) : (
                <div className="u-card" title={item.originName} data-test-id={'mail-head-reveiver-' + type}>
                  {item.originName}
                </div>
              )
            );
          } else {
            // console.log('card --------------->', item.contact);
            receiver.push(
              item.contactItem.contactItemVal ? (
                <>
                  <ItemCard
                    isSelected={!!isSelected}
                    handleVisible={visible => handleReceiverVisible(visible, item)}
                    contact={item.contact}
                    trigger="click"
                    originName={item.originName}
                    disabled={readOnly}
                    curAccount={account}
                  />
                </>
              ) : (
                <span>{getIn18Text('WUSHOUJIANREN')}</span>
              )
            );
          }
        }
      });
    }
    const index = _index.indexOf(type);
    const _type = returnType === 'name' ? _array[index] : _detail[index];
    return receiver.length || (type === 'to' && !returnType) ? (
      <div className={returnType === 'name' || returnType === 'nameCard' ? 'u-info-top' : 'u-info-item'}>
        <span
          className="name"
          style={{
            width: 'auto',
            minWidth: 56,
          }}
        >
          {showOneRcpt ? _oneRcpt : _type}
          {returnType === 'name' ? '' : '：'}
        </span>
        {receiver.length ? (
          <span className="detail">
            {receiver.map((_item, idx) => (
              <>
                {idx ? '、' : ''}
                {_item}
              </>
            ))}
          </span>
        ) : (
          <span className="detail">{getIn18Text('WUSHOUJIANREN')}</span>
        )}
      </div>
    ) : (
      ''
    );
  };
  const handleDeleteTag = (tagName: string, mailList: MailEntryModel[]) => {
    const ids = mailList.map(_ => _.entry.id);
    const account = mailList[0]?._account;
    eventApi.sendSysEvent({
      eventName: 'mailTagChanged',
      eventData: {
        tagNames: [tagName],
        mailList: ids,
      },
      eventStrData: 'untag',
      _account: account,
    });
  };
  const titileRef = useRef<HTMLDivElement>(null);
  const [mailAliasArr, setMailAliasArr] = useState<Array<string>>([]);
  const mailAliasArrStr = useMemo(() => mailAliasArr.join('@#@'), [mailAliasArr]);

  useEffect(() => {
    getMailAliasArr().then(arr => {
      setMailAliasArr(arr);
    });
  }, []);

  // 生成代发/转发展示文案
  const buildResent = useCallback(() => {
    const headers = localContent?.headers;
    if (headers && headers.Sender) {
      const isReply = !!headers['Resent-From']; // 是否为转发
      const mail = isReply ? headers['Resent-From'][0] : headers.Sender[0];
      return `(由${mail}${isReply ? getIn18Text('ZHUANFA') : getIn18Text('DAIFA')})`;
    }
    const mailSender = localContent?.sender?.contactItem?.contactItemType === 'EMAIL' ? localContent?.sender?.contactItem?.contactItemVal : '';
    const _mailAliasArr = mailAliasArrStr.split('@#@');
    const isCurrentUserSend = mailSender && _mailAliasArr.indexOf(mailSender) !== -1;

    if (isCurrentUserSend && headers && headers['Original_Account']) {
      const originalAccounts = headers['Original_Account'] || [];
      if (originalAccounts && originalAccounts.length) {
        const firstAccount = originalAccounts[0];
        if (firstAccount) {
          return getIn18Text('(BENYOUJIANY)ZHFS', { firstAccount });
        }
      }
    }
    return null;
  }, [localContent, mailAliasArrStr]);

  const receiverBody = useCallback(
    (rType: string = '') => {
      const showBcc = account === content?.sender?.contact?.contact?.accountName && content?.entry?.folder === 3;
      const showOneRcpt = [2, 3].includes(content?.entry?.folder) && content?.isOneRcpt;
      return showOneRcpt ? (
        formatReceiver('all', rType)
      ) : (
        <>
          {formatReceiver('to', rType)}
          {formatReceiver('cc', rType)}
          {showBcc ? formatReceiver('bcc', rType) : ''}
        </>
      );
    },
    [content, rightSideSelectedDetail.email]
  );
  // 邮件标签
  const MailTagElement = useMemo(() => {
    const tagVisiable = !localContent?.isTpMail && showTag;
    return tagVisiable ? (
      <div className="mail-head-tag-warp" hidden={isThreadMode || !(localContent?.tags && localContent?.tags.length)}>
        {localContent?.tags?.map((item, idx) => (
          <MailTag
            key={idx}
            className="tag"
            closeable={!readOnly && mailTagCloseAble}
            color={mailManagerApi.getTagColor(item, true)}
            fontColor={mailManagerApi.getTagFontColor(item)}
            style={{ color: mailManagerApi.getTagFontColor(item) }}
            onClose={() => {
              handleDeleteTag(item, [localContent]);
            }}
          >
            {item}
          </MailTag>
        ))}
      </div>
    ) : (
      <></>
    );
  }, [localContent, isThreadMode, readOnly, mailTagListStore, showTag]);

  // 邮件详情
  const MailDetailElement = useMemo(() => {
    const timeZone = mailConfApi.getTimezone();
    const sendTime = dayjs(systemApi.getDateByTimeZone(localContent?.entry.sendTime || 0, timeZone, true)).format('YYYY-MM-DD HH:mm:ss');
    return (
      <div
        className="u-info-detail"
        onClick={e => {
          e.stopPropagation();
        }}
      >
        <div className="u-info-item">
          <span className="title">{getIn18Text('FAJIANREN\uFF1A')}</span>
          <span className="content">
            <ItemCard
              contact={localContent?.sender?.contact}
              originName={localContent?.sender?.originName}
              trigger="click"
              disabled={readOnly}
              curAccount={account}
              handleVisible={handleVisible}
            />
          </span>
        </div>
        <p className="u-info-item-Forward">{buildResent()}</p>
        {receiverBody()}
        <div className="u-info-item" hidden={!isThreadMode}>
          <span className="title">{getIn18Text('ZHU&ems')}</span>
          <span className="content">{decodeTitle}</span>
        </div>
        <div className="u-info-item">
          <span className="title">{getIn18Text('SHI&ems')}</span>
          <span className="content">{sendTime}</span>
        </div>
      </div>
    );
  }, [localContent, isThreadMode, buildResent, readOnly, receiverBody]);

  // 任务状态
  const taskStatus = useAppSelector(state => state.readMailReducer.taskDetail.status);

  // 右侧按钮配置，按照原MenuList.tsx的逻辑更改为配置
  const customMenuConfg: CommonMailMenuConfig[] = useMemo(
    () => [
      {
        // todo: 需要确认该项目到底是否展示
        key: MAIL_MENU_ITEM.TAG,
        show: (mails, defaultShow) => {
          const mail = getMailFromMails(mails);
          const { isThread } = mail;
          if (taskStatus === 0 || isThread) {
            return false;
          }
          return !!defaultShow ? defaultShow(mail) : false;
        },
      },
      {
        // todo: 需要确认该项目到底是否展示
        key: MAIL_MENU_ITEM.TOP,
        show: (mail, defaultShow) => {
          if (taskStatus === 0 || isThreadMode) {
            return false;
          }
          return !!defaultShow ? defaultShow(mail) : false;
        },
      },
      {
        key: MAIL_MENU_ITEM.MOVE,
        show: (mail, defaultShow) => {
          if (isThreadMode) {
            return false;
          }
          return !!defaultShow ? defaultShow(mail) : false;
        },
      },
      {
        key: MAIL_MENU_ITEM.MAIL_WITHDRAW,
        show: (mail, defaultShow) => {
          if (listData?.isrcl) {
            return false;
          }
          return !!defaultShow ? defaultShow(mail) : false;
        },
        onClick: mails => {
          const mail = getMailFromMails(mails);
          // const { id, _account } = mail;
          // handleWithDraw(id, false, _account);
          eventApi.sendSysEvent({
            eventName: 'mailMenuOper',
            eventData: { mailData: mail },
            eventStrData: 'retractEmail',
            _account: mail?._account,
          });
        },
      },
      {
        key: MAIL_MENU_ITEM.MAIL_WITHDRAW_RES,
        show: (mail, defaultShow) => !!listData?.isrcl && (defaultShow ? defaultShow(mail) : false),
        onClick: mails => {
          const mail = getMailFromMails(mails);
          if (listData?.isrcl) {
            // const { id, _account } = mail;
            eventApi.sendSysEvent({
              eventName: 'mailMenuOper',
              eventData: { mailData: mail, showRes: true },
              eventStrData: 'retractEmail',
              _account: mail?._account,
            });
          }
        },
      },
      {
        key: MAIL_MENU_ITEM.DELETE,
        onClick: (mails, defaultClick) => {
          const mail = getMailFromMails(mails);
          // const { _account } = mail;
          // handleDelete必须要有，因为handleDeleteRef必然会存在，无法判断方法到底是否存在
          if (handleDelete && handleDeleteRef) {
            handleDeleteRef(mail.entry.id);
          } else {
            defaultClick && defaultClick(mail);
          }
        },
      },
      {
        key: MAIL_MENU_ITEM.SHARE,
        show: (mail, defaultShow) => {
          // 根据showMailDiscuss 设置决策是否展示邮件分享
          if (mailDiscussIsShow) {
            if (defaultShow) {
              return defaultShow(mail);
            }
            return true;
          }
          return false;
        },
      },
      // todo: 临时处理，以适应现在的融合规则, 需要重新写融合规则
      {
        key: MAIL_MENU_ITEM.TRANSLATE,
      },
      {
        key: MAIL_MENU_ITEM.EMAIL_HEADER,
      },
    ],
    [taskStatus, isThreadMode, listData?.isrcl, mailDiscussIsShow]
  );

  // 在icon按钮之前收集打点信息
  const handelIconMenuBeforeClick = useCallback((config: CommonMailMenuConfig, data: MailEntryModel | MailEntryModel[]) => {
    let name = config?.name;
    if (typeof config?.name === 'function') {
      const _name = config?.name(data);
      if (typeof _name === 'string') {
        name = _name;
      }
    }
    trackApi.track('pcMail_click_ReplyButton_mailHead_mailDetailPage', { buttonName: name });
  }, []);

  const menuConfig = useMemo(() => (menu && menu.length ? mergeMenuConfig(menu, customMenuConfg) : customMenuConfg), [menu, customMenuConfg]);

  // 与列表菜单的基础配置文件进行混合，是因为这两个菜单本质上是相同的，所以复用其配置。
  const localMenuData = useMemo(() => (menuConfig && menuConfig.length ? mergeMenuConfig(menuConfig, ReadMailSignMenuConfig) : ReadMailSignMenuConfig), [menuConfig]);

  const mailDiscussComp = useMemo(() => <MailDiscuss id={`toobar-mail-discuss${keyIds.mid}`} keyIds={keyIds} />, [keyIds?.mid]);

  // 收信人详情
  // todo：太大了，待拆解, 并且依赖会导致很多次无效渲染
  const HeaderInfoElement = useMemo(() => {
    // const attachmentCount = localContent?.entry?.attachment?.filter(item => !item.inlined && item.fileType !== 'ics').length;
    return (
      <div className="u-item-info" style={{ minHeight: 28 }}>
        {suspicious && (
          <div className="u-item-block-suspicious">
            <ReadListIcons.SuspiciousSvg />
          </div>
        )}
        {/* 权限小于2为紧急邮件 */}
        {typeof priority === 'number' && priority < 2 && (
          <Tooltip title={getIn18Text('JINJIYOUJIAN')} placement="top">
            <div className="alarm">
              <IconCard type="alarm" />
            </div>
          </Tooltip>
        )}
        {/* 名称 */}
        <div className="name">
          <ItemCard
            contact={localContent?.sender?.contact}
            showAccount={false}
            originName={localContent?.sender?.originName}
            trigger="click"
            disabled={readOnly}
            curAccount={account}
            customerLabel={
              process.env.BUILD_ISEDM && localContent?.sender?.contact ? (
                <CustomerLabel
                  contact={localContent?.sender?.contact}
                  style={{ verticalAlign: 'top', margin: '0 8px' }}
                  curAccount={account}
                  showEnterpriseLabel={false}
                />
              ) : undefined
            }
            handleVisible={handleVisible}
          >
            {/*{currentUser?.id === localContent?.sender?.contact.contact.accountName*/}
            {/*    ? (getIn18Text("WO")) : localContent?.sender?.originName ||*/}
            {/*    localContent?.sender?.contact.contact.contactName ||*/}
            {/*    localContent?.sender?.contact.contact.accountId}*/}
          </ItemCard>
          <span className="name-Forward">{buildResent()}</span>
        </div>
        <div className="time" data-test-id="mail-head-time">
          {dateFormat('YYYY-mm-dd HH:MM', localContent?.entry?.sendTime || '')}
        </div>
        {localContent?.sender?.contact?.contact?.accountName === 'notice@qiye.163.com' && decodeTitle.substring(0, 6) === '【账户安全】' ? (
          <ProductAuthTag
            tagName={ProductTagEnum.LOGIN_DEVICE_NOTIFY}
            type="bar"
            flowTipStyle={{
              width: '70px',
              padding: '0px 8px',
              textAlign: 'center',
              height: '20px',
              lineHeight: '20px',
              borderRadius: '10px',
              backgroundColor: '#386EE7',
              color: '#ffffff',
            }}
          />
        ) : (
          <></>
        )}
        {/* 占位空块，触发手风琴折叠 */}
        <div style={{ flex: '1' }} />
        <div
          className="u-operator"
          onClick={e => {
            // 阻止事件冒泡，防止点击菜单导致的panel折叠
            e && e.stopPropagation();
          }}
          hidden={readOnly}
          style={{
            marginTop: showTitle ? 0 : '-4px',
          }}
        >
          <MailMenuIcon
            defaultMenu={ReadMailIconMenuRightConfig}
            beforeMenuItemClick={handelIconMenuBeforeClick}
            mail={content}
            domProps={domPropsRender}
            menu={[
              {
                key: MAIL_MENU_ITEM.SHARE,
                show: (mail, defaultShow) => {
                  if (!isThreadMode || !showMailDiscuss || !defaultShow) {
                    return false;
                  }
                  return defaultShow(mail);
                },
              },
              {
                key: 'discuss',
                icon: mailDiscussComp,
                show: mailDiscussIsShow,
              },
              {
                key: 'extend',
                subMenus: localMenuData,
              },
            ]}
            menuItemStateMap={mailMenuItemState}
            onMenuItemStateChange={(menuId, data) =>
              setMailMenuItemState({
                ...mailMenuItemState,
                [content?.entry?.id]: {
                  ...(mailMenuItemState[content?.entry?.id] || {}),
                  [menuId]: data,
                },
              })
            }
          />
        </div>
        {/* 只在聚合模式下展示 其他模式下 展示在头部 */}
        {/* {mailDiscussIsShow && (
          <span className="mail-discuss-area">
            <MailDiscuss id={`toobar-mail-discuss${mid}`} keyIds={keyIds} />
          </span>
        )} */}
        {/* 新手引导 */}
        {/* {mailDiscussGuides && <HollowOutGuide ref={hollowOutGuideRef} guides={mailDiscussGuides} />} */}
      </div>
    );
  }, [localContent, listData, buildResent, mid, readOnly, keyIds, mailDiscussIsShow, menu, mailMenuItemState, setMailMenuItemState, suspicious, localMenuData]);

  const AvatarTagElement = useMemo(
    () => (
      <ItemCard
        contact={content?.sender?.contact}
        type="avatar"
        trigger="click"
        disabled={readOnly}
        originName={content?.sender?.originName}
        curAccount={account}
        handleVisible={handleVisible}
      >
        <div
          style={{
            marginRight: '12px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <AvatarTag
            size={32}
            contactId={content?.sender?.contact?.contact?.id}
            propEmail={contactApi.doGetModelDisplayEmail(content?.sender?.contact)}
            user={{
              name: content?.sender?.contact?.contact?.contactName,
              avatar: content?.sender?.contact?.contact?.avatar,
              color: content?.sender?.contact?.contact?.color,
              email: contactApi.doGetModelDisplayEmail(content?.sender?.contact),
            }}
          />
        </div>
      </ItemCard>
    ),
    [content, readOnly]
  );

  // 下属邮件是否已读标识
  const tpMailReadIconElement = useMemo(() => {
    const sendEmail = contactApi.doGetModelDisplayEmail(content?.sender?.contact) || '';
    // 是发件箱的，或者发信人是当前选中的下属
    const isSendMail = content.entry.folder === FLOLDER.SENT || sendEmail === selectedKeys.accountName;
    // 是三方邮件（下属邮件），是已读，并且不是自己发送的
    if (content.isTpMail && content.entry?.readStatus === 'read' && !isSendMail) {
      return (
        <div className={styles.readIcon}>
          <IconCard type="tongyong_xianshi" />
          <span>{getIn18Text(['XIASHU', 'YIDU'])}</span>
        </div>
      );
    } else {
      return <></>;
    }
  }, [content, selectedKeys.accountName]);

  return (
    <div className={`header-box ${readOnly ? 'head-readonly' : ''}`}>
      <div className="u-info">
        {showTitle ? (
          <TitleRightContextMenu targetNode={titileRef.current}>
            <div ref={titileRef} className="u-info-title" hidden={isThreadMode} data-test-id="mail-readmail-title">
              {decodeTitle || getIn18Text('WUZHUTI')}
            </div>
          </TitleRightContextMenu>
        ) : (
          <></>
        )}
        {MailTagElement}
        <div className="u-item">
          {showAvator ? AvatarTagElement : <></>}
          <div className="u-item-content">
            {HeaderInfoElement}
            <div className="u-item-sender">
              <span className="detail contains no-select">{content && content.receiver?.length ? receiverBody('nameCard') : getIn18Text('WULIANXIREN')}</span>
              <span
                className="u-item-detail contains"
                style={{ userSelect: 'none' }}
                onClick={e => {
                  e.stopPropagation();
                  setDetailShow(!isShowDetail);
                }}
                data-test-id="header-detail-expand-btn"
              >
                {isShowDetail ? getIn18Text('SHOUQI') : getIn18Text('XIANGQING')}
              </span>
            </div>
          </div>
          {tpMailReadIconElement}
        </div>
        {isShowDetail ? MailDetailElement : <></>}
        <div className={classnames({ 'header-content-attch': !isShowDetail && showAvator })}>
          <HeaderAttachment content={content} />
        </div>
        <TimeZone contact={localContent?.sender?.contact} isTpMail={!!localContent?.isTpMail} curAccount={account} sliceId={sliceId} />
        {memo && (
          <div className={classnames(styles.commentWrap)}>
            <Comment memo={memo} mailId={mid} account={content?._account} />
          </div>
        )}
      </div>
    </div>
  );
};
export default Header;
