/**
 *  功能：所有针对邮件的业务操作，都在此处，与邮件组件及菜单解耦，通过消息调用
 */
import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Modal, Tree, Spin, Button } from 'antd';
import message from '@web-common/components/UI/Message/SiriusMessage';
import useState2RM from '../../hooks/useState2ReduxMock';
import { MailActions, useActions, useAppDispatch, MailClassifyActions, AttachmentActions, useAppSelector, ScheduleActions } from '@web-common/state/createStore';
import { Thunks } from '@web-common/state/reducer/mailReducer';
import { MailTabModel, actions as mailTabActions } from '@web-common/state/reducer/mailTabReducer';
import CreateScheduleBox from '@web-schedule/components/CreateBox/CreateBox';
// import { ModalCloseSmall } from '@web-common/components/UI/Icons/icons';
import { ReactComponent as CloseIcon } from '@/images/icons/close_modal.svg';
import ReadListIcons from '@web-common/components/UI/Icons/svgs/ReadListSvgs';
import { useNiceModal } from '@web-common/components/UI/NiceModal/NiceModal';
import CommentModal from '../../common/components/comment/CommentModal';
import { TreeProps } from 'antd/lib/tree';
import { ScheduleSyncObInitiator } from '@web-schedule/data';
import {
  getForbidMoveFolderIdList,
  folderList2CanMoveTree,
  folderId2Number,
  folderId2String,
  MailStatus,
  getTreeStatesByAccount,
  filterSysMailTag,
  promiseIsTimeOut,
  isMac,
} from '../../util';
import LoadingOutlined from '@ant-design/icons/LoadingOutlined';
import Dialog from '@web-common/components/UI/Dialog/dialog';
import { idIsTreadMail } from '@web-common/utils/utils';
import './MailSyncModal.scss';
import {
  apiHolder as api,
  apis,
  DataTrackerApi,
  MailApi,
  MailBoxModel,
  MailConfApi,
  MailEntryModel,
  SystemApi,
  SystemEvent,
  EventApi,
  getIn18Text,
  ContactModel,
  ContactAndOrgApi,
  ContactItem,
  locationHelper,
  catalogSettingModel,
} from 'api';
import useMsgRenderCallback from '@web-common/hooks/useMsgRenderCallback';
import MailReport from '../MailReport/MailReport';
import MailPrint from '../MailPrint/MailPrint';
import MailTodoModal from '../TodoMail/TodoMail';
import Message from '@web-common/components/UI/Message/SiriusMessage';
import { TagModal } from '../../components/MailTagList/MailTag';
import { MAIL_TAG_GUIDE_LOCAL_KEY } from '../../common/constant';
// import { FLOLDER } from '../../common/constant';
// import NewGuideForAside from '@web-mail/components/CustomerMail/NewGuideForAside';
// import useState2ReduxMock from '../../hooks/useState2ReduxMock';
import ChatForward from '@web-im/subcontent/chatDisplay/chatForward';
import { TeamContactModel } from '@web-im/components/TeamCreator/teamCreator';
import MailDelivery from '../MailDelivery/MailDelivery';
import PersonalOrgModal from '@web-common/components/UI/SiriusContact/personalOrgModal/personalOrg';
import SiriusModal from '@web-common/components/UI/Modal/SiriusModal';
import Toast from '@web-common/components/UI/Message/SiriusMessage';
import MailDiscussModal from '@web-mail/components/ReadMail/component/MailDiscuss/MailDiscussModal';
import StatusModal from '@web-mail/components/StatusModal';
import useGetReadStatus from '@web-mail/components/ReadMail/hooks/useGetReadStatus';
import useCreateCallbackForEvent from '@web-common/hooks/useCreateCallbackForEvent';
import Alert from '@web-common/components/UI/Alert/Alert';
import Content from 'components/ReadMail/content/Content';
import { TagGuideModal } from '@web-mail/components/MailTagList/TagGuide';
import { getCatalogList, getSetting } from '@web-schedule/service';

const systemApi = api.api.getSystemApi() as SystemApi;
const mailApi = api.api.requireLogicalApi(apis.mailApiImpl) as MailApi;
const eventApi: EventApi = api.api.getEventApi() as unknown as EventApi;
const trackApi = api.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;
const contactApi = api.api.requireLogicalApi(apis.contactApiImpl) as ContactAndOrgApi;
const mailConfApi = api.api.requireLogicalApi(apis.mailConfApiImpl) as MailConfApi;
const storeApi = api.api.getDataStoreApi();

type ReportConfig = {
  mailId: string;
  hasReport: boolean;
  senderEmail: string;
};
type PrintConfig = {
  mailId: string;
  visible: boolean;
};
type PrintRef = {
  printMail: (id: string) => void;
};
const MailSyncModal: React.FC<any> = props => {
  // const { curMailId } = props;
  // 客户侧边栏新手引导
  // const [currentEmailForAside, setCurrentEmailForAside] = useState('');
  // 邮件举报是否显示
  const [reportVisible, setReportVisible] = useState<boolean>(false);
  // 邮件举报相关参数
  const [reportConfig, setReportConfig] = useState<ReportConfig>();
  // 邮件分发是否显示
  const [deliveryVisible, setDeliveryVisible] = useState<boolean>(false);
  // 当前操作的邮件id
  const [mailId, setMailId] = useState<string | undefined>(undefined);
  // 邮件分发当前操作的邮件account
  const [deliveryAccount, setDeliveryAccount] = useState<string | undefined>(undefined);
  // 邮件分发触发的方式，通过事件传递过来
  const [deliveryWay, setDeliveryWay] = useState<string | undefined>(undefined);
  // 邮件打印的id
  // const [printMailConfig, setPrintMailConfig] = useState<PrintConfig>();
  // 邮件打定弹窗是否显示
  // const [printVisible, setPrintVisible] = useState<boolean>(false);
  // 邮件打印模块的ref
  const printRef = useRef<any>();
  // 邮件撤回
  const [listData, setListData] = useState<MailStatus>();
  // 邮件撤回详情是否展示
  const [withDrawModalVisible, setWithDrawModalVisible] = useState(false);
  // 邮件撤回的id
  const [withDrawMailId, setWithDrawMailId] = useState();
  // 导入邮件的确认按钮状态
  const [importConfirmLoading, setImportConfirmLoading] = useState(false);
  // 来信分类配置
  const { setMailSender, setMailTitle, changeShowClassifyModal } = useActions(MailClassifyActions);
  // 邮件-搜索-搜索类型
  const [mailSearching] = useState2RM('mailSearching', 'doUpdateMailSearching');
  // 是否处于搜索模式
  const isSearching = useMemo(() => !!mailSearching, [mailSearching]);
  // 邮件-移动文件夹-是否显示
  const [isShowTreeMenu, setTreeMenu] = useState2RM('mailMoveModalVisiable', 'doUpdateMailMoveModalVisiable');
  // 邮件-移动文件夹-是否显示（用于邮件导入）
  const [isShowImportTreeMenu, setImportTreeMenu] = useState2RM('mailImportModalVisible', 'doUpdateMailImportModalVisible');
  // 邮件列表-选中的邮件idlist
  const [activeIds, setActiveIds] = useState2RM('activeIds', 'doUpdateActiveIds');
  // 移动邮件-弹窗-显示的真实邮件数量
  const [moveModalMailNum, setMoveModalMailNum] = useState2RM('mfModalReadMailNum', 'doUpdateMfModalReadMailNum');
  // 邮件-移动-弹窗-文件夹树-选中的目标文件夹id
  const [selectedMenuKeys, setSelectedMenuKeys] = useState2RM('mfModalSelectedFids', 'doUpdateMfModalSelectedFids');
  // 邮件移动-移动的邮件id
  const [mailMoveMid, setMailMoveMid] = useState2RM('mailMoveMid', 'doUpdateMailMoveMid');
  // 邮件导入-导入的邮件id
  const [mailImportMid, setMailImportMid] = useState2RM('mailImportMid', 'doUpdateMailMoveMid');
  // 邮件列表-文件夹-选中的key
  const [selectedKeys, setSelectedKeys] = useState2RM('selectedKeys', 'doUpdateSelectedKey');
  // 邮件-移动-弹窗-文件夹树-展开的目录ids
  const [expandedMenuKeys, setExpandedMenuKeys] = useState2RM('mfModalExpandFids', 'doUpdateMfModalExpandFids');
  // 通用提示弹窗是否展示-ex：删除，删除全部
  const [isModalVisible, setModalVisible] = useState2RM('commonModalVisible', 'doUpdateCommonModalVisible');
  // 对话弹窗配置项
  const [resetDialog, setDialog] = useState2RM('dialogConfig', 'doUpdatedialogConfig');

  // 邮件列表-文件夹-树形结构-list
  const [mailTreeStateMap] = useState2RM('mailTreeStateMap');
  // 邮件-移动-当前移动邮件-所属的文件夹
  const [mailMoveFid, setMailMoveFid] = useState2RM('mailMoveFid', 'doUpdateMailMoveFid');
  // 邮件分享
  const [shareMail, doUpdateShareMail] = useState2RM('shareMail', 'doUpdateShareMail');
  // 是否展示邮件-全局阻塞-loading
  const [showGlobalLoading, setShowGlobalLoading] = useState2RM('showGlobalLoading', 'doUpdateShowGlobalLoading');
  // 邮件标签-添加弹窗-是否显示
  const [addTagModalVisible, setAddtagModalVisible] = useState2RM('mailTagAddModalVisible', 'doUpdateMailTagAddModalVisible');
  // 客户侧边栏新手指引
  // const [, setNewGuideVisible] = useState2ReduxMock('newGuideForCustomerAside_cm');
  // 邮件标签-新建并标记的操作邮件id
  const [mailTagMarkMailList, setMailTagMarkMailList] = useState([]);
  const attachmentActions = useActions(AttachmentActions);
  const dispatch = useAppDispatch();
  const reducer = useActions(MailActions);
  // const [activeTab, setActiveTab] = useState('1');
  // 新增个人联系人跟组的弹窗默认选中
  const [defaultPersonalOrgSelect, setDefaultPersonalOrgSelect] = useState<ContactItem[]>([]);
  //是否显示添加联系人分组弹窗
  const [personalOrgModalVisible, setPersonalOrgModalVisible] = useState<boolean>(false);
  // 添加联系人分组的账号
  const [personalOrgAccount, setPersonalOrgAccount] = useState<string | undefined>(undefined);
  // 正字啊发送中的邮件
  const sendingMails = useAppSelector(state => state.mailReducer?.sendingMails);
  // 邮件标签guide的弹窗是否展示
  const [mailTagGuideModalVisable, setMailTagGuideModalVisable] = useState<boolean>(false);

  const closeTabRef = useRef<any>();

  // ics编辑弹窗数据
  const { scheduleEvent: icsEventDetail, scheduleEditFrom, catalogList } = useAppSelector(state => state.scheduleReducer);
  const { changeScheduleEvent, setScheduleEditFrom, updateCatlogList, setSettingZoneList, setShowSecondaryZone } = useActions(ScheduleActions);

  // const isCorpMail = systemApi.getIsCorpMailMode();
  // 当前页签
  const currentTab = useAppSelector(state => state.mailTabReducer.currentTab);
  // 分享邮件
  const mailActions = useActions(MailActions);
  const shareMailMid = useAppSelector(state => state.mailReducer.shareMailMid);
  const paidGuideModal = useNiceModal('paidGuide');
  // 邮件备注显示
  const [commentVisible, setCommentVisible] = useState(false);
  const [commentMemo, setCommentMemo] = useState('');
  const [commentMemoAccount, setCommentMemoAccount] = useState('');

  // 邮件分享弹窗相关
  const [MailDiscussModalVisiable, setMailDiscussModalVisiable] = useState(false);
  const [mailDicussModalKey, setMailDicussModalKey] = useState<{
    mid: string;
    tid?: string;
  } | null>(null);

  const handleDiscussClose = () => {
    setMailDiscussModalVisiable(false);
    setMailDicussModalKey(null);
  };

  const MenuConfig = {
    title: `移动${activeIds && activeIds.length ? moveModalMailNum : 1}封邮件到...`,
    width: '400px',
    wrapClassName: 'u-move-dialog',
    style: {
      maxHeight: '480px',
    },
  };
  const ImportMenuConfig = {
    ...MenuConfig,
    title: getIn18Text('DAORU1FENGYOU'),
  };
  // 文件夹列表转换为可移动的tree
  const data2tree = (data: MailBoxModel, isLocalImport?: boolean) => {
    const forbidFidList = getForbidMoveFolderIdList(mailMoveFid, isSearching, selectedKeys.id, isLocalImport);
    return folderList2CanMoveTree(data, forbidFidList, 'move-folder-item');
  };
  const onSelectMenuFid: TreeProps['onSelect'] = (_, { node }) => {
    node.key = folderId2Number(node.key);
    setSelectedMenuKeys([node.key]);
  };
  // 邮件移动
  const onConfirmMove = () => {
    dispatch(
      Thunks.doMoveMailFromModal({
        mailId: mailMoveMid?.mailId,
        folderId: selectedMenuKeys[0],
      })
    );
  };
  // 导入邮件
  const onConfirmImport = () => {
    setImportConfirmLoading(true);
    // 添加延时是为了避免动画卡顿。。。
    setTimeout(() => {
      // 只有主账号有
      // setCurrentAccount();
      mailApi
        .doUploadMail(mailImportMid, selectedMenuKeys[0])
        .then(v => {
          Message.success({ content: getIn18Text('DAORUCHENGGONG'), duration: 1 }).then();
          setImportTreeMenu(false);
          eventApi.sendSysEvent({
            eventName: 'initPage',
            eventData: v.mid,
            eventSeq: 0,
            noPost: true,
            asInnerMsg: true,
          });
          setShowGlobalLoading(true);
        })
        .catch(e => {
          console.warn(getIn18Text('YOUJIANDAORUSHI'), e);
          Message.error({ content: e || getIn18Text('YOUJIANDAORUSHI') }).then();
        })
        .finally(() => {
          setImportConfirmLoading(false);
        });
    }, 350);
  };
  // 导入邮件取消
  const onCancelImport = () => {
    setImportTreeMenu(false);
    setImportConfirmLoading(false);
  };
  // 刷新文件夹
  const refreshFolder = (noCache = false) => {
    promiseIsTimeOut(
      dispatch(
        Thunks.refreshFolder({
          noCache,
        })
      ),
      'pc_refreshFolder_timeout',
      {
        from: 'MailSyncModal',
      }
    );
  };

  useEffect(() => {
    shareMail?.entry && trackApi.track('pcMail_click_shareMail');
  }, [shareMail]);

  // 邮件分享弹窗
  const shareDiscussModal = useMemo(
    () => (
      <>
        {shareMail?.entry && !shareMailMid && (
          <ChatForward
            msgs={{ mailMid: shareMail?.entry?.id, mailTid: shareMail?.entry?.tid || '' }}
            type="shareText"
            onVisibleChange={() => mailActions.doUpdateShareMail({} as MailEntryModel)}
          />
        )}
        {!!shareMailMid && (
          <TeamContactModel
            show={!!shareMailMid}
            onCancel={() => {
              mailActions.doUpdateShareMail({} as MailEntryModel);
              mailActions.doUpdateShareMailMid('');
            }}
            creatorType={1}
            mid={shareMailMid} // 注意：聚合模式和正常模式id的设置
          />
        )}
      </>
    ),
    [shareMail, shareMailMid]
  );

  // 红旗、已读、置顶状态修改
  // const setRemarkMail = (mark: boolean, id: string | string[], type: MailOperationType, isThread?: boolean) =>
  //   MailApi.doMarkMail(mark, id, type, isThread);
  // todo： 待重构，全局只包含请求部分，后续需要剥离无关请求，合并部分操作
  // 处理红旗邮件消息对应的请求
  // const handleRedFlagRequest = (e: SystemEvent<any>) => {
  //   // if (window?.location?.pathname?.includes('readMail')) return false;
  //   const { eventData, eventStrData } = e;
  //   const { mark, id, type, hideMessage: _hideMessage } = eventData;
  //   const key = typeof id === 'string' || typeof id === 'number' ? id : id.join(',');
  //   // setHideMessage(!!_hideMessage);
  //   if (id.length <= 0) {
  //     // TODO: 非空处理过于简单
  //     console.log(getIn18Text('BIAOJISHIid'));
  //     return false;
  //   }
  //   if (eventStrData === 'mark' || eventStrData === 'unmark') {
  //     return setRemarkMail(mark, id, type);
  //   }
  //   if (eventStrData === 'read' || eventStrData === 'unread') {
  //     return setRemarkMail(mark, id, type).then(async res => {
  //       if (isCorpMail) {
  //         try {
  //           refreshFolder(true);
  //         } catch (ex) {
  //           console.error(ex);
  //         }
  //       }
  //       return res;
  //     });
  //   }
  //   // 已迁移
  //   if (eventStrData === 'top' || eventStrData === 'unTop') {
  //     // if (mark && getTopMailNum(_mailDataList) >= 10) {
  //     //   return Promise.reject();
  //     // }
  //     return setRemarkMail(mark, id, 'top')
  //       .then(res => {
  //         if (res.succ) {
  //           message.success({
  //             content: mark
  //               ? typeof window !== 'undefined'
  //                 ? getIn18Text('YITIANJIAZHIDING')
  //                 : ''
  //               : typeof window !== 'undefined'
  //               ? getIn18Text('YIQUXIAOZHIDING')
  //               : '',
  //             duration: 1,
  //             key
  //           });
  //         } else {
  //           return Promise.reject();
  //         }
  //       })
  //       .catch(() => {
  //         message.error({
  //           content:
  //             eventStrData === 'top'
  //               ? typeof window !== 'undefined'
  //                 ? getIn18Text('ZHIDINGSHIBAI')
  //                 : ''
  //               : typeof window !== 'undefined'
  //               ? getIn18Text('QUXIAOZHIDINGSHI')
  //               : '',
  //           duration: 1,
  //           key
  //         });
  //         // 刷新列表，重置状态
  //         // loadMoreRows({ startIndex: 0 });
  //         dispatch(
  //           Thunks.refreshMailList({
  //             showLoading: false
  //           })
  //         );
  //       });
  //   }
  // };
  // 处理标签变动请求
  // const handleMailTagChangeRequest = (e: SystemEvent<any>) => {
  //   const { eventData, eventStrData } = e;
  //   const { mailList = [] as string[], tagNames = [], successMsg: _successMsg, failMsg: _failMsg, isNewTag } = eventData;
  //   if (eventStrData === 'tag') {
  //     // 发送请求
  //     const req = {
  //       ids: mailList,
  //       add: tagNames,
  //       isNewTag
  //     };
  //     MailApi.updateMessageTags(req);
  //   } else if (eventStrData === 'untag') {
  //     // 发送请求
  //     const req = {
  //       ids: mailList,
  //       delete: tagNames
  //     };
  //     MailApi.updateMessageTags(req);
  //   }
  // };
  useEffect(() => {
    // 如果没有文件夹数据，请求之
    if ((isShowTreeMenu || !!isShowImportTreeMenu) && (!mailTreeStateMap || mailTreeStateMap.main.mailFolderTreeList.length == 0)) {
      dispatch(
        Thunks.refreshFolder({
          noCache: false,
        })
      );
    }
  }, [isShowTreeMenu, isShowImportTreeMenu]);
  // 更新日历信息
  useEffect(() => {
    if (catalogList?.length <= 0) {
      getCatalogList().then(res => {
        updateCatlogList(res);
      });
    }
    getSetting().then((res: catalogSettingModel) => {
      // setWeekNumbersVisible(!!res?.commonSetting?.showWeekNumber);
      // const weekFirstNumber = res.wkst === 7 ? 0 : res.wkst;
      // setWeekFirstDay(res.wkst);
      // setNotification(!!res.reminderNotice);
      setShowSecondaryZone(!!res?.commonSetting?.showSecondaryZone);
      if (res?.commonSetting?.secondaryZoneIds && res?.commonSetting?.secondaryZoneIds?.length > 0) {
        setSettingZoneList([...res?.commonSetting?.secondaryZoneIds]);
      }
    });
  }, []);
  /**
   *  判断是地址是否在联系人组里
   */
  const toggleNewPersonalGroup = async (params: { name?: string; email: string }[], _account?: string) => {
    // const emails = items.map(item => item.contactItem?.contactItemVal);
    const email2NameMap: { [key: string]: string | undefined } = {};
    const emails = params.map(item => {
      email2NameMap[item.email] = item.name;
      return item.email;
    });

    // 判断是否在通讯录中
    const contactRes = await contactApi.doGetContactByEmailFilter({ emails, _account });
    // 如果有，返回对应的key2content[]
    const contactResKeys = Object.keys(contactRes);
    // 找出不在的key
    const diff = emails.filter(item => !contactResKeys.includes(item));
    let resContent: ContactModel[] = [];
    if (diff.length > 0) {
      await new Promise<ContactModel[]>((r, j) => {
        SiriusModal.error({
          title: '联系人中有陌生邮箱地址，需要添加个人通讯录再创建分组。是否添加？',
          cancelText: '跳过',
          okText: '添加',
          onOk: () => {
            const insertParams = emails.map(item => {
              return {
                name: email2NameMap[item] || item.split('@')[0],
                emailList: [item],
                _account,
              };
            });
            // 添加到个人通讯录
            contactApi
              .doInsertContact({
                list: insertParams,
                _account,
              })
              .then(res => {
                r(res.data);
              })
              .catch(e => {
                r([]);
              });
          },
          onCancel: () => {
            // 选择跳过，则过滤掉不在通讯录里的地址
            // const insertParams = emails
            //   .filter(item => !diff.includes(item))
            //   .map(item => {
            //     return {
            //       name: email2NameMap[item] || item.split('@')[0],
            //       emailList: [item],
            //     };
            //   });
            const list = Object.values(contactRes);
            // 添加到个人通讯录
            r(list ? list : []);
            //   contactApi
            //     .doInsertContact(insertParams)
            //     .then(res => {
            //       r(res.data);
            //     })
            //     .catch(e => {
            //       r([]);
            //     });
          },
        });
      }).then((list: ContactModel[]) => {
        resContent = list;
      });
    } else {
      // 如果没有不同
      contactResKeys.forEach(item => {
        if (contactRes[item]) {
          resContent.push(contactRes[item]);
        }
      });
    }
    return resContent;
  };

  // 是否关闭读信页
  const getReplyForwardCloseStore = () => {
    const replyForwardCloseData = storeApi.getSync('replyForwardClose', { noneUserRelated: true }).data;
    // 未设置
    if (!replyForwardCloseData) {
      // mac 默认不关闭
      if (isMac()) return false;
      // win 默认关闭
      return true;
    }
    // 设置了
    return replyForwardCloseData === 'true';
  };

  const replyForwardCloseMain = (tab: MailTabModel) => {
    const { id, extra } = tab;
    if (!id) return;
    const replyForwardClose = getReplyForwardCloseStore();
    if (replyForwardClose) {
      // 独立读信页
      if (locationHelper.testPathMatch('/readMail')) {
        systemApi.closeWindow();
        // 主页
      } else {
        try {
          // 判断是否是聚合
          if (extra?.originMid && idIsTreadMail(extra?.originMid)) return;
          dispatch(mailTabActions.doCloseTab(id));
        } catch (error) {
          console.log('关闭失败', error);
        }
      }
    }
  };

  const closeCurReadTabBefore = (ev: any) => {
    // 独立读信页面
    if (locationHelper.testPathMatch('/readMail')) return;
    console.log('closeCurReadTab_before', currentTab, ev);
    closeTabRef.current = null;
    const { closeable, id, type, extra } = currentTab;
    const { opt } = ev.eventData;
    if (closeable && type === 'read' && id) {
      closeTabRef.current = { id, opt, extra };
    }
  };

  const closeCurReadTabAfter = (ev: any) => {
    // 独立读信页面
    if (locationHelper.testPathMatch('/readMail')) {
      if (getReplyForwardCloseStore()) {
        systemApi.closeWindow();
      }
      return;
    }
    console.log('closeCurReadTab_after', ev, closeTabRef.current);
    const { opt } = ev.eventData;
    // 同一操作
    if (closeTabRef?.current?.opt === opt) {
      replyForwardCloseMain(closeTabRef?.current);
      closeTabRef.current = null;
    }
  };

  const freeVerionSizeOver = (ev: any) => {
    paidGuideModal.show({ errType: '41', origin: '邮箱转发' });
  };

  // 邮件阅读状态相关业务
  const { openRecordData, setOpenRecordData, readStatus, setReadStatus, debounceGetStatusOrDetail, getStatusOrDetail, formatReadStatusByProduct } = useGetReadStatus();

  /**
   * 邮件阅读状态弹窗
   */
  const [readStatusVisbale, setReadStatusVisbale] = useState(false);
  const [readStatusMailData, setReadStatusMailData] = useState<MailEntryModel>();

  const refreshData = useCreateCallbackForEvent(() => {
    const id = readStatusMailData?.id;
    if (!id) return;
    getStatusOrDetail(readStatusMailData);
  });

  const mailReadStatusElement = useMemo(() => {
    return readStatusVisbale ? (
      <StatusModal
        tid={readStatusMailData?.entry?.tid}
        readListData={readStatus}
        onClose={() => {
          setReadStatusVisbale(false);
          setReadStatusMailData(null);
        }}
        visible={readStatusVisbale}
        refreshData={refreshData}
      />
    ) : (
      <></>
    );
  }, [readStatusVisbale, readStatus, readStatusMailData]);

  // 查看阅读状态
  const doCheckList = useCallback((_id: string, _account?: string) => {
    mailApi.doCheckReadStatus(_id, _account).then(data => {
      if (data.detail.length) {
        const list = formatReadStatusByProduct(data.detail);
        const sucList = list.data?.filter(item => item.status === 'suc');
        setReadStatus(list);
        if (sucList?.length === list.data?.length) {
          message.success({ content: getIn18Text('QUANBUCHEHUICHENG'), duration: 2 });
        } else {
          setReadStatusVisbale(true);
        }
      } else {
        message.warn({ content: getIn18Text('QUANBUCHEHUISHI'), duration: 2 });
      }
    });
  }, []);

  /**
   * 邮件撤回
   */
  const retractEmail = (content: MailEntryModel, showRes: boolean) => {
    if (!content) return;
    const mid = content?.entry?.id;
    const account = content?._account;
    const findRes = sendingMails.find(item => item.id === mid);
    if (findRes) {
      message.warn({ content: getIn18Text('FASONGZHONGBUKECHEHUI') });
      return;
    }
    // 邮件撤回只支持主账号，所以此处不考虑多账号的情况
    const accountAlias = systemApi.getCurrentUser()?.prop?.accountAlias || [];
    const currentUser = content?.sender?.contact?.contact?.accountName;
    if (!accountAlias?.includes(currentUser)) {
      const _all = Alert.warn({
        title: getIn18Text('CHEHUISHIBAI'),
        content: getIn18Text('CIYOUJIANFAJIAN'),
        funcBtns: [
          {
            text: getIn18Text('QUEDING'),
            type: 'primary',
            onClick: () => {
              _all.destroy();
            },
          },
        ],
      });
      return;
    }
    if (content?.entry?.sendTime && new Date().getTime() - new Date(content?.entry?.sendTime).getTime() > 1296000000) {
      const _al1 = Alert.warn({
        title: getIn18Text('CHEHUISHIBAI'),
        content: getIn18Text('CIYOUJIANJUFA'),
        funcBtns: [
          {
            text: getIn18Text('QUEDING'),
            type: 'primary',
            onClick: () => {
              _al1.destroy();
            },
          },
        ],
      });
      return;
    }
    if (showRes) {
      // setCurrentAccount(account);
      mailApi.doCheckReadStatus(mid, account).then(data => {
        if (data.detail.length) {
          // const list = formatReadStatus(data.detail);
          const list = formatReadStatusByProduct(data.detail);
          setReadStatus(list);
          setReadStatusVisbale(true);
        }
      });
      // eventApi.sendSysEvent({
      //   eventName: 'mailMenuOper',
      //   eventData: { mailData: content },
      //   eventStrData: 'showMailReadState',
      //   _account: content?._account,
      // });
    } else {
      if (localStorage.getItem('backNmr') === 'true') {
        const key = 'withdraw....';
        message.loading({ content: getIn18Text('ZHENGZAICHEHUIYOU'), key });
        // setCurrentAccount(account);
        mailApi.doWithdrawMail(mid, readStatus?.tid, account).then(() => {
          message.destroy(key);
          // setCurrentAccount(account);
          doCheckList(mid, account);
          eventApi.sendSysEvent({
            eventName: 'mailMenuOper',
            eventData: {
              id: mid,
            },
            eventStrData: 'retractEmailSuccess',
          });
        });
        return;
      }
      const al = Alert.warn({
        title: getIn18Text('QUEDINGYAOCHEHUI'),
        content: getIn18Text('CHEHUICHENGGONGHOU'),
        nmrText: getIn18Text('BUZAITIXING'),
        funcBtns: [
          {
            text: getIn18Text('QUXIAO'),
            onClick: () => al.destroy(),
          },
          {
            text: getIn18Text('CHEHUI'),
            type: 'primary',
            nmr: !0,
            onClick: (event, nmrChecked) => {
              if (nmrChecked) {
                localStorage.setItem('backNmr', 'true');
              }
              const key = 'withdraw....';
              message.loading({ content: getIn18Text('ZHENGZAICHEHUIYOU'), key });
              // setCurrentAccount(account);
              mailApi
                .doWithdrawMail(mid, readStatus?.tid, account)
                .then(() => {
                  message.destroy(key);
                  al.destroy();
                  doCheckList(mid);
                  eventApi.sendSysEvent({
                    eventName: 'mailMenuOper',
                    eventData: {
                      id: mid,
                    },
                    eventStrData: 'retractEmailSuccess',
                  });
                })
                .catch(err => {
                  message.destroy(key);
                });
            },
          },
        ],
      });
    }
  };

  /**
   * 消息监听
   */
  useMsgRenderCallback('mailMenuOper', ev => {
    const { _account } = ev;
    // 点击了邮件移动
    if (ev?.eventStrData == 'move') {
      const { mailId, folderId } = ev.eventData;
      reducer.showMailMoveModal({
        mailId: mailId,
        accountId: _account,
        folderId,
      });
    } else if (ev?.eventStrData == 'comment') {
      const { mailId, memo } = ev.eventData;
      const { _account } = ev;
      setCommentMemoAccount(_account || '');
      setCommentMemo(memo);
      setCommentVisible(true);
      setMailId(mailId);
    } else if (ev?.eventStrData == 'delete') {
      const { mailId: id, isThread, params, folderId } = ev.eventData;
      dispatch(
        Thunks.deleteMail({
          id,
          showLoading: params?.showLoading ? (params?.showGlobalLoading ? 'global' : true) : false,
          isScheduleSend: params?.isScheduleSend,
          detail: params?.detail,
          folderId: folderId,
        })
      );
    } else if (ev?.eventStrData == 'report') {
      const { mailId, hasReport, senderEmail } = ev.eventData;
      setReportConfig({
        mailId,
        hasReport,
        senderEmail,
      });
      setReportVisible(true);
    } else if (ev?.eventStrData == 'delivery') {
      const { mailId, account, way } = ev.eventData;
      setMailId(mailId);
      setDeliveryAccount(account);
      setDeliveryWay(way);
      setDeliveryVisible(true);
    } else if (ev?.eventStrData == 'print') {
      const { _account } = ev;
      const { mailId, isThread, isPreview = false } = ev.eventData;
      if (!isThread) {
        printRef?.current?.printMail(mailId, _account, isPreview);
      }
    } else if (ev?.eventStrData == 'setFromGroup') {
      const { senderEmail, title } = ev.eventData;
      setMailSender(senderEmail);
      setMailTitle(title);
      changeShowClassifyModal(true);
    } else if (ev?.eventStrData == 'attachmentPreview') {
      // web端，邮件列表点击附件不在发送此事件，改为直接打开新的tab页
      attachmentActions.doAttachmentPreview(ev.eventData);
    } else if (ev?.eventStrData === 'share') {
      doUpdateShareMail(ev?.eventData);
    } else if (ev?.eventStrData === 'importMail') {
      const { cid } = ev.eventData;
      refreshFolder();
      setTimeout(() => {
        reducer.showMailImportModal({
          mailId: cid,
        });
      }, 50);
    } else if (ev?.eventStrData === 'closeMailWindow') {
      // 关闭当前窗体
      systemApi.closeWindow(true);
      // todo: web下窗体如何关闭
    } else if (ev?.eventStrData === 'addTagAndMark') {
      const { mailList: list } = ev.eventData;
      if (list && list.length > 0) {
        setAddtagModalVisible({
          accountId: _account,
          visible: true,
        });
        setMailTagMarkMailList(list);
      }
    } else if (ev?.eventStrData === 'newGuideForAside') {
      // 邮件+231222版本，下线右侧边栏新手引导
      // const { visible, email } = ev.eventData;
      // if (email) {
      //   setCurrentEmailForAside(email);
      // }
      // if (typeof visible === 'boolean') {
      //   setNewGuideVisible(visible);
      // }
    } else if (ev?.eventStrData === 'back') {
      dispatch(mailTabActions.doChangeCurrentTab(currentTab?.extra?.from || '-1'));
    } else if (ev?.eventStrData === 'completeTrust') {
      // 这里是因来信分类或白名单进入非垃圾文件夹的可疑邮件提示条的信任，点击后调服务接口抹去可疑标识别
      const { mailId } = ev.eventData;

      mailApi.doCompleteTrustMail([mailId]).then(v => {
        reducer.doMailOperation({ ...ev });
      });
    } else if (ev?.eventStrData === 'createPersonalGroup') {
      const receiverEmails: { name?: string; email: string }[] = ev.eventData.receiverEmails;

      if (receiverEmails && receiverEmails.length && !personalOrgModalVisible) {
        // 判断收件人是否在通讯录中
        toggleNewPersonalGroup(receiverEmails, _account)
          .then((res: ContactModel[]) => {
            if (res && res.length) {
              const params = res.map(item => contactApi.transContactModel2ContactItem(item));
              setDefaultPersonalOrgSelect(params);
            } else {
              setDefaultPersonalOrgSelect([]);
            }
            setPersonalOrgModalVisible(true);
            setPersonalOrgAccount(_account);
          })
          .catch(e => {
            Toast.error({ content: '创建个人分组失败' });
          });
      }
    } else if (ev?.eventStrData === 'closeCurReadTab_before') {
      closeCurReadTabBefore(ev);
    } else if (ev?.eventStrData === 'closeCurReadTab_after') {
      closeCurReadTabAfter(ev);
    } else if (ev?.eventStrData === 'discussion') {
      // 弹出邮件分享弹框
      const { mailId, tid } = ev.eventData;
      setMailDiscussModalVisiable(true);
      setMailDicussModalKey({
        mid: mailId,
        tid,
      });
    }
    // 免费版 邮件尺寸超出
    else if (ev?.eventStrData === 'freeVerionSizeOver') {
      freeVerionSizeOver(ev);
    }
    // 查看邮件撤回状态
    else if (ev?.eventStrData === 'showMailReadState') {
      // 直接获取对应的mailmodel
      // const { mailData } = ev.eventData;
      // setReadStatusMailData(mailData);
      // // 请求邮件阅读状态
      // setReadStatusVisbale(true);
      // // setOpenRecordData({ count: 0, records: [] });
      // // todo
      // debounceGetStatusOrDetail(mailData);
    }
    // 邮件撤回
    else if (ev?.eventStrData === 'retractEmail') {
      // 直接获取对应的mailmodel
      const { mailData, showRes } = ev.eventData;
      retractEmail(mailData, showRes);
    }
    // 展示邮件标签的引导弹窗
    else if (ev?.eventStrData === 'showMailTagGuideModal') {
      // 直接获取对应的mailmodel
      const { visiable } = ev.eventData;
      setMailTagGuideModalVisable(visiable);
      localStorage.setItem(MAIL_TAG_GUIDE_LOCAL_KEY, 'true');
    } else if (ev?.eventStrData === 'mailTagGuideModalClose') {
      // 邮件标签引导弹窗关闭通知
      // 此处无逻辑处理，只做枚举
    }
    // else if (ev?.eventStrData === 'mailEncoding') {
    //   // 更改编码
    //   const { mid, encoding, account } = ev.eventData;
    //   mailApi.doChangeMailEncoding(mid, encoding, { _account: account }).then(newContent => {
    //     const noSysTagContent = filterSysMailTag(newContent);
    //     console.log(noSysTagContent);
    //   });
    // }

    // else if (ev?.eventStrData == 'withDraw') {
    //   const {
    //     mailId,
    //     content
    //   } = ev.eventData;
    //   setWithDrawMailId(mailId);
    //   handleWithDraw(mailId,content);
    // } else if (ev?.eventStrData == 'withDrawRes') {
    // }
  });

  // 当期那操作邮件的文件夹树
  const mailMoveTreeList = useMemo(() => {
    const res =
      mailTreeStateMap && mailMoveMid?.accountId && getTreeStatesByAccount(mailTreeStateMap, mailMoveMid.accountId)
        ? getTreeStatesByAccount(mailTreeStateMap, mailMoveMid.accountId)?.mailFolderTreeList
        : [];
    return res;
  }, [mailTreeStateMap, mailMoveMid]);

  // 当前操作的文件夹是否包含自定义文件夹
  const hasCustomFolder = useMemo(() => {
    return mailTreeStateMap && mailMoveMid?.accountId && getTreeStatesByAccount(mailTreeStateMap, mailMoveMid.accountId)
      ? getTreeStatesByAccount(mailTreeStateMap, mailMoveMid.accountId)?.hasCustomFolder
      : [];
  }, [mailTreeStateMap, mailMoveMid]);
  // 创建日程窗口关闭
  const handelCreateCancel = () => {
    // cRef.current?.getApi().getEventById(NewScheduleTempId)?.remove();
    changeScheduleEvent(null);
    setScheduleEditFrom('');
  };
  const IcsScheduleModel = useMemo(() => {
    return scheduleEditFrom === 'mail' && !!icsEventDetail ? (
      <CreateScheduleBox source={ScheduleSyncObInitiator.MAIL_MODULE} onCancel={handelCreateCancel} getReferenceElement={() => document.body} />
    ) : (
      <></>
    );
  }, [icsEventDetail]);
  // 是否展示 “提示用户创建自定义文件夹的” 的文案
  const showEmptyFolderTip = useMemo(() => {
    let selectedFolderId = 0;
    try {
      if (selectedKeys?.id) {
        selectedFolderId = parseInt(selectedKeys?.id + '');
      }
    } catch (e) {
      console.error('[showEmptyFolderTip Error]', e);
    }
    return !hasCustomFolder && (selectedFolderId < 0 || isSearching);
  }, [hasCustomFolder, selectedKeys?.id, isSearching]);

  return (
    <>
      {commentVisible && <CommentModal visible={commentVisible} setVisible={setCommentVisible} mailId={mailId || ''} memo={commentMemo} account={commentMemoAccount} />}
      <SiriusModal
        {...MenuConfig}
        visible={isShowTreeMenu}
        okText={getIn18Text('QUEDING')}
        cancelText={getIn18Text('QUXIAO')}
        okButtonProps={{ disabled: !selectedMenuKeys?.length }}
        onOk={onConfirmMove}
        closeIcon={<CloseIcon className="dark-invert" />}
        onCancel={() => setTreeMenu(false)}
        bodyStyle={{ overflow: 'auto' }}
        destroyOnClose={true}
      >
        <div className="m-tree-container m-move-tree">
          {showEmptyFolderTip ? (
            <div className="no-custom-folder-wrap">
              <div className="ncf-logo ">
                <div className="sirius-empty sirius-empty-search" />
              </div>
              <div className="ncf-title">{getIn18Text('JINZHICHIPILIANG')}</div>
            </div>
          ) : (
            <Tree
              selectedKeys={folderId2String(selectedMenuKeys)}
              showIcon
              onExpand={keys => {
                setExpandedMenuKeys(folderId2Number(keys));
              }}
              expandedKeys={folderId2String(expandedMenuKeys)}
              treeData={mailMoveTreeList?.map((treeData: MailBoxModel) => data2tree(treeData))}
              icon={<ReadListIcons.FolderSvg />}
              onSelect={onSelectMenuFid}
              blockNode
            />
          )}
        </div>
      </SiriusModal>
      <SiriusModal
        {...ImportMenuConfig}
        visible={isShowImportTreeMenu}
        closeIcon={<CloseIcon className="dark-invert" />}
        onCancel={onCancelImport}
        bodyStyle={{ overflow: 'auto' }}
        destroyOnClose={true}
        footer={[
          <Button key="confirm" onClick={onCancelImport} className="local-import-btn">
            {getIn18Text('QUXIAO')}
          </Button>,
          <Button key="confirm" type="primary" onClick={onConfirmImport} disabled={!selectedMenuKeys?.length} loading={importConfirmLoading} className="local-import-btn">
            {getIn18Text('QUEDING')}
          </Button>,
        ]}
      >
        <div className="m-tree-container m-move-tree">
          <Tree
            selectedKeys={folderId2String(selectedMenuKeys)}
            showIcon
            onExpand={keys => {
              setExpandedMenuKeys(folderId2Number(keys));
            }}
            expandedKeys={folderId2String(expandedMenuKeys)}
            treeData={mailTreeStateMap.main?.mailFolderTreeList?.map((treeData: MailBoxModel) => data2tree(treeData, true))}
            icon={<ReadListIcons.FolderSvg />}
            onSelect={onSelectMenuFid}
            blockNode
          />
        </div>
      </SiriusModal>
      <MailReport
        visible={reportVisible}
        setVisible={setReportVisible}
        mailId={reportConfig?.mailId}
        hasReport={reportConfig?.hasReport}
        senderEmail={reportConfig?.senderEmail}
      />
      <MailDelivery visible={deliveryVisible} setVisible={setDeliveryVisible} account={deliveryAccount as string} way={deliveryWay as string} mailId={mailId as string} />
      <MailPrint ref={printRef} />
      <MailTodoModal />
      {addTagModalVisible?.visible && (
        <TagModal
          account={addTagModalVisible?.accountId}
          type="add"
          markWhenAdd
          data={[]}
          activeIds={mailTagMarkMailList}
          afterClose={() => {
            setAddtagModalVisible(false);
          }}
        />
      )}
      {showGlobalLoading ? (
        <div className="global-modal-warp">
          <Spin
            wrapperClassName="global-modal-spin"
            tip={<div className="global-modal-spin-tip">{getIn18Text('CAOZUOZHENGZAIJIN')}</div>}
            indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />}
          >
            <div className="global-modal" />
          </Spin>
        </div>
      ) : (
        <></>
      )}
      {/* 邮件+231222版本，下线右侧边栏新手引导 */}
      {/* {process.env.BUILD_ISEDM && <NewGuideForAside email={currentEmailForAside} />} */}
      <Dialog isModalVisible={isModalVisible} onCancel={setModalVisible} isCancel {...resetDialog} />
      {/* 分享弹窗、讨论组创建弹窗组件 */}
      {shareDiscussModal}
      {personalOrgModalVisible && (
        <PersonalOrgModal
          defaultSelectedContact={defaultPersonalOrgSelect}
          // personalOrgId={selectedPersonalOrgId}
          _account={personalOrgAccount}
          onCancel={() => {
            setDefaultPersonalOrgSelect([]);
            setPersonalOrgModalVisible(false);
          }}
          onSure={() => {
            setDefaultPersonalOrgSelect([]);
            setPersonalOrgModalVisible(false);
          }}
        />
      )}
      <TagGuideModal visiable={mailTagGuideModalVisable} onClose={() => setMailTagGuideModalVisable(false)} />
      {/* 邮件阅读状态弹窗 */}
      {mailReadStatusElement}
      {/* 邮件分享弹窗 */}
      <MailDiscussModal keyIds={mailDicussModalKey} visiable={MailDiscussModalVisiable} onClosed={handleDiscussClose} />

      {IcsScheduleModel}
    </>
  );
};
export default MailSyncModal;
