/* eslint-disable react/no-unused-prop-types */
/* eslint-disable react/destructuring-assignment */
// 定时30s + 切换tab时，进行一次本地当前邮件（视图内）的存储
// 定时90s中进行一次全端（视图内）的存储
// 无论是哪种定时模式下，进行一次redux所有信的扫描，若不带远端草稿id，则进行一次静默全端存储（正在上传/存储/删除/发送中的信除外）
// 附件上传完成后，节流进行一次全端存储（无论是否处于currentmail）
// 如是保证远端一定有1个版本。
import React, { useEffect, useMemo, useRef } from 'react';
import message from '@web-common/components/UI/Message/SiriusMessage';
import { apiHolder as api, apis, DataTrackerApi, getIn18Text, MailApi, SystemApi, SystemEvent, util } from 'api';
import useMsgRenderCallback from '@web-common/hooks/useMsgRenderCallback';
import useDebounceForEvent from '@web-mail/hooks/useDebounceForEvent';
import style from './index.module.scss';
import { useAppDispatch, useAppSelector } from '@web-common/state/createStore';
import { actions as mailActions } from '@web-common/state/reducer/mailReducer';
import { ViewMail } from '@web-common/state/state';
import { resetMailWithDraft } from './utils';
import SiriusMessage from '@web-common/components/UI/Message/SiriusMessage';
import { WriteMailTypes } from '@web-common/state/reducer/mailTabReducer';
import useCreateCallbackForEvent from '@web-common/hooks/useCreateCallbackForEvent';
const systemApi = api.api.getSystemApi() as SystemApi;
const trackApi: DataTrackerApi = api.api.requireLogicalApi(apis.dataTrackerApiImp) as unknown as DataTrackerApi;
const mailApi: MailApi = api.api.requireLogicalApi(apis.mailApiImpl) as unknown as MailApi;
const eventApi = api.api.getEventApi();
interface Props {
  sendLoading: boolean; // 图片模板编辑中（已废弃）
  tooltipVisible: boolean;
  execAutoSaveDraft?: boolean;
  forceSave?: () => string; // 保存编辑器内容
  updateSaveTime: () => void;
}
interface PropsClone {
  sendLoading: boolean;
  tooltipVisible: boolean;
}
// eslint-disable-next-line max-statements
const SaveDraft: React.FC<Props> = (props: Props) => {
  const { sendLoading, execAutoSaveDraft, forceSave, tooltipVisible, updateSaveTime } = props;
  const { currentMail, mails } = useAppSelector(state => state.mailReducer);
  const { tabList } = useAppSelector(state => state.mailTabReducer);
  const tabListRef = useRef(tabList);
  tabListRef.current = tabList;
  const subAccountExpired = useMemo(() => currentMail?.subAccountExpired, [currentMail]); // 子账号造信 中途过期
  const attachments = useAppSelector(state => state.attachmentReducer.attachments);
  const attachmentsRef = useRef(attachments);
  attachmentsRef.current = attachments;
  const mailsRef = useRef(mails);
  mailsRef.current = mails;
  const currentMailId = useAppSelector(state => state.mailReducer.currentMail.cid);
  const currentMailIdRef = useRef(currentMailId);
  currentMailIdRef.current = currentMailId;
  const currentMailRef = useRef(currentMail);
  currentMailRef.current = currentMail;
  // 禁止存储草稿
  const forbidSaveTemp = useAppSelector(state => state.mailReducer.forbidSaveTemp);
  const forbidSaveTempRef = useRef(forbidSaveTemp);
  forbidSaveTempRef.current = forbidSaveTemp;
  const { doChangeMail, doChangeMailDraftId, doModifyMailEditStatus } = mailActions;
  const initSenderStr = useMemo(() => currentMail?.initSenderStr || '', [currentMailId, currentMail?.initSenderStr]);
  const initSenderStrRef = useRef(initSenderStr);
  initSenderStrRef.current = initSenderStr;
  const dispatch = useAppDispatch();
  const saveClickAble = useMemo(() => {
    const { mailEditStatus } = currentMail;
    if (mailEditStatus && ['delivering', 'saving', 'reUploading', 'reGenerating'].includes(mailEditStatus)) return false;
    if (subAccountExpired) return false;
    if (tooltipVisible) return false;
    if (sendLoading) return false;
    return true;
  }, [currentMail, subAccountExpired, tooltipVisible, sendLoading]);

  // 暂停自动保存草稿
  const pauseAutoSaveDraft = () => {
    systemApi.cancelEvent('mid', 'autoSaveDraft');
  };

  useEffect(() => {
    if (execAutoSaveDraft) {
      execAutoSaveDraft && startAutoSaveDraft();
    } else {
      pauseAutoSaveDraft();
    }
    return () => {
      systemApi.cancelEvent('mid', 'autoSaveDraft');
    };
  }, [execAutoSaveDraft]);

  // 开启自动保存草稿
  const startAutoSaveDraft = () => {
    systemApi.intervalEvent({
      seq: 1,
      eventPeriod: 'mid',
      id: 'autoSaveDraft',
      handler: e => {
        if (e.seq % 9 === 0) {
          // 90s一次本地+远端存储
          eventApi.sendSysEvent({
            eventName: 'toSaveDraft',
            eventStrData: '',
            eventData: {
              type: 'localAndRemote',
              trigger: 'internal',
              mailId: currentMailId,
            },
          });
        } else if (e.seq % 3 === 0) {
          // 30s一次本地存储
          doSaveDraftLocal();
        }
      },
    });
  };

  // 全端存储
  const doSaveDraftRemote = async (params: { taregtMailCid: string | undefined; silent: boolean; scan: boolean }) => {
    const { taregtMailCid, silent = true, scan = false } = params;
    if (!taregtMailCid) return;
    // 要保存的邮件
    let targetMail: ViewMail | null | undefined = null;
    // 保存的是当前编辑的邮件
    if (taregtMailCid === currentMailIdRef.current) {
      // 此两种类型会包含moment对象，moment对象clonedeep会有问题
      if (currentMailRef.current.taskMail || currentMailRef.current.conference) {
        targetMail = util.cloneDeep(currentMailRef.current);
        if (currentMailRef.current.taskMail && targetMail) {
          targetMail.taskMail = currentMailRef.current.taskMail;
        }
        if (currentMailRef.current.conference && targetMail) {
          targetMail.conference = currentMailRef.current.conference;
        }
      } else {
        targetMail = util.cloneDeep(currentMailRef.current);
      }
      if (forceSave) {
        // 取最新的当前邮件内容并赋值
        const latestCont = forceSave();
        if (targetMail?.entry?.content?.content && latestCont) {
          // 覆盖
          targetMail.entry.content.content = latestCont;
        }
      }
    } else {
      targetMail = mailsRef.current.find(item => item.cid === taregtMailCid);
    }
    if (!targetMail) return;
    if (!targetMail?.entry) return;

    const curCid = targetMail.cid;
    const filterAttachments = attachmentsRef.current.filter(att => String(att.mailId) === String((targetMail as ViewMail).cid));
    targetMail = {
      ...targetMail,
      entry: {
        ...targetMail.entry,
        attachment: filterAttachments,
        attachmentCount: filterAttachments.length,
      },
      // ？？
      ...{ _account: targetMail.initSenderStr },
    };

    dispatch(doModifyMailEditStatus({ cid: taregtMailCid, status: 'saving' }));
    mailApi
      .doSaveTemp({ content: targetMail, saveDraft: true, auto: silent })
      .then(res => {
        const { cid, _id, draftId } = res;
        if (cid) {
          // 纯文本 只保留draftId和_id 回填会格式紊乱
          if (targetMail?.status?.puretext) {
            dispatch(doChangeMailDraftId({ cid, draftId, _id }));
          } else {
            // 老逻辑 保留draftId和_id并回填内容
            const draftedMail = {
              ...targetMail,
              _id,
              draftId,
            };
            dispatch(doChangeMail(draftedMail));
          }
        }
        // @ts-ignore
        !silent &&
          message.info({
            content: getIn18Text('YICUNZHI\u201CCAO'),
          });
        // 更新对象为当前邮件时，更新右下角存储时间
        if (taregtMailCid === currentMailIdRef.current) {
          updateSaveTime();
        }
      })
      .catch(err => {
        console.log('远端存储失败', err);
        // 信件失效 且 当前编辑
        if ((err === 'FA_COMPOSE_NOT_FOUND' || err === 'FA_ID_NOT_FOUND') && taregtMailCid === currentMailIdRef.current) {
          // 主账号 重置
          if (targetMail?.initSenderStr === systemApi.getMainAccount1().email) {
            taregtMailCid && resetMailWithDraft(taregtMailCid);
            return;
          }
        }
        // @ts-ignore
        !silent &&
          message.fail({
            content: `保存草稿箱失败${err?.title ? `:${err.title}` : ''}`,
          });
      })
      .finally(() => {
        dispatch(doModifyMailEditStatus({ cid: curCid, status: '' }));
        // 扫描
        scan && silentScanOtherMails();
      });
  };

  // 本地存编辑中的当前草稿
  const doSaveDraftLocal = useCreateCallbackForEvent(async () => {
    const { mailEditStatus } = currentMailRef.current;
    // 非存储/发送中/重传中
    if (mailEditStatus && ['saving', 'delivering', 'reUploading', 'reGenerating'].includes(mailEditStatus)) return false;
    // 禁用时
    if (forbidSaveTempRef.current) return;
    // 以主账号为初始创建的信才能存储
    if (initSenderStrRef.current !== systemApi.getMainAccount1().email) return;
    let data = util.cloneDeep(currentMailRef.current);
    if (forceSave) {
      // 取最新的当前邮件内容并赋值
      const latestCont = forceSave();
      data?.entry?.content?.content && (data.entry.content.content = latestCont);
    }
    const filterAttachments = attachmentsRef.current.filter(att => String(att.mailId) === String(data.cid));
    data = {
      ...data,
      entry: {
        ...data.entry,
        attachment: filterAttachments,
        attachmentCount: filterAttachments.length,
      },
      ...{ _account: initSenderStrRef.current },
    };
    try {
      // 还没有远端草稿，则优先存个远端
      // 前提是符合全段存储条件
      if (!currentMailRef.current.draftId && mailRemoteSaveCheck(currentMailIdRef.current)) {
        doSaveDraftRemote({ taregtMailCid: currentMailIdRef.current, silent: true, scan: false });
      } else {
        const saveLocalRes = await mailApi.doSaveDraftLocal(data);
        silentScanOtherMails();
        // 调试用
        console.log('saveLocalRessaveLocalRes', saveLocalRes);
      }
    } catch (error) {
      console.log('定时本地存储失败', error);
    }
  });

  // 静默全端扫描其他邮件
  const silentScanOtherMails = useDebounceForEvent(() => {
    const tabArr = tabListRef.current || [];
    console.log('tabArrtabArr', tabArr);
    const writeMailActiveTabIds = tabArr
      .filter(tab => {
        const { isActive, type } = tab;
        return isActive && WriteMailTypes.includes(type);
      })
      .map(writeTab => writeTab.id);
    const unRemoteSaveMails = mailsRef.current.filter(item => {
      const { cid, draftId } = item;
      // 非当前
      if (cid === currentMailIdRef.current) return false;
      // 非激活标签
      if (!writeMailActiveTabIds.includes(String(cid))) return false;
      // 无全端草稿
      if (draftId) return false;
      // 状态常规校验
      const checkRes = mailRemoteSaveCheck(item.cid);
      if (!checkRes) return false;
      return true;
    });
    if (!unRemoteSaveMails?.length) return;
    // 静默存储
    unRemoteSaveMails.forEach(item => {
      doSaveDraftRemote({ taregtMailCid: item.cid, silent: true, scan: false });
    });
  }, 2000);

  // 存草稿通知前置校验
  const eventSaveDraft = useDebounceForEvent((ev: SystemEvent<any>) => {
    const { eventData } = ev;
    const { mailId } = eventData;
    // 校验能否存储
    const checkRes = mailRemoteSaveCheck(mailId);
    if (!checkRes) return;
    // 静默存储
    doSaveDraftRemote({ taregtMailCid: mailId, silent: true, scan: true });
  }, 1500);

  // 邮件远端存储的前置校验
  const mailRemoteSaveCheck = (saveCid: string | undefined): boolean => {
    if (!saveCid) return false;
    const target = mailsRef.current.find(item => item.cid === saveCid);
    if (!target) return false;
    const { mailEditStatus } = target;
    // 非存储/发送中
    if (mailEditStatus && ['saving', 'delivering', 'reUploading', 'reGenerating'].includes(mailEditStatus)) return false;
    // 当前邮件的所有附件不存在上传中、删除中
    const currentMailAttachments = attachmentsRef.current.filter(item => item.mailId === saveCid && item.type !== 'download');
    if (currentMailAttachments.some(item => item?.status && ['uploading', 'deleting'].includes(item?.status))) return false;
    return true;
  };

  // 手动点击存储当前邮件
  const clickSave = useDebounceForEvent(e => {
    e.stopPropagation();
    if (!saveClickAble) return false;
    trackApi.track('pcMail_click_saveDraft_writeMailPage');
    // 校验是否正在上传/删除中，并硬提醒
    const currentAttachments = attachmentsRef.current.filter(item => item.mailId === currentMailIdRef.current && item.type !== 'download');
    if (currentAttachments.some(item => item?.status && ['uploading', 'deleting'].includes(item?.status))) {
      SiriusMessage.info(getIn18Text('ZHENGZAISHANGCHUANFUJ，SCWCHJZDBCDCGX'));
      return;
    }
    // 通用校验
    const checkRes = mailRemoteSaveCheck(currentMailId);
    if (checkRes) {
      doSaveDraftRemote({ taregtMailCid: currentMailIdRef.current, silent: false, scan: true });
    }
  }, 500);

  // 通知存储
  useMsgRenderCallback('toSaveDraft', ev => {
    // 禁用时
    if (forbidSaveTempRef.current) return;
    eventSaveDraft(ev);
  });

  return (
    <>
      <div id="saveDraft" className={`${style.btn} ${style.draft} ${!saveClickAble ? 'disabled' : ''} `} onClick={e => clickSave(e)}>
        {getIn18Text('CUNCAOGAO')}
      </div>
    </>
  );
};

export default SaveDraft;

export const SaveDraftClone: React.FC<PropsClone> = (props: PropsClone) => {
  const { tooltipVisible, sendLoading } = props;
  const { currentMail } = useAppSelector(state => state.mailReducer);
  const saveClickAble = useMemo(() => {
    const { mailEditStatus, subAccountExpired } = currentMail;
    if (mailEditStatus && ['delivering', 'saving', 'reUploading', 'reGenerating'].includes(mailEditStatus)) return false;
    if (subAccountExpired) return false;
    if (tooltipVisible) return false;
    if (sendLoading) return false;
    return true;
  }, [currentMail, tooltipVisible, sendLoading]);
  const ckAction = (e: React.MouseEvent) => {
    e.stopPropagation();
    document.getElementById('saveDraft')?.click();
  };

  return (
    <>
      <div className={`${style.btn} ${style.draft} ${!saveClickAble ? 'disabled' : ''}`} onClick={e => ckAction(e)}>
        {getIn18Text('CUNCAOGAO')}
      </div>
    </>
  );
};
