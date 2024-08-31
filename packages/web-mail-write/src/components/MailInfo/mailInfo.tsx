/* eslint-disable max-statements */
/* eslint-disable max-len */
import React, { useState, useEffect, useMemo, useRef, useCallback, LegacyRef, useContext } from 'react';
import classnames from 'classnames';
import {
  apis,
  MailBoxEntryContactInfoModel,
  MailEntryModel,
  apiHolder,
  DataStoreApi,
  DataTrackerApi,
  ProductAuthorityFeature,
  api,
  ContactAndOrgApi,
  locationHelper,
  contactInsertParams,
  ContactItem,
  getIn18Text,
} from 'api';
import { transContactModel2ContactItem } from '@web-common/components/util/contact';
import { message, Tooltip } from 'antd';
import LxPopover from '@web-common/components/UI/LxPopover/LxPopover';
import InfoCircleOutlined from '@ant-design/icons/InfoCircleOutlined';
import KeyCode from 'rc-util/lib/KeyCode';
import Selector, { SelectorRefProps } from '../Selector/selector';
import { getStoreBooleanData, verifyEmail } from '../../util';
import styles from './mailInfo.module.scss';
import ConferenceBtn from './conference/ConferenceBtn';
import Conference from './conference/Conference';
import PraiseMailBtn from './praiseMail/PraiseMailBtn';
import PraiseMail from './praiseMail/PraiseMail';
import { useAppDispatch, useAppSelector, ContactActions, TempContactActions, MailActions, MailTemplateActions } from '@web-common/state/createStore';
import { actions as mailTabActions, MailTabModel } from '@web-common/state/reducer/mailTabReducer';
import { WriteContext } from '@web-setting/Mail/components/CustomTemplate/template_add_modal';
import { extractEmailsFromText, getCopiedContacts } from '../Selector/helper';
import TaskMailBtn from './taskMail/TaskMailBtn';
import TaskMail from './taskMail/TaskMail';
import FollowerCard from './taskMail/FollowerCard';
import debounce from 'lodash/debounce';
import { comIsShowByAuth } from '@web-common/utils/utils';
import IconCard from '@web-common/components/UI/IconCard';
import Attachment from '../Attachment';
import { transMailContactModel2ContactItem } from '@web-common/utils/contact_util';
import { doGetMailContactModelByContactItem } from '@web-common/state/selector/contact';
import { copyText, isSupportPaste, paste } from '@web-common/components/UI/ContextMenu/util';
import SiriusModal from '@web-common/components/UI/Modal/SiriusModal';
import InputContextMenu from '@web-common/components/UI/InputContextMenu/InputContextMenu';
import PersonalOrgModal from '@web-common/components/UI/SiriusContact/personalOrgModal/personalOrg';
import TimeZoneWriteMail from '@web-mail/components/ReadMail/component/TimeZone/TimeZoneWriteMail';
import useDebounceForEvent from '@web-mail/hooks/useDebounceForEvent';
import { systemIsMac } from '@web-mail/util';

// import GuideCard from './taskMail/GuideCard';
import SubjectHelper from './subjectHelper';
import { HelperBtn, AiPolishBtn, SubjectOtherBtn, BtnDivider } from './subjectHelper/btn';
import { EmailContentAssistantComponent } from '@web-edm/send/EmailContentAssistant/assistant';
import { aiModSubject, aiTimesSubtract } from '@web-edm/send/utils/aiModSubject';
import { getSideBarWidth } from '@web-common/utils/constant';
import useCreateCallbackForEvent from '@web-common/hooks/useCreateCallbackForEvent';

interface Props {
  setVisible: (val: any) => void;
  visible: boolean;
}

const SubjectHelperTips = 'SubjectHelperTipsClosed';
const dataStoreApi: DataStoreApi = apiHolder.api.getDataStoreApi() as DataStoreApi;
const storeApi: DataStoreApi = apiHolder.api.getDataStoreApi();
const trackApi = apiHolder.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;
const contactApi = api.requireLogicalApi(apis.contactApiImpl) as ContactAndOrgApi;
const checkEmails = (receivers: MailBoxEntryContactInfoModel[]): boolean =>
  receivers?.some(receiver => receiver?.contactItem?.contactItemType === 'EMAIL' && !verifyEmail(receiver?.contactItem?.contactItemVal?.trim()));
interface Props {
  setVisible: (val: any) => void;
  visible: boolean;
}
// 是否是mac系统
const isMac = systemIsMac();

const MailInfo: React.FC<Props> = props => {
  const { isMailTemplate } = useContext(WriteContext);
  // const [showCc, setShowCc] = useState<boolean>(true);
  const [showWriteContact, setShowWriteContact] = useState<boolean>(true);
  const [hasWrongNormal, setHasWrongNormal] = useState<boolean>(false);
  const [hasWrongCc, setHasWrongCc] = useState<boolean>(false);
  const [hasWrongBcc, setHasWrongBcc] = useState<boolean>(false);
  const [totalReceivers, setTotalReceivers] = useState<MailBoxEntryContactInfoModel[]>([]);
  const [normalReceivers, setNormalReceivers] = useState<MailBoxEntryContactInfoModel[]>([]);
  const [ccReceivers, setCcReceivers] = useState<MailBoxEntryContactInfoModel[]>([]);
  const [bccReceivers, setBccReceivers] = useState<MailBoxEntryContactInfoModel[]>([]);
  const [keywordSender, setKeywordSender] = useState<string>('');
  const [keywordCC, setKeywordCC] = useState<string>('');
  const [keywordBCC, setKeywordBCC] = useState<string>('');
  const attachments = useAppSelector(state => state.attachmentReducer.attachments);
  const isCorpMail = useAppSelector(state => state.loginReducer.loginInfo.isCorpMailMode);
  // 邮件内容长度，关闭弹窗会清空
  const mailLength = useAppSelector(state => state.mailReducer.mails.length);
  // 是否开启群发单显
  const isOneRcpt = useAppSelector(state => state.mailReducer.currentMail.isOneRcpt);
  const isCommonOrEditDraft = useAppSelector(state => ['common', 'edit', 'editDraft'].includes(state.mailReducer.currentMail?.entry?.writeLetterProp || ''));
  // 只有写邮件和发件箱重新编辑和编辑草稿时才需要回显群发单显
  useEffect(() => {
    if (mailLength > 0 && isOneRcpt && !isCommonOrEditDraft) {
      changeOneRcptStatus();
    }
  }, [mailLength]);
  const mailInfoWrapper = useRef<HTMLDivElement>(null);
  const focused = useAppSelector(state => (isMailTemplate ? state.tempContactReducer.selector.focused : state.contactReducer.selector.focused));
  const dispatch = useAppDispatch();
  const subject = useAppSelector(state =>
    isMailTemplate ? state.mailTemplateReducer.mailTemplateContent?.entry?.title : (state.mailReducer.currentMail as MailEntryModel)?.entry?.title
  );
  const [subjectTemp, setSubjectTemp] = useState<string>(subject);
  const mailTemplateName = useAppSelector(state => state.mailTemplateReducer.mailTemplateName);
  const receivers = useAppSelector(state =>
    isMailTemplate ? state.mailTemplateReducer.mailTemplateContent?.receiver : (state.mailReducer.currentMail as MailEntryModel)?.receiver
  ) as MailBoxEntryContactInfoModel[];
  const infoStatus = useAppSelector(state => (isMailTemplate ? state.mailTemplateReducer.mailTemplateContent?.status : (state.mailReducer.currentMail as any)?.status));
  const focusTitleStatus = useAppSelector(state =>
    isMailTemplate ? state.mailTemplateReducer.mailTemplateContent?.focusTitle : (state.mailReducer.currentMail as any)?.focusTitle
  );
  const selectedTags = useAppSelector(state => (isMailTemplate ? state.tempContactReducer.selectedTags : state.contactReducer.selectedTags));
  const writeLetterProp = useAppSelector(state => (state.mailReducer?.currentMail as any)?.writeLetterProp);
  const currentTab = useAppSelector(state => state.mailTabReducer.currentTab);
  const currentTabRef = useRef<MailTabModel>(currentTab);
  currentTabRef.current = currentTab;
  const currentMail = useAppSelector(state => state.mailReducer.currentMail);
  const sendSelectorRef = useRef<SelectorRefProps>(null);
  const ccSelectorRef = useRef<SelectorRefProps>(null);
  const bccSelectorRef = useRef<SelectorRefProps>(null);
  const refSubject: LegacyRef<HTMLInputElement> = useRef(null);
  const subjectBtnRef = useRef<HTMLDivElement>(null);
  const conferenceShow = infoStatus?.conferenceShow;
  const praiseMailShow = infoStatus?.praiseMailShow;
  const taskShow = infoStatus?.taskMailShow;
  const showCc = infoStatus?.cc;
  const showBcc = infoStatus?.bcc;

  // const eventApi = apiHolder.api.getEventApi();
  const onActions = isMailTemplate ? MailTemplateActions : MailActions;
  const { doModifyReceiver, doReplaceReceiver, doFocusTitle, doModifySubject, doShowWriteContact, doCCShow, doBCCShow } = onActions;
  const onContactActions = isMailTemplate ? TempContactActions : ContactActions;
  const { doSelectTags, doFocusSelector } = onContactActions;
  const [attachmentsCount, setAttachmentsCount] = useState(0);
  const [attachmentFlod, setAttachmentFlod] = useState(false);
  const [attachmentsHeight, setAttachmentsHeight] = useState(0);
  // 新增个人联系人跟组的弹窗默认选中
  const [defaultPersonalOrgSelect, setDefaultPersonalOrgSelect] = useState<ContactItem[]>([]);
  //是否显示添加联系人分组弹窗
  const [personalOrgModalVisible, setPersonalOrgModalVisible] = useState<boolean>(false);
  // 主题助手是否关闭了
  const [subjectHelperTipsClosed, setSubjectHelperTipsClosed] = useState<boolean>(getStoreBooleanData(SubjectHelperTips));
  // 主题助手样式
  const [subjectStyle, setSubjectStyle] = useState<React.CSSProperties>({});
  // 是否展示主题助手
  const [visibleSubjectHelper, setVisibleSubjectHelper] = useState<boolean>(false);
  // 内容助手位置
  const [subjectHelperPos, setSubjectHelperPos] = useState<Partial<DOMRect>>({});
  // 主题助手loading
  const [subjectLoading, setSubjectLoading] = useState<boolean>(false);
  //  主题助手model展示
  const [subjectHelperVisible, setSubjectHelperVisible] = useState<boolean>(false);
  const attachmentsRef = useRef(null);
  // 是否加密
  const setEncrypt = useMemo(() => {
    return currentMail?.setEncrypt || false;
  }, [currentMail]);
  const handleTotalReceivers = (needSort?: boolean) => {
    // const onlyReceivers: MailBoxEntryContactInfoModel[] = [];
    // const myMap = new Map();
    let totalReceivers = receivers;
    // normalReceivers ccReceivers bccReceivers直接使用不一定准确
    // 例如如果草稿在重新编辑前就是群发单显，那三个是空的而receivers是有值的，所以这里重新过滤
    if (needSort) {
      const normalReceivers = receivers.filter(receiver => receiver.mailMemberType === 'to');
      const ccReceivers = receivers.filter(receiver => receiver.mailMemberType === 'cc');
      const bccReceivers = receivers.filter(receiver => receiver.mailMemberType === 'bcc');
      totalReceivers = [...normalReceivers, ...ccReceivers, ...bccReceivers];
    }
    // SIRIUS-4138 一个用户有多个邮箱 contactItemVal相同 hitQueryEmail不同
    // 用contactItemVal过滤会少邮箱，目前不知道过滤的需求是什么，直接注释了，遇到相关需求再讨论
    // totalReceivers.forEach(item => {
    //   if (item?.contactItem?.contactItemVal) {
    //     if (!myMap.get(item.contactItem.contactItemVal)) {
    //       onlyReceivers.push(item);
    //       myMap.set(item.contactItem.contactItemVal, true);
    //     }
    //   }
    // });
    // myMap.clear();
    setTotalReceivers(totalReceivers);
  };
  useEffect(() => {
    setAttachmentsCount(attachments.filter(i => i.mailId === currentMail.cid && !i.forwardWithout).length);
  }, [attachments, currentMail.cid]);
  // 群发单显状态下，合并收件人、抄送、密送并去重，得到新的临时receivers用于回显数据
  useEffect(() => {
    isOneRcpt && handleTotalReceivers();
  }, [receivers?.length]);
  // 打开群发单显，内容需要按照收件人-抄送-密送先后顺序
  useEffect(() => {
    isOneRcpt && handleTotalReceivers(true);
  }, [isOneRcpt]);
  useEffect(() => {
    if (infoStatus) {
      const { showContact } = infoStatus;
      setShowWriteContact(showContact);
    }
  }, [infoStatus]);
  useEffect(() => {
    if (attachmentsRef.current) {
      const resizeOb = new ResizeObserver(() => {
        // @ts-ignore
        setAttachmentsHeight(attachmentsRef.current?.scrollHeight);
      });
      resizeOb.observe(attachmentsRef.current);
      return () => {
        attachmentsRef.current && resizeOb.unobserve(attachmentsRef.current);
      };
    }
    return () => {};
  }, [attachmentsRef.current]);

  useEffect(() => {
    setAttachmentFlod(false);
  }, [attachmentsCount]);

  const setShowCc = (status: boolean) => {
    dispatch(doCCShow(status));
  };
  const setShowBcc = (status: boolean) => {
    dispatch(doBCCShow(status));
  };
  const handleDrag = (e: { preventDefault: () => void; stopPropagation: () => void }) => {
    e.preventDefault();
    e.stopPropagation();
  };
  // 解决拖拽写信胶囊会触发拖拽上传附件的问题
  useEffect(() => {
    if (mailInfoWrapper.current) {
      mailInfoWrapper?.current.addEventListener('dragenter', handleDrag);
    }
    return () => {
      mailInfoWrapper?.current?.removeEventListener('dragenter', handleDrag);
    };
  }, [mailInfoWrapper]);
  useEffect(() => {
    const ccReceivers = receivers?.filter(receiver => receiver.mailMemberType === 'cc');
    const bccReceivers = receivers?.filter(receiver => receiver.mailMemberType === 'bcc');
    if (ccReceivers?.length) setShowCc(true);
    if (bccReceivers?.length) setShowBcc(true);
    if (focused === '正文') {
      setAttachmentFlod(true);
    }
  }, [receivers, focused]);

  const focusSelector: Record<string, (keyword?: string) => void> = {
    to: (keyword?: string) => {
      sendSelectorRef?.current?.focus();
      keyword && setKeywordSender(keyword);
    },
    cc: (keyword?: string) => {
      ccSelectorRef?.current?.focus();
      keyword && setKeywordCC(keyword);
    },
    bcc: (keyword?: string) => {
      bccSelectorRef?.current?.focus();
      keyword && setKeywordBCC(keyword);
    },
  };

  useEffect(() => {
    if (focused === 'focusto') {
      // 不加定时器不能执行，时序问题
      setTimeout(() => {
        sendSelectorRef?.current?.focus();
      }, 1000);
    }
  }, [focused, currentMail.cid]);

  const onTagsPatse = async () => {
    // 限制选中一个胶囊粘贴
    const { emails, type } = selectedTags;
    if (emails.length === 1) {
      const clipboardData = await paste(false);
      if (!clipboardData) return;
      const extractEmails = extractEmailsFromText(clipboardData);
      const result = await contactApi.doGetContactByEmails(extractEmails, type);
      // 粘贴数据
      const target = result.map(transMailContactModel2ContactItem);
      const contactItemList = receivers.filter(_ => _.mailMemberType === type).map(transMailContactModel2ContactItem) as ContactItem[];
      const index = contactItemList.findIndex(c => emails.includes(c.email));
      if (index !== -1) {
        contactItemList.splice(index, 1, ...target);
      }
      const receiver = await doGetMailContactModelByContactItem(contactItemList, type);
      dispatch(
        doModifyReceiver({
          receiver,
          receiverType: type,
        })
      );
    }
  };
  const handleCutAndCopy = async (e: KeyboardEvent) => {
    if (!e.target || (e.target as Element).getAttribute('data-test-id') == 'contact_selectList_search_input') {
      return;
    }
    e.preventDefault();
    const { emails, type } = selectedTags;
    const { which, metaKey, ctrlKey, key } = e;
    if ([KeyCode.DELETE, KeyCode.BACKSPACE].includes(which)) {
      dispatch(doModifyReceiver({ receiver: emails, receiverType: type, operation: 'delete' }));
      dispatch(doSelectTags({ emails: [], type }));
      focusSelector[focused] && focusSelector[focused]();
    }
    const holdingCtrl = metaKey || ctrlKey;
    const copiedContacts = getCopiedContacts(receivers, type, emails);
    if ([KeyCode.X, KeyCode.C].includes(which) && holdingCtrl) {
      if (!(await isSupportPaste())) {
        SiriusModal.error({
          content: '浏览器版本过低，不支持联系人的复制/剪切，请升级到新版chrome浏览器使用',
          okText: getIn18Text('ZHIDAOLE'),
          hideCancel: true,
        });
        return;
      }
      if (which === KeyCode.X) {
        copyText(copiedContacts);
        dispatch(doModifyReceiver({ receiver: emails, receiverType: type, operation: 'delete' }));
      } else if (which === KeyCode.C) {
        copyText(copiedContacts);
      }
    }

    // 选中一个胶囊，原位替换粘贴
    if (which === KeyCode.V && holdingCtrl && (await isSupportPaste())) {
      onTagsPatse();
    }
    if (which === KeyCode.A && holdingCtrl) {
      if (selectedTags.emails.length > 0) {
        dispatch(
          doSelectTags({
            emails: receivers.filter(item => item.mailMemberType === selectedTags.type).map(item => contactApi.doGetModelDisplayEmail(item.contact)),
            type: selectedTags.type,
          })
        );
      }
    }
    // 删除选中替换搜索字母
    if (selectedTags.emails?.length > 0 && !holdingCtrl && /^[a-z0-9]$/i.test(key)) {
      dispatch(doModifyReceiver({ receiver: selectedTags.emails, receiverType: selectedTags.type, operation: 'delete' }));
      dispatch(doSelectTags({ emails: [], type: selectedTags.type }));
      focusSelector[selectedTags.type] && focusSelector[selectedTags.type](key);
    }
  };
  /**
   * 有多选的联系人时，拦截剪切、复制、删除操作
   */
  useEffect(() => {
    if (!selectedTags.emails.length) {
      return;
    }
    // 这块修改先问一下 wanglijun
    document.addEventListener('keydown', handleCutAndCopy);
    return () => {
      document.removeEventListener('keydown', handleCutAndCopy);
    };
  }, [selectedTags, handleCutAndCopy]);
  useEffect(() => {
    if (focusTitleStatus) {
      refSubject.current?.focus();
      dispatch(doFocusTitle(false));
    }
  }, [focusTitleStatus]);
  useEffect(() => {
    const list = receivers || [];
    const normalReceivers = list.filter(receiver => receiver.mailMemberType === 'to');
    const ccReceivers = list.filter(receiver => receiver.mailMemberType === 'cc');
    const bccReceivers = list.filter(receiver => receiver.mailMemberType === 'bcc');
    setNormalReceivers(normalReceivers);
    setCcReceivers(ccReceivers);
    setBccReceivers(bccReceivers);
    const hasWrongNormal = checkEmails(normalReceivers);
    const hasWrongCc = checkEmails(ccReceivers);
    const hasWrongBcc = checkEmails(bccReceivers);
    setHasWrongNormal(hasWrongNormal);
    setHasWrongCc(hasWrongCc);
    setHasWrongBcc(hasWrongBcc);
  }, [receivers]);
  // 主页 同步修改标题
  const modifyTabTitle = debounce((subject: string) => {
    locationHelper.isMainPage() &&
      currentTabRef.current.id === String(currentMail.cid) &&
      dispatch(
        mailTabActions.doChangeTabById({
          id: currentTabRef.current.id,
          tabModel: {
            ...currentTabRef.current,
            title: subject || getIn18Text('WUZHUTI'),
          },
        })
      );
  }, 100);
  const modSubject = debounce(newSubject => {
    dispatch(doModifySubject(newSubject));
  }, 200);
  // 输入变化
  const onSubjectChange = useCallback(e => {
    trackApi.track('pcMail_click_options_saveDraftPage');
    const newSubject = e.target.value;
    // 立刻设值 以免卡顿
    setSubjectTemp(newSubject);
    // 节流 同步redux
    modSubject(newSubject);
  }, []);
  // 跟着redux设值标题 redux也会主动变化（添加附件时）
  useEffect(() => {
    setSubjectTemp(subject); // 也会触发change 但dispatch不变
    modifyTabTitle(subject);
  }, [subject]);
  const onTemplateNameChange = useCallback(e => {
    let templateName = e.target.value;
    if (templateName.length > 50) {
      message.destroy(); // 保证同时只展示一条message
      message.error({
        content: getIn18Text('QINGSHURU50'),
      });
      templateName = templateName.slice(0, 50);
    }
    dispatch(MailTemplateActions.doModifyTemplateName(templateName));
  }, []);
  const changeCcStatus = (status: boolean) => {
    setShowCc(status);
    if (status) {
      storeApi.put('ccStatus', 'open');
      setTimeout(() => {
        ccSelectorRef.current?.focus();
      }, 100);
    }
    // dispatch(MailActions.doChangeMailInfoStatus({ showContact: showWriteContact }));
  };
  const closeCC = () => {
    setShowCc(false);
    dispatch(doReplaceReceiver(receivers.filter(r => r.mailMemberType !== 'cc')));
    storeApi.put('ccStatus', 'close');
  };
  const closeBCC = () => {
    setShowBcc(false);
    dispatch(doReplaceReceiver(receivers.filter(r => r.mailMemberType !== 'bcc')));
    storeApi.put('bccStatus', 'close');
  };
  const changeBccStatus = (status: boolean) => {
    setShowBcc(status);
    if (status) {
      storeApi.put('bccStatus', 'open');
      setTimeout(() => {
        bccSelectorRef.current?.focus();
      }, 100);
    }
    // dispatch(MailActions.doChangeMailInfoStatus({ showContact: showWriteContact }));
  };
  const changeOneRcptStatus = () => {
    dispatch(MailActions.doChangeMailOneRcpt(!isOneRcpt));
  };
  const toggleShowContact = () => {
    const show = !showWriteContact;
    trackApi.track('pcMail_click_AddressButton', { status: show ? getIn18Text('ZHANKAI') : getIn18Text('SHOUQI') });
    dispatch(doShowWriteContact(show));
    // @ts-ignore
    dataStoreApi.put('showContact', show).then(() => {});
  };
  const getPersonCount = (receiver: MailBoxEntryContactInfoModel[], wrapperRef: React.RefObject<SelectorRefProps>, to = false) => {
    const height = wrapperRef?.current?.wrapperHeight || 44;
    return (
      // height > 50 &&
      receiver.length > 10 && (
        <span
          className={classnames(styles.memberCount, {
            [styles.memberCountLittle]: to && (isOneRcpt ? totalReceivers.length < 16 : normalReceivers.length < 16),
          })}
        >
          {getIn18Text('GONG')}
          {receiver?.length}
          {getIn18Text('REN&nbs')}&nbsp;
        </span>
      )
    );
  };

  const onClickAiPolish = useCreateCallbackForEvent(async () => {
    if (subjectLoading) {
      return;
    }
    if (!subject || !subject.trim()) {
      message.error(getIn18Text('QINGSHURUZHUTINR'));
      return;
    }
    setSubjectLoading(true);
    try {
      const res = await aiModSubject([subject], 1, 5);
      message.success(getIn18Text('AIRUNSEWANC，ZTYTH'));
      setSubjectTemp(res[0]);
      modSubject(res[0]);
      aiTimesSubtract();
    } catch (error: any) {
      let err = error?.message || error;
      if (err === '今日剩余次数不足') {
        err = getIn18Text('JINRIAIKEYCSW0');
      }
      message.error(err);
    } finally {
      setSubjectLoading(false);
    }
  });

  const NewPersonalGroup = ({ items }: { items: MailBoxEntryContactInfoModel[] }) => {
    // doGetContactByEmailFilter(items)

    const toggleNewPersonalGroup = async () => {
      const emails = items.map(item => item.contactItem?.contactItemVal);
      const contactRes = await contactApi.doGetContactByEmailFilter({ emails });
      const contactResKeys = Object.keys(contactRes);
      // 陌生人
      const diff = emails.filter(item => !contactResKeys.includes(item));
      // 在通讯录内
      const itemsInContact = items.filter(item => !diff.includes(item.contactItem?.contactItemVal));
      let res = itemsInContact.map(item => transContactModel2ContactItem(item.contact));
      if (diff.length > 0) {
        SiriusModal.error({
          title: '联系人中有陌生邮箱地址，需要添加个人通讯录再创建分组。是否添加？',
          cancelText: '跳过',
          okText: '添加',
          onOk: async () => {
            // doInsertContact
            const enterpriseList: contactInsertParams[] = [];
            diff.forEach(item => {
              const name = item.split('@')[0] || '未知';
              enterpriseList.push({
                name,
                emailList: [item],
                groupIdList: [],
              });
            });
            const { success, data: insertPersonalList } = await contactApi.doInsertContact({
              list: enterpriseList,
            });
            if (success && insertPersonalList) {
              res = res.concat(transContactModel2ContactItem(insertPersonalList[0]));
              setDefaultPersonalOrgSelect(res);
              setPersonalOrgModalVisible(true);
            }
          },
          onCancel: () => {
            setDefaultPersonalOrgSelect(res);
            setPersonalOrgModalVisible(true);
          },
        });
      } else {
        setDefaultPersonalOrgSelect(res);
        setPersonalOrgModalVisible(true);
      }
    };
    return (
      <span className={classnames([styles.labelBtn, styles.labelBtnColor1, styles.newPersonalGroup])} onClick={toggleNewPersonalGroup}>
        {/* {getIn18Text('新建个人分组')} */}
        新建个人分组
      </span>
    );
  };
  const toReceivers = isOneRcpt ? totalReceivers : normalReceivers;
  const btnBox = (
    <div className={classnames(styles.btnBox, { [styles.btnBoxMultLine]: toReceivers.length > 15 })} tabIndex={-1}>
      {getPersonCount(toReceivers, sendSelectorRef, true)}
      {toReceivers.length > 1 && <NewPersonalGroup items={toReceivers} />}
      {!showCc && !isOneRcpt && (
        <span
          className={classnames([styles.labelBtn], {
            [styles.labelBtnSelected]: showCc,
          })}
          onClick={() => {
            changeCcStatus(true);
            dispatch(doFocusSelector(''));
          }}
        >
          {getIn18Text('CHAOSONG')}
        </span>
      )}
      {!showBcc && !taskShow && !isOneRcpt && (
        <span
          className={classnames([styles.labelBtn], {
            [styles.labelBtnSelected]: showBcc,
          })}
          onClick={() => {
            changeBccStatus(true);
            dispatch(doFocusSelector(''));
          }}
        >
          {getIn18Text('MISONG')}
        </span>
      )}
      {isCorpMail || conferenceShow || taskShow || praiseMailShow || isMailTemplate ? null : (
        <span
          className={classnames(styles.labelBtn)}
          onClick={() => {
            changeOneRcptStatus();
            dispatch(doFocusSelector(''));
          }}
        >
          {isOneRcpt ? getIn18Text('QUXIAOQUNFADAN') : getIn18Text('QUNFADANXIAN')}
        </span>
      )}
      <span
        className={classnames([styles.labelBtn], {
          [styles.labelBtnSelected]: showWriteContact,
        })}
        onClick={toggleShowContact}
      >
        {getIn18Text('TONGXUNLU')}
      </span>
    </div>
  );

  // 发送消息，触发邮件发送
  const debounceSendMail = useDebounceForEvent(
    () => {
      eventApi.sendSysEvent({
        eventName: 'mailMenuOper',
        eventData: {},
        eventStrData: 'sendMail',
      });
    },
    1000,
    {
      leading: true,
      trailing: false,
    }
  );
  const renderSubjectContent = () => {
    return (
      <InputContextMenu inputOutRef={refSubject} changeVal={setSubjectTemp}>
        <input
          className={classnames(styles.inputItem, {
            [styles.titleInput]: !conferenceShow,
            [styles.disabled]: subjectLoading,
          })}
          tabIndex={34}
          maxLength={256}
          value={subjectTemp}
          disabled={subjectLoading}
          ref={refSubject}
          onClick={() => {
            // tips 没有关闭才做计算
            if (!subjectHelperTipsClosed) {
              // 获取输入框的位置
              const pos = refSubject.current?.getBoundingClientRect();
              // 获取整个form表单的宽度
              const mailInfoPos = mailInfoWrapper.current?.getBoundingClientRect();
              if (mailInfoPos && pos) {
                setVisibleSubjectHelper(true);
                // 展示输入框下拉应该在的位置
                setSubjectHelperPos(pos || null);
                // 设置下拉框应该展示的宽度（总的宽度 - 输入框距离最左边的宽度 + sideBar宽度 - 距离最右边距离）
                setSubjectStyle({
                  width: mailInfoPos.width - pos.left + getSideBarWidth() - 16,
                });
              }
            }
          }}
          onFocus={() => {
            dispatch(doFocusSelector(getIn18Text('ZHUTI')));
          }}
          onChange={onSubjectChange}
        />
      </InputContextMenu>
    );
  };
  const visibleTaskOrPraise = !isCorpMail && !isOneRcpt && !isMailTemplate && !setEncrypt && !taskShow && !conferenceShow && !praiseMailShow;

  return (
    <>
      <div className={styles.writeMailInfo} tabIndex={-1} id="writeMailInfo" ref={mailInfoWrapper}>
        <div className={styles.infoItem} hidden={!isMailTemplate}>
          <span className={styles.infoLabel}>{getIn18Text('MOBANMINGCHENG')}</span>
          <span className={styles.colonLabel}>:</span>
          <div className={`ant-allow-dark ${styles.titleDesc}`}>
            <input className={classnames(styles.inputItem, { [styles.titleInput]: !conferenceShow })} value={mailTemplateName} onChange={onTemplateNameChange} />
          </div>
        </div>

        {/* 群发单显实际是标记为单显的收件人，所以与收件人共用数据 */}
        <div
          className={classnames([styles.infoItem, styles.webkitNoDrag], {
            [styles.infoItemWarning]: hasWrongNormal,
            [styles.flowColumn]: isOneRcpt ? totalReceivers.length > 15 : normalReceivers.length > 15,
            // [styles.infoItemColumn]: normalReceivers.length > 0,
          })}
        >
          <div className={classnames([styles.receiverWrapper, styles.receiverSelector])}>
            {isOneRcpt ? (
              <span className={classnames([styles.infoLabel, styles.infoLabelSingle])}>
                {getIn18Text('QUNFADANXIAN')}
                <Tooltip
                  arrowPointAtCenter
                  destroyTooltipOnHide
                  placement="bottomLeft"
                  overlayClassName="rencent-tooltip-arrow"
                  title={getIn18Text('\u201CQUNFADANXIAN')}
                  overlayStyle={{ maxWidth: '100%' }}
                >
                  {/* @ts-ignore */}
                  <InfoCircleOutlined />
                </Tooltip>
              </span>
            ) : (
              <span className={classnames(styles.infoLabel, { [styles.executeLabel]: taskShow })}>
                {taskShow ? getIn18Text('SHOUJIAN\uFF08ZHIXING') : getIn18Text('SHOUJIANREN')}
              </span>
            )}
            <span className={styles.colonLabel}>:</span>
            <Selector
              /* multiLine={true} */
              suffixDiv
              // autoFocus
              type="to"
              tabIndex={31}
              items={isOneRcpt ? totalReceivers : normalReceivers}
              ref={sendSelectorRef}
              setKeyword={setKeywordSender}
              keyword={keywordSender}
              onKeyDown={event => {
                if (isMac && event.metaKey && event.key === 'Enter') {
                  debounceSendMail();
                } else if (!isMac && event.ctrlKey && event.key === 'Enter') {
                  debounceSendMail();
                }
              }}
            />
          </div>
          {btnBox}
        </div>
        {/* 抄送 */}
        {!isOneRcpt && Boolean(showCc) && (
          <div className={classnames([styles.wrapperCc, styles.receiverSelector])}>
            <div className={classnames([styles.infoItem], { [styles.infoItemWarning]: hasWrongCc })}>
              <span className={classnames(styles.infoLabel, { [styles.executeLabel]: taskShow })}>
                {taskShow ? getIn18Text('CHAOSONG\uFF08GUANZHU') : getIn18Text('CHAOSONG')}
              </span>
              <span className={styles.colonLabel}>:</span>
              <Selector
                type="cc"
                items={ccReceivers}
                ref={ccSelectorRef}
                tabIndex={32}
                keyword={keywordCC}
                setKeyword={setKeywordCC}
                onKeyDown={event => {
                  if (isMac && event.metaKey && event.key === 'Enter') {
                    debounceSendMail();
                  } else if (!isMac && event.ctrlKey && event.key === 'Enter') {
                    debounceSendMail();
                  }
                }}
              />
              {getPersonCount(ccReceivers, ccSelectorRef)}
              <div className={styles.ccClose}>
                {ccReceivers.length > 1 && <NewPersonalGroup items={ccReceivers} />}
                {/* <NewPersonalGroup items={ccReceivers} /> */}
                <span onClick={closeCC} className={styles.closeIcon}>
                  <IconCard className="dark-invert" type="close" />
                </span>
              </div>
            </div>
            <FollowerCard />
          </div>
        )}
        {/* 密送 */}
        {!isOneRcpt && Boolean(showBcc) && (
          <div className={classnames([styles.infoItem, styles.receiverSelector], { [styles.infoItemWarning]: hasWrongBcc })}>
            <span className={styles.infoLabel}>{getIn18Text('MISONG')}</span>
            <span className={styles.colonLabel}>:</span>
            <Selector type="bcc" items={bccReceivers} ref={bccSelectorRef} tabIndex={33} keyword={keywordBCC} setKeyword={setKeywordBCC} />
            {getPersonCount(bccReceivers, bccSelectorRef)}
            <div className={styles.ccClose}>
              {bccReceivers.length > 1 && <NewPersonalGroup items={bccReceivers} />}
              <span onClick={closeBCC} className={styles.closeIcon}>
                <IconCard className="dark-invert" type="close" />
              </span>
            </div>
          </div>
        )}
        {/* 邮件+写信,展示当前选中客户或者默认第一客户的时区信息,展示在主题上面 */}
        {process.env.BUILD_ISEDM && <TimeZoneWriteMail />}
        {/* 主题 & 任务主题 */}
        <div className={classnames(styles.infoItem, styles.paddingRight16)}>
          <span className={styles.infoLabel}>{taskShow ? getIn18Text('RENWUZHUTI') : getIn18Text('ZHUTI')}</span>
          <span className={styles.colonLabel}>:</span>
          <div className={`ant-allow-dark ${styles.titleDesc}`}>
            <InputContextMenu inputOutRef={refSubject} changeVal={setSubjectTemp}>
              <input
                className={classnames(styles.inputItem, { [styles.titleInput]: !conferenceShow })}
                tabIndex={34}
                maxLength={256}
                value={subjectTemp}
                ref={refSubject}
                onFocus={() => dispatch(doFocusSelector(getIn18Text('ZHUTI')))}
                onChange={onSubjectChange}
                onKeyDown={event => {
                  if (isMac && event.metaKey && event.key === 'Enter') {
                    debounceSendMail();
                  } else if (!isMac && event.ctrlKey && event.key === 'Enter') {
                    debounceSendMail();
                  }
                }}
              />
            </InputContextMenu>
          </div>
          <div className={`ant-allow-dark ${styles.titleDesc}`}>{renderSubjectContent()}</div>
          {/* 主题助手按钮 */}
          {process.env.BUILD_ISEDM && !isMailTemplate ? <HelperBtn innerRef={subjectBtnRef} onClick={() => setSubjectHelperVisible(!subjectHelperVisible)} /> : null}
          {/* AI润色按钮 */}
          {process.env.BUILD_ISEDM && !isMailTemplate ? <AiPolishBtn loading={subjectLoading} onClick={onClickAiPolish} /> : null}
          {/* AI润色按钮旁边的分割线跟随会议展示，切只有ai润色按钮展示才展示
          {!process.env.BUILD_ISEDM || isMailTemplate || isOneRcpt || setEncrypt ? null : <BtnDivider />} */}
          {/* 会议按钮 */}
          {isMailTemplate || isOneRcpt || setEncrypt ? null : <ConferenceBtn />}
          {visibleTaskOrPraise ? (
            process.env.BUILD_ISEDM ? (
              <SubjectOtherBtn />
            ) : (
              <>
                {/* 任务邮件与群发单显互斥 */}
                <TaskMailBtn />
                {/* 插入任务后隐藏群发单显按钮和密送按钮 */}
                {comIsShowByAuth(ProductAuthorityFeature.PRAISE_EMAIL_WRITE_EMAIL_ENTRANCE_SHOW, <PraiseMailBtn />)}
              </>
            )
          ) : null}
        </div>
        {/* 会议 */}
        {isMailTemplate ? null : <Conference {...props} />}
        {/* 表扬信表单 */}
        {isMailTemplate ? null : comIsShowByAuth(ProductAuthorityFeature.PRAISE_EMAIL_WRITE_EMAIL_ENTRANCE_SHOW, <PraiseMail {...props} />)}
        {/* 任务邮件表单 */}
        {isMailTemplate ? null : <TaskMail {...props} />}
        {/* 写信附件 */}
        {!isMailTemplate && (
          <div className={classnames(styles.attachmentsWrapper)} style={!!attachmentsCount ? {} : { display: 'none' }}>
            <div
              className={classnames([styles.infoItem, attachmentFlod && styles.attachmentFlod])}
              onClick={() => {
                dispatch(doFocusSelector(''));
              }}
            >
              <span className={styles.infoLabel}>附件</span>
              <span className={styles.colonLabel}>:</span>
              <div className={styles.attachment} ref={attachmentsRef}>
                <Attachment writeLetterProp={writeLetterProp} />
                {/* 正常一行附件高度是58，这里稍微写大一点到70，预防一下 */}
                {attachmentsHeight > 70 && (
                  <div
                    className={styles.attachmentCount}
                    onClick={() => {
                      setAttachmentFlod(pre => !pre);
                    }}
                  >
                    <span>共{attachmentsCount}个</span>
                    <IconCard type={attachmentFlod ? 'arrowDown' : 'arrowUp'} />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        {/* 拖拽中联系人 wrapper */}
        <div style={{ position: 'absolute', zIndex: -9999, top: -10000 }}>
          <div id="drag-active-tags" style={{ display: 'flex', justifyContent: 'space-evenly', alignItems: 'center' }} />
        </div>
      </div>
      {personalOrgModalVisible && (
        <PersonalOrgModal
          defaultSelectedContact={defaultPersonalOrgSelect}
          modelZIndex={101}
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
      {process.env.BUILD_ISEDM && subjectHelperVisible && (
        <EmailContentAssistantComponent
          isTheme={true}
          emailContentAssistantOpen={subjectHelperVisible}
          setEmailContentAssistantOpen={visible => {
            setSubjectHelperVisible(visible);
          }}
          insertContent={content => {
            if (content) {
              modSubject(content);
              setSubjectTemp(content);
            }
          }}
        />
      )}
      {process.env.BUILD_ISEDM && !subjectHelperTipsClosed ? (
        <LxPopover
          left={subjectHelperPos.left || 0}
          top={(subjectHelperPos.top || 0) + 44}
          visible={visibleSubjectHelper}
          resetStyle={subjectStyle}
          setVisible={() => {
            setVisibleSubjectHelper(false);
          }}
        >
          <SubjectHelper
            onClose={() => {
              // 移动到内容助手的按钮位置去
              const targetPos = subjectBtnRef.current?.getBoundingClientRect();
              if (targetPos) {
                // 计算内容助手 + ai助手的按钮宽度（70）
                const targetWidth = targetPos.width + 70;
                // 计算缩小的比例
                const scaleX = (targetWidth / Number(subjectStyle.width)).toFixed(3);
                const scaleY = (targetPos.height / 76).toFixed(3);
                //  设置属性
                setSubjectStyle({
                  width: subjectStyle.width,
                  left: targetPos.left,
                  top: targetPos.top,
                  transform: `scale(${scaleX}, ${scaleY})`,
                  opacity: 0.3,
                  transformOrigin: 'top left',
                  // transition: 'left 0.5s ease, top 0.5s ease, transform 0.5s ease, opacity 0.5s ease'
                  transition: 'all 0.4s ease',
                });
              }
              // 400ms 后关闭
              setTimeout(() => {
                setVisibleSubjectHelper(false);
                //localstorage 记录数据
                dataStoreApi.putSync(SubjectHelperTips, 'true');
                setSubjectHelperTipsClosed(true);
              }, 400);
            }}
            loading={subjectLoading}
            onClickAiPolish={onClickAiPolish}
            onVisibleSubjectHelper={() => {
              setVisibleSubjectHelper(false);
              setSubjectHelperVisible(true);
            }}
          />
        </LxPopover>
      ) : null}
    </>
  );
};
export default MailInfo;
