import { formatFileSize } from '@web-common/utils/file';
import { apiHolder, apis, EdmSendBoxApi, DataStoreApi, SystemApi, SensitiveWord, SendStepProps, AttachmentInfo, GPTReport, PrevScene } from 'api';
import React, { useRef, useImperativeHandle, useEffect, useState, useReducer, useContext, useCallback } from 'react';
import { Editor as TinyMCEEditor } from '@web-common/tinymce';
import classnames from 'classnames';
import { getTrail } from '@web-disk/utils';
import UploadOutlined from '@ant-design/icons/UploadOutlined';
import toast from '@web-common/components/UI/Message/SiriusMessage';
import LxPopover from '@web-common/components/UI/LxPopover/LxPopover';
import { AIWriteAttention } from '@web-common/components/UI/LxEditor/HOCAiWriteMail';
import { Button, Checkbox, Empty, Modal } from 'antd';
import { TemplateListModal } from '@web-setting/Mail/components/CustomTemplate/template_list_modal';
import { TemplateListModalWaimao } from '@web-setting/Mail/components/CustomTemplate/template_list_modal_waimao';
import { MailTemplateActions, AiWriteMailReducer, useActions } from '@web-common/state/createStore';
import MailFormatModal from '@web-mail-write/components/MailFormat/modal';
import MailFormatEdit from '@web-mail-write/components/MailFormat/edit';
import WarnIcon from '@web-common/components/UI/Icons/svgs/WarnSvg';
import { ViewMail } from '@web-common/state/state';
import { TemplateAddModal } from '@web-setting/Mail/components/CustomTemplate/template_add_modal';
import CloseIcon from '@web-common/components/UI/Icons/svgs/CloseMailSvg';
import { DraftEditAdd, edmDataTracker } from '../../../tracker/tracker';
import MailEditor, { uploadAttachmentType } from '../../../components/editor/editor';
import { AttachmentItem, IAttachmentState } from '../../../components/attachment/card';
import { AttachmentUploader, UploadFileStatus } from '../../../attachment_upload';
import { getTemplateContent } from '../../../mailTemplate/template-util';
import { NewTamplateModal } from '../../../mailTemplate/NewTamplateModal';
import IconCard from '@web-mail/components/Icon';
import { Guide, GuideType } from '../../../send/guide/guide';
import { isEmpty } from '../../../send/utils/getMailContentText';
import { InsertVariablModal } from './insertVariableModal';
import SourceCodeModal from './MailSourceCodeModal';
import { edmWriteContext } from '../../../send/edmWriteContext';
import { getNextId } from '../../../utils';
import { ProductTip } from '../../../send/ProductTip';
import style from './style.module.scss';
import { getTransText } from '@/components/util/translate';
import { getIn18Text } from 'api';

const dataStoreApi = apiHolder.api.getDataStoreApi() as DataStoreApi;

const plugins = [
  'advlist autolink lists link lximg image print preview anchor autoresize fullpage',
  'searchreplace visualblocks fullscreen nonbreaking lxsignature',
  'media table paste code lxuploadattachment lxappendvar noneditable lxpreview lxmailformat lxformatpainter lxsociallink lxappendproduct lxaiwritemail lxoptimizecontent lxgrammar lxemoji',
];
const toolbar = [
  'lxuploadattachment $split lxappendvar $split lxmailformat $split lxsignature $split lxsociallink $split lxappendproduct lxproducttip $split lxaiwritemail $split lxoptimizecontent lxAIWriteManual',
  [
    'undo redo lxformatpainter removeformat ',
    'fontselect fontsizeselect',
    'bold italic underline forecolor backcolor',
    'bullist numlist lineheight',
    'lxgrammar',
    'alignleftSplit dentSplit',
    'lxTable lximg link lxemoji $split preview print code',
  ].join(' $split '),
];

const edmApi = apiHolder.api.requireLogicalApi(apis.edmSendBoxApiImpl) as EdmSendBoxApi;
const systemApi = apiHolder.api.getSystemApi() as SystemApi;
const inElectron = systemApi.isElectron();
const FileApi = apiHolder.api.getFileApi();
const inEdm = process.env.BUILD_ISEDM; //systemApi.inEdm();

const MAX_ATTACHEMENT_SIZE = 20 * 1024 * 1024;
let isCloudAttachment = false;

const EdmWritePage = ['#edm', '#intelliMarketing'];
const isEdmWrite = (): boolean => {
  const url = location.hash;

  return url != null && url !== '' && EdmWritePage.some(page => url.match(page) != null);
};

export const ContentEditor = React.forwardRef((props: SendStepProps & ContentEditorProps, ref) => {
  const { contentOnChange, onUseAi, showCodeVarSelect = true } = props;
  const fileSelectorRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<{ getEditor(): TinyMCEEditor | null; appendProductAction: () => void }>();
  const initAttachmentList = props.attachmentList.map(attachment => ({
    id: 'attachment_' + getNextId(),
    type: attachment.type,
    status: UploadFileStatus.DONE, // before being success error
    fileName: attachment.fileName,
    fileType: getTrail(attachment.fileName).toUpperCase(),
    uploadProgress: 100, // 0 ~100
    fileSize: attachment.fileSize,
    serverData: {
      downloadUrl: attachment.downloadUrl,
      expireTime: attachment.expireTime,
    },
  }));
  const [uploaders] = useState<{ [key: string]: AttachmentUploader }>({});
  const { state, dispatch: dispatchWriteContext } = useContext(edmWriteContext).value;
  const [attachmentList, dispatch] = useReducer((attachmentList, action) => {
    switch (action.type) {
      case 'update': {
        return [...attachmentList];
      }
      case 'add': {
        return [...attachmentList, ...action.list];
      }
      case 'remove': {
        return attachmentList.filter(i => i.id !== action.id);
      }
      case 'set': {
        return [...action.payload];
      }
      default:
    }
  }, initAttachmentList);
  // const [showTemplate, setShowTemplate] = useState(false);
  // const [historyMailList, setHistoryMailList] = useState<Array<IHistoryMail>>([]);
  // const [showHisotryModal, setShowHistoryModal] = useState(false);
  // 邮件模板
  const { changeShowTemplateList } = useActions(MailTemplateActions);
  const { changeShowAiWriteModal, changeShowAiOptimizeModal } = useActions(AiWriteMailReducer);
  // 图片模板
  const [mfModalState, setMfModalState] = useState(false);
  const [editState, setEditState] = useState(false);
  const [groupId, setGroupId] = useState('');
  const [mfId, setMfId] = useState('');
  // 模板插入邮件二次提醒弹窗可见性
  const [mailTemplateRemindVisible, setMailTemplateRemindVisible] = useState(false);
  // 模板插入邮件二次提醒弹窗不再提醒
  const [insertRemindChecked, setInsertRemindChecked] = useState(false);
  // 正文内容有任何改动，都会触发
  const [isContentChanged, setIsContentChanged] = useState(false);
  // 邮件模板
  const mailTemplate = useRef<null | ViewMail>(null);
  // TODO: init words from service
  const [sensitiveWords, setSensitiveWords] = useState<SensitiveWord[]>([]);
  const [sensitiveWordsDetected, setSensitiveWordsDetected] = useState<SensitiveWord[]>([]);
  const [dragging, setDragging] = useState(false);
  const [dragenterCount, setDragenterCount] = useState(0);
  const refDrag = useRef<HTMLDivElement>(null);
  // const [isEdmWrite, setIsEdmWrite] = useState(false);
  // 附件
  const attachmentRef = useRef<HTMLDivElement>(null);

  // 变量弹窗
  const [variableVisible, setVariableVisible] = useState(false);
  // 变量介绍弹窗
  const [variableIntroVisible, setVariableIntroVisible] = useState(false);
  // 变量弹窗展示坐标
  const [variablePos, setVariablePos] = useState({ top: 0, left: 0 });

  const [sourceCodeModalVisible, setSourceCodeModalVisible] = useState(false);
  const [sourceCode, setSourceCode] = useState('');
  const [firstUseTemplateState, setFirstUseTemplateState] = useState(false);

  const [showAiTooltips, setShowAiTooltips] = useState(false);
  const [AiTooltipsPos, setAiTooltipsPos] = useState({ top: 1000, left: 1000 });

  {
    /* 插入商品ⓘ功能介绍面板 */
  }
  const [productTipVisible, setProductTipVisible] = useState(false);

  useEffect(() => {
    contentOnChange && contentOnChange((props.content || props.signature) ?? '');
  }, [props.content, props.signature]);

  useEffect(() => {
    edmApi.getSensitiveWords().then(data => {
      setSensitiveWords(data.sensitive_words);
    });
  }, []);

  const getVars = () => {
    const body = editorRef.current?.getEditor()?.getBody();
    const ret: { [key: string]: number } = {};
    if (body) {
      Array.from(body.querySelectorAll('span.mce-lx-var'))
        .map(span => span.textContent)
        .forEach(s => {
          if (s && s.length > 2) {
            if (s.startsWith('#{') && s.endsWith('}')) {
              ret[s.substring(2, s.length - 1)] = 1;
            }
          }
        });
    }
    return Object.keys(ret);
  };

  const setContent = (val: string) => {
    return editorRef.current?.getEditor()?.setContent(val);
  };

  useImperativeHandle(
    ref,
    () => ({
      getEditor() {
        return editorRef.current?.getEditor();
      },
      getContent() {
        return editorRef.current?.getEditor()?.getContent();
      },
      getContentWithAttachment() {
        const editor = editorRef.current?.getEditor();
        if (!editor) return '';
        const content = editor.getContent();
        const attachmentList = this.getAttachmentList().filter((a: AttachmentInfo) => a.type === 1);
        if (attachmentList.length === 0) {
          return content;
        }
        // 云附件 html
        const bodyEndIndex = content.indexOf('</body>');
        if (bodyEndIndex > 0) {
          return content.substring(0, bodyEndIndex) + prepareAttachmentsForSend(attachmentList) + content.substring(bodyEndIndex);
        }
        return content + prepareAttachmentsForSend(attachmentList);
      },
      getText() {
        return editorRef.current?.getEditor()?.getContent({ format: 'text' });
      },
      getImages() {
        const body = editorRef.current?.getEditor()?.getBody();
        if (body) {
          return Array.from(body.querySelectorAll('img'))
            .map(img => img.src)
            .filter(s => s.length > 0);
        }
        return [];
      },
      getVars,
      // getAiReportInfo,
      clearHoverGuide() {
        setVariableIntroVisible(false);
      },
      getLinks() {
        const body = editorRef.current?.getEditor()?.getBody();
        const ret: { [key: string]: number } = {};
        if (body) {
          const links = Array.from(body.querySelectorAll('a'));
          const excludeLinks = Array.from(body.querySelectorAll('.mail-signature a, .sirius-product-table a'));
          links.forEach(a => {
            const href = a.getAttribute('href') || ''; // a.href会自动在url上加path
            if (
              excludeLinks.includes(a) ||
              a.classList.contains('edm-unsubscribe') ||
              /^https\:\/\/sirius-it-edm.cowork.netease.com\/unsubscribe(?:[_\w]?).html/.test(href)
            ) {
              // 退订链接
              return;
            }
            // 排除签名中链接
            if (href && /^https?:\/\/.+/.test(href) /*&& (a.closest('.mail-signature') === null)) */) {
              ret[href] = 1;
            }
          });
        }
        return Object.keys(ret);
      },
      getProductsInfo() {
        const body = editorRef.current?.getEditor()?.getBody();
        const ret: Array<{ productId: string; productLink: string; siteId: string; isCopy: boolean }> = [];
        if (body) {
          const source = (new URLSearchParams(location.href).get('from') as PrevScene) || '';
          const isCopy = source === 'copyTask';
          Array.from(body.querySelectorAll('.sirius-product-table .sirius-product-item')).forEach(item => {
            ret.push({
              productId: item.getAttribute('data-id') || '',
              productLink: item.getAttribute('data-link') as string,
              // 营销邮件插入商品，发送邮件的时候，contentEditInfo 下面的 edmSendProductInfos 里面增加 siteId参数
              siteId: item.getAttribute('data-siteId') as string,
              isCopy, // 是否复制的任务，如果是，后端重新生成商品链接的mid
            });
          });
          return ret;
        }
        return [];
      },
      getUnSuccessAttachments() {
        return attachmentList.filter(a => a.serverData == null);
      },
      getAttachmentList() {
        // 云附件
        return attachmentList
          .filter(a => a.serverData != null)
          .map(a => ({
            fileName: a.fileName,
            fileSize: a.fileSize,
            type: a.type, // type: 0普通附件 1云附件
            downloadUrl: a.serverData.downloadUrl,
            expireTime: a.serverData.expireTime,
          }));
      },
    }),
    [attachmentList, editorRef]
  );

  const initInstanceCallback = () => {
    // 将第一次放在了useeffect加载时，编辑器getEditor 返回为null，所以加载失败
    // 现在是放在了 编辑器加载成功的回调函数中 （也删除了原来500ms的延迟插入）
    if (editorRef.current) {
      const url = location.hash;
      // const search = new URLSearchParams(url.replace('#edm?', ''));
      let index = url.indexOf('?');
      const originStr = url.slice(0, index + 1) || '#edm?';
      const search = new URLSearchParams(url.replace(originStr, ''));
      // 增加uniTemplate 来源
      if ((search.get('from') === 'template' || search.get('from') === 'uniTemplate') && search.get('page') === 'write') {
        const editor = editorRef.current?.getEditor();
        mailTemplateRemind2();
        editor?.insertContent(getTemplateContent());
      }
    }
    props.onReady && props.onReady();
  };

  const handleMailEditorCreated = () => {
    dispatchWriteContext({
      type: 'setState',
      payload: {
        editorCreated: true,
      },
    });
  };
  const handleImageUpload = (file: File) => {
    edmDataTracker.trackDraftEditAdd(DraftEditAdd.Image);
    return edmApi.uploadEdmImage(file).then((url: string) => url);
  };
  const handleAttachmentClick = (attachmentType: uploadAttachmentType) => {
    isCloudAttachment = attachmentType.usingCloud;
    fileSelectorRef.current?.click();
  };
  const handleFileSelected = useCallback(
    (files: FileList | null) => {
      if (files === null || files.length === 0) return;
      const fileArr = Array.from(files);

      if (!isCloudAttachment) {
        // 普通附件限制大小
        const currAttachemntSize = attachmentList.filter(a => a.type === 0).reduce((sum, a) => (sum += a.fileSize), 0);
        const bytesOfFiles = fileArr.reduce((sum, a) => (sum += a.size), 0);

        if (currAttachemntSize + bytesOfFiles > MAX_ATTACHEMENT_SIZE) {
          toast.error({ content: getIn18Text('FUJIANZONGDAXIAOCHAOCHUSHANGXIAN\uFF0CWUFATIANJIA') });
          return;
        }
      }

      // todo: 防止重复文件判断
      const attachments: IAttachmentState[] = [];
      Array.from(files).forEach(file => {
        const attachment: IAttachmentState = {
          id: 'attachment_' + getNextId(),
          type: isCloudAttachment ? 1 : 0,
          fileName: file.name,
          fileType: getTrail(file.name).toUpperCase(),
          uploadProgress: 0,
          fileSize: file.size,
          status: UploadFileStatus.UPLOADING,
        };
        const uploader = new AttachmentUploader(file);
        uploaders[attachment.id] = uploader;
        const onError = (event: any) => {
          toast.error(event?.message || getIn18Text('FUJIANSHANGCHUANSHIBAI'));
        };
        const onProgress = ({ progress }) => {
          attachment.uploadProgress = progress;
          dispatch({
            type: 'update',
          });
        };
        const onStatusChange = (status: UploadFileStatus) => {
          attachment.status = status;
          dispatch({
            type: 'update',
          });
        };
        uploader.on('error', onError);
        uploader.on('progress', onProgress);
        uploader.on('statusChange', onStatusChange);
        uploader.on('uploadFinish', data => {
          // console.log('uploadSuccess', data.identity);
          attachment.serverData = data;
          dispatch({
            type: 'update',
          });
        });
        // todo 是否需要队列?
        uploader.startUpload();
        attachments.push(attachment);
      });
      edmDataTracker.trackDraftEditAdd(DraftEditAdd.Attachment);
      dispatch({
        type: 'add',
        list: attachments,
      });
    },
    [dispatch, attachmentList]
  );

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

  const handleDragOver = e => {
    e.preventDefault();
    e.stopPropagation();
  };

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

  const handleDrop = async e => {
    if ([...e.dataTransfer.items].every(i => i.kind !== 'file')) return;
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
    setDragenterCount(0);
    const df = e.dataTransfer;
    let dropFiles = e.dataTransfer.files; // 存放拖拽的文件对象
    if (df.items !== undefined) {
      dropFiles = [];
      // Chrome有items属性，对Chrome的单独处理
      for (let i = 0; i < df.items.length; i++) {
        const item = df.items[i];
        // 用webkitGetAsEntry禁止上传文件夹
        if (item.kind === 'file' && item.webkitGetAsEntry().isFile) {
          const file = item.getAsFile();
          dropFiles.push(file);
        }
      }
      if (dropFiles.length !== e.dataTransfer.files.length) {
        toast.error(getTransText('FUJIANBUZHICHI'));
      }
    }
    // if (!dropFiles.length) return;
    isCloudAttachment = false;
    attachmentRef?.current?.scrollIntoView();
    handleFileSelected(dropFiles);
  };

  const removeFromAttachmentList = (id: string) => {
    const uploader = uploaders[id];
    if (uploader) {
      delete uploaders[id];
      uploader.removeAllListeners();
    }
    dispatch({
      type: 'remove',
      id,
    });
  };

  useEffect(() => {
    try {
      editorRef.current?.getEditor()?.focus();
    } catch (e) {}
  }, [props.visible]);

  useEffect(() => {
    if (props.visible && props.sensitiveChecking) {
      setVariableIntroVisible(false);
      setProductTipVisible(false);
    }
  }, [props.visible, props.sensitiveChecking]);

  // useEffect(() => {
  //   if (!fileSelectorRef.current) return;
  //   const el = fileSelectorRef.current;
  //   el.onchange = () => { handleFileSelected(el.files); el.value = ''; };
  //   return function () {
  //     el.onchange = null;
  //   };
  //   // todo 附件变化之后执行
  // }, [handleFileSelected]);

  const comMailFormatAction = useCallback(
    (formatId: number) => {
      changeShowTemplateList({ isShow: true, defaultActiveTab: formatId });
      // 埋点
      if (typeof formatId === 'object') {
        // 点击了模板按钮
        edmDataTracker.trackTemplateBtn();
      } else {
        edmDataTracker.trackTemplateBtnType(formatId);
      }
    },
    [changeShowTemplateList]
  );

  // 图文模板的引导 引导组件包编辑器不好用 所以自己写了一下
  const mailTemplateRemind2 = () => {
    const mailTemplateRemind2 = dataStoreApi.getSync('mailTemplateRemind2').data;
    setFirstUseTemplateState(mailTemplateRemind2 !== 'true');
    dataStoreApi.put('mailTemplateRemind2', 'true');
  };

  // 插入模板到邮件
  const insertTemplate = () => {
    setMailTemplateRemindVisible(false);
    changeShowTemplateList({ isShow: false });

    const templateData = mailTemplate.current;
    if (templateData) {
      if (templateData.form === 'template') {
        mailTemplateRemind2();
      }
      const editor = editorRef.current?.getEditor();
      editor?.insertContent(templateData.entry.content.content);
    }
  };

  // 更改邮件二次提醒弹窗是否下次提醒
  const changeMailTempRemind = async e => {
    setInsertRemindChecked(e.target.checked);
    const val = e.target.checked ? '1' : '0';
    await dataStoreApi.put('mailTemplateRemind', val);
  };

  // 邮件模板二次提醒弹窗点了取消
  const onRemindCancel = async () => {
    setMailTemplateRemindVisible(false);
    changeShowTemplateList({ isShow: true, defaultActiveTab: 1 });
    await changeMailTempRemind({ target: { checked: false } });
  };

  // 点击邮件模板之后
  const getTemplateResult = (data: ViewMail) => {
    mailTemplate.current = data;
    // 图文模板的提醒

    dataStoreApi.get('mailTemplateRemind').then(v => {
      const content = editorRef.current?.getEditor()?.getContent();
      const empty = isEmpty(content ?? '');
      if (v.data === '1' || empty) {
        insertTemplate();
      } else {
        setMailTemplateRemindVisible(true);
        changeShowTemplateList({ isShow: false });
      }
    });
    dispatchWriteContext({
      type: 'setState',
      payload: { templateId: data.id },
    });
  };

  // 插入模板内容
  const addTemplateContent = (content: string) => {
    if (editorRef.current) {
      const editor = editorRef.current?.getEditor();
      editor?.insertContent(content);
    }
  };

  const showMfEdit = (groupId?: string, mfId?: string) => {
    setGroupId(groupId || '');
    setMfId(mfId || '');
    setMfModalState(false);
    setEditState(true);
  };

  const handleEditComplete = async files => {
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
      const editor = editorRef.current?.getEditor();
      if (data && data.data && data.data.url && editor) {
        const src = data.data.url;
        editor.insertContent(`<p></p><img src="${src}" alt="" width="${autoWidth}" height="${autoHeight}" /></p></p>`);
      }
    }
  };

  const handleVariableChange = (value: (number | string)[]) => {
    const editor = editorRef.current?.getEditor();
    const key = value[value.length - 1] as string;
    if (key === 'company') {
      editor?.insertContent('<span class="mce-lx-var mceNonEditable">#{company}</span>');
    } else if (key.indexOf('name') === 0) {
      editor?.execCommand('appendVar', false, key);
    } else {
      editor?.insertContent(`<span class="mce-lx-var mceNonEditable">#{${key}}</span>`);
    }
    setVariableVisible(false);
  };

  const SensitiveResultComp = () => {
    return props.visible && props.sensitiveChecking ? (
      <div className={style.sensitiveResult}>
        <div className={style.sensitiveResultClose} onClick={props.onSensitiveCheckingClose}>
          <CloseIcon />
        </div>
        <div className={style.sensitiveResultTitle}>{`共发现${sensitiveWordsDetected.length}处内容`}</div>
        {Array.isArray(sensitiveWordsDetected) && !!sensitiveWordsDetected.length && (
          <div className={style.sensitiveResultWarning}>{getIn18Text('KENENGSHEJIGUANGGAOXINXIDENG\uFF0CRONGYIBEIPANWEILAJIYOUJIAN\uFF0CJIANYIJINXINGTIHUAN')}</div>
        )}
        {Array.isArray(sensitiveWordsDetected) && !!sensitiveWordsDetected.length ? (
          <div className={style.sensitiveResultContent}>
            <div className={style.sensitiveResultList}>
              {sensitiveWordsDetected.map((item, index) => (
                <div className={style.sensitiveResultItem}>
                  <div className={style.sensitiveResultItemTop}>
                    <div className={style.sensitiveResultItemTopIndex}>{index + 1}</div>
                    <span className={style.sensitiveResultItemTopWord}>{item.word}</span>
                  </div>
                  {item.suggestWords != null && (
                    <div className={style.sensitiveResultItemBottom}>
                      <div className={style.sensitiveResultLabel}>{getIn18Text('KETIHUANWEI：')}</div>
                      <div className={style.sensitiveResultLabel}>{item.suggestWords.join(',')}</div>
                    </div>
                  )}
                  {/* <span>
                    {item.type === 'AVOID' && getIn18Text('JIANYIYOUHUA')}
                    {item.type === 'DANGER' && getIn18Text('JIANYITIHUAN')}
                  </span> */}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className={style.sensitiveResultEmpty}>
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={getIn18Text('ZANWEIFAXIANMINGANCI')} />
          </div>
        )}
      </div>
    ) : null;
  };

  const VariableIntroVisibleComp = () => {
    return props.visible && variableIntroVisible ? (
      <div className={style.variableIntroduce}>
        <Guide guideType={GuideType.InsertVariable} clickClose={() => setVariableIntroVisible(false)} />
      </div>
    ) : null;
  };

  const aiWriteMailUse = (id: string, type: string) => {
    if (type === 'write') {
      onUseAi && onUseAi({ gptRecordId: id, type: 1 });
    }
    if (type === 'retouch') {
      onUseAi && onUseAi({ gptRecordId: id, type: 2 });
    }
  };

  const SourceCodeModalComp = () => {
    return (
      <SourceCodeModal
        visible={sourceCodeModalVisible}
        setVisible={setSourceCodeModalVisible}
        setContent={setContent}
        sourceCode={sourceCode}
        setSourceCode={setSourceCode}
        showVarSelect={showCodeVarSelect}
      />
    );
  };
  const MailEditorComp = () => {
    return (
      <>
        <MailEditor
          sensitiveChecking={props.sensitiveChecking}
          setSourceCodeModalVisible={setSourceCodeModalVisible}
          setSourceCode={setSourceCode}
          templateEmitResult={getTemplateResult}
          sensitiveWords={sensitiveWords}
          sensitiveWordsDetected={sensitiveWordsDetected}
          onSensitiveDetectedChange={setSensitiveWordsDetected}
          defaultContent={props.content || props.signature}
          onEditCreated={handleMailEditorCreated}
          uploadAttachmentAction={handleAttachmentClick}
          scrollSelector="#edmMailContentEditor"
          handleImageUpload={handleImageUpload}
          comMailFormatAction={comMailFormatAction}
          onChange={val => {
            contentOnChange && contentOnChange(val);
            setIsContentChanged(true);
          }}
          source={'market'}
          mailFormatAction={() => setMfModalState(true)}
          initInstanceCallback={initInstanceCallback}
          onVaribleClickAction={pos => {
            setVariablePos({ top: pos.top, left: pos.left - 52 });
            setVariableVisible(true);
            edmDataTracker.track('pc_markting_edm_insert_click', {
              insert_content: getIn18Text('BIANLIANG'),
            });
            props.onSensitiveCheckingClose();
          }}
          onmouseenterofvar={(title, pos) => {
            console.log('onmouseoutofvaronmouseoutofvar', pos);
            if (title === getIn18Text('BIANLIANG')) {
              setVariablePos({ top: pos.top - 32, left: pos.left });
              setVariableVisible(true);
              edmDataTracker.track('pc_markting_edm_insert_click', {
                insert_content: getIn18Text('BIANLIANG'),
              });
            }
            if (title === getIn18Text('SHANGPINXINXI')) {
              setVariableVisible(false);
            }
            props.onSensitiveCheckingClose();
          }}
          onmouseleaveofvar={_ => {
            console.log('onmouseoutofvaronmouseoutofvar xxxxx');
          }}
          variableList={state.variableList}
          editorConfig={{
            plugins: props.plugins || plugins,
            toolbar: props.toolbar || toolbar,
          }}
          ref={editorRef}
          onVaribleGuideClicked={() => {
            setVariableIntroVisible(!variableIntroVisible);
          }}
          aiWriteMailAction={aiWriteMailAction}
          aiWriteMailUse={aiWriteMailUse}
          uploadAttachment={(file, type) => {
            isCloudAttachment = type ?? false;
            handleFileSelected(file as any as FileList);
          }}
          showProductTipAction={showProductTipActionFunc}
        />
      </>
    );
  };

  const aiWriteDidClickFunc = () => {
    edmDataTracker.track('waimao_mail_click_aiWritingemail');
    changeShowAiWriteModal({ show: true });
  };

  const retouchDidClickFunc = () => {
    edmDataTracker.track('waimao_mail_click_aiRephrase');
    changeShowAiOptimizeModal({ show: true });
  };

  const aiWriteMailAction = (type: 'retouch' | 'write') => {
    if (type === 'retouch') retouchDidClickFunc();
    if (type === 'write') aiWriteDidClickFunc();
  };

  // 打开插入商品功能介绍面板
  const showProductTipActionFunc = () => {
    setProductTipVisible(true);
    edmDataTracker.track('email_sitedetail_show');
  };
  // 在插入商品功能介绍面板，点击立即添加按钮
  const showProductModal = () => {
    editorRef.current?.appendProductAction();
    setProductTipVisible(false);
    edmDataTracker.track('email_sitedetail_add');
  };

  const AttachmentListComp = () => {
    return (
      <div ref={attachmentRef} className={`attachment ${style.edmAttachments}`}>
        {attachmentList.length > 0 && (
          <div className="title">
            {getIn18Text('FUJIAN(')}
            {attachmentList.length})
          </div>
        )}
        <div className="attachment-list">
          {attachmentList.map(attachment => (
            <AttachmentItem key={attachment.id} state={attachment} uploader={uploaders[attachment.id]} removeFromList={() => removeFromAttachmentList(attachment.id)} />
          ))}
        </div>
      </div>
    );
  };

  const AttachmentDropComp = () => {
    return (
      <div
        className={style.attachmentDrop}
        onClick={() => {
          setDragging(false);
          setDragenterCount(0);
        }}
        onDrop={handleDrop}
        hidden={!dragging}
      >
        <p className={style.dropUploadTips}>
          <UploadOutlined />
          <span className="text">{getIn18Text('TIANJIAWEIFUJIAN')}</span>
        </p>
      </div>
    );
  };

  const NormalTemplateComp = () => {
    return inEdm ? (
      isEdmWrite() ? (
        <NewTamplateModal insertContent={addTemplateContent} emitResult={getTemplateResult} />
      ) : (
        <TemplateListModalWaimao emitResult={getTemplateResult} templateCategory="LX-WAIMAO" />
      )
    ) : (
      <TemplateListModal emitResult={getTemplateResult} templateCategory="LX-WAIMAO" />
    );
  };
  const PhotoTemplateComp = () => {
    return (
      <>
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
            groupId={groupId}
            mfId={mfId}
            onCompleted={handleEditComplete}
            onCancel={() => setEditState(false)}
            onBack={() => {
              setEditState(false);
              setMfModalState(true);
            }}
          />
        ) : (
          ''
        )}
      </>
    );
  };
  const TemplateSecondryConfrimComp = () => {
    return (
      <Modal width={400} centered visible={mailTemplateRemindVisible} maskClosable={false} onCancel={onRemindCancel} footer={null} closable={false}>
        <div className={style.mailRemindContent}>
          <div className={style.mailRemindLeft}>
            <WarnIcon />
          </div>
          <div className={style.mailRemindRight}>
            <p className={style.mailRemindText}>{getIn18Text('JIANCEDAOXIEXINYEYIYOUNEIRONG\uFF0CMOBANNEIRONGJIANGCHARUDAOXIEXINYENEIRONGHOU')}</p>
            <div className={style.mailRemindFooter}>
              <Checkbox onChange={changeMailTempRemind} checked={insertRemindChecked}>
                {getIn18Text('BUZAITIXING')}
              </Checkbox>
              <div className={style.mailRemindBtns}>
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
    );
  };
  return (
    <>
      {SensitiveResultComp()}
      {VariableIntroVisibleComp()}
      {/* {aiWriteVisible && AiWriteMailComp()} */}
      <div
        className={style.writeMailEditorHeader}
        style={{
          display: props.visible ? undefined : 'none',
          // width: props.sensitiveChecking ? 'calc(100% - 220px)' : 'auto',
        }}
        onDrop={handleDragEnd}
        ref={refDrag}
      >
        <input type="file" ref={fileSelectorRef} multiple style={{ display: 'none' }} />
        <div
          className={style.contentWrapper}
          id="edmMailContentEditor"
          style={{
            width: props.sensitiveChecking ? 'calc(100% - 220px)' : 'auto',
          }}
        >
          <div className={classnames(style.formatGuide)} hidden={!firstUseTemplateState}>
            <div className={classnames(style.formatIcon)}>
              <IconCard type="leftTriangle" stroke="#EBEDF2" />
            </div>
            <div className={classnames(style.formatTitle)}>{getTransText('NEIRONGBIANJI')}</div>
            <div className={classnames(style.formatDesc)}>{getTransText('XUANHAODEMUBAN')}</div>
            <div className={classnames(style.formatFooter)}>
              <div
                className={classnames(style.fromatBtn)}
                onClick={() => {
                  setFirstUseTemplateState(false);
                }}
              >
                {getTransText('ZHIDAOLE')}
              </div>
            </div>
          </div>
          {SourceCodeModalComp()}
          {MailEditorComp()}
          {AttachmentListComp()}
          {AttachmentDropComp()}
        </div>
      </div>
      {/* { 普通模板 } */}
      {NormalTemplateComp()}
      <TemplateAddModal templateCategory="LX-WAIMAO" />
      {/* { 图片模板 } */}
      {PhotoTemplateComp()}
      {/* 插入模板二次提醒弹窗 */}
      {TemplateSecondryConfrimComp()}
      {/* {AiWriteSecondryConfrimComp()} */}
      {
        variableVisible && (
          <InsertVariablModal
            variableVisible={variableVisible}
            trackSource={getIn18Text('ZHENGWEN')}
            onChange={handleVariableChange}
            defaultOpen={true}
            onVisible={visible => !visible && setVariableVisible(false)}
          />
        )

        // <LxPopover top={variablePos.top} left={variablePos.left} visible={true} offset={[0, 30]}>
        //   <InsertVariable trackSource='正文' onChange={handleVariableChange} defaultOpen={true} onVisible={visible => !visible && setVariableVisible(false)} />
        // </LxPopover>
      }
      <LxPopover visible={showAiTooltips} setVisible={setShowAiTooltips} left={AiTooltipsPos.left} top={AiTooltipsPos.top}>
        <AIWriteAttention
          closeTips={() => {
            setShowAiTooltips(false);
          }}
        />
      </LxPopover>
      {/* 插入商品ⓘ功能介绍面板 */}
      {props.visible && productTipVisible && <ProductTip onClose={() => setProductTipVisible(false)} showProductModal={showProductModal} />}
    </>
  );
});
export interface ContentEditorProps {
  onUseAi?: (report: GPTReport) => void;
  sensitiveChecking: boolean;
  onSensitiveCheckingClose: () => void;
  attachmentList: Array<AttachmentInfo>;
  content?: string;
  signature?: string;
  canShowHistoryModal?: boolean;
  /**
   * 是否是营销打开
   */
  isMarketing?: boolean;
  contentOnChange?: (content: string) => void;
  onReady?: () => void;
  toolbar?: string[];
  plugins?: string[];
  showCodeVarSelect?: boolean;
}
export const ATTACHMENT_CONFIG = {
  prefix: '<!--autoAppendStart-->',
  subfix: '<!--autoAppendEnd-->',
};
export function prepareAttachmentsForSend(attachmentList: AttachmentInfo[]) {
  if (attachmentList.length === 0) return '';
  const head = `<div><br/>附件(${attachmentList.length})</div>`;
  // todo download属性应该是文件名称，接口用的链接，暂时保持一致
  const body = attachmentList.map(a => {
    const size = formatFileSize(a.fileSize);
    const expireTime = a.expireTime === 0 ? getIn18Text('WUXIANQI') : moment(a.expireTime).format('yyyy-MM-DD HH:mm');
    return `<div class="netease-sirius-edm-attach" style="font-size: 14px; font-style: normal; font-variant-caps: normal; font-weight: normal; letter-spacing: normal; orphans: auto; text-align: start; text-indent: 0px; text-transform: none; white-space: normal; widows: auto; word-spacing: 0px; -webkit-text-size-adjust: auto; -webkit-text-stroke-width: 0px; text-decoration: none; clear: both; margin-top: 1px; margin-bottom: 1px; font-family: verdana, Arial, Helvetica, sans-serif; border: 1px solid rgb(238, 238, 239); box-shadow: rgba(203, 205, 210, 0.3) 0px 5px 15px; border-top-left-radius: 6px; border-top-right-radius: 6px; border-bottom-right-radius: 6px; border-bottom-left-radius: 6px; color: rgb(38, 42, 51);">
            <div style="background-color: rgb(255, 255, 255); padding: 0px 12px; border-top-left-radius: 12px; border-top-right-radius: 12px; border-bottom-right-radius: 12px; border-bottom-left-radius: 12px; position: relative; background-position: initial initial; background-repeat: initial initial;"><div style="width: 24px; position: absolute; height: 40px; left: 16px; top: 4px;">
                <a href="${a.downloadUrl}">
                <img width="24px" height="24px" src="https://cowork-storage-public-cdn.lx.netease.com/lxbg/2021/06/22/ca9bd44fe5cb439f99b8507c9c0d626d.png" border="0" title="云附件" showheight="24px" showwidth="24px" style="width: 24px; height: 24px;"></a>
            </div>
            <div style="padding-right: 32px; margin-left: 30px; border-bottom-width: 1px; border-bottom-style: solid; border-bottom-color: rgba(38, 42, 51, 0.08); margin-top: 16px; padding-bottom: 16px;">
                <div style="margin-left: 4px;">
                    <div style="padding: 1px; font-size: 14px; line-height: 14px;">
                    <a href="${a.downloadUrl}" target="_blank" rel="noopener" download="${a.downloadUrl}" style="text-decoration: none; color: rgb(38, 42, 51); display: block;">
                        ${a.fileName}
                    </a>
                    </div>
                    <div style="padding: 1px; color: rgb(38, 42, 51); opacity: 0.4; font-size: 12px; margin-top: 4px;">${size} | 过期时间：${expireTime}</div>
                    </div>
                </div>
                <a class="divNeteaseSiriusCloudAttachItem" href="${a.downloadUrl}" download="${a.downloadUrl}" file-id="d4274046ff72415e9480986801e73292" file-name="IMG_2810.MP4" file-size="171757928" expired="0" style="text-decoration: none; display: block; font-size: 12px; line-height: 12px; position: absolute; right: 16px; top: 29px; margin-top: -14px; color: rgb(56, 110, 231);">
                    下载
                </a>
                </div>
            </div>
        <br class="Apple-interchange-newline">`;
  });
  return ATTACHMENT_CONFIG.prefix + head + '<div>' + body.join('') + '</div>' + ATTACHMENT_CONFIG.subfix;
}
export const getContentWithoutAttachment = (content: string) => {
  const appendStart = ATTACHMENT_CONFIG.prefix;
  const appendEnd = ATTACHMENT_CONFIG.subfix;
  if (!content || content.length <= appendEnd.length + appendStart.length) return content;
  let startIndex = content.indexOf(appendStart);
  let endIndex = content.indexOf(appendEnd);
  let c = content;
  while (startIndex > -1 && endIndex > -1) {
    c = c.substring(0, startIndex) + c.substring(endIndex + appendEnd.length);
    startIndex = c.indexOf(appendStart);
    endIndex = content.indexOf(appendEnd);
  }
  return c;
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
