/* eslint-disable react/no-unused-prop-types */
/* eslint-disable react/destructuring-assignment */
import React, { useEffect, useMemo, useRef, useState, useImperativeHandle } from 'react';
import { Checkbox, Tooltip } from 'antd';
import message from '@web-common/components/UI/Message/SiriusMessage';
import moment from 'moment';
import {
  apiHolder as api,
  apis,
  MailAliasAccountModel,
  MailApi,
  MailBoxEntryContactInfoModel,
  MailEntryModel,
  SystemApi,
  // 最近联系人
  apiHolder,
  ContactApi,
  OrgApi,
  util,
  isElectron,
  ProductAuthorityFeature,
  AccountApi,
  DataStoreApi,
  EventApi,
  locationHelper,
  MailDraftApi,
  NetStorageApi,
  MailFileAttachModel,
  SystemEvent,
  PerformanceApi,
  LoggerApi,
  isEdm,
  WriteMailInitModelParams,
  MailConfApi,
} from 'api';
import { navigate } from 'gatsby';
import style from './index.module.scss';
import { ViewMail } from '@web-common/state/state';
import { actions as mailActions, SendingMail } from '@web-common/state/reducer/mailReducer';
import { useActions, useAppDispatch, useAppSelector } from '@web-common/state/createStore';
import useDebounceForEvent from '@web-mail/hooks/useDebounceForEvent';
import { actions as mailTabActions } from '@web-common/state/reducer/mailTabReducer';
import { comIsShowByAuth } from '@web-common/utils/utils';
import { AppActions, MailActions } from '@web-common/state/reducer';
import { actions as attachmentActions } from '@web-common/state/reducer/attachmentReducer';
import { dealTaskMail, dealPraiseMail, resetMailWithDraft } from './utils';
import SaveDraft from './SaveDraft';
import ScheduledSent from './ScheduledSent';
import EncryptMail from './EncryptMail';
import ReadRemindComp from './ReadRemindComp';
import SenderSelectComp from './SenderSelectComp';
import SaveAsTemplateComp from './SaveAsTemplateComp';
import calendarSubmit from './calendarSubmit';
import SendValidateComp from './SendValidateComp';
import SendErrorContect from '@web-mail-write/components/SendMail/SendErrorContect';
import SiriusModal from '@web-common/components/UI/Modal/SiriusModal';
import SiriusMessage from '@web-common/components/UI/Message/SiriusMessage';
import { joinWebmailActivity } from '@web-common/components/util/webmail-util';
import useCreateCallbackForEvent from '@web-common/hooks/useCreateCallbackForEvent';
import { Editor as EditorType } from '@web-common/tinymce';
import { attachmentDownloadAction } from '@web-common/state/action';
import CloseButton from './CloseButton';
import useReupload from './useReupload';
import Dialog from '@web-common/components/UI/Dialog/dialog';
import { useGetProductAuth } from '@web-common/hooks/useGetProductAuth';
import { useNiceModal } from '@web-common/components/UI/NiceModal/NiceModal';
import { ReactComponent as IconWarn } from '@/images/icons/icon-warn.svg';
import { getIn18Text } from 'api';
// import { accountWork } from './utils';

/* tslint-disable */
const systemApi = api.api.getSystemApi() as SystemApi;
const inElectron = isElectron();
const mailApi: MailApi = api.api.requireLogicalApi(apis.mailApiImpl) as unknown as MailApi;
const contactApi = apiHolder.api.requireLogicalApi(apis.contactApiImpl) as unknown as ContactApi & OrgApi;
const mailDraftApi = api.api.requireLogicalApi(apis.mailDraftApiImpl) as MailDraftApi;
const accountApi = api.api.requireLogicalApi(apis.accountApiImpl) as AccountApi;
const performanceApi: PerformanceApi = api.api.requireLogicalApi(apis.performanceImpl) as PerformanceApi;
const mailConfApi = api.api.requireLogicalApi(apis.mailConfApiImpl) as unknown as MailConfApi;
const dataStoreApi = api.api.getDataStoreApi() as DataStoreApi;
const eventApi: EventApi = api.api.getEventApi() as unknown as EventApi;
const diskApi = api.api.requireLogicalApi(apis.netStorageImpl) as NetStorageApi;
const loggerApi = api.api.requireLogicalApi(apis.loggerApiImpl) as LoggerApi;

interface Props {
  sendLoading: boolean;
  setVisibleConf: React.Dispatch<React.SetStateAction<boolean>>;
  execAutoSaveDraft?: boolean;
  forceSave?: () => string;
  isContentChanged?: boolean;
  tooltipVisible: boolean;
  setTooltipVisible: (val: boolean) => void;
  saveTime: string;
  setSaveTime: (val: string) => void;
  updateSaveTime: () => void;
  innerCloseTab?: (id: string) => void;
  scheduledSent?: boolean;
  setScheduledSent?: (val: boolean) => void;
  editorInstance?: EditorType;
}

interface GenerateDataParams {
  receiver?: MailBoxEntryContactInfoModel[];
  icsReupload?: boolean;
  curSendId?: string;
}

// eslint-disable-next-line max-statements
const SendMail: React.FC<Props> = React.forwardRef((props: Props, ref) => {
  const [visibleErrorContect, setVisibleErrorContect] = useState(false);
  const [errorMsg, setErrorMsg] = useState<any>({});
  const sendRef = useRef(null);
  const [showSaveTime, setShowSaveTime] = useState<boolean>(true); // 添加控制变量，在最小尺寸下，不展示保存时间
  const {
    sendLoading,
    setVisibleConf,
    execAutoSaveDraft = false,
    forceSave,
    isContentChanged,
    tooltipVisible,
    setTooltipVisible,
    saveTime,
    setSaveTime,
    updateSaveTime,
    innerCloseTab,
    scheduledSent,
    setScheduledSent,
    editorInstance,
  } = props;
  const { currentMail, mails } = useAppSelector(state => state.mailReducer);
  const { tabList } = useAppSelector(state => state.mailTabReducer);
  // const receiver = useAppSelector(state => state.mailReducer.currentMail.receiver);
  const senderReceivers = useAppSelector(state => state.mailReducer.currentMail.senderReceivers);
  const currentMailId = useAppSelector(state => state.mailReducer.currentMail.cid);
  const { doChangeMailContent, doSetPuretext } = MailActions;
  // const curAccount = useAppSelector(state => state.mailReducer.currentMail?.optSender);
  const optSenderMainEmail = useAppSelector(state => state.mailReducer.currentMail?.optSenderMainEmail);
  // 定时发信时间
  const scheduleDate = useAppSelector(state => state.mailReducer.currentMail.scheduleDate);
  // 加密邮件
  const setEncrypt = useAppSelector(state => state.mailReducer.currentMail.setEncrypt);
  const appActions = useActions(AppActions);
  const [sender, setSender] = useState<MailAliasAccountModel | null>(null); // 别名
  const receiverMemo = useMemo(() => currentMail?.receiver, [visibleErrorContect]);
  const priority = useMemo(() => currentMail?.entry?.priority, [currentMail]);
  const subAccountExpired = useMemo(() => currentMail?.subAccountExpired, [currentMail]); // 子账号造信 中途过期
  const requestReadReceipt = useMemo(() => currentMail?.requestReadReceipt, [currentMail]);
  const senderEmail = useMemo(() => currentMail?.initSenderStr || '', [currentMailId, currentMail?.initSenderStr]);
  const currentTabId = useAppSelector(state => state.mailTabReducer.currentTab.id);
  const dispatch = useAppDispatch();
  const conferenceShow = useAppSelector(state => state.mailReducer.currentMail.status?.conferenceShow);
  const praiseMailShow = useAppSelector(state => state.mailReducer.currentMail.status?.praiseMailShow);
  const taskMailShow = useAppSelector(state => state.mailReducer.currentMail.status?.taskMailShow);
  const puretext = useAppSelector(state => state.mailReducer.currentMail.status?.puretext);
  const sendfooterRef = useRef<HTMLDivElement>(null);
  const currentMailIdRef = useRef<string | undefined>(currentMailId);
  currentMailIdRef.current = currentMailId;
  const currentTabIdRef = useRef<string | undefined>(currentTabId);
  currentTabIdRef.current = currentTabId;

  const [sendfooterWidth, setSendfooterWidth] = useState(0);
  const { reUploadHandler, clearMidFile, reUploadHandlerWeb } = useReupload();
  const attachments = useAppSelector(state => state.attachmentReducer.attachments);
  const [puretextVisible, setPuretextVisible] = useState(false);
  const [isSub, setIsSub] = useState(false);
  const paidGuideModal = useNiceModal('paidGuide');

  useEffect(() => {
    if (!sendfooterRef.current) {
      return;
    }
    const observableInstance = new ResizeObserver(entries => {
      for (const entry of entries) {
        setSendfooterWidth(entry.contentRect.width);
      }
    });
    observableInstance.observe(sendfooterRef.current);
    return () => {
      observableInstance.disconnect();
    };
  }, []);

  // 加密checkbox展示
  const encryptMailCkShow = useMemo(() => {
    const { writeType, isEncryptedMail } = currentMail;
    if (isSub) return false;
    // 加密邮件 转发/回复
    if (isEncryptedMail && (writeType?.includes('reply') || writeType?.includes('forward'))) {
      return false;
    }
    return true;
  }, [currentMail, isSub]);

  // 加密checkbox禁用
  const encryptMailDisabled = useMemo(() => {
    const { status } = currentMail;
    const { praiseMailShow, taskMailShow, conferenceShow } = status || {};
    // 与任务邮件 表扬信 会议邀请 定时发送 互斥
    if (praiseMailShow || taskMailShow || conferenceShow || scheduledSent) {
      return true;
    }
    return false;
  }, [currentMail, scheduledSent]);
  // 当前版本信息
  const {
    productVersionInfo: { productVersionId },
  } = useGetProductAuth();
  useEffect(() => {
    if (sendfooterWidth && sendfooterWidth < 850) {
      setShowSaveTime(false);
    } else {
      setShowSaveTime(true);
    }
  }, [sendfooterWidth]);

  // 发信成功，关闭写信
  const sucDealReducer = useCreateCallbackForEvent(async (curCid: string, isSendCurrentMail?: boolean) => {
    const { pathname } = window.location;
    // mailReducer处理
    if (isSendCurrentMail) {
      // 清除并设置新的currentMail
      curCid && dispatch(mailActions.doCloseMail(curCid));
    } else {
      // 清除
      curCid && dispatch(mailActions.doClearMails([curCid]));
    }

    // 桌面端
    if (inElectron) {
      // 写信独立弹窗 关闭
      if (pathname.includes('/writeMail')) {
        setTimeout(() => {
          const isLowMemoryMode = systemApi.getIsLowMemoryModeSync();
          const isSendAttachmentPage = mailApi.getIsSendAttachmentWritePage();
          if (isLowMemoryMode || isSendAttachmentPage) {
            window.electronLib.windowManage.getCurWindow().then((res: { id: number }) => {
              const winId = res.id;
              setTimeout(() => {
                window.electronLib.windowManage.hide(winId);
              }, 0);
            });
            setTimeout(() => {
              systemApi.closeWindow();
            }, 1200);
          } else {
            systemApi.closeWindow();
          }
        }, 300);
      } else {
        if (isSendCurrentMail) {
          setTimeout(() => {
            // 清除并设置新的currentTab
            dispatch(mailTabActions.doCloseTab(String(curCid)));
          }, 1000);
        } else {
          // 清除
          dispatch(mailTabActions.doClearTabs([String(curCid)]));
        }
      }
      return;
    }

    // web端
    if (isSendCurrentMail) {
      setTimeout(() => {
        // 清除并设置新的currentTab
        dispatch(mailTabActions.doCloseTab(String(curCid)));
      }, 800);
    } else {
      // 清除
      dispatch(mailTabActions.doClearTabs([String(curCid)]));
    }
  });

  const errorContectResend = errorMsg => {
    const errReceivers = errorMsg.msgItem.map(item => item.email);
    const filterReveivers = currentMail?.receiver?.filter(item => !errReceivers.includes(item?.contact?.contact?.accountName));
    appActions.doReplaceReceiver(filterReveivers);
    saveSend({ receiver: filterReveivers as MailBoxEntryContactInfoModel[] });
  };

  // 选择定时发送模式
  const scheduledSentChange = () => {
    // 关闭
    if (scheduledSent) {
      dispatch(mailActions.doChangeMailSchedule(undefined));
      dispatch(mailActions.doChangeMailScheduleTimeZone(undefined));
    }
    // 打开
    if (!scheduledSent) {
      // 没有时间 初始化
      if (!scheduleDate) {
        // 默认选中比当前时间迟1-5分钟的下一个时间点，如当前时间是12月31日18:03，则默认选中12月31日18:05；如当前时间是18:05，则默认选中18:10
        const diff =
          30 -
          (moment()
            .utcOffset(systemApi.getSystemTimeZone()?.key || 8)
            .minute() %
            5);
        dispatch(
          mailActions.doChangeMailSchedule(
            moment()
              .add(diff, 'm')
              .utcOffset(systemApi.getSystemTimeZone()?.key || 8)
              .format('YYYY-MM-DD HH:mm:ss')
          )
        );
        dispatch(mailActions.doChangeMailScheduleTimeZone(systemApi.getSystemTimeZone()?.key));
      }
    }
    setScheduledSent && setScheduledSent(data => !data);
  };

  const scheduledSentChangeDisabled = () => {
    if (taskMailShow) {
      // @ts-ignore
      message.warn({
        content: getIn18Text('RENWUYOUJIANZAN'),
      });
    } else if (praiseMailShow) {
      // @ts-ignore
      message.warn({
        content: getIn18Text('BIAOYANGYOUJIANZAN'),
      });
    }
  };

  // 选择是否加密邮件
  const encryptMailChange = () => {
    // 关闭 清空
    if (setEncrypt) {
      dispatch(mailActions.doChangeMailSetEncrypt(false));
      dispatch(mailActions.doChangeMailEncpwd(''));
      dispatch(mailActions.doChangeMailSavePassword(false));
    } else {
      dispatch(mailActions.doChangeMailSetEncrypt(true));
    }
  };

  // 办公免费版提示升级版本引导
  const paidGuideShow = (errType: string) => {
    if (errType === '7') {
      paidGuideModal.show({ errType: errType, origin: '写信页' });
    } else if (errType === '8') {
      paidGuideModal.show({ errType: errType, origin: '写信页' });
    }
  };

  // 设置为紧急/非紧急
  const emergencyChange = () => {
    // 紧急邮件优先级为1，普通邮件为3
    const targetPriority = priority === 1 ? 3 : 1;
    dispatch(mailActions.doChangeMailEmergency(targetPriority));
  };
  // 已读回执
  const requestReadReceiptChange = () => {
    dataStoreApi.put('requestReadReceiptStore', String(+!requestReadReceipt));
    dispatch(mailActions.doChangeRequestReadReceipt(!requestReadReceipt));
  };
  useEffect(() => {
    dataStoreApi.get('requestReadReceiptStore').then(({ data }) => {
      const status = data || '0';
      dispatch(mailActions.doChangeRequestReadReceipt(!!+status));
    });
  }, [currentMailId]);

  useImperativeHandle(ref, () => {
    return {
      toSaveSend() {
        saveSend();
      },
    };
  });

  // 重新上传附件
  const reUploadAtts = useCreateCallbackForEvent(async (resendAccount?: string) => {
    const oldCid = currentMailId;

    if (inElectron) {
      try {
        dispatch(mailActions.doModifyMailEditStatus({ cid: oldCid, status: 'reUploading' }));
        const reUploadRes = await reUploadHandler(resendAccount);
        dispatch(mailActions.doModifyMailEditStatus({ cid: oldCid, status: '' }));
        console.log('reUploadResreUploadResreUploadRes', reUploadRes);
        if (reUploadRes && reUploadRes.every(i => i.status === 'fulfilled')) {
          message.success('上传完成');
          dispatch(mailActions.doModifyInitSenderStr(optSenderMainEmail || ''));
        } else {
          message.error('部分附件或图片上传失败，请重试');
        }
      } catch (err) {
        console.log('附件重传失败', err);
        dispatch(mailActions.doModifyMailEditStatus({ cid: oldCid, status: '' }));
      }
    } else {
      try {
        if (reUploadHandlerWeb) {
          dispatch(mailActions.doModifyMailEditStatus({ cid: oldCid, status: 'reUploading' }));
          const reUploadWebRes = await reUploadHandlerWeb(resendAccount, false, forceSave);
          dispatch(mailActions.doModifyInitSenderStr(optSenderMainEmail || ''));
          dispatch(mailActions.doModifyMailEditStatus({ cid: oldCid, status: '' }));
          message.success('上传完成');
        }
      } catch (error) {
        message.error('部分附件或图片上传失败，请重试');
        dispatch(mailActions.doModifyMailEditStatus({ cid: oldCid, status: '' }));
      }
    }
  });

  // 云附件续期
  const renewalCloudAtt = async (attachments: MailFileAttachModel[]) => {
    // 仅限旗舰版
    if (productVersionId !== 'ultimate') return;
    const renewIds: string[] = [];
    attachments.forEach((att: MailFileAttachModel) => {
      const { expired, cloudAttachment, id, docId } = att;
      // 会过期
      if (expired) {
        // 云附件空间添加为云附件
        if (cloudAttachment && id) {
          typeof id === 'string' && renewIds.push(id);
        }
        // 云附件空间添加为普通附件
        if (!cloudAttachment && docId) {
          typeof docId === 'string' && renewIds.push(docId);
        }
      }
    });

    if (renewIds.length) {
      try {
        const res = await diskApi.renewAttachments({ identities: renewIds });
        if (res !== true) {
          console.log('发信云附件续期失败');
        }
      } catch (err) {
        console.log('发信云附件续期失败', err);
      }
    }
  };

  // 删除本地草稿
  const delLocalDraft = async (curCid: string) => {
    try {
      const delRes = await mailDraftApi.deleteDraftMailByCid(curCid);
      const { success, message } = delRes;
      // 删除成功 刷新本地草稿
      if (success) {
        eventApi.sendSysEvent({
          eventName: 'refreshLocalDraft',
          eventData: {},
        } as SystemEvent);
        return;
      }
      console.log('发信删除草稿邮件失败', message || '');
    } catch (error) {
      console.log('发信删除草稿邮件失败', error);
    }
  };

  // 邮件重置
  const mailReset = useCreateCallbackForEvent(async () => {
    const { draftId, _account, cid } = currentMail;
    let latestedDraftId = draftId;
    try {
      // 强制不带参存储一次草稿 这样稍后恢复时能尽可能拿到最多的数据
      const res = await mailApi.doSaveTemp({ content: currentMail, saveDraft: true, auto: true, callPurpose: 'resetSaveDraft' });
      console.log('forceSave res', res, latestedDraftId);
      if (res.draftId) {
        latestedDraftId = res.draftId;
      }
    } catch (error) {
      console.log('重置前保存草稿失败', error);
    }
    // 未存储过草稿
    if (!latestedDraftId) {
      SiriusMessage.error({ content: '恢复失败' });
      return;
    }
    const curAccountId = _account ? accountApi.getEmailIdByEmail(_account) : '';
    console.log('curAccountId', curAccountId);
    // 主账号 走已有的重生逻辑
    if (!curAccountId || systemApi.getCurrentUser()?.id === curAccountId) {
      cid && resetMailWithDraft(cid);
      return;
    }
    const oldCid = cid;
    // 子账号 走简化的远端重新编辑逻辑
    const draftParams: WriteMailInitModelParams = {
      id: latestedDraftId,
      mailType: 'draft',
      writeType: 'editDraft',
      withoutPlaceholder: true,
      _account: _account,
    };
    const res = await mailApi.initModel(draftParams);
    if (res) {
      // 新的cid
      const { cid: newCid } = res;
      res.recoverCid = oldCid;
      // 替换旧的mailreducer
      dispatch(mailActions.doReplaceMail(res));
      // 替换tabreducer
      dispatch(mailTabActions.doReplaceTabById({ id: String(newCid), recoverCid: String(oldCid) }));
      // 清除旧的attachemntreducer附件
      oldCid && dispatch(attachmentActions.doDelAttachment({ cid: [oldCid] }));
      // 清除旧的attachmentredux附件
      // 将附件添加至attachment redux层 用于展示
      // 过滤掉在正文中显示的附件
      const filterAttachment = (res.entry.attachment || []).filter(item => !item.inlined);
      filterAttachment.forEach(attachment => {
        const temp = {
          ...attachment,
          mailId: res.cid,
          // 用于重新下载
          downloadContentId: res.entry.id,
          downloadId: attachment.fileUrl + res.entry.id,
          type: 'download', // 需要重新下载 但此逻辑已废弃...
          cloudAttachment: attachment.type === 'netfolder',
        };
        // 添加上附件
        dispatch(
          attachmentDownloadAction(temp, {
            forward: true,
            entryId: res.entry.id,
            cid: res.cid || '0',
          })
        );
      });
    }
  });

  const mailStatusError = () => {
    const modal = SiriusModal.error({
      title: '邮件附件状态异常',
      content: '需刷新恢复',
      okText: '刷新',
      onOk: () => {
        mailReset();
        modal.destroy();
      },
    });
  };

  // 发信成功
  const sendSuc = useCreateCallbackForEvent(async (params: { resModel: MailEntryModel; reqData: any; curSendId: string; recoverCid?: string }) => {
    const { curSendId, recoverCid, resModel, reqData } = params;
    const { errMsg, id, cid, createTime, entry, aliasSender, _account, sentTInfo, scheduleDate } = resModel;
    const { tid = '', title } = entry;
    const isSendCurrentMail = curSendId === currentMailIdRef.current;

    performanceApi.timeEnd({ statKey: 'mail_send_over', statSubKey: `${cid}` });
    dispatch(mailActions.doModifyMailEditStatus({ cid: curSendId, status: '' }));
    // 信件发送成功后，校验活动
    joinWebmailActivity(tid);
    // 发送失败 唤起失败弹窗
    if (errMsg) {
      setErrorMsg(errMsg);
      setVisibleErrorContect(true);
      return;
    }
    // 清除附件reducer内附件
    cid && dispatch(appActions.doDelAttachment({ cid: [cid] }));
    // 清除此封信DB里本地草稿
    mailDraftApi.deleteDraftMailByCid(curSendId);
    curSendId && sucDealReducer(curSendId, isSendCurrentMail);
    // 清除方便重传做的文件缓存
    cid && clearMidFile(cid);
    // 发送成功，记录已读提醒的选择状态
    dataStoreApi.put('lxWriteRemind', (!!reqData.senderReceivers).toString(), { noneUserRelated: true });

    const accounts = await accountApi.getMainAndSubAccounts();
    const mainAccount = accounts[0]?.mainAccount;

    // 主账号
    if (_account === mainAccount) {
      // 云附件续期
      renewalCloudAtt(entry.attachment || []);
      // 存在源头cid（恢复草稿）
      recoverCid && delLocalDraft(recoverCid);
      const sendRevokeRes = dataStoreApi.getSync('sendRevoke');
      const sendRevokeOpen = !!sendRevokeRes.suc && sendRevokeRes.data === 'ON';
      const revokeable = sendRevokeOpen && !scheduleDate;
      // 左下角 发信中
      const curSendingMail = {
        cid,
        id,
        tid,
        createTime,
        title,
        sentTInfo,
        source: 'tab',
        optSenderStr: aliasSender?.id || _account,
      };
      // 网页
      if (!inElectron) {
        if (locationHelper.testPathMatch('/readMailComb')) {
          return;
        }
        // 主页
        if (isSendCurrentMail) {
          // 前往邮箱主标签
          navigate('/#mailbox');
          dispatch(mailTabActions.doChangeCurrentTab('-1'));
        }
        revokeable && dispatch(mailActions.doAddSendingMails(curSendingMail as SendingMail));
      } else {
        // 桌面端
        // 独立窗口
        if (locationHelper.testPathMatch('/writeMail')) {
          if (revokeable) {
            eventApi.sendSysEvent({
              eventName: 'sendingMail',
              eventData: {
                ...curSendingMail,
                source: 'writeMail',
              },
            });
          }
          return;
        }

        // 主页
        if (isSendCurrentMail) {
          // 前往邮箱主标签
          navigate('/#mailbox');
          dispatch(mailTabActions.doChangeCurrentTab('-1'));
        }
        revokeable && dispatch(mailActions.doAddSendingMails(curSendingMail as SendingMail));
      }
    }
  });

  // 发信失败
  const sendFail = useCreateCallbackForEvent(async (params: { err: any; curSendId: string; reqData: ViewMail }) => {
    const { err, curSendId, reqData } = params;
    const isSendCurrentMail = curSendId === currentMailIdRef.current;

    dispatch(mailActions.doModifyMailEditStatus({ cid: curSendId, status: '' }));
    console.log(getIn18Text('FASONGSHIBAI'), err);
    const errMessage = typeof err === 'string' ? err : err.message;
    // 特例：免费版超限
    if (typeof err === 'string' && ['free_version_total_size_overflow', 'free_version_attachment_size_overflow'].includes(err)) {
      paidGuideModal.show({ errType: '41', origin: '写信' });
    }
    // 附件上传失败 (写信过程中更换发件人，导致需重新上传附件)
    else if (errMessage === 'FA_MTA_RETRY' || errMessage === 'FA_MTA_ICSRETRY') {
      try {
        loggerApi.track('useReupload_modal');
        mailConfApi.reqMailLimit({ _account: reqData._account || '' });
      } catch (error) {
        console.log('loggerApi_useReupload_modal', error);
      }
      const modal = SiriusModal.error({
        title: getIn18Text('FUJIANCHONGCHUAN'),
        content: getIn18Text('DIANJIQUEREN'),
        okText: getIn18Text('QUERENSHANGCHUAN'),
        onOk: () => {
          // 是当前tab 直接重传
          if (curSendId === currentTabId) {
            reUploadAtts(reqData._account);
            modal.destroy();
          } else {
            // 切换tab并重传
            if (mails.find(mail => mail.cid === curSendId) && tabList.find(tab => tab.id === curSendId)) {
              dispatch(mailTabActions.doChangeCurrentTab(curSendId));
              currentMailIdRef.current !== curSendId && dispatch(mailActions.doChangeCurrentMail(curSendId));
              setTimeout(() => {
                // 切换成功
                if (currentTabIdRef.current === curSendId && currentMailIdRef.current === curSendId) {
                  reUploadAtts(reqData._account);
                } else {
                  message.error('重传失败');
                }
                modal.destroy();
              }, 200);
            }
          }
        },
        onCancel: () => {
          dispatch(mailActions.doModifyMailEditStatus({ cid: curSendId, status: '' }));
        },
      });
      // 不带附件 静默重生
    } else if (errMessage === 'FA_MTA_RETRY_SILENT') {
      if (inElectron) {
        try {
          dispatch(mailActions.doModifyMailEditStatus({ cid: curSendId, status: 'reGenerating' }));
          const reUploadRes = await reUploadHandler(reqData._account);
          dispatch(mailActions.doModifyMailEditStatus({ cid: curSendId, status: '' }));
          if (reUploadRes && reUploadRes.every(i => i.status === 'fulfilled')) {
            message.info('上传完成，请重新点击发送');
          } else {
            message.error('上传失败');
          }
          mailConfApi.reqMailLimit({ _account: reqData._account || '' });
        } catch (error) {
          dispatch(mailActions.doModifyMailEditStatus({ cid: curSendId, status: '' }));
          message.error('上传失败');
        }
      } else {
        try {
          dispatch(mailActions.doModifyMailEditStatus({ cid: curSendId, status: 'reGenerating' }));
          const reUploadRes = await reUploadHandlerWeb(reqData._account, true);
          dispatch(mailActions.doModifyMailEditStatus({ cid: curSendId, status: '' }));
          message.info('上传完成，请重新点击发送');
          mailConfApi.reqMailLimit({ _account: reqData._account || '' });
        } catch (error) {
          dispatch(mailActions.doModifyMailEditStatus({ cid: curSendId, status: '' }));
          message.error('上传失败');
        }
      }
    }
    // 邮件状态异常
    else if (errMessage == 'MAIL_STATUS_ERROR') {
      if (isSendCurrentMail) {
        mailStatusError();
      } else {
        SiriusMessage.error({ content: '邮件附件状态异常' });
      }
    } else {
      // 解除
      dispatch(mailActions.doModifyMailEditStatus({ cid: curSendId, status: '' }));
    }
  });

  // 生成发信data
  const generateData = useCreateCallbackForEvent(async (params?: GenerateDataParams) => {
    const { receiver, icsReupload, curSendId: curId } = params || {};
    const curSendId = curId || currentMailId;
    const curMail = curSendId === currentMailId ? currentMail : mails.find(mail => mail.cid === curSendId);
    if (!curMail) return;

    const isSendCurrentMail = curSendId === currentMailIdRef.current;
    const { status, senderReceivers, optSenderMainEmail, optSender } = curMail;
    const { conferenceShow, praiseMailShow, taskMailShow } = status || {};

    dispatch(mailActions.doModifyMailEditStatus({ cid: curSendId, status: 'delivering' }));
    // 恢复本地草稿时的源cid

    let data: ViewMail = util.cloneDeep(curMail);
    if (!scheduledSent) {
      // 重置发送时间
      dispatch(mailActions.doChangeMailSchedule({ id: curId, scheduleDate: undefined }));
      // 重置发信时区
      dispatch(mailActions.doChangeMailScheduleTimeZone({ id: curId, scheduleTimeZone: undefined }));
      data.scheduleDate = '';
    } else {
      // 定时发送
      if (data.scheduleDate) {
        // 这里必须转为东八区，api层只有东八区！
        data.scheduleDate = systemApi.timeZoneTrans(data.scheduleDate, data.scheduleDateTimeZone || 8, 8)?.format('YYYY-MM-DD HH:mm:ss');
      }
    }
    // 选择了别名或者子账号
    if (optSender) {
      // data.aliasSender = sender;
      data.aliasSender = { id: optSender.id, nickName: optSender.senderName, mailEmail: optSender.mailEmail || '' };
    }

    // 任务邮件 指定了receiver
    if (receiver) {
      data = { ...curMail, receiver };
    }

    // 会议邀请
    // 账号未切换
    if (conferenceShow && (data.initSenderStr === optSenderMainEmail || icsReupload)) {
      // 如果切换账号了，就得重传icsfile，等待composeid不存在重试
      const hasError = await calendarSubmit({ currentMail: curMail, setVisibleConf, isSendCurrentMail });
      if (hasError) {
        dispatch(mailActions.doModifyMailEditStatus({ cid: curSendId, status: '' }));
        return;
      }
    }

    // 表扬信
    if (praiseMailShow) {
      data = dealPraiseMail(data);
    }

    // 任务邮件
    if (taskMailShow) {
      data = await dealTaskMail(data);
    }

    // 是否开启已读提醒(boolean)
    data.senderReceivers = senderReceivers;

    // 账号处理
    const accounts = await accountApi.getMainAndSubAccounts();
    const mainAccount = accounts[0]?.mainAccount;
    // 设置真正要发出的_account
    if (mainAccount !== optSenderMainEmail) {
      data._account = optSenderMainEmail;
      data.sender = mailApi.buildRawContactItem();
    } else {
      data._account = mainAccount;
    }
    // linkAttached当前邮件的附件有云附件
    const currentAttachment = attachments.filter(i => i.mailId === curSendId);
    const linkAttached = currentAttachment.some(attachment => !!attachment?.flag?.usingCloud || !!attachment?.cloudAttachment || attachment?.type === 'netfolder');
    if (linkAttached) {
      data.entry.linkAttached = linkAttached;
    }
    return data;
  });

  // 发信
  const saveSend = useCreateCallbackForEvent(async (params?: { receiver?: MailBoxEntryContactInfoModel[]; icsReupload?: boolean; curSendId?: string }) => {
    const curSendId = params?.curSendId || currentMailId;
    const curMail = curSendId === currentMailId ? currentMail : mails.find(mail => mail.cid === curSendId);
    // 源头cid
    const { recoverCid } = curMail as ViewMail;
    dispatch(mailActions.doRemWaittingMailId(curSendId));
    try {
      const data = await generateData(params);
      try {
        performanceApi.time({ statKey: 'mail_send_over', statSubKey: `${data.cid}` });
        mailApi
          .doSendMail(data as MailEntryModel)
          .then(async resModel => {
            sendSuc({ resModel, reqData: data, curSendId: curSendId as string, recoverCid });
          })
          .catch(async err => {
            sendFail({ err, curSendId: curSendId as string, reqData: data });
          });
      } catch (e) {
        console.log(getIn18Text('FASONGSHIBAI'), e);
        dispatch(mailActions.doModifyMailEditStatus({ cid: curSendId, status: '' }));
      }
    } catch (err) {
      dispatch(mailActions.doModifyMailEditStatus({ cid: curSendId, status: '' }));
    }
  });

  // 有默认值的情况下，初始化定时发送的时间，日期
  useEffect(() => {
    setScheduledSent && setScheduledSent(!!scheduleDate);
  }, [scheduleDate]);
  useEffect(() => {
    setSaveTime('');
  }, [currentMailId]);

  useEffect(() => {
    if (editorInstance) {
      if (puretext) {
        const toolbarList = editorInstance.settings.toolbar_mode === 'scrolling' ? ['lxuploadattachment'] : 'lxuploadattachment';
        editorInstance.fire('changeToolbar', { toolbarList });
        return;
      }
      editorInstance.fire('changeToolbar');
    }
  }, [puretext]);

  const isSubAccount = useDebounceForEvent(async () => {
    try {
      // 子账号不展示
      const isSub = await accountApi.isSubAccount(senderEmail);
      setIsSub(isSub || false);
    } catch (error) {
      console.log('isSubAccount error', error);
      setIsSub(false);
    }
  }, 200);

  useEffect(() => {
    isSubAccount();
  }, [senderEmail]);

  const puretextChange = () => {
    if (editorInstance) {
      if (puretext) {
        dispatch(doSetPuretext(false));
        return;
      }
      setPuretextVisible(true);
    }
  };
  const confirmPuretext = () => {
    if (!editorInstance) return;
    const content = editorInstance.getContent({ format: 'text' });
    dispatch(doChangeMailContent(content));
    const mail = { ...JSON.parse(JSON.stringify(currentMail)), ...{ _account: senderEmail } };
    if (mail?.entry?.content?.content) {
      mail.entry.content.content = content;
    }
    // 同步local
    mailApi.doSaveMailLocal(mail);
    dispatch(doSetPuretext(!puretext));
    setPuretextVisible(false);
  };
  const isCorpMail = useAppSelector(state => state.loginReducer.loginInfo.isCorpMailMode);
  return (
    <>
      <div className={`${style.layer}`} hidden={!tooltipVisible} />

      {/* 底部按钮组 */}
      <div className={style.sendFooter} id="sendfooter" ref={sendfooterRef}>
        {/* 加密邮件 */}
        {setEncrypt && <EncryptMail />}
        {/* 定时发送 */}
        {scheduledSent && <ScheduledSent />}
        <div className={`ant-allow-dark ${style.footerTop}`}>
          {/* 别名选择 */}
          <SenderSelectComp setSender={setSender} />
          {isCorpMail || comIsShowByAuth(ProductAuthorityFeature.MAIL_TRACE_WRITE_EMAIL_SHOW, <ReadRemindComp />)}
          {/* 免费版办公增加已读提醒、追踪邮件阅读状态 两个假功能，不能用，只是用来点击弹出提示升级弹窗 */}
          {!isEdm() && productVersionId === 'free' && (
            <>
              <div className={style.emergency}>
                <Checkbox checked={false} onClick={() => paidGuideShow('7')}>
                  {getIn18Text('YIDUTIXING')}
                </Checkbox>
                <Tooltip
                  arrowPointAtCenter
                  getPopupContainer={() => document.getElementById('sendfooter') || document.body}
                  placement="topLeft"
                  title={getIn18Text('GOUXUANCIGONGNENG11')}
                >
                  <IconWarn />
                </Tooltip>
              </div>
              <div className={style.emergency}>
                <Checkbox checked={false} onClick={() => paidGuideShow('8')}>
                  {getIn18Text('ZHUIZONGYOUJIANYUEDZT')}
                </Checkbox>
              </div>
            </>
          )}
          <div className={style.emergency}>
            <Checkbox checked={requestReadReceipt} onClick={requestReadReceiptChange}>
              {getIn18Text('YIDUHUIZHI')}
            </Checkbox>
          </div>
          <div className={`${style.schedule}`}>
            <Checkbox checked={puretext} onClick={puretextChange}>
              {getIn18Text('CHUNWENBEN')}
            </Checkbox>
          </div>
          <div className={`${style.schedule}`} onClick={scheduledSentChangeDisabled}>
            <Checkbox checked={scheduledSent} disabled={praiseMailShow || taskMailShow || setEncrypt} onClick={scheduledSentChange}>
              {getIn18Text('DINGSHIFASONG')}
            </Checkbox>
          </div>
          <div className={style.emergency}>
            <Checkbox checked={!!(typeof priority === 'number' && priority < 2)} onClick={emergencyChange}>
              {getIn18Text('JINJI')}
            </Checkbox>
          </div>
          {encryptMailCkShow && (
            <div className={`${style.encryptMailCk}`}>
              <Checkbox checked={setEncrypt} onClick={encryptMailChange} disabled={encryptMailDisabled}>
                邮件加密
              </Checkbox>
            </div>
          )}

          {saveTime && showSaveTime && (
            <div className={style.savedDraft}>
              {getIn18Text('YIYU')}
              {saveTime}
              {getIn18Text('BAOCUNCAOGAO')}
            </div>
          )}
        </div>
        <div className={style.footerBottom}>
          {/* 发送按钮 */}
          <div style={{ marginRight: '8px' }} ref={sendRef}>
            <SendValidateComp
              sendLoading={sendLoading}
              tooltipVisible={tooltipVisible}
              scheduledSent={scheduledSent}
              setTooltipVisible={setTooltipVisible}
              saveSend={saveSend}
              editorInstance={editorInstance}
            />
          </div>

          {/* 存草稿 */}
          <SaveDraft
            tooltipVisible={tooltipVisible}
            execAutoSaveDraft={execAutoSaveDraft}
            forceSave={forceSave}
            updateSaveTime={updateSaveTime}
            sendLoading={sendLoading}
          />

          {/* 保存为模板 */}
          <SaveAsTemplateComp isContentChanged={!!isContentChanged} />
          {/* 关闭 */}
          {innerCloseTab && currentMailId && !inElectron && <CloseButton innerCloseTab={innerCloseTab} id={currentMailId} />}
          {/* 子账号过期 */}
          {subAccountExpired && <span className={style.subAccountExpiredText}>{getIn18Text('DANGQIANYOUJIANYISX，QZYBFYJNRHGBXXYZS')}</span>}
        </div>
      </div>
      {/* 发送失败 */}
      {visibleErrorContect && (
        <SendErrorContect visible={visibleErrorContect} setVisible={setVisibleErrorContect} receiver={receiverMemo} errorMsg={errorMsg} confirm={errorContectResend} />
      )}
      <Dialog
        isModalVisible={puretextVisible}
        okText="确定"
        title="邮件转为纯文本将会遗失某些格式，确定要继续吗？"
        isCancel={true}
        onOk={confirmPuretext}
        onCancel={() => {
          setPuretextVisible(false);
        }}
      />
    </>
  );
});
export default SendMail;
