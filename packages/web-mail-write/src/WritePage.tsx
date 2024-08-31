import React, { useEffect, useState, useRef, useImperativeHandle, useContext, useMemo } from 'react';
import {
  apiHolder,
  SystemApi,
  DataStoreApi,
  apiHolder as api,
  apis,
  MailEntryModel,
  MailBoxEntryContactInfoModel,
  WriteLetterPropType,
  NetStorageApi,
  NSDirContent,
  isElectron,
  locationHelper,
  EventApi,
  MailApi,
  SensitiveWord,
  EdmSendBoxApi,
  DataTrackerApi,
} from 'api';
import UploadOutlined from '@ant-design/icons/UploadOutlined';
import { message, Modal, Button, Checkbox, Spin } from 'antd';
import { ResizableBox } from 'react-resizable';
import classNames from 'classnames';
import dayjs from 'dayjs';
import DayViewTimeLineGrid from '@web-schedule/components/DayViewTimeLineGrid/DayViewTimeLineGrid';
import styles from './writePage.module.scss';
import WarnIcon from '@web-common/components/UI/Icons/svgs/WarnSvg';
import MailContent from './components/MailContent/MailContent';
import { TemplateEditor } from '@web-setting/Mail/components/CustomTemplate/template_editor';
import UploadAttachment from './components/UploadAttachment';
import Prompt from '@web-mail-write/components/Prompt/prompt';
import WriteContact from './components/WriteContact/writeContact';
import WriteSide from './components/WriteContact/writeSide';
import MailInfo from './components/MailInfo/mailInfo';
import SendMail from './components/SendMail';
import MailFormat from './components/MailFormat/format';
import MailFormatModal from './components/MailFormat/modal';
import MailFormatEdit from './components/MailFormat/edit';
import { AppActions, MailActions, MailTemplateActions, useActions, useAppDispatch, useAppSelector } from '@web-common/state/createStore';
import { preUploadAttachment } from './util';
import { currentMailSize as getCurrentMailSize } from '@web-common/state/getter';
import { AttachmentActions } from '@web-common/state/reducer';
import { uploadAttachmentType } from './components/type';
import { TemplateListModal } from '@web-setting/Mail/components/CustomTemplate/template_list_modal';
import ErrorModal from '@web-mail-write/components/SendMail/ErrorModal';
import useState2SalesPitchReduxMock from '@/components/Layout/EnterpriseSetting/salesPitch/utils/useState2ReduxMock';
// import { TemplateListModalWaimao } from '@web-setting/Mail/components/CustomTemplate/template_list_modal_waimao';
import { NewTamplateModal } from '@web-edm/mailTemplate/NewTamplateModal';
import { ViewMail } from '@web-common/state/state';
import { WriteContext } from '@web-setting/Mail/components/CustomTemplate/template_add_modal';
import useRightSideColumnStatusSelector from './hooks/useRightSideColunmStatusSelector';
import useConferenceSelector from './hooks/useConferenceSelector';
import useReceiverStateSelector from './hooks/useReceiverStateSelector';
import { useGetProductAuth } from '@web-common/hooks/useGetProductAuth';
import { SendValidateCompClone } from '@web-mail-write/components/SendMail/SendValidateComp';
import { SaveDraftClone } from '@web-mail-write/components/SendMail/SaveDraft';
import { SaveAsTemplateCompClone } from '@web-mail-write/components/SendMail/SaveAsTemplateComp';
import CloseButton from '@web-mail-write/components/SendMail/CloseButton';
import Alert from '@web-common/components/UI/Alert/Alert';
import EmojiTip from './components/EmojiTip/emojiTip';
import debounce from 'lodash/debounce';
// import SalesPitchGuideHoc from '@/components/Layout/EnterpriseSetting/salesPitch/components/salesPitchGuide';
import AttUploading from '@web-mail-write/components/AttUploading/attUploading';
import { getIn18Text } from 'api';
import { SensitiveTip } from './components/MailContent/SensitiveTip';
import useCreateCallbackForEvent from '@web-common/hooks/useCreateCallbackForEvent';
import { useNiceModal } from '@web-common/components/UI/NiceModal/NiceModal';
const trackApi = api.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;
const mailApi = api.api.requireLogicalApi(apis.mailApiImpl) as MailApi;
const systemApi = apiHolder.api.getSystemApi() as SystemApi;
const inElectron = systemApi.isElectron();
const DataStore = apiHolder.api.getDataStoreApi() as DataStoreApi;
const StoreName = 'mfDialogTipState';
const FileApi = api.api.getFileApi();
const diskApi = apiHolder.api.requireLogicalApi(apis.netStorageImpl) as NetStorageApi;
const storeApi = apiHolder.api.getDataStoreApi() as DataStoreApi;
const eventApi = apiHolder.api.getEventApi() as EventApi;
const edmApi = apiHolder.api.requireLogicalApi(apis.edmSendBoxApiImpl) as EdmSendBoxApi;

const templateType = 'write';
enum EnumMfDialogState {
  INIT = 'INIT',
  STEP = 'STEP',
  FINE = 'FINE',
}

const checkFilePaths = (filePaths: string[]) => {
  const checkPromises = filePaths.map(filePath => {
    return window.electronLib.fsManage.isDir(filePath);
  });
  return Promise.all(checkPromises)
    .then((resArr: Array<boolean>) => {
      const hasDir = resArr.some(isDir => {
        return isDir;
      });
      return {
        success: true,
        hasDir: hasDir,
        errorMsg: '',
      };
    })
    .catch(err => {
      return {
        success: false,
        hasDir: false,
        errorMsg: (err && err.message) || '未知原因',
      };
    });
};

const filePathToFile = (filePaths: string[]) => {
  const toPromises = filePaths.map(filePath => {
    return window.electronLib.fsManage
      .stat(filePath)
      .then((res: { size: number }) => {
        return {
          success: true,
          data: {
            name: window.electronLib.fsManage.getBaseName(filePath),
            size: res.size,
            electronFullPath: filePath,
          },
        };
      })
      .catch((err: any) => {
        return {
          success: false,
          errorMsg: err && err.message,
        };
      });
  });

  return Promise.all(toPromises).then(files => {
    return files.filter((toRes: { success: boolean }) => {
      return toRes.success;
    });
  });
};

let hasHandleSendAttachments = false;

interface Props {
  execAutoSaveDraft?: boolean;
  innerCloseTab?: (id: string) => void;
  style?: Object;
  curMode?: string;
  setCurMode?: (val: string) => void;
  cond?: string;
}
const WriteContentO = React.forwardRef((props: Props, ref) => {
  // const SalesPitchGuide = useMemo(() => SalesPitchGuideHoc('2'), []);
  const { execAutoSaveDraft = false, innerCloseTab, style = {}, curMode = 'normal', setCurMode, cond } = props;
  // const SalesPitchGuide = useMemo(() => SalesPitchGuideHoc('2'), []);
  const { isMailTemplate } = useContext(WriteContext);
  const [showWriteContact, showUserFreeBusy] = useRightSideColumnStatusSelector();
  const conferenceState = useConferenceSelector();
  const users = useReceiverStateSelector();
  const paidGuideModal = useNiceModal('paidGuide');
  const currentMail = useAppSelector(state => (isMailTemplate ? state.mailTemplateReducer.mailTemplateContent : state.mailReducer.currentMail));
  const currentMailRef = useRef<ViewMail>(currentMail);
  currentMailRef.current = currentMail;
  const watchIdRef = useRef<string | undefined>(null);
  const initSenderStr = useMemo(() => currentMailRef.current.initSenderStr, [currentMailRef.current]);

  // 是否开启已读提醒
  const senderReceivers = useAppSelector(state => state.mailReducer.currentMail.senderReceivers);
  const scheduleDate = useAppSelector(state => state.mailReducer.currentMail.scheduleDate);
  const mailEditStatus = useAppSelector(state => state.mailReducer.currentMail.mailEditStatus);
  const waittingMailIds = useAppSelector(state => state.mailReducer.waittingMailIds);
  const tooltipVisible = useAppSelector(state => state.mailReducer.tooltipVisible);
  const appActions = useActions(AppActions);
  const mailActions = useActions(MailActions);
  const [dialogTipState, setDialogTipState] = useState(EnumMfDialogState.FINE);
  const [mfModalState, setMfModalState] = useState(false);
  const [editState, setEditState] = useState(false);
  const [groupId, setGroupId] = useState('');
  const [mfId, setMfId] = useState('');
  const [sendLoading, setSendLoading] = useState(false);
  const [visibleConf, setVisibleConf] = useState<boolean>(false);
  // 选择上传的附件的类型 （取名不好...）
  const [clickUploadAttach, setClickAttachment] = useState<uploadAttachmentType>({
    clickUploadAttach: false,
    usingCloud: false,
  });
  const [clickMailFormat, setClickMailFormat] = useState(false);
  const [mailContentEdit, setMailContentEdit] = useState<any>(null);
  const [scheduledSent, setScheduledSent] = useState<boolean>(!!scheduleDate); // 是否为定时发信
  const [readRemind, setReadRemind] = useState<boolean>(!!senderReceivers); // 是否开启已读提醒
  const [saveTime, setSaveTime] = useState(''); // 草稿保存时间
  const mailContentRef = useRef<any>(null);
  const sendMailRef = useRef<any>(null);
  const refDrag = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [dragenterCount, setDragenterCount] = useState(0);
  const { doAddAttachment } = useActions(AttachmentActions);
  const currentMailId = useAppSelector(state => (isMailTemplate ? state.mailTemplateReducer.mailTemplateContent?.cid : state.mailReducer.currentMail?.cid));
  const attachments = useAppSelector(state => state.attachmentReducer.attachments);
  const currentMailSize = getCurrentMailSize(currentMail as MailEntryModel, attachments);
  const { doModifyReceiver, doModifySubject } = useActions(MailActions);

  // 写信敏感词检测，外贸通下支持
  const [sensitiveWords, setSensitiveWords] = useState<SensitiveWord[]>([]); // 服务端的敏感词
  const [sensitiveWordsDetected, setSensitiveWordsDetected] = useState<SensitiveWord[]>([]);
  // 是否需要进行敏感词检测，直接去是否外贸通环境即可
  const [sensitiveChecking, setSensitiveChecking] = useState(true);
  const [enableSensitiveMarks, setEnableSensitiveMarks] = useState(false);
  useEffect(() => {
    // 从服务端获取一次敏感词
    if (process.env.BUILD_ISEDM) {
      edmApi.getSensitiveWords().then(data => {
        setSensitiveWords(data.sensitive_words);
      });
    }
  }, []);
  // 正文富文本编辑器，工具栏高度，处理下窗口下三行工具栏遮挡正文的问题,默认两行工具栏，80
  const [toolbarHeight, setToolbarHeight] = useState(80);
  // 模板插入邮件二次提醒弹窗可见性
  const [mailTemplateRemindVisible, setMailTemplateRemindVisible] = useState(false);
  // 模板插入邮件二次提醒弹窗不再提醒
  const [insertRemindChecked, setInsertRemindChecked] = useState(false);
  // 正文内容有任何改动，都会触发
  const [isContentChanged, setIsContentChanged] = useState(false);
  // 展示模板列表
  const { changeShowTemplateList } = useActions(MailTemplateActions);
  // 邮件模板
  const mailTemplate = useRef<null | ViewMail>(null);
  // 附件
  const attachmentRef = useRef<HTMLDivElement>();
  const currentReceivers = useAppSelector(state => (state.mailReducer.currentMail as MailEntryModel)?.receiver);
  const currentSubject = useAppSelector(state => (state.mailReducer.currentMail as MailEntryModel)?.entry?.title);
  // 右侧通讯录/会议忙闲列是否正在resize
  const [rightSideColumnResizing, setRightSideColumnResizing] = useState<boolean>(false);
  const [rightSideWidth, setRightSideWidth] = useState<number>(200);
  const curModeRef = useRef<string>(curMode);
  curModeRef.current = curMode;
  // 获取当前版本信息
  const {
    productVersionInfo: { productVersionId },
  } = useGetProductAuth();
  // 安全提示
  const [reminderVisible, setReminderVisible] = useState<boolean>(false);
  // 当前空间信息
  const [cloudAttInfo, setCloudAttInfo] = useState<NSDirContent>();
  // 是否展示编辑器添加表情引导
  const [capturescreenTipVisible, setCapturescreenTipVisible] = useState<boolean>(false);
  // 点击使用的话术
  const [writePageSalesPitch, setWritePageSalesPitch] = useState2SalesPitchReduxMock('writePageSalesPitch');
  const dispatch = useAppDispatch();
  // 如果点击的话术库变化，则插入新的话术库
  useEffect(() => {
    if (writePageSalesPitch && writePageSalesPitch.discourseContent) {
      // 插入话术内容
      insertTemplateToEditor(writePageSalesPitch.discourseContent || '');
      // 1秒后清除
      setTimeout(() => {
        setWritePageSalesPitch(null);
      }, 1000);
    }
  }, [writePageSalesPitch?.discourseContent]);

  const spinText = useMemo(() => {
    const mailEditStatus = currentMail.mailEditStatus;
    if (mailEditStatus === 'reGenerating') return '因在写信时切换发信账号，邮件内容重新上传中，请稍候';
    if (mailEditStatus === 'reUploading') return '附件重传中，请稍等';
    return '';
  }, [currentMail]);

  // 附件正在上传中 是否展示
  const attUploadingShow = useMemo(() => {
    if (currentMailId && waittingMailIds?.includes(currentMailId)) return true;
    return false;
  }, [waittingMailIds, currentMailId]);

  const setTooltipVisible = (vis: boolean) => {
    dispatch(mailActions.doSetTooltipVisible(vis));
  };

  // 信件参数发生改变，中断自动发信
  useEffect(() => {
    // console.log('信件参数发生改变，中断自动发信', currentMail);
    if (watchIdRef.current !== currentMail?.cid) return;
    if (currentMail?.cid && waittingMailIds.includes(currentMail?.cid)) {
      dispatch(mailActions.doRemWaittingMailId(currentMail?.cid));
      message.error({ content: getIn18Text('ZIDONGFASONGZHONGD，QBJWCHCXFS') });
    }
  }, [
    currentMail?.cid,

    currentMail?.status?.cc,
    currentMail?.status?.bcc,
    currentMail?.status?.conferenceSetting,
    currentMail?.status?.conferenceShow,
    currentMail?.status?.praiseMailShow,
    currentMail?.status?.praiseMailSetting,
    currentMail?.status?.taskMailShow,
    currentMail?.status?.puretext,
    currentMail?.status?.taskMailSetting,

    currentMail?.conference, // 会议对象
    currentMail?.praiseMail, // 表扬信对象
    currentMail?.taskMail, // 任务邮件对象
    currentMail?.optSender?.id, // 发信账号
    currentMail?.initSenderStr, // 写信创建账号
    currentMail?.subAccountExpired, // 子账号过期
    currentMail?.sender, // 发信人
    currentMail?.senders,
    currentMail?.receiver, // 收信人
    currentMail?.isOneRcpt, // 是否群发单显
    currentMail?.mailTrace, // 邮件追踪
    currentMail?.senderReceivers, // 已读提醒
    currentMail?.requestReadReceipt, // 已读回执
    currentMail?.scheduleDateTimeZone, // 时区
    currentMail?.scheduleDate, // 定时发信
    currentMail?.isEncryptedMail, // 加密邮件
    currentMail?.savePassword, // 在【发件箱中】保存密码

    currentMail?.entry?.title, // 邮件主题
    currentMail?.entry?.content, // 正文
    currentMail?.entry?.priority, // 邮件权限等级 紧急邮件
    currentMail?.entry?.encpwd, // 加密邮件密码
  ]);

  const debounSetWatchId = debounce((cid: string | undefined) => {
    watchIdRef.current = cid;
  }, 500);

  useEffect(() => {
    debounSetWatchId(currentMail?.cid);
  }, [currentMail?.cid]);

  const addUploadAttachments = (files: File[]) => {
    const fileListAry = preUploadAttachment({ fileList: files, currentMailId, currentMailSize, cloudAttInfo });
    if (!fileListAry) return;
    doAddAttachment(fileListAry);
    attachmentRef?.current?.scrollIntoView();
    if (currentMail && currentMail.entry && currentMail.entry.title === '') {
      const firOne = fileListAry[0];
      const { fileName } = firOne;
      const name = fileName.split('.');
      name.length > 1 && name.pop();
      doModifySubject(name.join());
    }
  };

  const handleSendFiles = (filePaths: Array<string>) => {
    checkFilePaths(filePaths).then(res => {
      if (res && res.success) {
        if (res.hasDir) {
          Alert.info({
            title: '文件检查错误',
            content: '存在文件夹，请将文件夹压缩后重新添加',
          });
          return;
        } else {
          filePathToFile(filePaths).then((sendFiles: Array<{ success: boolean; data: { name: string; size: number } }>) => {
            const files = sendFiles.filter(item => item.success).map(item => item.data);
            if (currentMailId) {
              addUploadAttachments(files as File[]);
            } else {
              setTimeout(() => {
                addUploadAttachments(files as File[]);
              }, 1000);
            }
          });
        }
      } else {
        Alert.error({
          title: '获取文件信息失败',
          content: res.errorMsg,
        });
      }
    });
  };

  useEffect(() => {
    if (!process.env.BUILD_ISELECTRON) return;
    const isSendAttachmentPage = mailApi.getIsSendAttachmentWritePage();
    if (currentMailId && isSendAttachmentPage) {
      if (hasHandleSendAttachments) {
        return;
      }
      hasHandleSendAttachments = true;
      const storeKey = new URLSearchParams(location.search).get('store-key');
      if (storeKey) {
        mailApi.getStoreFilesByKey(storeKey).then(sendFilePaths => {
          if (sendFilePaths && sendFilePaths.length) {
            handleSendFiles(sendFilePaths);
          }
        });
      }
    }
  }, [currentMailId, handleSendFiles]);

  useEffect(() => {
    setRightSideWidth(showWriteContact ? 200 : 360);
  }, [showWriteContact]);
  useEffect(() => {
    if (dialogTipState === EnumMfDialogState.FINE) {
      DataStore.get(StoreName).then(async res => {
        let state = res.data as EnumMfDialogState;
        if (!res.suc) {
          DataStore.put(StoreName, EnumMfDialogState.INIT);
          state = EnumMfDialogState.INIT;
        }
        setDialogTipState(state);
      });
    }
    return () => {
      // 写信中
      if (!isMailTemplate) {
        // 桌面端 关闭写信窗口 清空邮件和附件（老逻辑改造）
        if (isElectron() && locationHelper.testPathMatch('/writeMail')) {
          appActions.doClearAllMails();
          appActions.doFilterDownloadAttachment();
        }
      }
    };
  }, []);
  useEffect(() => {
    // 获取当前空间信息
    diskApi.doGetNSFolderInfo({ type: 'cloudAtt' }).then(res => {
      setCloudAttInfo(res);
    });
  }, []);
  const restRightSideState = () => {
    if (!showWriteContact) {
      mailActions.doShowWriteContact(true);
    } else {
      setRightSideWidth(200);
    }
  };
  useImperativeHandle(ref, () => ({
    // 强制保存
    forceSave: () => {
      return mailContentRef?.current?.forceSave();
    },
    resetSideState: () => {
      restRightSideState();
    },
  }));
  const forceSave = () => mailContentRef?.current?.forceSave();
  // 插入模板内容到编辑器
  const insertTemplateToEditor = (content: string) => mailContentRef?.current?.insertTemplateToEditor(content);
  const handleNext = function () {
    if (dialogTipState === EnumMfDialogState.INIT) {
      DataStore.put(StoreName, EnumMfDialogState.STEP);
      setDialogTipState(EnumMfDialogState.STEP);
      return;
    }
    if (dialogTipState === EnumMfDialogState.STEP) {
      DataStore.put(StoreName, EnumMfDialogState.FINE);
      setDialogTipState(EnumMfDialogState.FINE);
    }
  };
  const showMfDialog = function () {
    setMfModalState(true);
  };
  const showMfEdit = function (groupId, mfId) {
    setGroupId(groupId);
    setMfId(mfId);
    setMfModalState(false);
    setEditState(true);
  };
  // 根据图片的大小结合返回适合编辑器展示的宽高
  const getAutoSize: (width: number, height: number) => [width: number, height: number] = function (width, height) {
    if (width && height) {
      const max = inElectron ? 900 : 700;
      let autowidth = width;
      let autoHeight = height;
      const proportion = width / height;
      if (width > max) {
        autowidth = max;
        autoHeight = autowidth / proportion;
      }
      return [autowidth, autoHeight];
    }
    return [width, height];
  };
  const handleEditComplete = async files => {
    setSendLoading(true);
    // const content = currentMail?.entry?.content?.content || '';
    for (let i = files.length - 1; i >= 0; i--) {
      const file = files[i];
      const { width, height } = file;
      const { type, size } = file.blob;
      const [autoWidth, autoHeight] = getAutoSize(width, height);
      const { data } = await FileApi.uploadFile({
        fileName: new Date().getTime() + type.includes('jpeg') ? '.jpg' : '.png',
        file: file.blob,
        fileSourceType: type,
        fileSize: size,
      });
      if (data && data.data && data.data.url) {
        const src = data.data.url;
        mailContentEdit.insertContent(`<p></p><img src="${src}" alt="" width="${autoWidth}" height="${autoHeight}" /></p></p>`);
      }
    }
    // 看起来和 mailContentEdit.insertContent 重复了。
    // appActions.doChangeMailContent(content);
    setTimeout(() => {
      setSendLoading(false);
    }, 1500);
  };
  const handleBack = () => {
    setSendLoading(false);
    setEditState(false);
    setMfModalState(true);
  };
  const uploadAttachmentAction = (uploadAttachment: uploadAttachmentType) => {
    setClickAttachment(uploadAttachment);
  };
  const mailFormatAction = () => {
    setClickMailFormat(true);
  };
  const handleMailEditCreated = ed => {
    setMailContentEdit(ed);
  };
  const uploadAttachmentRef = useRef<{
    upload(fileList: File[]): any;
  }>(null);
  useEffect(() => {
    if (refDrag.current) {
      const node = refDrag.current as unknown as HTMLElement;
      node.addEventListener('dragover', handleDragOver);
      node.addEventListener('dragenter', handleDragEnter);
      node.addEventListener('dragleave', handleDragLeave);
      return () => {
        node.removeEventListener('dragover', handleDragOver);
        node.removeEventListener('dragenter', handleDragEnter);
        node.removeEventListener('dragleave', handleDragLeave);
      };
    }
    return undefined;
  }, [refDrag.current]);
  const handleDragOver = e => {
    e.preventDefault();
    e.stopPropagation();
  };
  const handleDragEnter = e => {
    if ([...e.dataTransfer.items].every(i => i.kind !== 'file')) return;
    setDragenterCount(pre => pre + 1);
    setDragging(true);
    e.preventDefault();
    e.stopPropagation();
  };
  const handleDragLeave = e => {
    if ([...e.dataTransfer.items].every(i => i.kind !== 'file')) return;
    setDragenterCount(pre => {
      if (pre === 1) setDragging(false);
      return pre - 1;
    });
    e.preventDefault();
    e.stopPropagation();
  };
  const handleDragEnd = e => {
    if ([...e.dataTransfer.items].every(i => i.kind !== 'file')) return;
    setDragging(false);
    setDragenterCount(0);
    e.preventDefault();
    e.stopPropagation();
  };
  const handleDrop = async e => {
    if ([...e.dataTransfer.items].every(i => i.kind !== 'file')) return;
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
    setDragenterCount(0);
    const df = e.dataTransfer;
    let dropFiles = e.dataTransfer.files; // 存放拖拽的文件对象
    trackApi.track('pcMail_dragFile_writeMailPage');
    if (df.items !== undefined) {
      dropFiles = [];
      // Chrome有items属性，对Chrome的单独处理
      for (let i = 0; i < df.items.length; i++) {
        const item = df.items[i];
        // 用webkitGetAsEntry禁止上传文件夹
        if (item.kind === 'file' && item.webkitGetAsEntry()?.isFile) {
          const file = item.getAsFile();
          dropFiles.push(file);
        }
      }
      if (dropFiles.length !== e.dataTransfer.files.length) {
        message.error(getIn18Text('FUJIANBUZHICHI'));
      }
    }
    if (!dropFiles.length) return;
    addUploadAttachments(dropFiles);
  };
  /**
   * @deprecated
   * @author 郭超
   * @name 本期暂不支持
   */
  const dropUpload = (error: Error | null, fileList: File[]) => {
    // 不处理错误场景,uploadAttachmentRef都处理了
    // uploadAttachmentRef.current!.upload(fileList)
  };
  // 从模板中插入收件人、抄送、密送
  const insertMailInfoFromTemplate = (templateData: ViewMail) => {
    const receivers = templateData.receiver;
    if (receivers.length > 0) {
      const receiverTypes = receivers.reduce(
        (total, current) => {
          const key = current.mailMemberType;
          if (!total[key]) {
            total[key] = [];
          }
          return total;
        },
        {} as {
          [keys: string]: MailBoxEntryContactInfoModel[];
        }
      );
      receivers.forEach(item => {
        const key = item.mailMemberType;
        receiverTypes[key].push(item);
      });
      Object.keys(receiverTypes).forEach((key: keyof typeof receiverTypes) => {
        const currentReceiver = currentReceivers.filter(v => v.mailMemberType === key);
        const currentReceiverVal = currentReceiver.map(v => v.contactItem.contactItemVal);
        const receiver = receiverTypes[key].filter(v => !currentReceiverVal.includes(v.contactItem.contactItemVal));
        doModifyReceiver({ receiverType: key as string, receiver: [...currentReceiver, ...receiver] });
      });
    }
  };
  // 从模板中插入收件人、抄送、密送
  const insertSubjectFromTemplate = (templateData: ViewMail) => {
    if (!currentSubject) {
      doModifySubject(templateData.entry.title);
    }
  };
  // 插入模板到邮件
  const insertTemplate = () => {
    setMailTemplateRemindVisible(false);
    changeShowTemplateList({ isShow: false });
    const templateData = mailTemplate.current;
    if (templateData) {
      insertMailInfoFromTemplate(templateData);
      insertSubjectFromTemplate(templateData);
      insertTemplateToEditor(templateData.entry.content.content);
    }
  };
  // 更改邮件二次提醒弹窗是否下次提醒
  const changeMailTempRemind = async e => {
    setInsertRemindChecked(e.target.checked);
    const val = e.target.checked ? '1' : '0';
    await DataStore.put('mailTemplateRemind', val);
  };
  // 邮件模板二次提醒弹窗点了取消
  const onRemindCancel = async () => {
    setMailTemplateRemindVisible(false);
    changeShowTemplateList({ isShow: true, templateType });
    await changeMailTempRemind({ target: { checked: false } });
  };
  // 点击邮件模板之后
  const getTemplateResult = (data: ViewMail) => {
    mailTemplate.current = data;
    DataStore.get('mailTemplateRemind').then(v => {
      if (v.data === '1' || !isContentChanged) {
        insertTemplate();
      } else {
        setMailTemplateRemindVisible(true);
        changeShowTemplateList({ isShow: false });
      }
    });
  };
  const clickMailContent = e => {
    const { target } = e;
    if (target && mailContentEdit && target.isEqualNode(refDrag.current)) {
      mailContentEdit.focus();
    }
  };
  const updateSaveTime = () => {
    setSaveTime(dayjs().format('HH:mm'));
  };
  // web编辑器最大化/常态化
  const webScale = () => {
    setCurMode && setCurMode(curModeRef.current === 'max' ? 'normal' : 'max');
  };
  const debounceSetReminderVisible = debounce(async () => {
    // 提醒状态
    const riskReminderStatus = await storeApi.get('riskReminderStatus');
    const { data, suc } = riskReminderStatus;
    if (suc) {
      // 0 为展示 1为不展示
      setReminderVisible(!!(data !== '1'));
    } else {
      setReminderVisible(true);
    }
  }, 300);
  useEffect(() => {
    setCurMode && setCurMode('normal');
    debounceSetReminderVisible();

    // 截图功能引导是否需要显示
    const { data, suc } = storeApi.getSync('lx_write_capturescreen1', { noneUserRelated: true });
    if (!suc || data !== 'true') {
      setCapturescreenTipVisible(true);
    } else {
      setCapturescreenTipVisible(false);
    }
  }, [currentMailId]);

  const subAccountLoginExpired = e => {
    const { eventData } = e;
    // 01 02.. 转义后的email
    const { subAccount } = eventData;
    if (subAccount) {
      mailActions.doModifySubAccountExpired({ email: subAccount, expired: true });
    }
  };

  const freeUpgradeVersion = useCreateCallbackForEvent(e => {
    const { eventName, eventData } = e;
    if (eventName === 'upgradeVersion' && eventData?.cid === currentMailId) {
      paidGuideModal.show({ errType: '41', origin: '写信' });
    }
  });

  useEffect(() => {
    const eid = eventApi.registerSysEventObserver('upgradeVersion', { func: e => freeUpgradeVersion(e) });
    return () => {
      eventApi.unregisterSysEventObserver('upgradeVersion', eid);
    };
  }, []);

  useEffect(() => {
    const eid = eventApi.registerSysEventObserver('SubAccountLoginExpired', { func: e => subAccountLoginExpired(e) });
    return () => {
      eventApi.unregisterSysEventObserver('SubAccountLoginExpired', eid);
    };
  }, []);

  const BelowOperateContent = (
    <>
      {/* 编辑器上方 收件人 抄送 主题... */}
      <div hidden={curMode === 'max'} style={{ flex: '0 0 auto' }}>
        <MailInfo visible={visibleConf} setVisible={setVisibleConf} />
      </div>
      {/* 隐藏 */}
      {isMailTemplate ? null : (
        <div className={styles.operWrapper}>
          <div className={styles.operItem}>
            {/* 上传附件辅助隐藏文件按钮 */}
            {/* <UploadAttachment ref={uploadAttachmentRef} clickUploadAttach={clickUploadAttach} setClickAttachment={setClickAttachment}/> */}
          </div>
          <div className={styles.operItem}>
            <MailFormat
              clickMailFormat={clickMailFormat}
              setClickMailFormat={setClickMailFormat}
              showMfDialog={showMfDialog}
              dialogTipState={dialogTipState}
              handleNext={handleNext}
            />
          </div>
        </div>
      )}
      {/* 编辑器主体 */}
      <div className={styles.writeMailEditorHeader + ' extheme'}>
        <div className={styles.contentWrapper} id="writeMailEditorScroll" style={{ marginTop: toolbarHeight, height: `calc(100% - ${toolbarHeight}px)` }}>
          {isMailTemplate ? (
            <TemplateEditor />
          ) : (
            <>
              {/* @ts-ignore */}
              <MailContent
                sensitiveChecking={process.env.BUILD_ISEDM && sensitiveChecking}
                enableSensitiveMarks={process.env.BUILD_ISEDM && enableSensitiveMarks}
                sensitiveWords={sensitiveWords}
                sensitiveWordsDetected={sensitiveWordsDetected}
                onSensitiveDetectedChange={setSensitiveWordsDetected}
                ref={mailContentRef}
                onEditCreated={handleMailEditCreated}
                mailFormatAction={mailFormatAction}
                uploadAttachmentAction={uploadAttachmentAction}
                onEditChange={() => setIsContentChanged(true)}
                webScale={webScale}
                onToolbarHeightChange={setToolbarHeight}
              />
              {capturescreenTipVisible && inElectron && <EmojiTip setCapturescreenTipVisible={setCapturescreenTipVisible} />}
            </>
          )}
        </div>
        {/* 敏感词提示 */}
        {process.env.BUILD_ISEDM && !isMailTemplate && (
          <SensitiveTip
            toolbarHeight={toolbarHeight}
            insertContent={data => {
              if (data && data.trim()) {
                insertTemplateToEditor(data);
              }
            }}
            setSensitiveChecking={setSensitiveChecking}
            setEnableSensitiveMarks={setEnableSensitiveMarks}
            sensitiveWordsDetected={sensitiveWordsDetected}
          />
        )}
      </div>

      {/* 底部按钮组 */}
      {isMailTemplate ? null : (
        <SendMail
          ref={sendMailRef}
          execAutoSaveDraft={execAutoSaveDraft}
          sendLoading={sendLoading}
          setVisibleConf={setVisibleConf}
          editorInstance={mailContentEdit}
          forceSave={forceSave}
          isContentChanged={isContentChanged}
          tooltipVisible={tooltipVisible}
          setTooltipVisible={setTooltipVisible}
          readRemind={readRemind}
          setReadRemind={setReadRemind}
          saveTime={saveTime}
          setSaveTime={setSaveTime}
          updateSaveTime={updateSaveTime}
          innerCloseTab={innerCloseTab}
          scheduledSent={scheduledSent}
          setScheduledSent={setScheduledSent}
        />
      )}
    </>
  );

  const writeSideContent = (
    <>
      {showWriteContact && <WriteSide />}
      {showUserFreeBusy && conferenceState && (
        <DayViewTimeLineGrid
          // eslint-disable-next-line react/jsx-props-no-spreading
          {...conferenceState}
          onClose={() => {
            mailActions.doShowUserBusyFree(false);
          }}
          users={users}
          sizeOptions={{
            GRID_CONTAINER_MARGIN_RIGHT: 0,
          }}
        />
      )}
    </>
  );
  return (
    <div style={style} className={`${styles.mailWrapper} ${styles.writeContent} ${curMode === 'max' ? styles.max : ''} writePage-module-container`}>
      <div
        className={classNames(styles.mailBody, {
          // mail body 里的编辑器是iframe 拖动侧边栏鼠标指针移入iframe会丢失鼠标位置引起resize工作异常
          // 因此在拖动的时候增加一个全覆盖的伪元素，使得事件能被正常捕获
          [styles.mailBodyInResize]: rightSideColumnResizing,
        })}
      >
        {/* 附件上传中 */}
        {attUploadingShow && <AttUploading />}
        {/* 模板列表 */}
        {process.env.BUILD_ISEDM ? <NewTamplateModal emitResult={getTemplateResult} templateType={templateType} /> : <TemplateListModal emitResult={getTemplateResult} />}

        {/* 插入模板二次提醒弹窗 */}
        <Modal width={400} visible={mailTemplateRemindVisible} maskClosable={false} onCancel={onRemindCancel} footer={null} closable={false}>
          <div className={styles.mailRemindContent}>
            <div className={styles.mailRemindLeft}>
              <WarnIcon />
            </div>
            <div className={styles.mailRemindRight}>
              <p className={styles.mailRemindText}>{getIn18Text('JIANCEDAOXIEXIN')}</p>
              <div className={styles.mailRemindFooter}>
                <Checkbox onChange={changeMailTempRemind} checked={insertRemindChecked}>
                  {getIn18Text('BUZAITIXING')}
                </Checkbox>
                <div className={styles.mailRemindBtns}>
                  <Button style={{ marginRight: '16px' }} onClick={onRemindCancel}>
                    {getIn18Text('QUXIAO')}
                  </Button>
                  <Button type="primary" onClick={insertTemplate}>
                    {getIn18Text('QUEDINGCHARU')}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Modal>

        <div className={styles.mailContent} onDrop={handleDragEnd} onClick={clickMailContent} ref={refDrag}>
          {/* 尊享版 开启了安全提示 */}
          {
            // 安全提示
            !isMailTemplate && productVersionId === 'sirius' && reminderVisible && <Prompt />
          }

          {/* 只有在web端菜展示顶部的操作区 */}
          {!inElectron && !isMailTemplate && (
            <div className={`ant-allow-dark ${styles.topOperate}`}>
              <div style={{ marginRight: '8px' }}>
                <SendValidateCompClone sendLoading={sendLoading} tooltipVisible={tooltipVisible} scheduledSent={scheduledSent} readRemind={readRemind} />
              </div>

              {/* 存草稿 */}
              <SaveDraftClone tooltipVisible={tooltipVisible} sendLoading={sendLoading} />

              {/* 保存为模板 */}
              <SaveAsTemplateCompClone isContentChanged={!!isContentChanged} />

              {/* 关闭 */}
              {currentMailId && innerCloseTab && !inElectron && <CloseButton id={currentMailId} innerCloseTab={innerCloseTab} />}
            </div>
          )}
          {inElectron ? BelowOperateContent : <div className={styles.belowOperate}>{BelowOperateContent}</div>}
          {/* 拖拽文件区域 */}
          {isMailTemplate ? null : (
            <div
              className={`ant-allow-dark ${styles.attachmentDrop}`}
              onClick={() => {
                setDragging(false);
                setDragenterCount(0);
              }}
              onDrop={handleDrop}
              hidden={!dragging}
            >
              <p className={styles.dropUploadTips}>
                <UploadOutlined />
                <span className="text">{getIn18Text('TIANJIAWEIFUJIAN')}</span>
              </p>
            </div>
          )}
        </div>
      </div>
      {/* 左右分割线 */}
      <div className={styles.dividerLine} />

      {/* 联系人区 */}
      {process.env.BUILD_ISEDM && !isMailTemplate ? (
        <>
          <div
            className={classNames(styles.contactWrapper, {
              [styles.contactWrapperHidden]: !(showWriteContact || showUserFreeBusy) || curMode === 'max',
              [styles.contactWrapperFreebusy]: !showWriteContact && showUserFreeBusy,
            })}
            style={{ width: 340 }}
          >
            {writeSideContent}
          </div>
        </>
      ) : (
        <ResizableBox
          className={classNames(styles.contactWrapper, {
            [styles.contactWrapperHidden]: !(showWriteContact || showUserFreeBusy) || curMode === 'max',
            [styles.contactWrapperFreebusy]: !showWriteContact && showUserFreeBusy,
          })}
          width={rightSideWidth}
          axis="x"
          resizeHandles={['w']}
          height={Infinity}
          maxConstraints={[500, Infinity]}
          minConstraints={[showWriteContact ? 200 : 360, Infinity]}
          onResize={(_, data) => {
            setRightSideWidth(data.size.width);
          }}
          onResizeStart={() => setRightSideColumnResizing(true)}
          onResizeStop={() => setRightSideColumnResizing(false)}
        >
          {writeSideContent}
        </ResizableBox>
      )}

      {/* 图片模板 添加邮件模板 */}
      <MailFormatModal
        visible={mfModalState}
        showMfEdit={(groupId, mfId) => {
          showMfEdit(groupId, mfId);
        }}
        onCancel={() => setMfModalState(false)}
      />
      {editState ? (
        <MailFormatEdit
          visible={editState}
          onCompleted={handleEditComplete}
          onCancel={() => {
            setEditState(false);
            setSendLoading(false);
          }}
          groupId={groupId}
          onBack={handleBack}
          mfId={mfId}
        />
      ) : (
        ''
      )}
      {/* <SalesPitchGuide /> */}
      {mailEditStatus && ['reGenerating', 'reUploading'].includes(mailEditStatus) && (
        <div className={styles.spinningWrap}>
          <Spin spinning={true} tip={spinText} />
        </div>
      )}
      {/* 邮箱场景下错误弹窗外置 */}
      {cond !== 'mailBox' && tooltipVisible && <ErrorModal cond={cond} />}
    </div>
  );
});
export default WriteContentO;
