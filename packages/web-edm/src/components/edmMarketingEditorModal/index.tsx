import React, { useState, useEffect, useRef, useMemo, useImperativeHandle, useReducer } from 'react';
import { apis, apiHolder, MailApi, MailSignatureApi, SystemApi, EdmContentInfo, EdmEmailType, DataStoreApi, platform, EdmSendBoxApi } from 'api';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import { InsertVariablModal } from '../insertVariable/insertVariableModal';
import IconCard from '@web-common/components/UI/IconCard/index';
import { Popover, Space, Button, Input, message } from 'antd';
import { ContentEditor } from '../../send/contentEditor';
import style from './edmMarketingEditorModal.module.scss';
import { edmDataTracker } from '../../tracker/tracker';
import classnames from 'classnames';
import { edmWriteContext, writeContextReducer, EmptyContactType, IEdmWriteState } from '../../send/edmWriteContext';
import { uniq } from 'lodash';
import { encodeHTML, guardString } from '../../utils';
import { isMac } from '@web-mail/util';
import { getIn18Text } from 'api';
import useState2SalesPitchReduxMock from '@/components/Layout/EnterpriseSetting/salesPitch/utils/useState2ReduxMock';

const mailApi: MailApi = apiHolder.api.requireLogicalApi(apis.mailApiImpl) as unknown as MailApi;
const systemApi = apiHolder.api.getSystemApi() as SystemApi;
const mailSigApi = apiHolder.api.requireLogicalApi(apis.mailSignatureImplApi) as unknown as MailSignatureApi;
const dataStoreApi = apiHolder.api.getDataStoreApi() as DataStoreApi;
const edmApi = apiHolder.api.requireLogicalApi(apis.edmSendBoxApiImpl) as EdmSendBoxApi;
export interface EdmEditorValues {
  emailContent: string;
  emailAttachment: string;
  emailSubject: string;
}
export enum UnsubscribeTextLan {
  zh = 'zh',
  en = 'en',
}
// const unsubscribeUrl = 'https://sirius-it-edm.qiye.163.com/unsubscribe_zh.html';
// const unsubscribeEnUrl = 'https://sirius-it-edm.qiye.163.com/unsubscribe_en.html';
interface EditorModalProps {
  visible: boolean;
  emailContent: string;
  emailAttachment: string;
  emailSubject?: string;
  subjectVisible?: boolean;
  onCancel: () => void;
  onSave: (values: EdmContentInfo) => void;
  needModal?: boolean;
  destroyOnClose?: boolean;
  templateSource?: string;
  emailSenderEmail?: string;
}
const isEdmWeb = systemApi.isWebWmEntry();
const isWindows = systemApi.isElectron() && !isMac;

const toolbarWithVar = [
  'lxuploadattachment $split lxappendvar $split lxmailformat $split lxsignature $split lxsociallink $split lxaiwritemail $split lxoptimizecontent lxAIWriteManual $split lxsubscribe lxsubscribetip $split lxsalespitch',
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

const EditorModal: React.FC<EditorModalProps> = React.forwardRef((props, ref) => {
  const {
    visible,
    emailContent,
    emailAttachment,
    emailSubject,
    subjectVisible,
    onCancel,
    onSave,
    needModal = true,
    destroyOnClose = true,
    templateSource,
    emailSenderEmail,
  } = props;
  const [variableVisible, setVariableVisible] = useState(false); // 变量弹窗
  const [signature, setSignature] = useState('');
  const [subject, setSubject] = useState(emailSubject || '');
  const contentRef = useRef<any>();
  const subjectInputRef = useRef<any>();
  const [state, dispatch] = useReducer(writeContextReducer, {
    currentStage: 0,
    canSend: false,
    isReady: false,
    editorCreated: false,
    draftId: undefined,
    edmEmailId: undefined,
    emptyContactType: dataStoreApi.getSync('EmptyContactSetting').data || EmptyContactType.Email,
    templateParamsFromEditor: [] as unknown,
  } as IEdmWriteState);
  const attachmentList = useMemo(() => {
    let attachmentList = [];
    try {
      attachmentList = JSON.parse(emailAttachment);
    } catch (error) {}
    return attachmentList || [];
  }, [emailAttachment]);
  const refresh = async () => {
    await edmApi.refreshUnsubscribeUrl(emailSenderEmail);
  };

  useEffect(() => {
    refresh();
    mailSigApi.doGetDefaultSign().then(sig => {
      if (sig && sig.enable && sig.content) {
        let contentCombine = '';
        // 邮件本身有内容开头处加空行
        contentCombine = `<div><br/></div><div><br/></div>${sig.content}`;
        const nextSignature = mailApi.doTransferSign(contentCombine);
        setSignature(nextSignature);
      }
    });
  }, []);
  const handleAddUnsubscribeText = async (lan: UnsubscribeTextLan) => {
    edmDataTracker.track('pc_markting_edm_writeMailPage_unsubscribe_click', {
      unsubscribe_type: lan === UnsubscribeTextLan.zh ? getIn18Text('ZHONGWENWENAN') : getIn18Text('YINGWENWENAN'),
    });
    if (!contentRef.current) return;
    const editor = contentRef.current.getEditor();
    await edmApi.refreshUnsubscribeUrl(emailSenderEmail || '');
    editor.undoManager.transact(function () {
      // const url = unsubscribeUrl + '?host=#{t_host}&sign=#{t_p1}&from=#{t_p2}';
      // const enUrl = unsubscribeEnUrl + '?host=#{t_host}&sign=#{t_p1}&from=#{t_p2}';
      // let text;
      // if (lan === UnsubscribeTextLan.zh) {
      //   text = `<p>如不想收到此类邮件，<a href="${url}" target="_blank" class="edm-unsubscribe">点击退订</a></p>`;
      // } else {
      //   text = `<p>If you don't want to receive our emails, you can easily <a href="${enUrl}" target="_blank" class="edm-unsubscribe">unsubscribe</a> here.</p>`;
      // }
      const text = edmApi.handleUnsubscribeText(lan);
      editor.insertContent(text);
    });
  };

  useImperativeHandle(ref, () => ({
    getContentReference() {
      return contentRef;
    },
  }));

  const handleSave = () => {
    if (subjectVisible && (!subject || subject.length === 0)) {
      message.warn({ content: getIn18Text('QINGSHURUYOUJIANZHUTI') });
      return;
    }
    let preText = contentRef.current?.getEditor()?.getContent({ format: 'text' }) as string;
    if (!guardString(preText)) {
      message.warn({ content: '请输入邮件内容' });
      return;
    }

    onSave(getSendCommonParams());
  };

  const getSendCommonParams = (): EdmContentInfo => {
    const attachmentList = contentRef.current?.getAttachmentList();
    const vars = contentRef.current?.getVars();
    const links: string[] = contentRef.current?.getLinks() || [];
    const productInfos: Array<{ productId: string; productLink: string; siteId: string }> = contentRef.current?.getProductsInfo();
    const titleVars: string[] = [];
    subject.replace(/#\{(\S+)\}/g, (_: string, $1) => {
      if (titleVars.indexOf($1) === -1) {
        titleVars.push($1);
      }
      return _;
    });
    const editor = contentRef.current?.getEditor();
    const editorBody = editor?.getBody();

    // 邮件摘要需要添加
    if (editorBody) {
      const holderDiv: Element = editorBody.querySelector('#preheader-waimao');
      if (holderDiv) {
        holderDiv.remove();
      }
      if (subject) {
        editorBody.insertAdjacentHTML(
          'afterbegin',
          `<span id="preheader-waimao" id="9999" style="display: none !important; font-size:0; line-height:0">${subject}</span>`
        );
      }
    }
    const content = contentRef.current?.getContentWithAttachment();

    let contentEditInfo: EdmContentInfo = {
      emailContent: content,
      emailAttachment: attachmentList && attachmentList.length ? JSON.stringify(attachmentList) : '',
      templateParams: uniq(titleVars.concat(vars || []).concat(state.templateParamsFromEditor)).join(','),
      traceLinks: links.map(link => ({ traceUrl: link, escapedTraceUrl: encodeHTML(link) })),
      edmSendProductInfos: productInfos,
      subject: subject,
      emailReceipt: 0,
    };

    if (state.templateId !== undefined) {
      contentEditInfo.templateId = state.templateId;
      contentEditInfo.emailType = EdmEmailType.USE_TEMPLATE;
    } else {
      contentEditInfo.emailType = EdmEmailType.CREATE_EMAIL;
    }
    return contentEditInfo;
  };
  const appendVarMulti = (value: string[]) => {
    const variable = value[value.length - 1];
    // const input = document.querySelectorAll('.edm-email-subject-item input')[index] as HTMLInputElement;
    const input = subjectInputRef.current?.input;
    // const subjects = form.getFieldValue('emailSubjects');
    const oldVal = subject || '';
    const insertContent = ` #{${variable}}`;
    let newVal = oldVal + insertContent;
    if (input && oldVal) {
      newVal = oldVal.substring(0, input.selectionStart) + insertContent + oldVal.substring(input.selectionEnd);
    }
    // const copy = [...subjects];
    // copy[index] = { subject: newVal };
    // form.setFieldsValue({ emailSubjects: copy });
    setSubject(newVal);
    // edmDataTracker.track('pc_markting_edm_sendprocess_setting_Contact_click');
  };

  // 话术库相关---------------
  // 控制话术库抽屉的visible
  const [, setEdmMailOuterDrawerVisible] = useState2SalesPitchReduxMock('edmMailOuterDrawerVisible');
  // 跟单话术库，点击使用
  const [edmMailSalesPitch, setEdmMailSalesPitch] = useState2SalesPitchReduxMock('edmMailSalesPitch');

  // 如果点击的话术库变化，则插入新的话术库
  useEffect(() => {
    if (edmMailSalesPitch && edmMailSalesPitch.discourseContent) {
      // 插入话术内容
      contentRef.current?.insertContent(edmMailSalesPitch.discourseContent || '');
      // 1秒后清除
      setTimeout(() => {
        setEdmMailSalesPitch(null);
      }, 1000);
    }
  }, [edmMailSalesPitch?.discourseContent]);
  // 话术库相关---------------

  const renderEditor = useMemo(
    () => (
      <edmWriteContext.Provider value={{ value: { state, dispatch, isEdmModalEditor: true } }}>
        <ContentEditor
          readonly={false}
          visible={true}
          ref={contentRef}
          content={emailContent}
          signature={signature}
          attachmentList={attachmentList}
          canShowHistoryModal={false}
          toolbar={toolbarWithVar}
          showCodeVarSelect={true}
          templateSource={templateSource}
          salespitchActionAction={() => {
            // 点击跟单话术库
            setEdmMailOuterDrawerVisible(true);
          }}
        />
      </edmWriteContext.Provider>
    ),
    [emailContent, signature, attachmentList]
  );

  const renderFooter = () => (
    <div className={style.footer}>
      <div className={style.footerContent}>
        <span className={style.unsubscribe}>
          {getIn18Text('WENMOTIANJIA')}
          <Popover
            overlayClassName={style.unsubscribePopover}
            content={
              <Space>
                <Button size="small" onClick={() => handleAddUnsubscribeText(UnsubscribeTextLan.en)}>
                  {getIn18Text('YINGWENWENAN')}
                </Button>
                <Button size="small" onClick={() => handleAddUnsubscribeText(UnsubscribeTextLan.zh)}>
                  {getIn18Text('ZHONGWENWENAN')}
                </Button>
              </Space>
            }
          >
            <a>{getIn18Text('TUIDINGWENAN')}</a>
          </Popover>
          {getIn18Text('\uFF0CYOUZHUYUJIANGDIBEIPANWEILAJIYOUJIANDEFENGXIAN')}
        </span>
      </div>
      <div className={style.footerButtons}>
        <Button onClick={onCancel}>{getIn18Text('QUXIAO')}</Button>
        <Button type="primary" onClick={handleSave}>
          {getIn18Text('QUEDING')}
        </Button>
      </div>
    </div>
  );

  return (
    <>
      <Modal
        className={classnames(style.edmEditorModal, needModal ? style.edmEditorModal2 : '', isEdmWeb ? style.edmEditorModalWeb : '', isWindows ? style.windowsOnly : '')}
        visible={visible}
        title={'编辑邮件内容'}
        width={900}
        okText={getIn18Text('BAOCUN')}
        onCancel={onCancel}
        onOk={handleSave}
        maskClosable={false}
        footer={<>{renderFooter()}</>}
        zIndex={999}
        destroyOnClose={destroyOnClose}
        maskStyle={{
          top: 0,
        }}
        transitionName=""
        maskTransitionName=""
      >
        {subjectVisible && (
          <div className={classnames(style.edmEditorModalBodyHeader)}>
            <p className={classnames(style.mailSubject)}>
              <span>{getIn18Text('YOUJIANZHUTI')}:</span>
              <Input ref={subjectInputRef} className={classnames(style.subject)} bordered={false} value={subject} onChange={e => setSubject(e.target.value)} />
            </p>
            <p className={classnames(style.mailSubjectVar)} onClick={() => setVariableVisible(true)}>
              {/* <IconCard type="jichu_jiagou" /> */}
              插入变量
            </p>
          </div>
        )}
        {renderEditor}
      </Modal>
      <InsertVariablModal
        variableVisible={variableVisible}
        trackSource={getIn18Text('ZHUTI')}
        onChange={v => {
          appendVarMulti(v as string[]);
          setVariableVisible(false);
        }}
        defaultOpen={true}
        onVisible={visible => {
          !visible && setVariableVisible(false);
        }}
      />
    </>
  );
});
export default EditorModal;
