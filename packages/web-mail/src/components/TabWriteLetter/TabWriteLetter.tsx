import React, { useState, useEffect, useRef, useMemo, useImperativeHandle } from 'react';
import message from '@web-common/components/UI/Message/SiriusMessage';
import WriteContent from '@web-mail-write/WritePage';
import { TemplateAddModal } from '@web-setting/Mail/components/CustomTemplate/template_add_modal';
import { actions as mailTabActions, MailTabModel, WriteMailTypes } from '@web-common/state/reducer/mailTabReducer';
import { useAppDispatch, useAppSelector } from '@web-common/state/createStore';
import NeedTempDialog from '@web-mail/components/NeedTempDialog';
import styles from './TabWriteLetter.module.scss';
import { AccountApi, apiHolder as api, apis, DataStoreApi, MailApi, MailDraftApi, WriteMailInitModelParams } from 'api';
import { actions as mailActions } from '@web-common/state/reducer/mailReducer';
import { actions as attachmentActions } from '@web-common/state/reducer/attachmentReducer';
import { Attachment, ViewMail } from '@web-common/state/state';
// import { setCurrentAccount } from '../../util';
import useReupload from '@web-mail-write/components/SendMail/useReupload';
import useDebounceForEvent from '../../hooks/useDebounceForEvent';
import { getIn18Text } from 'api';
const mailApi: MailApi = api.api.requireLogicalApi(apis.mailApiImpl) as unknown as MailApi;
const systemApi = api.api.getSystemApi();
const isElectron = systemApi.isElectron();
const storeApi: DataStoreApi = api.api.getDataStoreApi();
const accountApi = api.api.requireLogicalApi(apis.accountApiImpl) as AccountApi;
const mailDraftApi = api.api.requireLogicalApi(apis.mailDraftApiImpl) as MailDraftApi;

// 标签下写邮件
// web端弹窗和桌面端弹窗都有一层壳子包着 这里多标签也加一层壳子 方便自定义行为 降低复杂性
const TabWriteLetter = React.forwardRef<any>((_, ref) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [execAutoSaveDraft, setExecAutoSaveDraft] = useState<boolean>(false);
  // 需要被保存到草稿箱的邮件 用于弹窗
  const [needDraftMails, setNeedDraftMails] = useState<ViewMail[]>([]);
  // 申请关闭id(包括写信/读信)
  const [closeIds, setCloseIds] = useState<string[]>([]);
  const [opening, setOpening] = useState<boolean>(false);
  const openingRef = useRef<boolean>(opening);
  openingRef.current = opening;
  // 需要关闭的写信cid
  const [closeWriteCids, setCloseWriteCids] = useState<string[]>([]);
  const { currentTab } = useAppSelector(state => state.mailTabReducer);
  const { currentMail, mails } = useAppSelector(state => state.mailReducer);
  const currentMailRef = useRef<ViewMail>(currentMail);
  currentMailRef.current = currentMail;
  const { doChangeMail } = mailActions;
  const { tabList } = useAppSelector(state => state.mailTabReducer);
  const { attachments } = useAppSelector(state => state.attachmentReducer);
  const attachmentsRef = useRef<Attachment[]>(attachments);
  attachmentsRef.current = attachments;
  const mailsRef = useRef<ViewMail[]>(mails);
  mailsRef.current = mails;
  const tabListRef = useRef<MailTabModel[]>(tabList);
  tabListRef.current = tabList;
  const writePageRef = useRef<HTMLElement | null>(null);
  const [curMode, setCurMode] = useState<string>('normal');
  const optSender = useMemo(() => currentMailRef.current?.optSender, [currentMailRef.current]);
  const initSenderStr = useMemo(() => currentMailRef.current?.initSenderStr, [currentMailRef.current]);
  const { doCloseMail, doClearMails } = mailActions;
  const { doCloseTab, doClearTabs, doCleanTabs, doChangeCurrentTab } = mailTabActions;
  const { doDelAttachment } = attachmentActions;
  const dispatch = useAppDispatch();
  // 使用cid而不是id
  const currentMailCid = useMemo(() => currentMail.cid, [currentMail]);
  const { clearMidFile } = useReupload();
  // 最新内容
  // const getEdittingMail = () => {
  //     // 获取编辑器内容
  //     const latestCont = (writePageRef?.current as any)?.forceSave();
  //     const cloneMail = JSON.parse(JSON.stringify(currentMail));
  //     cloneMail?.entry?.content?.content && (cloneMail.entry.content.content = latestCont);
  //     console.log('latestContlatestCont', latestCont, currentMail);
  //     return cloneMail;
  // };
  // 关闭所有标签前置校验操作
  const befCloseTabs = async (
    closeWriteCids: string[]
  ): Promise<{
    closeable: boolean;
    needDraftMails?: ViewMail[];
  }> => {
    // 需要保存到草稿箱的邮件
    const needDraftMails: ViewMail[] = [];
    // 要关闭的邮件
    const closeWriteMails = mails.filter(item => closeWriteCids.includes(item.cid as string));
    // 单个校验
    const judgeMailP = (mail: ViewMail) => {
      return new Promise(async resolve => {
        const res = await mailApi.doNeedSaveTemp(mail);
        resolve(res);
      });
    };
    return new Promise(resolve => {
      Promise.allSettled(closeWriteMails.map(judgeMailP)).then(judgeArr => {
        judgeArr.forEach((item, index) => {
          const { status, value } = item;
          if (status === 'fulfilled') {
            //  true 代表需要
            if (value) {
              needDraftMails.push(closeWriteMails[index]);
            }
          }
        });
        // 未保存的数目
        if (needDraftMails.length > 0) {
          resolve({
            closeable: false,
            needDraftMails,
          });
        }
        resolve({ closeable: true });
      });
    });
  };
  const afterApply = (needDraftMails: ViewMail[], closeIds: string[]) => {
    setTimeout(() => {
      setNeedDraftMails([...needDraftMails]);
      // 结合现有业务简化处理（关闭单个/全部）
      // 关闭单个
      if (closeIds.length === 1) {
        // 如果当前并未处于被关闭的标签里 切换到被关闭的标签
        if (closeIds[0] !== String(currentTab.id)) {
          dispatch(doChangeCurrentTab(closeIds[0]));
        }
      }
      // 关闭全部
      if (closeIds.length > 1) {
        // 前往第一个需要被保存的tab
        dispatch(doChangeCurrentTab(String(needDraftMails[0].cid)));
      }
      // 唤弹窗
      setIsModalVisible(true);
    });
  };
  // 申请关闭
  const applyCloseMails = async (closeWriteCids: string[]) => {
    try {
      const judgeRes = await befCloseTabs(closeWriteCids);
      const { needDraftMails, closeable } = judgeRes;
      // 校验通过 可关闭
      if (closeable) {
        // 中断自动保存草稿
        setExecAutoSaveDraft(false);
        // 清除这些邮件
        dispatch(doClearMails(closeWriteCids));
        return { res: true };
      }
      if (!needDraftMails) return { res: true };
      return { res: false, needDraftMails };
    } catch (error) {
      console.error(getIn18Text('SHENQINGGUANBIBIAO'), error);
      return { res: false };
    }
  };

  // 清除服务端composeid & 清除写信本地缓存的附件
  const doCancelCompose = (mid: string) => {
    mailApi.doCancelCompose(mid, false, initSenderStr);
    // 缓存的附件二进制
    clearMidFile(mid);
  };

  const doubleCkTabAction = useDebounceForEvent(() => {
    setOpening(true);
    // 有附件在上传中
    if (
      attachmentsRef.current.some(
        attachment => attachment.mailId === currentMailRef.current.cid && attachment.status && attachment.status !== 'success' && attachment.type !== 'download'
      )
    ) {
      // @ts-ignore
      message.warn({
        content: getIn18Text('FUJIANSHANGCHUANZHONG'),
      });
      setOpening(false);
      return;
    }
    const curAttachments = attachmentsRef.current.filter(item => item.mailId == currentMailRef.current.cid);
    const objAttachments = curAttachments.map(item => {
      const tmp = {};
      for (let i in item) {
        if (typeof item[i] !== 'function' && i !== 'arrayBuffer') {
          tmp[i] = item[i];
        }
      }
      return tmp;
    });
    // setCurrentAccount();
    objAttachments && storeApi.putSync('curAttachments', JSON.stringify(objAttachments));
    // 发送中 附件中 待补充
    const current = {
      ...currentMailRef.current,
      entry: {
        ...currentMailRef.current.entry,
        attachments: objAttachments,
        attachmentCount: objAttachments.length,
        withoutPlaceholder: true,
      },
      ...{ _account: initSenderStr },
    };
    mailApi
      .doSaveTemp({ content: current, saveDraft: true, auto: false })
      .then(res => {
        setOpening(false);
        const { cid, _id, draftId } = res;
        if (cid) {
          // 保留draftId和_id
          const draftedMail = {
            ...currentMail,
            _id,
            draftId,
          };
          dispatch(doChangeMail(draftedMail as ViewMail));
        }
        // @ts-ignore
        // message.open({
        //   content: '已存至“草稿箱”, 新窗口开启中',
        // });
        const params: WriteMailInitModelParams = {
          id: draftId,
          mailType: 'draft',
          writeType: 'editDraft',
          withoutPlaceholder: true,
          writeWay: 'newWin', // 以新窗口形式打开
          optSenderStr: optSender?.id || '',
          _account: initSenderStr,
        };
        // 切换后台
        // accountApi.setCurrentAccount({ email: initSenderStr });
        // 唤起写信页
        mailApi.callWriteLetterFunc(params);
        if (currentMailCid) {
          setIsModalVisible(false);
          // 中断自动保存草稿
          setExecAutoSaveDraft(false);
          let curRmCid = currentMailRef.current.cid;
          // 清除当前邮件
          curRmCid && dispatch(doClearMails([curRmCid]));
          dispatch(doCloseTab(String(curRmCid)));
        }
      })
      .catch(err => {
        console.log(getIn18Text('DAKAIXINCHUANGKOU'), err);
        setOpening(false);
        // @ts-ignore
        message.fail({
          content: `打开新窗口失败${err?.title ? `:${err.title}` : ''}`,
        });
      });
  }, 400);
  // 双击标签
  const doubleCkTabFun = () => {
    if (!isElectron) return;
    if (openingRef.current) return;
    doubleCkTabAction();
  };
  // 弹窗确认不保存
  const dialogConfirmNotSave = () => {
    setIsModalVisible(false);
    // 中断自动保存草稿
    setExecAutoSaveDraft(false);
    // 清除邮件
    dispatch(doClearMails(closeWriteCids));
    // 清除本地草稿
    mailDraftApi.deleteDraftMailByCid(closeWriteCids);
    // 结合现有业务简化处理（关闭单个/全部）
    // 关闭一封写信
    if (closeIds.length === 1) {
      dispatch(doCloseTab(closeIds[0]));
    } else {
      // 全部关闭（目前只会出现这些场景）
      dispatch(doCleanTabs());
    }
    // 清除资源
    // closeWriteCids.forEach(item => mailApi.doCancelCompose(item));
    closeWriteCids.forEach(item => doCancelCompose(item));
    // 删除UI层缓存附件
    dispatch(doDelAttachment({ cid: closeWriteCids }));
  };
  // 弹窗确认保存
  const dialogConfirmSave = (failCids?: string[]) => {
    setIsModalVisible(false);
    // 中断自动保存草稿
    setExecAutoSaveDraft(false);
    // 存在报错失败
    if (failCids) {
      dispatch(doClearMails(closeWriteCids.filter(item => !failCids.includes(item))));
      dispatch(doClearTabs(closeIds?.filter(item => !failCids.map(String).includes(item))));
      dispatch(doChangeCurrentTab(String(failCids[0])));
      // 成功关闭的写信清除资源
      closeWriteCids.forEach(item => {
        if (!failCids.includes(item))
          // mailApi.doCancelCompose(item);
          doCancelCompose(item);
      });
      // 删除UI层缓存附件
      dispatch(
        doDelAttachment({
          cid: closeWriteCids.filter(item => !failCids.includes(item)),
        })
      );
      return;
    }
    // 全部成功
    dispatch(doClearMails(closeWriteCids));
    // 结合现有业务简化处理（关闭单个/全部）
    // 关闭一封写信
    if (closeIds.length === 1) {
      dispatch(doCloseTab(closeIds[0]));
    } else {
      // 全部关闭（目前只会出现这些场景）
      dispatch(doCleanTabs());
    }
    // closeWriteCids.forEach(item => mailApi.doCancelCompose(item));
    closeWriteCids.forEach(item => doCancelCompose(item));
    // 删除UI层缓存附件
    dispatch(doDelAttachment({ cid: closeWriteCids }));
  };

  // 关闭标签
  const closeTab = async (closeIds: string[]) => {
    setCloseIds(closeIds);
    // 关闭标签里的写信标签
    const closeWriteCids: string[] = [];
    mailsRef.current.forEach(mail => {
      if (mail.cid && closeIds.includes(String(mail.cid))) {
        closeWriteCids.push(mail.cid);
      }
    });
    // 要关闭的邮件里有写信
    if (closeWriteCids.length > 0) {
      setCloseWriteCids(closeWriteCids);
      const res = await applyCloseMails(closeWriteCids);
      // 可直接关闭 清除缓存资源
      if (res.res) {
        // closeWriteCids.forEach(item => mailApi.doCancelCompose(item));
        // 清除草稿
        mailDraftApi.deleteDraftMailByCid(closeWriteCids);
        // 清除UI层
        dispatch(doDelAttachment({ cid: closeWriteCids }));
        // 清除API层
        closeWriteCids.forEach(item => doCancelCompose(item));
      }
      // 需要保存草稿
      else if (res.needDraftMails) {
        afterApply(res.needDraftMails, closeIds);
      }
      return res.res;
    }
    // 只关闭读信 通过
    return true;
  };
  // 保存指定邮件的草稿
  const saveDraft = (id: string) => {
    try {
      const target = mailsRef.current.find(item => String(item.cid) === id);
      // 找到了
      if (target) mailApi.doSaveTemp({ content: target, saveDraft: true });
    } catch (error) {
      console.log(getIn18Text('BAOCUNSHIBAI'), error);
    }
  };
  // 内部 关闭标签
  const innerCloseTab = async (id: string) => {
    const res = await closeTab([id]);
    if (res) {
      dispatch(mailTabActions.doCloseTab(id));
    }
  };
  useImperativeHandle(ref, () => {
    return {
      // 关闭标签
      closeTab,
      // 双击标签
      doubleCkTab: doubleCkTabFun,
      // 保存草稿
      saveDraft,
    };
  });
  useEffect(() => {
    const { type } = currentTab;
    if (WriteMailTypes.includes(type)) {
      setExecAutoSaveDraft(true);
    } else {
      setExecAutoSaveDraft(false);
    }
  }, [currentTab]);
  useEffect(() => {
    if (!window || (window && window.electronLib)) return;
    window.onbeforeunload = () => {
      const allMailCids: number[] = [];
      tabListRef.current.forEach((tab: MailTabModel) => {
        const { type, id } = tab;
        if (WriteMailTypes.includes(type)) {
          allMailCids.push(Number(id));
        }
      });
      // console.log('allMailCids', allMailCids);
      // const judgeRes = await befCloseTabs(allMailCids);
      // console.log('judgeRes', judgeRes);
      // const { closeable } = judgeRes;
      // 不可直接关闭
      if (allMailCids.length > 0) {
        return getIn18Text('NINQUEDINGYAOLI');
      }
    };
    return () => (window.onbeforeunload = () => {});
  }, []);
  // 没有currentMail隐藏自己
  if (!currentMail || JSON.stringify(currentMail) === '{}') {
    return null;
  }
  return (
    <div className={styles.tabWriteLetter}>
      <WriteContent
        ref={writePageRef}
        style={{ minWidth: '805px' }}
        execAutoSaveDraft={execAutoSaveDraft}
        innerCloseTab={innerCloseTab}
        curMode={curMode}
        setCurMode={setCurMode}
        cond="mailBox"
      />

      {/* 待优化！这两最好放在content里头 存在一定冗余性 */}
      <TemplateAddModal maskStyle={curMode === 'max' ? { left: 0 } : {}} />

      <NeedTempDialog
        maskStyle={curMode === 'max' ? { left: 0 } : {}}
        isModalVisible={isModalVisible}
        needSaveMails={needDraftMails}
        setIsModalVisible={val => setIsModalVisible(val)}
        // 选择不保存直接关闭
        onNotSave={() => dialogConfirmNotSave()}
        // 选择保存草稿箱后关闭
        onSave={() => dialogConfirmSave()}
        closeWriteNum={closeWriteCids.length}
      />
    </div>
  );
});
export default TabWriteLetter;
