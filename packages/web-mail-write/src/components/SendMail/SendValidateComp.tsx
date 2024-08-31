/* eslint-disable react/no-unused-prop-types */
/* eslint-disable react/destructuring-assignment */
import React, { useEffect, useMemo, useState } from 'react';
import { Modal } from 'antd';
import message from '@web-common/components/UI/Message/SiriusMessage';
import LoadingOutlined from '@ant-design/icons/LoadingOutlined';
import { Editor as EditorType } from '@web-common/tinymce';
import {
  apiHolder as api,
  SystemApi,
  MailBoxEntryContactInfoModel,
  ContactModel,
  MailEntryModel,
  apis,
  ContactAndOrgApi,
  doGetContactInMailListRespose,
  MailConfApi,
  ProductAuthApi,
  util,
} from 'api';
import { useActions, useAppDispatch, useAppSelector } from '@web-common/state/createStore';
import { actions as mailActions } from '@web-common/state/reducer/mailReducer';
import { AppActions } from '@web-common/state/reducer';
import { currentMailSize as getCurrentMailSize } from '@web-common/state/getter';
import { trackSendMail, replaceCurrentMailContent } from './utils';
import { verifyEmail, mailHiddenText, remWaittingId } from '../../util';
import style from './index.module.scss';
import TaskMailOutDomain from './TaskMailOutDomain';
import { sizeTransform } from '@web-common/utils/file';
import SendIcon from '@web-common/components/UI/Icons/svgs/SendSvg';
import { getIn18Text } from 'api';
import HiddenTxtModal from './HiddenTxtModal';
import { AttachmentView, ViewMail } from '@web-common/state/state';
import useMsgRenderCallback from '@web-common/hooks/useMsgRenderCallback';
import useCreateCallbackForEvent from '@web-common/hooks/useCreateCallbackForEvent';
import { checkboxConfirm } from '@web-mail/common/components/CheckboxModal/CheckboxModal';
import { MAIL_WRITE_GUIDE_LOCAL_KEY, MAIL_WRITE_HOTKEY_LOCAL_KEY } from '@web-mail/common/constant';
import { tabType } from '@web-common/state/reducer/mailTabReducer';

/* tslint-disable */
interface Props {
  sendLoading: boolean;
  tooltipVisible: boolean;
  scheduledSent: boolean;
  setTooltipVisible: (val: boolean) => void;
  saveSend: (params?: { receiver?: MailBoxEntryContactInfoModel[]; curSendId?: string }) => void;
  editorInstance?: EditorType;
}
interface PropsClone {
  sendLoading: boolean;
  tooltipVisible: boolean;
  scheduledSent: boolean;
}
const systemApi = api.api.getSystemApi() as SystemApi;
const contactApi = api.api.requireLogicalApi(apis.contactApiImpl) as ContactAndOrgApi;
const mailConfApi = api.api.requireLogicalApi(apis.mailConfApiImpl) as MailConfApi;
const productAuthApi = api.api.requireLogicalApi(apis.productAuthApiImpl) as ProductAuthApi;
const eventApi = api.api.getEventApi();
//
const writeTabTypes = [
  tabType.reply,
  tabType.replyAll,
  tabType.forward,
  tabType.writeCommon,
  tabType.replyWithAttach,
  tabType.replyAllWithAttach,
  tabType.forwardAsAttach,
  tabType.edit,
  tabType.editDraft,
];

// eslint-disable-next-line max-statements
const SendValidateComp: React.FC<Props> = (props: Props) => {
  const { sendLoading, tooltipVisible, scheduledSent, setTooltipVisible, saveSend, editorInstance } = props;
  const { currentMail, mails } = useAppSelector(state => state.mailReducer);
  const receiver = useAppSelector(state => state.mailReducer.currentMail.receiver);
  const currentMailId = useAppSelector(state => state.mailReducer.currentMail.cid);
  const attachments = useAppSelector(state => state.attachmentReducer.attachments);
  const readRemind = useAppSelector(state => state.mailReducer.currentMail.senderReceivers);
  const puretext = useAppSelector(state => state.mailReducer.currentMail.status?.puretext);
  const curTabTyps = useAppSelector(state => state.mailTabReducer.currentTab?.type);
  const requestReadReceipt = useMemo(() => currentMail?.requestReadReceipt, [currentMail]);
  const conferenceShow = currentMail.status?.conferenceShow;
  const praiseMailShow = currentMail.status?.praiseMailShow;
  const taskMailShow = currentMail.status?.taskMailShow;
  const priority = currentMail?.entry?.priority;
  const isOneRcpt = currentMail?.entry?.isOneRcpt;
  const dispatch = useAppDispatch();
  const [afterConfirm, setAfterConfirm] = useState(['']);
  const subAccountExpired = useMemo(() => currentMail?.subAccountExpired, [currentMail]); // 子账号造信 中途过期
  const [outDomainReceiver, setOutDomainReceiver] = useState<MailBoxEntryContactInfoModel[]>([]); // 任务邮件domain不同收件人 关注人
  const [taskMailOutDomainVisible, setTaskMailOutDomainVisible] = useState<boolean>(false); // 是否显示任务邮件domain 不同弹窗
  // 定时发信时间
  const scheduleDate = useAppSelector(state => state.mailReducer.currentMail.scheduleDate);
  const scheduleDateTimeZone = useAppSelector(state => state.mailReducer.currentMail.scheduleDateTimeZone);
  const [hiddenTxtVisible, setHiddenTxtVisible] = useState(false);
  const mailEditStatus = useAppSelector(state => state.mailReducer.currentMail.mailEditStatus);
  // 发信可点击
  const sendClickAble = useMemo(() => {
    const { mailEditStatus } = currentMail;
    if (mailEditStatus && ['delivering', 'saving', 'reUploading', 'reGenerating'].includes(mailEditStatus)) return false;
    if (subAccountExpired) return false;
    if (tooltipVisible) return false;
    if (sendLoading) return false;
    return true;
  }, [currentMail, subAccountExpired, tooltipVisible, sendLoading]);

  const [currentMailMailListMap, setCurrentMailMailListMap] = useState<doGetContactInMailListRespose>({
    id: {},
    mail: {},
  });
  // 隐藏内容
  const [hiddenTxt, setHiddenTxt] = useState('');
  const appActions = useActions(AppActions);

  const commandStr = util.getCommonTxt();

  useEffect(() => {
    // 隐藏/重置状态
    if (!tooltipVisible) {
      // 最后一个是标题，则重新聚焦标题
      if (afterConfirm[afterConfirm.length - 1] === 'title') {
        appActions.doFocusTitle(true);
      }
      // 清空 待确认项
      setAfterConfirm([]);
      dispatch(mailActions.doCoverErrModalData({ errModalMailId: undefined }));
    }
  }, [tooltipVisible]);

  const confirmTaskMail = () => {
    const receiverAccountName = outDomainReceiver.map(item => item.contact.contact.accountName);
    const filterReveivers = receiver.filter(item => !receiverAccountName.includes(item?.contact?.contact?.accountName));
    appActions.doReplaceReceiver(filterReveivers);
    saveSend({ receiver: filterReveivers as MailBoxEntryContactInfoModel[] });
  };

  // 任务邮件校验
  const taskMailValidate = (mailListMap: doGetContactInMailListRespose, curMail: ViewMail) => {
    const { receiver, entry, cid } = curMail;
    if (!receiver?.some(item => item.mailMemberType === 'to')) {
      dispatch(
        mailActions.doCoverErrModalData({
          errModalMailId: cid,
          errorText: getIn18Text('WUFAFASONG\uFF0C11'),
          isSimpleTooltip: true,
        })
      );
      setTooltipVisible(true);
      return true;
    }
    let title = entry?.title || '';
    title = title.replace(/\s+/g, '');
    if (!title && !afterConfirm.includes('title')) {
      dispatch(
        mailActions.doCoverErrModalData({
          errModalMailId: cid,
          errorText: getIn18Text('WUFAFASONG\uFF0C12'),
          isSimpleTooltip: true,
        })
      );
      setTooltipVisible(true);
      return true;
    }
    if (existOutDomain(mailListMap)) {
      return true;
    }
    return false;
  };

  // 表扬邮件校验
  const praiseMailValidate = (curMail: ViewMail) => {
    const praiseMail = curMail.praiseMail;
    if (!praiseMail?.winners?.length) {
      // @ts-ignore
      message.info({
        content: getIn18Text('QINGTIANJIABIAOYANG'),
      });
      return true;
    }
    if (!praiseMail?.medalId) {
      // @ts-ignore
      message.info({
        content: getIn18Text('QINGBANFAXUNZHANG'),
      });
      return true;
    }
    if (!praiseMail?.presentationWords) {
      // @ts-ignore
      message.info({
        content: getIn18Text('QINGSHURUBANJIANG11'),
      });
      return true;
    }
    if (!praiseMail?.presenter) {
      // @ts-ignore
      message.info({
        content: getIn18Text('QINGSHURUBANJIANG'),
      });
      return true;
    }
    return false;
  };
  const existOutDomain = (mailListMap: doGetContactInMailListRespose) => {
    const currentUser = systemApi.getCurrentUser();
    if (currentUser) {
      const currentUserDomain = currentUser.domain;
      const receiverDiff = receiver.filter(item => {
        const domain = getContactDomain(item.contact);
        const isMailList = item.contactItem.type === 'external' ? mailListMap.mail[item?.contactItem.contactItemVal] : mailListMap.id[item?.contact.contact.id];
        return domain !== currentUserDomain || isMailList;
      });
      if (receiverDiff.length) {
        setOutDomainReceiver(receiverDiff);
        setTaskMailOutDomainVisible(true);
        return true;
      }
    }
    return false;
  };
  const getContactDomain = (contact: ContactModel) => {
    const accountName = contact.contact.accountName;
    return accountName.split('@')[1];
  };
  // 检查有没有未完成上传的图片
  const validateUnfinishImg = () => {
    const content = currentMail?.entry?.content?.content;
    if (content.includes('paste-img-title') || content.includes('paste-img-reload')) {
      return true;
    }
    return false;
  };
  // 附件校验
  const attachmentValidate = (params: { currentAttachments: AttachmentView[]; curSendId: string }) => {
    const { currentAttachments, curSendId } = params;
    // 附件上传失败
    if (currentAttachments.some(item => item.status === 'fail')) {
      // @ts-ignore
      message.fail({
        content: getIn18Text('CUNZAISHANGCHUANSHI'),
      });
      return false;
    }
    // 附件上传中
    if (currentAttachments.some(item => item.status === 'uploading')) {
      // @ts-ignore
      // message.open({
      //   content: getIn18Text('FUJIANSHANGCHUANZHONG11'),
      //   className: style.msgCustomClass,
      // });
      dispatch(mailActions.doAddWaittingMailIds([curSendId]));
      return false;
    }
    return true;
  };

  // 邮件过期校验
  const expireAttValidate = (params: { currentAttachments: AttachmentView[]; curSendId?: string }) => {
    const { currentAttachments, curSendId } = params;
    const nowTime = new Date().getTime();
    // 是否存在已过期附件
    const expireExist = currentAttachments.some(item => {
      const { expired } = item;
      // 存在过期时间
      if (typeof expired === 'number') {
        // 永不过期
        if (expired === 0) return false;
        // 已过期
        if (expired < nowTime) return true;
        return false;
      }
      return false;
    });
    // 校验通过
    if (!expireExist) return true;
    // 校验不通过
    dispatch(
      mailActions.doCoverErrModalData({
        errmodalMailId: curSendId,
        errorText: getIn18Text('FUJIANBAOHANBUCUNZAI'),
        isSimpleTooltip: false,
      })
    );
    setTooltipVisible(true);
    setAfterConfirm([...afterConfirm, 'attExpired']);
    return false;
  };

  // 手动点击 发信前置校验发送 + 继续发送
  const sendValidate = useCreateCallbackForEvent(async (params?: { continueSend?: boolean }) => {
    const { continueSend } = params || {};
    // 点击发信上报
    trackSendMail({
      receiver,
      attachments,
      readRemind: !!readRemind,
      conferenceShow,
      taskMailShow,
      praiseMailShow,
      scheduledSent,
      priority,
      isOneRcpt,
      puretext,
      requestReadReceipt,
    });
    // 校验网络
    if (!systemApi.isNetworkAvailable()) {
      // @ts-ignore
      message.fail({ content: getIn18Text('CAOZUOSHIBAI\uFF0C') });
      return;
    }
    // 校验收件人邮箱有无
    if (!receiver?.length) {
      // @ts-ignore
      message.warn({ content: getIn18Text('QINGTIANXIESHOUJIAN') });
      return;
    }

    // 校验收件人邮箱格式
    const receiverError = receiver?.filter(item => !verifyEmail(item?.contactItem?.contactItemVal?.trim() || ''));
    if (receiverError?.length) {
      const msg = receiverError.length === 1 ? getIn18Text('YOUXIANGDEZHICUO') : getIn18Text('CUNZAICUOWUDE');
      // @ts-ignore
      message.warn({ content: msg });
      return;
    }

    // 任务邮件校验
    if (taskMailShow) {
      // 获取所有收件邮箱是否有邮件列表
      const doGetContactInMailListParams = {
        idList: [] as string[],
        emailList: [] as string[],
      };
      receiver.forEach(contact => {
        if (contact.contactItem.type === 'external') {
          doGetContactInMailListParams.emailList.push(contact.contactItem.contactItemVal);
        } else {
          doGetContactInMailListParams.idList.push(contact.contact.contact.id);
        }
      });
      doGetContactInMailListParams.idList = doGetContactInMailListParams.idList.filter(_ => _);
      doGetContactInMailListParams.emailList = doGetContactInMailListParams.emailList.filter(_ => _);
      let mailListMap = { id: {}, mail: {} };
      if (doGetContactInMailListParams.idList.length || doGetContactInMailListParams.emailList.length) {
        try {
          mailListMap = await contactApi.doGetContactInMailList(doGetContactInMailListParams);
          setCurrentMailMailListMap(mailListMap);
        } catch (error) {
          return false;
        }
      }
      if (taskMailValidate(mailListMap, currentMail)) return;
    }
    // 表扬邮件校验
    if (praiseMailShow && praiseMailValidate(currentMail)) return;
    // 邮件无主题
    if (!currentMail?.entry?.title && !afterConfirm.includes('title')) {
      dispatch(
        mailActions.doCoverErrModalData({
          errModalMailId: currentMailId,
          errorText: getIn18Text('YOUJIANWU\u201CZHU'),
          isSimpleTooltip: false,
        })
      );
      // 用于继续发送
      setAfterConfirm([...afterConfirm, 'title']);
      setTooltipVisible(true);
      return;
    }

    // 邮件无正文
    if (currentMail?.entry?.content?.content?.length === 0 && !afterConfirm.includes('content')) {
      setAfterConfirm([...afterConfirm, 'content']);
      dispatch(
        mailActions.doCoverErrModalData({
          errModalMailId: currentMailId,
          errorText: getIn18Text('YOUJIANWU\u201CZHENG'),
          isSimpleTooltip: false,
        })
      );
      setTooltipVisible(true);
      return;
    }

    // 邮件中提及了“附件”，但您未添加附件，是否继续发送？
    // 去除正文中的<style>标签的内容，以及标签中 style 属性的内容
    // 去除正文中引用原文的内容（blockquote 标签中的内容）
    const replacedContent = replaceCurrentMailContent(currentMail?.entry?.content?.content, ['style', 'blockquote']).replace(/(<.+?)style=".+?"(.*?>)/g, '$1$2');
    // content转为html对象
    const htmlContent = new DOMParser().parseFromString(replacedContent || '', 'text/html');
    // 校验正文
    const contentAttachExecRes = /附件|attachments|attachment/.exec(htmlContent.body.innerText);
    // 校验标题
    const titleAttachExecRes = /附件|attachments|attachment/.exec(currentMail?.entry?.title);
    const attachExecRes = contentAttachExecRes || titleAttachExecRes;
    if (attachExecRes && attachExecRes.filter(v => v) && !attachments.some(attachment => attachment.mailId === currentMail.cid) && !afterConfirm.includes('attachment')) {
      dispatch(
        mailActions.doCoverErrModalData({
          errModalMailId: currentMailId,
          errorText: getIn18Text('YOUJIANZHONGTIJI'),
          isSimpleTooltip: false,
        })
      );
      setAfterConfirm([...afterConfirm, 'attachment']);
      setTooltipVisible(true);
      return;
    }

    // 定时发送时间不能早于当前时间
    if (scheduledSent && scheduleDate) {
      const moment8 = systemApi.timeZoneTrans(scheduleDate, scheduleDateTimeZone || 8, 8);
      if (moment8) {
        if (new Date().getTime() / 1000 - moment8.unix() > 0) {
          dispatch(
            mailActions.doCoverErrModalData({
              errModalMailId: currentMailId,
              errorText: getIn18Text('DINGSHIFASONGSHI'),
              isSimpleTooltip: true,
            })
          );
          setTooltipVisible(true);
          return;
        }
      }
    }

    // 校验密码
    if (currentMail.setEncrypt) {
      if (!currentMail.entry.encpwd || !/^[a-zA-Z0-9]{6}$/.test(currentMail.entry.encpwd)) {
        dispatch(
          mailActions.doCoverErrModalData({
            errModalMailId: currentMailId,
            errorText: getIn18Text('JIAMIMIMABIXS6WSZ、ZMZC，ZMXQFDXX'),
            isSimpleTooltip: true,
          })
        );
        setTooltipVisible(true);
        return;
      }
    }

    // 图片未上传完
    if (validateUnfinishImg()) {
      dispatch(
        mailActions.doCoverErrModalData({
          errModalMailId: currentMailId,
          errorText: getIn18Text('WUFAFASONG\uFF0C'),
          errorDoc: getIn18Text('QINGQUERENSUOYOU'),
          isSimpleTooltip: true,
        })
      );
      setTooltipVisible(true);
      return;
    }

    // 附件校验
    const currentAttachments = attachments.filter(item => item.mailId === currentMailId && item.type !== 'download');
    const attachmentValidateRes = attachmentValidate({ currentAttachments, curSendId: currentMailId as string });
    if (!attachmentValidateRes) return;

    // 邮件体积校验 过大
    const currentMailSize = getCurrentMailSize(currentMail as MailEntryModel, attachments);
    const mailLimit = mailConfApi.getMailLimit({ _account: currentMail?.initSenderStr || '' });
    if (currentMailSize > mailLimit.smtp_max_send_mail_size) {
      const curVersionId = await productAuthApi.asyncGetProductVersionId({ _account: currentMail?.initSenderStr });
      // 免费版 提示升级
      if (curVersionId === 'free') {
        eventApi.sendSysEvent({
          eventName: 'upgradeVersion',
          eventData: { cid: currentMailId },
        });
      } else {
        Modal.error({
          title: getIn18Text('FASONGSHIBAI，YJZDX（ZW+FJ）CG') + mailLimit.smtp_max_send_mail_size / 1024 / 1024 + 'M',
          content: `当前大小为${sizeTransform(currentMailSize)}M，您可拆封为多封邮件发送`,
          okText: getIn18Text('ZHIDAOLE'),
          className: `${style.sizeErrorDialog}`,
        });
      }
      return false;
    }
    // 校验附件过期
    if (!afterConfirm.includes('attExpired')) {
      const expireAttVRes = expireAttValidate({ currentAttachments });
      if (!expireAttVRes) return;
    }
    // 校验通过了

    // 适用于“继续发送”的场景
    if (continueSend) {
      setTooltipVisible(false);
    }
    appActions.doModifyMailEditStatus({ cid: currentMailId, status: '' });
    // 发信
    saveSend();
    return true;
  });

  // 自动发送校验（已校验一部分）
  const autoSendValidate = useCreateCallbackForEvent(async (curSendId: string) => {
    remWaittingId(curSendId);
    // 整展示着 被阻塞
    if (tooltipVisible) {
      // @ts-ignore
      message.fail({ content: '自动发信失败' });
      return;
    }

    const curMail = mails.find(item => item.cid === curSendId);
    if (!curMail) return;
    const { scheduleDate, scheduleDateTimeZone, entry } = curMail;

    // 校验网络
    if (!systemApi.isNetworkAvailable()) {
      // @ts-ignore
      message.fail({ content: getIn18Text('CAOZUOSHIBAI\uFF0C') });
      return;
    }

    // 定时发送时间不能早于当前时间
    if (scheduleDate) {
      const moment8 = systemApi.timeZoneTrans(scheduleDate, scheduleDateTimeZone || 8, 8);
      if (moment8) {
        if (new Date().getTime() / 1000 - moment8.unix() > 0) {
          dispatch(
            mailActions.doCoverErrModalData({
              errModalMailId: curSendId,
              errorText: getIn18Text('DINGSHIFASONGSHI'),
              isSimpleTooltip: true,
            })
          );
          setTooltipVisible(true);
          return;
        }
      }
    }

    // 邮件体积校验 过大
    const currentMailSize = getCurrentMailSize(curMail as MailEntryModel, attachments);
    const mailLimit = mailConfApi.getMailLimit({ _account: curMail?.initSenderStr || '' });
    if (currentMailSize > mailLimit.smtp_max_send_mail_size) {
      const curVersionId = await productAuthApi.asyncGetProductVersionId({ _account: curMail?.initSenderStr });
      // 免费版 提示升级
      if (curVersionId === 'free') {
        eventApi.sendSysEvent({
          eventName: 'upgradeVersion',
          eventData: { cid: currentMailId },
        });
      } else {
        Modal.error({
          title: getIn18Text('FASONGSHIBAI，YJZDX（ZW+FJ）CG') + mailLimit.smtp_max_send_mail_size / 1024 / 1024 + 'M',
          content: `邮件${entry?.title || ''}大小为${sizeTransform(currentMailSize)}M，您可拆封为多封邮件发送`,
          okText: getIn18Text('ZHIDAOLE'),
          className: `${style.sizeErrorDialog}`,
        });
      }
      return false;
    }

    const currentAttachments = attachments.filter(item => item.mailId === curSendId && item.type !== 'download');
    // 校验附件过期
    const expireAttVRes = expireAttValidate({ currentAttachments, curSendId });
    if (!expireAttVRes) return;

    appActions.doModifyMailEditStatus({ cid: curSendId, status: '' });

    // 发信
    saveSend({ curSendId });
    return true;
  });

  // 隐藏
  const hiddenTxtValidate = useCreateCallbackForEvent(async () => {
    remWaittingId(currentMailId);
    // 粘贴时候遍历元素，如果有隐藏文本，发信时提醒, 不行粘贴可以删了
    // 只检测原信外的输入内容
    // 只能用 editorInstance.getBody() 才能使用 widow.getcomputedstyle 方法

    if (!editorInstance || mailEditStatus === 'delivering') return;
    dispatch(mailActions.doModifyMailEditStatus({ cid: currentMailId, status: 'delivering' }));
    const valiHiddenTxt = mailHiddenText(editorInstance.getBody(), 'html');
    if (valiHiddenTxt) {
      setHiddenTxt(valiHiddenTxt);
      setHiddenTxtVisible(true);
      dispatch(mailActions.doModifyMailEditStatus({ cid: currentMailId, status: '' }));
      return;
    }
    const valiRes = await sendValidate();
    if (!valiRes) {
      // 验证没通过
      dispatch(mailActions.doModifyMailEditStatus({ cid: currentMailId, status: '' }));
    }
  });

  const sendAction = useCreateCallbackForEvent((sendMailId: string, cond?: string) => {
    // 发送当前邮件 走老流程
    if (sendMailId === currentMailId) {
      if (cond === 'continueSend') {
        sendValidate({ continueSend: true });
      } else {
        hiddenTxtValidate();
      }
    } else {
      // 其他 走自动流程
      autoSendValidate(sendMailId);
    }
  });

  // 通知发信
  useMsgRenderCallback('toSendMail', ev => {
    const { sendMailId, cond } = ev.eventData;
    sendAction(sendMailId, cond);
  });

  const isWriteMailTab = useMemo(() => {
    return writeTabTypes.includes(curTabTyps);
  }, [curTabTyps]);

  // 快捷键发送
  useMsgRenderCallback('mailMenuOper', ev => {
    // 当前页签为写信页
    if (ev.eventStrData === 'sendMail' && isWriteMailTab) {
      let canShowModal = true;
      let hkIsOpen = false;
      try {
        canShowModal = !localStorage.getItem(MAIL_WRITE_GUIDE_LOCAL_KEY);
        hkIsOpen = !!localStorage.getItem(MAIL_WRITE_HOTKEY_LOCAL_KEY);
      } catch (e) {
        console.error('[error] MAIL_WRITE_GUIDE_LOCAL_KEY', e);
      }
      // 快捷键没有开启 且 本地弹窗没有不再提醒标记
      if (canShowModal && !hkIsOpen) {
        const guideModal = checkboxConfirm({
          title: getIn18Text('`SHIFOUKAIQIYJFSKJJ`') + `(${commandStr} ↩)`,
          // content: <div>若有未校验出的邮箱地址，请重新检查格式</div>,
          okText: getIn18Text('QUEDING'),
          cancelText: getIn18Text('QUXIAO'),
          closable: true,
          isGlobal: true,
          onCancel: () => {
            guideModal.destroy();
          },
          onOk: (checked: boolean) => {
            // 本地打开快捷键记录
            localStorage.setItem(MAIL_WRITE_HOTKEY_LOCAL_KEY, '1');
            // 关闭弹窗
            if (checked) {
              localStorage.setItem(MAIL_WRITE_GUIDE_LOCAL_KEY, '1');
            }
            guideModal.destroy();
            const modal = checkboxConfirm({
              title: getIn18Text('QUERENFASONGYOUJ？（JXDJ↩JKFS）'),
              // content: <div>若有未校验出的邮箱地址，请重新检查格式</div>,
              okText: getIn18Text('QUEDING') + ' ↩',
              cancelText: getIn18Text('QUXIAO') + ' Esc',
              closable: true,
              isGlobal: true,
              autoFocusButton: 'ok',
              showCheck: false,
              onCancel: () => {
                modal.destroy();
              },
              onOk: () => {
                hiddenTxtValidate();
                modal.destroy();
              },
            });
            return false;
          },
        });
      } else if (hkIsOpen) {
        // 如果快捷键是开启状态，进入发信流程
        const modal = checkboxConfirm({
          title: getIn18Text('QUERENFASONGYOUJ？（JXDJ↩JKFS）'),
          okText: getIn18Text('QUEDING') + ' ↩',
          cancelText: getIn18Text('QUXIAO') + ' Esc',
          closable: true,
          isGlobal: true,
          autoFocusButton: 'ok',
          showCheck: false,
          onCancel: () => {
            modal.destroy();
          },
          onOk: () => {
            hiddenTxtValidate();
            modal.destroy();
          },
        });
      }
    }
  });

  return (
    <>
      <div
        id="sendValidateComp"
        className={`${style.btn} ${style.send} ${!sendClickAble ? style.btnDisabled : ''}`}
        onClick={e => {
          e.stopPropagation();
          hiddenTxtValidate();
        }}
      >
        <span>{scheduledSent ? getIn18Text('DINGSHIFASONG') : getIn18Text('FASONG')}</span>
        <span className={`${style.icon}`} hidden={scheduledSent}>
          {scheduledSent ? '' : mailEditStatus === 'delivering' ? <LoadingOutlined /> : <SendIcon />}
        </span>
      </div>
      {/* 任务邮件暂不支持企业外邮箱地址和邮件列表 */}
      <TaskMailOutDomain
        visible={taskMailOutDomainVisible}
        setVisible={setTaskMailOutDomainVisible}
        receiver={outDomainReceiver}
        confirm={confirmTaskMail}
        currentMailMailListMap={currentMailMailListMap}
      />
      <HiddenTxtModal visible={hiddenTxtVisible} setVisible={setHiddenTxtVisible} hiddenTxt={hiddenTxt} handleCommentOk={sendValidate} />
    </>
  );
};
export default SendValidateComp;
// 发送按钮的克隆
export const SendValidateCompClone: React.FC<PropsClone> = (props: PropsClone) => {
  const { sendLoading, tooltipVisible, scheduledSent } = props;
  const { currentMail } = useAppSelector(state => state.mailReducer);
  const subAccountExpired = useMemo(() => currentMail?.subAccountExpired, [currentMail]); // 子账号造信 中途过期
  const mailEditStatus = useMemo(() => currentMail?.mailEditStatus, [currentMail]);
  const sendClickAble = useMemo(() => {
    const { mailEditStatus } = currentMail;
    if (mailEditStatus && ['delivering', 'saving', 'reUploading', 'reGenerating'].includes(mailEditStatus)) return false;
    if (subAccountExpired) return false;
    if (tooltipVisible) return false;
    if (sendLoading) return false;
    return true;
  }, [currentMail, subAccountExpired, tooltipVisible, sendLoading]);
  const ckAction = (e: React.MouseEvent) => {
    if (!sendClickAble) return;
    e.stopPropagation();
    document.getElementById('sendValidateComp')?.click();
  };
  return (
    <>
      <div className={`${style.btn} ${style.send} ${!sendClickAble ? style.btnDisabled : ''}`} onClick={e => ckAction(e)}>
        <span>{scheduledSent ? getIn18Text('DINGSHIFASONG') : getIn18Text('FASONG')}</span>
        <span className={`${style.icon}`} hidden={scheduledSent}>
          {scheduledSent ? '' : mailEditStatus === 'delivering' ? <LoadingOutlined /> : <SendIcon />}
        </span>
      </div>
    </>
  );
};
