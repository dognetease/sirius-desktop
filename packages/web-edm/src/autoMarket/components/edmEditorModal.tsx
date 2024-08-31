import React, { useState, useEffect, useRef, useMemo, useImperativeHandle } from 'react';
import { apis, apiHolder, MailApi, MailSignatureApi, SystemApi, EdmSendBoxApi } from 'api';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import { Popover, Space, Button } from 'antd';
import { ContentEditor } from './contentEditor';
import style from './edmEditorModal.module.scss';
import { edmDataTracker } from '../../tracker/tracker';
import classnames from 'classnames';
import { getIn18Text } from 'api';

const mailApi: MailApi = apiHolder.api.requireLogicalApi(apis.mailApiImpl) as unknown as MailApi;
const systemApi = apiHolder.api.getSystemApi() as SystemApi;
const mailSigApi = apiHolder.api.requireLogicalApi(apis.mailSignatureImplApi) as unknown as MailSignatureApi;
const edmApi = apiHolder.api.requireLogicalApi(apis.edmSendBoxApiImpl) as EdmSendBoxApi;

export interface EdmEditorValues {
  emailContent: string;
  emailAttachment: string;
}
export enum UnsubscribeTextLan {
  zh = 'zh',
  en = 'en',
}
// export const unsubscribeUrl = 'https://sirius-it-edm.qiye.163.com/unsubscribe_zh.html';
// export const unsubscribeEnUrl = 'https://sirius-it-edm.qiye.163.com/unsubscribe_en.html';
interface EditorModalProps {
  visible: boolean;
  emailContent: string;
  emailAttachment: string;
  onCancel: () => void;
  onSave: (values: EdmEditorValues) => void;
  needModal?: boolean;
  destroyOnClose?: boolean;
  isReMarketing?: boolean;
}
const isEdmWeb = systemApi.isWebWmEntry();

const toolbarWithVar = [
  'lxuploadattachment $split lxappendvar $split lxmailformat $split lxsignature $split lxsociallink $split lxaiwritemail $split lxoptimizecontent lxAIWriteManual',
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
  const { visible, isReMarketing, emailContent, emailAttachment, onCancel, onSave, needModal = true, destroyOnClose = true } = props;
  const [signature, setSignature] = useState('');
  const contentRef = useRef<any>();
  const attachmentList = useMemo(() => {
    let attachmentList = [];
    try {
      attachmentList = JSON.parse(emailAttachment);
    } catch (error) {}
    return attachmentList || [];
  }, [emailAttachment]);
  useEffect(() => {
    edmApi.refreshUnsubscribeUrl();
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
    await edmApi.refreshUnsubscribeUrl();

    editor.undoManager.transact(function () {
      const text = edmApi.handleUnsubscribeText(lan);
      // const url = unsubscribeUrl + '?host=#{t_host}&sign=#{t_p1}&from=#{t_p2}';
      // const enUrl = unsubscribeEnUrl + '?host=#{t_host}&sign=#{t_p1}&from=#{t_p2}';
      // let text;
      // if (lan === UnsubscribeTextLan.zh) {
      //   text = `<p>如不想收到此类邮件，<a href="${url}" target="_blank" class="edm-unsubscribe">点击退订</a></p>`;
      // } else {
      //   text = `<p>If you don't want to receive our emails, you can easily <a href="${enUrl}" target="_blank" class="edm-unsubscribe">unsubscribe</a> here.</p>`;
      // }
      editor.insertContent(text);
    });
  };

  useImperativeHandle(ref, () => ({
    getContentReference() {
      return contentRef;
    },
  }));

  const handleSave = () => {
    const emailContent = contentRef.current?.getContent();
    let emailAttachment = '';
    try {
      const attachmentList = contentRef.current?.getAttachmentList() || [];
      if (attachmentList.length) {
        emailAttachment = JSON.stringify(attachmentList);
      }
    } catch (error) {}
    onSave({ emailContent, emailAttachment });
  };

  const renderEditor = useMemo(
    () => (
      <ContentEditor
        sensitiveChecking={false}
        onSensitiveCheckingClose={() => {}}
        readonly={false}
        visible={true}
        ref={contentRef}
        content={emailContent}
        signature={signature}
        attachmentList={attachmentList}
        canShowHistoryModal={false}
        toolbar={toolbarWithVar}
        showCodeVarSelect={true}
      />
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
        {/* <Button onClick={onCancel}>预览</Button> */}
        <Button type="primary" onClick={handleSave}>
          {getIn18Text('QUEDING')}
        </Button>
      </div>
    </div>
  );

  return (
    <Modal
      // className={`${style.edmEditorModal} ${needModal ? style.edmEditorModal2 : ''} ${systemApi.isWebWmEntry()}`}
      className={classnames(style.edmEditorModal, needModal ? style.edmEditorModal2 : '', isEdmWeb ? style.edmEditorModalWeb : '')}
      visible={visible}
      title={getIn18Text('BIANJIYOUJIAN')}
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
      {renderEditor}
    </Modal>
  );
});
export default EditorModal;
