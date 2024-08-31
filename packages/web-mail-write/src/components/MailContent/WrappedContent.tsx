import React, { useEffect, useImperativeHandle, useRef, useState, useCallback, useMemo } from 'react';
import { message } from 'antd';
import debounce from 'lodash/debounce';
import classnames from 'classnames';
import juice from 'juice';
import './MailContent.scss';
import { Editor as EditorType } from '@web-common/tinymce';
import {
  apiHolder as api,
  apis,
  ContactModel,
  DataStoreApi,
  DataTrackerApi,
  MailApi,
  AccountApi,
  EntityContactItem,
  EntityContact,
  MailAliasAccountModel,
  MailSignatureApi,
  PerformanceApi,
  ProductAuthorityFeature,
  ContactAndOrgApi,
  MailConfApi,
  SensitiveWord,
} from 'api';
import {
  ContactActions,
  DiskAttActions,
  MailActions,
  MailConfigActions,
  MailTemplateActions,
  useActions,
  useAppDispatch,
  useAppSelector,
} from '@web-common/state/createStore';
import { uploadAttachmentType } from '../type';
import SelectSign from '@web-setting/Mail/components/CustomSignForm/select_sign_modal/index';
import SignEdit from '@web-setting/Mail/components/CustomSignForm/sign_edit_modal/index';
import { createNiceModal } from '@web-common/components/UI/NiceModal/NiceModal';
import { getSignTemplatesAsync } from '@web-common/state/reducer/mailConfigReducer';
import { MailAt } from '../MailAt';
import { DiskAttachmentModal } from '@web-mail/components/DiskAttachmentModal';
import LxPopover from '@web-common/components/UI/LxPopover/LxPopover';
import ContactDetail from '@web-contact/component/Detail/detail';
import { useEventObserver } from '@web-common/hooks/useEventObserver';
import useMsgRenderCallback from '@web-common/hooks/useMsgRenderCallback';
import { scaleEditor, filterSVGScript } from './tools';
import { MAIL_EDITOR_CONTAINER_CLASS, MAIL_EDITOR_CONTAINER_EDM_CLASS } from './editor-config';
import { useNiceModal } from '@web-common/components/UI/NiceModal/NiceModal';
import { transContactModel2MailContactModel } from '@web-common/utils/contact_util';
import LxEditor from '@web-common/components/UI/LxEditor/LxEditor';
import { ProductSettingModal } from '@web-edm/components/productSettingModal/productSettingModal';
import { getProductsHtml } from '@web-edm/components/editor/template';
import SalesPitchWritePageDrawer from '@web-mail-write/components/MailContent/SalesPitchWritePageDrawer/index';
import useState2SalesPitchReduxMock from '@/components/Layout/EnterpriseSetting/salesPitch/utils/useState2ReduxMock';
import { SALES_PITCH_GUIDE_ID } from '@/components/Layout/EnterpriseSetting/salesPitch/components/salesPitchGuide';
import useDebounceForEvent from '@web-mail/hooks/useDebounceForEvent';
import { systemIsMac } from '@web-mail/util';

import { getIfHaveAuth } from '@web-common/utils/utils';
import { getIn18Text } from 'api';
const SignEditModal = createNiceModal('signEditOnWrite', SignEdit);
const SelectSignModal = createNiceModal('selectSignOnWrite', SelectSign);
const storeApi: DataStoreApi = api.api.getDataStoreApi();
const systemApi = api.api.getSystemApi();
const isElectron = systemApi.isElectron();
const inEdm = systemApi.inEdm();
const trackApi = api.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;
const accountApi = api.api.requireLogicalApi(apis.accountApiImpl) as AccountApi;
const performanceApi = api.api.requireLogicalApi(apis.performanceImpl) as PerformanceApi;
const contactApi = api.api.requireLogicalApi(apis.contactApiImpl) as ContactAndOrgApi;
const mailConfApi = api.api.requireLogicalApi(apis.mailConfApiImpl) as MailConfApi;
const eventApi = api.api.getEventApi();

const mailSigApi: MailSignatureApi = api.api.requireLogicalApi(apis.mailSignatureImplApi) as unknown as MailSignatureApi;
const tinyStyle = 'body {margin: 0; font-size: 14px; overflow: hidden; }';
// 是否是mac系统
const isMac = systemIsMac();

type SensitiveMark = {
  width: number;
  height: number;
  top: number;
  left: number;
  isFirstNode: boolean;
  word: string;
};
interface Props {
  uploadAttachmentAction: (params: uploadAttachmentType) => void;
  mailFormatAction: () => void;
  onEditCreated: (ed: EditorType) => void;
  recognizeDiskUrl: (ed: EditorType, content: string) => void;
  onEditChange: () => void;
  uploadAttachmentWithFiles: () => void;
  uploadAttachment: (files: File[], cloud?: boolean) => void;
  isContentChanged: boolean;
  webScale?: () => void;
  enableSensitiveMarks?: boolean; // 编辑器是否展示敏感词标记
  sensitiveChecking?: boolean; // 编辑器是否正在执行敏感词检测
  sensitiveWords?: SensitiveWord[]; // 服务端敏感词
  sensitiveWordsDetected?: SensitiveWord[]; // 正文敏感词
  onSensitiveDetectedChange?: (sensitiveWord: SensitiveWord[]) => void; // 正文敏感词修改
  onToolbarHeightChange?: (toolbarHeight: number) => void; // 正文富文本编辑器工具栏高度变化触发
}
// const contextPath = config('contextPath') as string;
interface LastUser {
  key: 'defaultFontFamily' | 'defaultFontSize' | 'defaultLineHeight' | 'defaultColor' | 'defaultAlign';
  value: string;
}
let toolbar: string | string[] = [
  'lxuploadattachment $split lxmailformat $split lxsignature $split lxaiwritemail $split lxoptimizecontent lxAIWriteManual $split preview print code $split undo redo lxformatpainter removeformat',
  [
    'fontselect fontsizeselect',
    'bold italic underline strikethrough forecolor backcolor',
    'bullist numlist lineheight',
    'lxgrammar',
    'link lxemoji',
    'alignleftSplit dentSplit',
    `lxTable lximg ${isElectron ? 'lxcapturescreen' : ''} lxsplitline`,
  ].join(' $split '),
];

if (inEdm) {
  toolbar = [
    'lxuploadattachment $split lxappendcommodity $split lxmailformat $split lxsignature $split lxaiwritemail $split lxoptimizecontent lxAIWriteManual $split lxsalespitch',
    [
      'undo redo lxformatpainter removeformat ',
      'fontselect fontsizeselect',
      'bold italic underline strikethrough forecolor backcolor',
      'bullist numlist lineheight',
      'lxgrammar',
      'alignleftSplit dentSplit',
      `lxTable lximg ${isElectron ? 'lxcapturescreen ' : ''}link lxemoji`,
      'preview print code',
    ].join(' $split '),
  ];
}
let toolbar_mode = 'floating';

const MailContent = React.forwardRef((props: Props, ref) => {
  // 在外贸场景下控制话术库抽屉的visible
  const [, setGuideVisible] = useState2SalesPitchReduxMock('guideVisible');
  const [, setWritePageGuidePos] = useState2SalesPitchReduxMock('writePageGuidePos');
  const [, setWritePageOuterDrawerVisible] = useState2SalesPitchReduxMock('writePageOuterDrawerVisible');

  const {
    uploadAttachmentAction,
    mailFormatAction,
    onEditCreated,
    uploadAttachmentWithFiles,
    recognizeDiskUrl,
    webScale,
    uploadAttachment,
    sensitiveWords,
    enableSensitiveMarks,
    sensitiveChecking,
    onSensitiveDetectedChange,
    onToolbarHeightChange,
  } = props;
  const mailApi: MailApi = api.api.requireLogicalApi(apis.mailApiImpl) as unknown as MailApi;
  const currentMail = useAppSelector(state => state.mailReducer.currentMail);
  const infoStatus = useAppSelector(state => state.mailReducer.currentMail.status);
  const conferenceSetting = useRef<boolean | undefined>(false);
  const taskSetting = useRef<boolean | undefined>(false);
  const praiseMailSetting = useRef<boolean | undefined>(false);
  const focusedRef = useRef('');
  conferenceSetting.current = infoStatus?.conferenceSetting;
  taskSetting.current = infoStatus?.taskMailSetting;
  praiseMailSetting.current = infoStatus?.praiseMailSetting;
  const currentMailContent = useAppSelector(state => state.mailReducer.currentMail?.entry?.content.content);
  const focused = useAppSelector(state => state.contactReducer.selector.focused);
  focusedRef.current = focused;
  const waittingMailIds = useAppSelector(state => state.mailReducer.waittingMailIds);
  // const currentConfigMail = useAppSelector(state => state.mailConfigReducer.currentMail);
  const curAccount = useAppSelector(state => state.mailReducer.currentMail?.optSender);
  const curAccountRef = useRef(curAccount);
  const textareaRef = useRef(null);
  curAccountRef.current = curAccount;
  const [localSender, setLocalSender] = useState<null | MailAliasAccountModel>();
  // const allMails = useAppSelector(state => state.mailReducer.mails);
  const currentMailId = useAppSelector(state => state.mailReducer.currentMail?.cid);
  const defaultSign = useAppSelector(state => state.mailReducer.currentMail?.defaultSign);
  const puretext = useAppSelector(state => state.mailReducer.currentMail.status?.puretext);
  const menus = useAppSelector(state => state.privilegeReducer.menus);
  const resetCont = useMemo(() => currentMail.resetCont, [currentMail]);
  const dispatch = useAppDispatch();
  const {
    doChangeMailContent,
    setResetCont,
    doConferenceSettting,
    doModifyReceiver,
    doTaskMailSetting,
    doPraiseMailSetting,
    doUpdateForbidSaveTemp,
    doChangeCacheAttachment,
    doModifyDefaultSign,
  } = MailActions;
  // const { doSetCurrentMail: doSetCurrentConfigMail, doSetDisplayMail, doSetNickname } = MailConfigActions;
  const { doSetDisplayMail, doSetSignList } = MailConfigActions;
  const [content, setContent] = useState('');
  const [uploadAttachmentConfig, setUploadAttachmentConfig] = useState<Array<number> | null>(null);
  const [haveContent, setHaveContent] = useState(false);
  const currentMailIdRef = useRef(currentMailId);
  currentMailIdRef.current = currentMailId;
  const refContainer = useRef<HTMLDivElement>(null);
  const senderEmail = useMemo(() => currentMail?.initSenderStr || '', [currentMailIdRef.current, currentMail?.initSenderStr]);
  const senderEmailRef = useRef(senderEmail);
  senderEmailRef.current = senderEmail;
  // const refContent = useRef('');
  const refEditorInstance = useRef<EditorType | null>(null);
  const [layerZIndex, setLayerZIndex] = useState(1);
  const [editorInstance, setEditorInstance] = useState<EditorType | null>(null);
  const getAtResultCBRef = useRef<(contactInfo: EntityContactItem | string, contact?: EntityContact) => void>(() => {});
  const [token, setToken] = useState('');
  // const signEditModalAttr = useNiceModal('signEditOnWrite');
  const selectSignModalAttr = useNiceModal('selectSignOnWrite');
  // 在外贸场景下控制选择商品弹窗的visible
  const [showSettingProductModal, setShowSettingProductModal] = useState(false);

  // 在外贸场景下普通邮件编辑器中添加插入配置
  const lxAppendCommodity = inEdm ? 'lxappendcommodity' : '';
  useEffect(() => {
    // 如果没有开通外贸通，不展示插入商品信息入口
    if (inEdm && menus.length == 0) {
      (toolbar as string[])[0] = toolbar[0].replace('lxappendcommodity $split', '');
    }
    systemApi.doGetCookies(true).then(cookies => {
      const { QIYE_TOKEN } = cookies;
      setToken(QIYE_TOKEN);
    });
    // avoidMailConfigUpdateSign();
  }, []);

  useEffect(() => {
    if (focused === 'focusContent' && editorInstance) {
      editorInstance.focus();
    }
  }, [focused, editorInstance, currentMailId]);

  const getToken = () => token;
  // @时光标位置
  const [contactPos, setContactPos] = useState({
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
  });
  // @人组件可见性控制
  const [atVisible, setAtVisible] = useState(false);
  // 点击联系人出现卡片
  const [contactCardVisible, setContactCardVisible] = useState(false);
  const [contactClicked, setContactClicked] = useState<{ id?: string; email: string }>();
  // 展示邮件模板列表
  const { changeShowTemplateList } = useActions(MailTemplateActions);
  /**
   * @description: 在替换签名之前对签名字符串进行处理
   * @param {string} signHtml
   * @return {string}
   */
  const preSetDign = (signHtml: string) => {
    if (!signHtml) {
      return '';
    }
    const signJuice = juice(signHtml);
    const lastVal = signJuice.replace(/\n/g, '');
    return lastVal;
  };
  const editorChangeSign = (sign: string) => {
    const editorVal = preSetDign(sign);
    editorInstance?.fire('modifySignature', {
      sigContent: mailApi.doTransferSign(`<div class='mail-signature' onselectstart="return false">${editorVal}</div>`),
    });
  };
  // 外界可以通过这种方式向编辑器插入内容
  // eslint-disable-next-line
  const mailInsertContent = contentParam => {
    editorInstance?.insertContent(contentParam);
    handleSensitiveMarksUpdate(); // 插入内容后如果需要检测敏感词，则进行检测
  };

  useImperativeHandle(ref, () => ({
    // 强制保存
    forceSave: () => {
      // 拿到编辑器最新内容并返回
      // const curContent = refContent.current;
      return refEditorInstance?.current?.getContent();
    },
    // 插入模板内容到正文
    insertTemplateToEditor: (templateContent: string) => {
      // 插入模板，视为正文内容有改动
      if (!props.isContentChanged) {
        props.onEditChange();
      }
      mailInsertContent(templateContent);
    },
    getEditorInstance: () => refEditorInstance.current,
  }));

  const getDefaultSign = async (updateEditor?: boolean, mailEmail?: string) => {
    try {
      // accountApi.setCurrentAccount({ email: mailEmail || '' });
      const defaultSignRes = await mailSigApi.doGetDefaultSign(true, currentMail?.entry?.writeLetterProp, mailEmail);
      // if ((updateEditor || defaultSignRes.defaultSignChange) && defaultSignRes.content) {
      if ((updateEditor || defaultSignRes.defaultSignChange) && defaultSignRes.enable) {
        const lastVal = preSetDign(defaultSignRes.content);
        refEditorInstance.current?.fire('allSignature', {
          sigContent: mailApi.doTransferSign(lastVal),
        });
      }
      const signList = defaultSignRes.personalSignList;
      signList?.map(sign => {
        sign._account = mailEmail;
      });
      signList && dispatch(doSetSignList(signList));
      delete defaultSignRes.personalSignList;
      dispatch(doModifyDefaultSign({ cid: currentMail.cid, sign: defaultSignRes }));
    } catch (e) {}
  };

  // useEffect(debounce(() => {
  //     if (defaultSign === undefined && content) {
  //         // 写信初始化
  //         // 获取默认签名，与DB返回的默认签名diff
  //         // TODO: 使用1000ms的延迟，保证content已被渲染到编辑器中，这种实现很丑，但是现在编辑器还没有渲染后回调的能力
  //         getDefaultSign(false, currentMail?.mailFormClickWriteMail || senderEmail);
  //     }
  // }, 1000), [currentMailId, content])
  useEffect(() => {
    if (curAccount && localSender && curAccount.mailEmail !== localSender.mailEmail && curAccount.currentMailCid === localSender.currentMailCid) {
      // 切换账号
      getDefaultSign(true, curAccount.mailEmail);
    }
  }, [curAccount]);

  useEffect(() => {
    // 主账号 挂载账号切换后
    if (curAccount && curAccount.mailEmail !== localSender?.mailEmail) {
      setLocalSender(curAccount);
      // accountApi.setCurrentAccount({ email: curAccount.mailEmail });
      // avoidMailConfigUpdateSign();
      // dispatch(doSetNickname(curAccount.nickName || ''));
      dispatch(doSetDisplayMail(curAccount.agentEmail || ''));
      dispatch(getSignTemplatesAsync());
      // dispatch(getSignListAsync());
    }
  }, [curAccount]);

  // 敏感词相关开始-----------------
  const [sensitiveMarks, setSensitiveMarks] = useState<SensitiveMark[]>([]);
  const [sensitiveLayerScrollX, setSensitiveLayerScrollX] = useState<number>(0);

  const getSensitiveDetectedIndex = (word: string) => (props.sensitiveWordsDetected ? props.sensitiveWordsDetected.findIndex(wordItem => wordItem.word === word) + 1 : 0);

  const getTextNodesByDocument = (document?: Document) => {
    if (!document) return [];
    const textNodes: Node[] = [];
    const loop = (node: Node) => {
      if (node.childNodes.length && node?.nodeName.toLowerCase() !== 'style') {
        Array.from(node.childNodes).forEach(child => {
          if (child.nodeName === '#text') {
            textNodes.push(child);
          } else {
            loop(child);
          }
        });
      }
    };
    loop(document);
    return textNodes;
  };
  const handleSensitiveCore = (document: Document) => {
    const documentRect = document?.documentElement?.getBoundingClientRect() || new DOMRect(0, 0, 0, 0);
    const documentTextNodes: Node[] = getTextNodesByDocument(document);
    const sensitiveMarkMap: { [word: string]: SensitiveMark[] } = {};
    const nextSensitiveWordsDetected: SensitiveWord[] = [];

    // const sensitiveWords = props.sensitiveWords;
    if (!sensitiveWords || sensitiveWords.length === 0 || documentTextNodes.length === 0) {
      return;
    }

    const markTextNode = (textNode: Node) => {
      const nodeValue = textNode.nodeValue || '';
      sensitiveWords.forEach(wordItem => {
        const { word } = wordItem;
        let wordForRegExp = '';
        if (/[a-zA-Z]/.test(word)) {
          // 如果英文单词，需要加单词边界匹配
          wordForRegExp = '\\b' + word.replace(/[\[\]\(\)\{\}\.\*\+\?\^\$\\\|]/g, $1 => `\\${$1}`).trim() + '\\b';
        } else {
          // 如果是100%或者其他字符，不能加单词边界
          wordForRegExp = '\\b' + word.replace(/[\[\]\(\)\{\}\.\*\+\?\^\$\\\|]/g, $1 => `\\${$1}`).trim();
        }
        const wordMatched = Array.from(nodeValue.matchAll(new RegExp(wordForRegExp, 'gi')));
        if (!wordMatched.length) return;
        const wordRanges = wordMatched.map(item => ({
          start: item.index as number,
          end: (item.index as number) + word.length,
        }));
        if (!nextSensitiveWordsDetected.includes(wordItem)) {
          nextSensitiveWordsDetected.push(wordItem);
        }
        wordRanges.forEach(({ start, end }) => {
          for (let i = start; i < end; i++) {
            const range = typeof Range === 'function' ? new Range() : document.createRange();
            range.setStart(textNode, i);
            range.setEnd(textNode, i + 1);
            const letter = range.getBoundingClientRect();
            const letterMark = {
              width: letter.width,
              height: letter.height,
              top: letter.top - documentRect.y,
              left: letter.left - documentRect.x,
              isFirstNode: i === start,
              word,
            };
            if (sensitiveMarkMap[word]) {
              sensitiveMarkMap[word].push(letterMark);
            } else {
              sensitiveMarkMap[word] = [letterMark];
            }
          }
        });
      });
    };
    documentTextNodes.forEach(markTextNode);
    const nextSensitiveMarks = Object.keys(sensitiveMarkMap).reduce<SensitiveMark[]>((accumulator, word) => [...accumulator, ...sensitiveMarkMap[word]], []);
    return {
      nextSensitiveMarks,
      nextSensitiveWordsDetected,
    };
  };
  const handleSensitiveMarksUpdate = useDebounceForEvent(
    () => {
      if (sensitiveChecking) {
        const document = refEditorInstance.current?.getDoc() as Document;
        const res = handleSensitiveCore(document);

        const { nextSensitiveMarks, nextSensitiveWordsDetected } = res || {
          nextSensitiveMarks: [],
          nextSensitiveWordsDetected: [],
        };
        setSensitiveMarks(nextSensitiveMarks);
        onSensitiveDetectedChange && onSensitiveDetectedChange(nextSensitiveWordsDetected);
      }
    },
    1000,
    { leading: true, trailing: false, maxWait: 1000 }
  );
  useEffect(() => {
    handleSensitiveMarksUpdate();
  }, [sensitiveWords, sensitiveChecking]);
  // 敏感词相关结束-----------------

  const writeMailLoadTrack = () => {
    performanceApi.timeEnd({
      statKey: 'write_mail_load',
      statSubKey: `${currentMail?.cid}`,
      params: {
        type: `${currentMail?.entry?.writeLetterProp}`,
      },
    });
  };
  const findActionNode = () => {
    const nodes = document.querySelectorAll('.tox-toolbar__group[role=toolbar]');
    if (nodes) {
      return Array.from(nodes).find(node => node.innerHTML.includes('跟单话术库'));
    }
    return null;
  };
  const setEditor = useCallback(
    debounce(() => {
      const contentTemp = currentMail?.entry?.content?.content;
      if (contentTemp !== undefined) {
        setHaveContent(true);
      }
      currentMailIdRef.current = currentMailId;
      if (editorInstance) {
        // @ts-ignore: Unreachable code error
        editorInstance.setContent(contentTemp, {
          after: () => {
            // 如果是非首次打开的新的一封写信，需要重新请求签名，本地签名与远端签名diff
            if (defaultSign === undefined) {
              getDefaultSign(false, currentMail?.mailFormClickWriteMail || senderEmail);
            }
            writeMailLoadTrack();
          },
        });
      }
      // else {
      //     setContent(contentTemp);
      // }
      setContent(contentTemp);
      setTimeout(() => {
        const parentEl = refContainer.current?.parentElement;
        if (parentEl && parentEl.scrollTo) {
          parentEl.scrollTo(0, 0);
        }
      }, 100);
      if (refContainer.current && currentMail.entry) {
        const iframeDom = refContainer.current.querySelector('iframe');
        // iframeDom && beforeNewWindow(iframeDom, 'setTemplateButtonDisplay', currentMail.entry.writeLetterProp || 'common');
      }
    }, 300),
    [currentMail, defaultSign]
  );

  useEffect(() => {
    try {
      const config = getIfHaveAuth(ProductAuthorityFeature.ORG_SETTING_BIG_ATTACH_SHOW) ? [0, 1, 2, 3] : [0, 2, 3];
      setUploadAttachmentConfig(config);
    } catch (error) {
      console.log('获取云附件权限失败', error);
      setUploadAttachmentConfig([0, 1, 2, 3]);
    }
  }, []);

  useEffect(() => {
    setEditor();
    setSensitiveMarks([]);
    onSensitiveDetectedChange && onSensitiveDetectedChange([]);
    // 回复存草稿的功能
    dispatch(doUpdateForbidSaveTemp(false));
  }, [currentMailId]); // 不能改成 currentMail

  // useEffect(() => {
  //   // 回复分割线设置
  //   if (editorInstance) {
  //     const defaultSeparateLine = storeApi.getSync('defaultSeparateLine').data || '0';
  //     if (defaultSeparateLine === '0') {
  //       editorInstance.getBody().classList.add('non-separate-line');
  //     } else {
  //       editorInstance.getBody().classList.remove('non-separate-line');
  //     }
  //   }
  // }, [currentMailId, editorInstance]);
  // 重置编辑器
  useEffect(() => {
    if (resetCont) {
      dispatch(setResetCont(false));
      setEditor();
    }
  }, [resetCont]);
  useEventObserver('electronClosed', {
    name: 'mailContentElectronClosedOb',
    func: () => {
      // 临时关闭存草稿的功能，防止把『--数据加载中--』给用户存草稿中
      dispatch(doUpdateForbidSaveTemp(true));
      console.log('[save draft] closed');
      // setContent('<br/><br/>--数据加载中--');
      const hasReceiver = currentMail?.receiver?.length > 0;
      if (hasReceiver) {
        editorInstance?.focus();
      }
    },
  });

  // 替换编辑器图片链接
  useMsgRenderCallback('writePageDataExchange', ev => {
    if (ev?.eventStrData === 'inlineImgReUpload') {
      editorInstance?.fire('replaceImgUrl', ev.eventData);
    }
  });

  // 检查工具栏高度是否变化,默认两行工具栏，高度78
  const toobarHeight = useRef(78);
  const checkToolbarHeightChange = () => {
    // 这里直接抓取的工具栏dom的高度
    const toolbarDom = document.querySelector('.tox-editor-header>.tox-toolbar-overlord');
    // 如果获取到了高度
    if (toolbarDom && toolbarDom.clientHeight) {
      // 如果不相等再通知
      if (toolbarDom.clientHeight !== toobarHeight.current) {
        toobarHeight.current = toolbarDom.clientHeight;
        if (toolbarDom.clientHeight > 80) {
          // 大于80，就是三行，通知为120，实际大概是117
          onToolbarHeightChange && onToolbarHeightChange(120);
        } else {
          // 小于等于80，两行，通知为80，实际大概78
          onToolbarHeightChange && onToolbarHeightChange(80);
        }
      }
    }
  };

  const debounceInterrupt = useDebounceForEvent(() => {
    if (currentMailIdRef.current && waittingMailIds.includes(currentMailIdRef.current)) {
      dispatch(MailActions.doRemWaittingMailId(currentMailIdRef.current));
      message.error({ content: getIn18Text('ZIDONGFASONGZHONGD，QBJWCHCXFS') });
    }
  }, 500);

  const changeEditor = val => {
    debounceInterrupt();
    setTimeout(() => {
      handleSensitiveMarksUpdate(); // editor变化如果需要检测敏感词，则进行检测
    }, 0);
  };
  const imagesUploadHandler = async (blobInfo, succFun, failFun) => {
    const imgFile = blobInfo.blob();
    if (Object.prototype.toString.call(imgFile) === '[object File]') {
      // 删除SVG里面的script脚本
      filterSVGScript(imgFile).then(file => {
        imagesUploadService(file, succFun, failFun).then(fileUrl => {
          // 缓存附件用于发信失败重传
          dispatch(
            doChangeCacheAttachment({
              id: currentMailIdRef.current,
              type: 'inlineImg',
              value: imgFile,
              operationType: 'add',
              originFileUrl: fileUrl as string,
            })
          );
        });
      });
    }
  };

  const imagesUploadService = async (imgFile: File | string, succFun, failFun) => {
    const accounts = await accountApi.getMainAndSubAccounts();
    const mainAccount = accounts[0].mainAccount;
    const flag: any = { inline: true };
    const _token = mailConfApi.accountTokens.find(token => token.account === senderEmailRef.current)?.token || '';
    const isSubAccount = mailConfApi.isSubAccount(senderEmailRef.current);
    if (mainAccount !== senderEmailRef.current) {
      flag._account = senderEmailRef.current;
    }
    return mailApi
      .doUploadAttachment({
        cid: currentMailIdRef.current,
        _account: flag._account || '',
        attach: imgFile,
        uploader: undefined,
        flag,
        realId: mailApi.generateRndId(),
      })
      .then(({ fileUrl }) => {
        // inline插入图片，而非图片附件
        // item.setAttribute('wirte-origin-src', fileUrl || '');
        let imgSrc = fileUrl;
        if (isSubAccount && !isElectron) {
          const newUrl = fileUrl?.replace(/(\/js6\/s)/, '/commonweb/proxy$1');
          imgSrc = `${newUrl}&_token=${_token}`;
        }
        succFun({ url: imgSrc, originUrl: fileUrl });
        // saveDraft();
        return fileUrl;
      })
      .catch(() => {
        failFun();
      });
  };

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

  const getContact = (contactId: string, contactEmail: string) => {
    setContactClicked({ id: contactId, email: contactEmail });
    setContactCardVisible(true);
  };
  const edSetup = (ed: EditorType) => {
    const fontColor = storeApi.getSync('defaultColor').data;
    if (fontColor) {
      // 根据默认上次修改的颜色改toolbar按钮的颜色
      setTimeout(() => {
        ed.fire('TextColorChange', { name: 'forecolor', color: fontColor });
      }, 2000);
    }

    ed.on('keydown', event => {
      if (isMac && event.metaKey && event.key === 'Enter') {
        debounceSendMail();
      } else if (!isMac && event.ctrlKey && event.key === 'Enter') {
        debounceSendMail();
      }
    });
    ed.on('focusout', () => {
      // 同步redux editorInstance
      dispatch(doChangeMailContent(refEditorInstance?.current?.getContent()));
      const mail = { ...JSON.parse(JSON.stringify(currentMail)), ...{ _account: senderEmail } };
      if (mail?.entry?.content?.content) {
        mail.entry.content.content = refEditorInstance?.current?.getContent();
      }
      // 同步local
      mailApi.doSaveMailLocal(mail);
    });
    // 内容有改动时，通知父组件
    ed.on('input', () => {
      if (!props.isContentChanged) {
        props.onEditChange();
      }
    });
    // 内容有改动时，通知父组件
    ed.on('focusout', () => {
      setTimeout(() => {
        setLayerZIndex(1);
      }, 300);
    });
    ed.on('clickContact', ({ top, left, bottom, right, contactId, email }) => {
      getContact(contactId, email);
      setContactPos({
        top,
        left,
        bottom,
        right,
      });
    });
    // 敏感词相关
    ed.on('ResizeContent', () => {
      setTimeout(() => {
        handleSensitiveMarksUpdate(); // editor变化如果需要检测敏感词，则进行检测
        checkToolbarHeightChange();
      }, 0);
    });
    ed.on('ObjectResized', event => {
      setTimeout(() => {
        handleSensitiveMarksUpdate(); // editor变化如果需要检测敏感词，则进行检测
      }, 0);
    });
    ed.on('ScrollContent', event => {
      if (sensitiveChecking && event.target === refEditorInstance.current?.getDoc()) {
        setSensitiveLayerScrollX(event.target.documentElement.scrollLeft);
      }
    });
  };
  const edInitCallback = ed => {
    if (!isElectron) {
      scaleEditor(scale); // 最好在第一样 插入元素 后面才能绑定事件
    }
    const hasReceiver = currentMail?.receiver?.length > 0;
    if (hasReceiver) {
      ed.focus();
    }
    setEditorInstance(ed);
    refEditorInstance.current = ed;
    onEditCreated && onEditCreated(ed);

    // 编辑器初始化结束，请求签名，本地签名与远端签名diff
    getDefaultSign(false, currentMail?.mailFormClickWriteMail || senderEmail);
    writeMailLoadTrack();

    // 展示外贸场景下，话术库引导
    setTimeout(() => {
      storeApi.get(SALES_PITCH_GUIDE_ID).then(({ suc, data }) => {
        const neverShown = !suc || data !== 'true';
        if (neverShown) {
          const target = findActionNode();
          if (inEdm && target != null) {
            const { x, y, width, height } = target.getBoundingClientRect();
            setWritePageGuidePos({
              x,
              y,
              width,
              height,
            });
            setGuideVisible(true);
          }
        }
      });
    }, 1000);
  };
  const overLayer = () => {
    if (editorInstance) {
      setLayerZIndex(-1);
    }
  };
  const signatureActionAction = () => {
    // avoidMailConfigUpdateSign();
    // if (signListRef.current && signListRef.current.length > 0) {
    //     selectSignModalAttr.show();
    // }
    // else {
    //     signEditModalAttr.show({ _account: curAccountRef.current?.mailEmail || '' })
    // }
    selectSignModalAttr.show();
  };
  const salespitchActionAction = () => {
    setWritePageOuterDrawerVisible(true);
  };

  // @组件选择结果
  const getAtResult = (contactModel: ContactModel | string) => {
    if (typeof contactModel === 'string') {
      getAtResultCBRef.current(contactModel);
      return;
    }
    const contactInfo = contactModel.contactInfo.find(i => i.hitQuery?.includes('isDefault'));
    getAtResultCBRef.current(contactInfo || contactApi.findContactInfoVal(contactModel.contactInfo), contactModel.contact);
    // 将@后的联系人添加到收件人
    const receiver = transContactModel2MailContactModel(contactModel, 'to');
    dispatch(
      doModifyReceiver({
        receiver: [receiver],
        receiverType: 'to',
        operation: 'paste',
      })
    );
    dispatch(ContactActions.doFocusSelector('to'));
  };
  const lastUse = (data: LastUser) => {
    storeApi.put(data.key, data.value);
  };
  // 从云文档添加
  const uploadFromOfficeDocAction = () => {
    trackApi.track('pcMail_click_attachments_writeMailPage', { attachmentsList: getIn18Text('CONGYUNWENDANGTIAN1') });
    dispatch(DiskAttActions.doToggleDiskModal(true));
  };
  // 从往来附件添加
  const uploadFromNormalAtt = () => {
    trackApi.track('pcMail_click_attachments_writeMailPage', { attachmentsList: getIn18Text('CONGWANGLAIFUJIAN') });
    dispatch(DiskAttActions.doSwitchType('normalAtt'));
    dispatch(DiskAttActions.doToggleDiskModal(true));
  };
  // 编辑器输入@联系人
  const lxContactShow = ({ position }, callback: (contact: ContactModel | string) => void) => {
    setAtVisible(true);
    setContactPos(position);
    getAtResultCBRef.current = callback;
  };
  const comMailFormatAction = (formatId: number) => {
    // formatId 个人模板:2 企业模板:4 推荐模板:3
    changeShowTemplateList({ isShow: true, defaultActiveTab: formatId, templateType: 'write' });
  };
  const scale = (status: boolean) => {
    webScale && webScale();
  };
  const editorCk = () => {
    if (focusedRef.current !== getIn18Text('ZHENGWEN')) {
      setTimeout(() => {
        dispatch(ContactActions.doFocusSelector(getIn18Text('ZHENGWEN')));
      }, 100);
    }
    if (conferenceSetting) {
      setTimeout(() => {
        dispatch(doConferenceSettting(false));
      }, 100);
    }
    if (taskSetting) {
      setTimeout(() => {
        dispatch(doTaskMailSetting(false));
      }, 100);
    }
    if (praiseMailSetting) {
      setTimeout(() => {
        dispatch(doPraiseMailSetting(false));
      }, 100);
    }
  };

  // 外贸场景下打开选择商品弹窗
  const onSettingProduct = () => {
    setShowSettingProductModal(true);
    // 点击商品信息
    trackApi.track('mail_add_product');
  };

  // 外贸场景下关闭选择商品弹窗
  const closeSettingProductModal = () => {
    setShowSettingProductModal(false);
  };

  /**
   * 外贸场景下向编辑器插入商品信息
   * @param tab
   * @param lists
   * @param columns
   * @param fieldsMap
   * @returns
   */
  const handleAddProducts = (tab: number, lists: any[], columns: string[], fieldsMap: any, imgSize: number) => {
    const html = getProductsHtml(tab, lists, columns, fieldsMap, imgSize);
    editorInstance?.undoManager.transact(function () {
      editorInstance?.insertContent(html);
      handleSensitiveMarksUpdate(); // 插入内容后如果需要检测敏感词，则进行检测
    });
  };
  const textareaChange = () => {
    if (textareaRef.current) {
      const value = textareaRef.current.value;
      dispatch(doChangeMailContent(value));
      // textareaRef.current.style.height = '100px';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 20 + 'px';
    }
  };
  useEffect(() => {
    if (!refContainer.current || !editorInstance) return;
    const toxSidebarWrap = refContainer.current.querySelector('.tox-sidebar-wrap');
    if (puretext) {
      //@ts-ignore
      toxSidebarWrap!.style!.display = 'none';
      textareaChange();
    } else {
      currentMailContent && editorInstance!.setContent(currentMailContent.replace(/[\r\n]/g, '<br />'));
      editorInstance!.fire('updatePlaceholder', { show: false });
      //@ts-ignore
      toxSidebarWrap!.style.display = 'flex';
    }
  }, [puretext]);

  if (!haveContent || !uploadAttachmentConfig) {
    return <></>;
  }
  return (
    <>
      <div className={classnames([MAIL_EDITOR_CONTAINER_CLASS, inEdm && MAIL_EDITOR_CONTAINER_EDM_CLASS])} ref={refContainer}>
        {/* 敏感词展示 */}
        <div className="editor-sensitive-layer" style={{ marginLeft: -1 * (sensitiveLayerScrollX || 0) }}>
          <div className="editor-sensitive-content">
            {enableSensitiveMarks &&
              sensitiveMarks.map((item, index) => (
                <div
                  className="editor-sensitive-mark"
                  style={{
                    top: item.top,
                    // todo 去掉＋16
                    left: item.left,
                    width: item.width,
                    height: item.height,
                  }}
                  key={index}
                >
                  {item.isFirstNode && (
                    <div className="editor-sensitive-mark-index" style={{ height: 12, top: -12, display: 'flex', padding: '0 5px', alignItems: 'center' }}>
                      {getSensitiveDetectedIndex(item.word)}
                    </div>
                  )}
                </div>
              ))}
          </div>
        </div>
        <div className="editor-container-layer" onMouseMove={overLayer} style={{ zIndex: layerZIndex }} />
        <textarea ref={textareaRef} className="editor-container-textarea" hidden={!puretext} value={currentMailContent} onInput={textareaChange}></textarea>
        {/* control-editor-height 如果没有这个控制 编辑器被隐藏了但是高度还存在 占据了底部空间 */}
        <div className={classnames({ 'control-editor-height': puretext })}>
          <LxEditor
            onClick={editorCk}
            initialValue={content}
            init={{
              placeholder: getIn18Text('CHANGSHI@TA'),
              content_style: tinyStyle,
              recognizeDiskUrl,
              setup: edSetup,
              getToken,
              uploadAttachmentAction,
              AntdMessage: message,
              uploadFromOfficeDocAction,
              uploadAttachment,
              uploadAttachmentWithFiles,
              mailFormatAction,
              comMailFormatAction,
              lxContactShow,
              signatureActionAction,
              salespitchActionAction,
              init_instance_callback: edInitCallback,
              scrollSelect: '#writeMailEditorScroll',
              images_upload_handler: imagesUploadHandler,
              automatic_uploads: false,
              last_use: lastUse,
              uploadAttachmentConfig,
              uploadFromNormalAtt,
              min_height: 80,
              tabIndex: 35,
              toolbar_mode,
              toolbar_scale: !isElectron,
              // 外贸场景下添加插入商品信息的配置
              lxAppendCommodity: {
                onSettingProduct,
              },
              toolbar,
            }}
            source={'general'}
            onEditorChange={debounce(changeEditor, 2000)}
          />
        </div>
        <SelectSignModal signSelectId="selectSignOnWrite" signEditId="signEditOnWrite" writeType={currentMail.writeType} onSave={editorChangeSign} />
        <SignEditModal signEditId="signEditOnWrite" />
        <DiskAttachmentModal />
        <LxPopover
          top={contactPos.top}
          left={contactPos.left}
          right={contactPos.right}
          bottom={contactPos.bottom}
          visible={atVisible}
          setVisible={setAtVisible}
          height={246} // 246 来自MailAt的最大高度 为了保证搜索栏不会上下跳动
          acceptTopBottom
        >
          <MailAt visible={atVisible} setVisible={setAtVisible} emitResult={getAtResult} />
        </LxPopover>
        <LxPopover
          top={contactPos.top}
          left={contactPos.left}
          right={contactPos.right}
          bottom={contactPos.bottom}
          visible={contactCardVisible}
          setVisible={setContactCardVisible}
          offset={[0, 30]}
        >
          {contactClicked && (
            <ContactDetail
              contactId={contactClicked.id}
              email={contactClicked.email}
              dividerLine={false}
              onNotifyParent={() => {
                setContactCardVisible(false);
              }}
              branch
              toolipShow
            />
          )}
        </LxPopover>
        {/* 外贸场景下， 在普通邮件下选择商品信息的弹窗 */}
        {process.env.BUILD_ISEDM ? (
          <ProductSettingModal
            container="#mailboxModule"
            onShow={onSettingProduct}
            onAdd={handleAddProducts}
            visible={showSettingProductModal}
            onClose={closeSettingProductModal}
          />
        ) : null}
        <SalesPitchWritePageDrawer />
      </div>
    </>
  );
});
export default MailContent;
