/* eslint-disable camelcase */
/* eslint-disable react/destructuring-assignment */
import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState, useContext, useMemo } from 'react';
import { throttle } from 'lodash';
import { apiHolder, apis, DataStoreApi, MailApi, SensitiveWord, PrevScene } from 'api';
import { Editor as TinyMCEEditor } from '@web-common/tinymce';
import { getSignListAsync, getSignTemplatesAsync } from '@web-common/state/reducer/mailConfigReducer';
import { createNiceModal, useNiceModal } from '@web-common/components/UI/NiceModal/NiceModal';
import SelectSign from '@web-setting/Mail/components/CustomSignForm/select_sign_modal/index';
import { useAppDispatch, useAppSelector } from '@web-common/state/createStore';
import './editor.scss';
import './sensitive.scss';
import juice from 'juice';
import SignEdit from '@web-setting/Mail/components/CustomSignForm/sign_edit_modal/index';
import { DraftEditAdd, edmDataTracker } from '../../tracker/tracker';
import { editorConfig } from '@/components/Layout/editorConfig';
import { EmptyContactType } from '../../send/edmWriteContext';
import { EmptyContactSettingModal } from '../insertVariable/emptyContactModal';
import { SocialLinkModal } from './sociallinkModal';
import { ProductSettingModal } from '../productSettingModal/productSettingModal';
import { QuickAccess } from '../../mailTemplate/quickAccess/quickAccess';
import { ViewMail } from '@web-common/state/state';
import LxEditor from '@web-common/components/UI/LxEditor/LxEditor';
import { getProductsHtml } from './template';
import { edmWriteContext } from '../../send/edmWriteContext';
import { PreHeader } from '../../send/utils/mailClassnameConstant';

const SignEditModal = createNiceModal('signEditOnWaimao', SignEdit);
const SelectSignModal = createNiceModal('selectSignOnWaimao', SelectSign);

export interface uploadAttachmentType {
  clickUploadAttach: boolean;
  usingCloud: boolean;
}

interface EditorProps {
  sensitiveAutoCheck?: boolean;
  sensitiveChecking: boolean;
  sensitiveWords: SensitiveWord[];
  sensitiveWordsDetected: SensitiveWord[];
  onSensitiveDetectedChange: (sensitiveWord: SensitiveWord[]) => void;
  defaultContent?: string;
  scrollSelector: string;
  uploadAttachmentAction: (type: uploadAttachmentType) => void;
  handleImageUpload(blob: File): Promise<string>;
  onEditCreated?: (editor: any) => void;
  onChange?: (val: string) => void;
  onBlur?: (val?: string) => void;
  editorConfig?: Record<string, any>;
  comMailFormatAction?: (formatId: number) => void;
  variableList?: Array<{ variableId: string; variableName: string }>;
  mailFormatAction?: () => void;
  onmouseenterofvar?: (text: string, pos: { top: number; left: number }) => void;
  onmouseleaveofvar?: (text: string) => void;
  onVaribleClickAction?: (pos: { top: number; left: number }) => void;
  onSubscribeClickAction?: (pos: { top: number; left: number }) => void;
  showProductTipAction?: (text: string) => void;
  initInstanceCallback?: () => void;
  setSourceCodeModalVisible: React.Dispatch<boolean>;
  setSourceCode: React.Dispatch<string>;
  onVaribleGuideClicked?: () => void;
  templateEmitResult: (v: ViewMail) => void;
  source: 'general' | 'market';
  aiWriteMailAction?: (type: 'retouch' | 'write') => void;
  aiWriteMailUse?: (id: string, type: string) => void;
  uploadAttachment: (files: File[], cloud?: boolean) => void;
  salespitchActionAction: () => void;
  // 摘要敏感词
  setSensitiveWordsPreheader?: (sensitiveWord: SensitiveWord[]) => void;
  /**
   * 是否是引用原文
   */
  isCopyHeader?: boolean;
}

const fontsFamily = 'Carlibri=Carlibri;' + editorConfig.font_formats;
const mailApi: MailApi = apiHolder.api.requireLogicalApi(apis.mailApiImpl) as unknown as MailApi;
const dataStoreApi = apiHolder.api.getDataStoreApi() as DataStoreApi;
const EmptyContactTypeList = [EmptyContactType.Empty, EmptyContactType.Friend, EmptyContactType.Email];

/**
 * @description: 在替换签名之前对签名字符串进行处理
 * @param {string} signHtml
 * @return {string}
 */
const preSetDign = signHtml => {
  const signJuice = juice(signHtml);
  const lastVal = signJuice.replace(/\n/g, '');
  return lastVal;
};

type SensitiveMark = {
  width: number;
  height: number;
  top: number;
  left: number;
  isFirstNode: boolean;
  word: string;
};

let firstTimeValueChange: boolean = true;

const MailEditor = (props: EditorProps, ref) => {
  const prevScene = (new URLSearchParams(location.href).get('from') as PrevScene) || 'newCreate';
  const page = new URLSearchParams(location.hash.split('?')[1]).get('page');
  const refContainer = useRef<HTMLDivElement>(null);
  const [layerZIndex, setLayerZIndex] = useState(1);
  const editorRef = useRef<TinyMCEEditor | null>(null);
  const [showTemplateQuickAccess, setShowTemplateQuickAccess] = useState<boolean>(true);
  const {
    onVaribleGuideClicked,
    source,
    aiWriteMailAction,
    aiWriteMailUse,
    setSensitiveWordsPreheader,
    sensitiveWords,
    sensitiveChecking,
    sensitiveWordsDetected,
    isCopyHeader,
  } = props;
  const sensitiveWordsRef = useRef(sensitiveWords);
  const signEditModalAttr = useNiceModal('signEditOnWaimao');
  const selectSignModalAttr = useNiceModal('selectSignOnWaimao');

  const dispatch = useAppDispatch();
  const { signList } = useAppSelector(state => state.mailConfigReducer);
  const signListRef = useRef(signList);

  // 模板配置逻辑。如果是二次营销的编辑器需要隐藏从营销任务选择入口。
  const { isEdmModalEditor } = useContext(edmWriteContext)?.value;
  const templateConfig = useMemo(() => (isEdmModalEditor ? [2, 4, 3] : undefined), [isEdmModalEditor]);

  const [sensitiveMarks, setSensitiveMarks] = useState<SensitiveMark[]>([]);
  const [sensitiveLayerScrollX, setSensitiveLayerScrollX] = useState<number>(0);
  const [showEmptyContactModal, setShowEmptyContactModal] = useState(false);
  const [socialLinkOpen, setSocialLinkOpen] = useState<boolean>(false);
  const [showSettingProductModal, setShowSettingProductModal] = useState(false);
  const emptyContactType = useRef(dataStoreApi.getSync('EmptyContactSetting').data || EmptyContactType.Email);
  useEffect(() => {
    signListRef.current = signList;
  }, [signList]);

  useImperativeHandle(ref, () => ({
    getEditor() {
      return editorRef.current;
    },
    insertContent(content?: string) {
      content && editorRef.current?.insertContent(content);
      props.sensitiveAutoCheck && handleSensitiveMarksUpdate();
    },
    appendProductAction,
    sensitiveCheck() {
      handleSensitiveMarksUpdate();
      handleSensitivePreheaderMarksUpdate();
    },
  }));

  useEffect(() => {
    return () => {
      firstTimeValueChange = true;
    };
  }, []);

  useEffect(() => {
    dispatch(getSignTemplatesAsync());
    dispatch(getSignListAsync());
  }, [dispatch]);

  const changeEditor = val => {
    if (!firstTimeValueChange && showTemplateQuickAccess) {
      setShowTemplateQuickAccess(false);
    }
    firstTimeValueChange = false;
    props.onChange && props.onChange(val);
    (props.sensitiveChecking || props.sensitiveAutoCheck) && handleSensitiveMarksUpdate();
  };
  // setContentString
  // eslint-disable-next-line camelcase
  const images_upload_handler = (blobInfo, succFun, failFun) => {
    if (Object.prototype.toString.call(blobInfo.blob()) === '[object File]') {
      props
        .handleImageUpload(blobInfo.blob())
        .then(url => {
          succFun({ url, originUrl: url });
        })
        .catch(failFun);
    }
  };

  const setup = (editor: TinyMCEEditor) => {
    editor.on('blur', () => {
      props.onBlur && props.onBlur(editorRef.current?.getContent());
    });
    editor.on('focusout', () => {
      setLayerZIndex(1);
    });
    // 这个是异步的，数据不一定是新的
    editor.on('ResizeContent', () => {
      (props.sensitiveAutoCheck || props.sensitiveChecking) && handleSensitiveMarksUpdate();
    });
    editor.on('ObjectResized', event => {
      (props.sensitiveAutoCheck || props.sensitiveChecking) && handleSensitiveMarksUpdate();
    });
    editor.on('ScrollContent', event => {
      if (event.target === editorRef.current?.getDoc()) {
        setSensitiveLayerScrollX(event.target.documentElement.scrollLeft);
      }
    });
    /**
     * 修复变量无法修改样式的问题，使用的noneditable插件，目前无官方修复方案
     * https://github.com/tinymce/tinymce/issues/3355
     * 采用了这个hack方案：https://github.com/tinymce/tinymce/issues/3355#issuecomment-1031836965
     */
    var nonEditableClass = editor.getParam('noneditable_noneditable_class', 'mceNonEditable');
    // Register a event before certain commands run that will turn contenteditable off temporarilly on noneditable fields
    editor.on('BeforeExecCommand', function (e) {
      // The commands we want to permit formatting noneditable items for
      var textFormatCommands = ['mceToggleFormat', 'mceApplyTextcolor', 'mceRemoveTextcolor', 'FontSize'];
      if (textFormatCommands.indexOf(e.command) !== -1) {
        // Find all elements in the editor body that have the noneditable class on them
        //  and turn contenteditable off
        editor
          .$(editor.getBody())
          .find('.' + nonEditableClass)
          .attr('contenteditable', null);
      }
    });
    // Turn the contenteditable attribute back to false after the command has executed
    editor.on('ExecCommand', function (e) {
      // Find all elements in the editor body that have the noneditable class on them
      //  and turn contenteditable back to false
      editor
        .$(editor.getBody())
        .find('.' + nonEditableClass)
        .attr('contenteditable', false);
    });

    editorRef.current = editor;
    props.onEditCreated && props.onEditCreated(editor);
  };

  const edInitCallback = ed => {
    // todo: 当收件人不为空，焦点自动放到编辑器

    /**
     * The following two hacks fix some weirdness with the way the textcolor
      plugin works - namely, it was attemping to apply color and background-color
      directly on the element that had the noneditable css class on it instead of putting
      a span around it as underline does.
     *
     **/
    ed.formatter.get('forecolor')[0].exact = true;
    ed.formatter.get('hilitecolor')[0].exact = true;
    props.initInstanceCallback && props.initInstanceCallback();

    const eventsMap = {
      MouseEvents: ['mousedown', 'click'],
    };
    Object.keys(eventsMap).forEach(key => {
      const events = eventsMap[key];
      events.forEach(eventName => {
        ed.on(eventName, () => {
          if (document) {
            const event = document.createEvent(key);
            event.initEvent(eventName, true, false);
            document.dispatchEvent(event);
          }
        });
      });
    });
  };

  const signature_action_handler = useCallback(() => {
    if (signListRef.current && signListRef.current.length > 0) {
      selectSignModalAttr.show();
    } else {
      signEditModalAttr.show();
    }
  }, [signList]);

  const clickLayer = () => {
    // cliclEd();
    if (editorRef.current) {
      setLayerZIndex(0);
      editorRef?.current?.focus();
    }
  };

  const config = { ...editorConfig, font_formats: fontsFamily, ...props.editorConfig };

  const getTextNodesByDocument = (document?: Document, excludeSelector?: string) => {
    if (!document) return [];

    const textNodes: Node[] = [];

    const loop = (node: Node) => {
      if (node.childNodes.length && node?.nodeName.toLowerCase() !== 'style' && (node as HTMLDivElement)?.id !== excludeSelector) {
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

  const handleSensitiveCore = (document: Document, excludeSelector?: string) => {
    // // 获取正文除了摘要
    // const document = editorRef.current?.getDoc() as Document;
    // // 获取摘要
    // const document = editorRef.current?.getDoc().querySelector();
    const documentRect = document?.documentElement?.getBoundingClientRect() || new DOMRect(0, 0, 0, 0);
    const documentTextNodes: Node[] = getTextNodesByDocument(document, excludeSelector);
    const sensitiveMarkMap: { [word: string]: SensitiveMark[] } = {};
    const nextSensitiveWordsDetected: SensitiveWord[] = [];

    // const { sensitiveWords, onSensitiveDetectedChange } = props;
    const sensitiveWords = sensitiveWordsRef.current;
    if (sensitiveWords.length === 0 || documentTextNodes.length === 0) {
      return;
    }

    const markTextNode = (textNode: Node) => {
      const nodeValue = textNode.nodeValue || '';

      sensitiveWords.forEach(wordItem => {
        const { word, equal_type, suggestWords = [] } = wordItem;
        let wordForRegExp = '';
        if (/[a-zA-Z]/.test(word)) {
          // 如果英文单词，需要加单词边界匹配
          wordForRegExp = '\\b' + word.replace(/[\[\]\(\)\{\}\.\*\+\?\^\$\\\|]/g, $1 => `\\${$1}`).trim() + '\\b';
        } else {
          // 如果是100%或者其他字符，不能加单词边界
          wordForRegExp = '\\b' + word.replace(/[\[\]\(\)\{\}\.\*\+\?\^\$\\\|]/g, $1 => `\\${$1}`).trim();
        }
        // const ignore = equal_type === 'IGNORE_CASE';
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

  // 处理摘要的敏感词
  const handleSensitivePreheaderMarksUpdate = () => {
    const document = editorRef.current?.getDoc()?.querySelector(`#${PreHeader}`) as any as Document;
    let nextSensitiveWordsDetected: SensitiveWord[] = [];
    if (document != null) {
      const res = handleSensitiveCore(document);

      if (res != null) {
        nextSensitiveWordsDetected = res.nextSensitiveWordsDetected;
      }
    }
    setSensitiveWordsPreheader && setSensitiveWordsPreheader(nextSensitiveWordsDetected);
  };

  // 敏感词检测相关
  const handleSensitiveMarksUpdate = () => {
    const { onSensitiveDetectedChange } = props;
    const document = editorRef.current?.getDoc() as Document;
    const res = handleSensitiveCore(document, PreHeader);

    const { nextSensitiveMarks, nextSensitiveWordsDetected } = res || {
      nextSensitiveMarks: [],
      nextSensitiveWordsDetected: [],
    };
    setSensitiveMarks(nextSensitiveMarks);
    onSensitiveDetectedChange(nextSensitiveWordsDetected);
  };

  useEffect(() => {
    if (props.sensitiveChecking || props.sensitiveAutoCheck) {
      handleSensitiveMarksUpdate();
      handleSensitivePreheaderMarksUpdate();
    }
  }, [props.sensitiveChecking, props.sensitiveWords]);

  useEffect(() => {
    sensitiveWordsRef.current = props.sensitiveWords;
  }, [props.sensitiveWords]);

  const getSensitiveDetectedIndex = (word: string) => props.sensitiveWordsDetected.findIndex(wordItem => wordItem.word === word) + 1;

  const onAppendContactName = () => {
    console.log('lxAppendVar', 'onAppendContactName');
    const idx = EmptyContactTypeList.indexOf(emptyContactType.current as EmptyContactType);
    if (idx > -1) {
      editorRef.current?.execCommand('appendVar', false, 'name_' + idx);
    }
  };
  const onSettingContactName = () => {
    onVaribleGuideClicked && onVaribleGuideClicked();
  };

  function socialLinkAction() {
    setSocialLinkOpen(true);
  }

  function addSocialLink(
    options: Array<{
      type: string;
      link: string;
      imgUrl: string;
      text: string;
    }>
  ) {
    const editor = editorRef.current;
    if (editor) {
      editor.undoManager.transact(function () {
        let linkHtml = '';
        options.forEach(item => {
          let link = item.link;
          if (item.type === 'Whatsapp' && /^(\d)+$/.test(item.link)) {
            link = `https://wa.me/?phone=${item.link}`;
          }
          linkHtml += `<a class="edm-social-link" href="${link}" style="background-color:transparent;text-decoration:none;">
            <span style="position: relative;margin: 0px 3px;white-space: initial !important;word-wrap: initial !important;word-break: initial !important;">
              <span style="width:0;">&emsp;</span>
              <img 
                style="position:absolute;top:0;left:0;height:100% !important;" 
                src="${item.imgUrl}"
              />
            </span>${item.text ? `<span style="flex-shrink: 0;">${item.text}</span>` : ''}
          </a>  `;
        });
        // linkHtml = `<a href="${link}" style="background-color:transparent;text-decoration:none;">
        //     <span style="position: relative;margin: 0px 3px;">
        //       <span style="width:0;">&emsp;</span>
        //       <img
        //         style="position:absolute;top:0;left:0;height:100% !important;"
        //         src="${imgUrl}"
        //       />
        //     </span>
        //     ${text ? `<span style="flex-shrink: 0;">${text}</span>` : ''}
        //   </a>`;
        editor.insertContent(linkHtml.trim());
        editor.insertContent('  ');
      });
    }
  }

  const TemplateQuickAccessComp = () => {
    const scene = prevScene || 'newCreate';
    // page==='aiHosting' 营销托管，营销信编辑，不需要展示模板的快捷使用
    return scene === 'copyTask' || scene === 'template' || scene === 'uniTemplate' || scene === 'draft' || page === 'aiHosting' || page === 'aiHostingNew' ? null : (
      <div style={showTemplateQuickAccess ? { display: 'block' } : { display: 'none' }}>
        <QuickAccess
          insertProdInfoFunc={() => appendProductAction()}
          templateDidClickFunc={viewMail => {
            props.templateEmitResult(viewMail);
          }}
          moreTemplateFunc={() => {
            props.comMailFormatAction && props.comMailFormatAction(1);
          }}
          closeDidClickFunc={() => {
            setShowTemplateQuickAccess(false);
          }}
        ></QuickAccess>
      </div>
    );
  };

  const appendProductAction = () => {
    setShowSettingProductModal(true);
    edmDataTracker.track('email_addgoods_click'); // 插入商品入口点击
  };

  /**
   * 向编辑器插入商品信息
   * @param tab
   * @param lists
   * @param columns
   * @param fieldsMap
   * @returns
   */
  const handleAddProducts = (tab: number, lists: any[], columns: string[], fieldsMap: any, imgSize: number, siteId: string) => {
    const html = getProductsHtml(tab, lists, columns, fieldsMap, imgSize, siteId);
    editorRef.current?.undoManager.transact(function () {
      editorRef.current?.insertContent(html);
    });
    edmDataTracker.track('email_addgoods_done'); // 插入商品成功
  };

  // 修改了行高
  const lastUseFont = (data: { key: any; value: any }) => {
    dataStoreApi.put(`edm-${data.key}`, data.value);
  };

  return (
    <>
      <div className="editor-container edm-editor-container" ref={refContainer}>
        <div className="editor-sensitive-layer" style={{ marginLeft: -1 * (sensitiveLayerScrollX || 0) }}>
          <div className="editor-sensitive-content">
            {props.sensitiveChecking &&
              sensitiveMarks.map((item, index) => (
                <div
                  className="editor-sensitive-mark"
                  style={{
                    top: item.top + (isCopyHeader ? 50 : 7),
                    // todo 去掉＋16
                    left: item.left,
                    width: item.width,
                    height: item.height + 5,
                  }}
                  key={index}
                >
                  {item.isFirstNode && <div className="editor-sensitive-mark-index">{getSensitiveDetectedIndex(item.word)}</div>}
                </div>
              ))}
          </div>
        </div>
        <div className="editor-container-layer" onClick={clickLayer} onMouseEnter={clickLayer} style={{ zIndex: layerZIndex, top: 0, left: 0 }} />
        <LxEditor
          initialValue={props.defaultContent}
          init={{
            setup,
            uploadAttachmentAction: props.uploadAttachmentAction,
            setSourceCodeModalVisible: props.setSourceCodeModalVisible,
            onmouseenterofvar: props.onmouseenterofvar,
            onmouseleaveofvar: props.onmouseleaveofvar,
            onVaribleClickAction: props.onVaribleClickAction,
            onSubscribeClickAction: props.onSubscribeClickAction,
            setSourceCode: props.setSourceCode,
            init_instance_callback: edInitCallback,
            scrollSelect: props.scrollSelector,
            uploadAttachment: props.uploadAttachment,
            salespitchActionAction: props.salespitchActionAction,
            images_upload_handler,
            signatureActionAction: signature_action_handler,
            socialLinkAction,
            ...config,
            min_height: 80,
            comMailFormatAction: props.comMailFormatAction,
            mailFormatAction: props.mailFormatAction,
            uploadAttachmentConfig: [0, 1],
            templateConfig,
            lxAppendVar: {
              onClick() {
                edmDataTracker.trackDraftEditAdd(DraftEditAdd.ContactName);
              },
              onAppendContactName,
              onSettingContactName,
              variableList: props.variableList,
            },
            appendProductAction,
            showProductTipAction: props.showProductTipAction,
            toolbar_mode: 'scrolling',
            last_use: lastUseFont,
          }}
          aiWriteMailAction={aiWriteMailAction}
          source={source}
          aiWriteMailUse={aiWriteMailUse}
          onEditorChange={throttle(changeEditor, 500)}
        />
        {signList.length > 0 && (
          <SelectSignModal
            signList={signList}
            signEditId="signEditOnWaimao"
            signSelectId="selectSignOnWaimao"
            onSave={(signHtml: string) => {
              const lastVal = preSetDign(signHtml);
              editorRef.current?.fire('modifySignature', {
                sigContent: mailApi.doTransferSign(`<div class='mail-signature' onselectstart="return false">${lastVal}</div>`),
              });
            }}
          />
        )}
        <SignEditModal signEditId="signEditOnWaimao" />
        <EmptyContactSettingModal
          visible={showEmptyContactModal}
          value={emptyContactType.current as EmptyContactType}
          onClose={() => setShowEmptyContactModal(false)}
          onOk={value => {
            setShowEmptyContactModal(false);
            emptyContactType.current = value;
          }}
        />
        <SocialLinkModal visible={socialLinkOpen} onAdd={addSocialLink} onCancel={() => setSocialLinkOpen(false)} />
        <ProductSettingModal
          onShow={() => setShowSettingProductModal(true)}
          onAdd={handleAddProducts}
          visible={showSettingProductModal}
          onClose={() => setShowSettingProductModal(false)}
        />
      </div>
      {TemplateQuickAccessComp()}
    </>
  );
};

export default forwardRef(MailEditor);
