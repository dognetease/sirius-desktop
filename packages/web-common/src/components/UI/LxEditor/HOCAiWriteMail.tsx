import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Editor as EditorType } from '@web-common/tinymce';
import { Modal, Button, Checkbox } from 'antd';
import toast from '@web-common/components/UI/Message/SiriusMessage';
import aiIntro from '@/images/aiIntro.gif';
import { apiHolder, DataStoreApi } from 'api';
import { AiWriteMail } from '@web-edm/send/AiWriteMail';
import { getMailContentText, isEmpty } from '@web-edm/send/utils/getMailContentText';
import LxPopover from '../LxPopover/LxPopover';
import WarnIcon from '@web-common/components/UI/Icons/svgs/WarnSvg';
import style from './editor.module.scss';
import { getIn18Text, api, apis, EdmSendBoxApi } from 'api';
export interface AiWriteMailtype {
  onUse: (id: string, type: string) => void;
  type: 'retouch' | 'write';
  originalContent: string | undefined;
  visible: boolean;
  onClose: () => void;
  aiInsertContent: (content: string) => void;
}

export const AIWriteAttention = ({ closeTips }: { closeTips: () => void }) => {
  return (
    <div className={style.AIWriteContention}>
      <img src={aiIntro} alt="" />
      <div className={style.info}>
        <div className={style.title}>新增AI写信及润色能力！</div>
        <div className={style.infoMsg}>AI帮你写邮件，只需要输入指令，即可帮您生成专业得体的邮件内容</div>
      </div>
      <div className={style.bottom}>
        <Button
          onClick={closeTips}
          type="primary"
          style={{
            width: 76,
          }}
        >
          知道了
        </Button>
      </div>
    </div>
  );
};

const dataStoreApi = apiHolder.api.getDataStoreApi() as DataStoreApi;

const HOCAiWriteMail = (Component: typeof React.Component) => {
  const AiWriteMailWrapped = (props: any) => {
    const { ref, aiWriteMailAction, source, aiWriteMailUse, onEditCreated, ...rest } = props;
    const [aiWriteType, setAiWriteType] = useState<'write' | 'retouch' | 'select'>('write');
    const editorRef = useRef<any>();
    const aiWriteTemplate = useRef<null | string>(null);
    const [aiWriteVisible, setAiWriteVisible] = useState(false);
    // ai模板插入邮件二次提醒弹窗可见性
    const [aiWriteRemindVisible, setAiWriteRemindVisible] = useState(false);
    // ai模板插入邮件二次提醒弹窗不再提醒
    const [insertAiWriteRemindChecked, setInsertAiWriteRemindChecked] = useState(false);

    const [AIWriteContentionShow, setAIWriteContentionShow] = useState(false);

    const [attentionPos, setAttentionPos] = useState({ top: 0, left: 0 });

    const [refreshCount, setRefreshCount] = useState<number>(0);

    const [content, setContent] = useState('');

    const getCurrentMailText = useCallback(
      type => {
        if (type === 'select') {
          return editorRef.current?.selection.getContent({ format: 'text' });
        }
        const editorBody = editorRef.current?.getContent();
        if (editorBody) {
          return getMailContentText(editorBody, true);
        }
      },
      [editorRef.current]
    );

    const addTemplateContent = (content: string) => {
      if (editorRef.current) {
        editorRef.current.insertContent(content);
      }
    };

    const insertAiWriteTemplate = () => {
      // 关闭
      setAiWriteRemindVisible(false);
      setAiWriteVisible(false);
      if (aiWriteTemplate.current) {
        addTemplateContent(aiWriteTemplate.current);
      }
    };

    const getAiWriteResult = (content: string) => {
      aiWriteTemplate.current = content;
      dataStoreApi.get('mailAiWriteRemind').then(v => {
        const curContent = editorRef.current?.getContent();
        const empty = isEmpty(curContent ?? '');
        if (v.data === '1' || empty) {
          insertAiWriteTemplate();
        } else {
          setAiWriteRemindVisible(true);
        }
      });
    };

    const changeAiWriteTempRemind = async e => {
      setInsertAiWriteRemindChecked(e.target.checked);
      const val = e.target.checked ? '1' : '0';
      await dataStoreApi.put('mailAiWriteRemind', val);
    };

    const onAiWriteRemindCancel = async () => {
      setAiWriteRemindVisible(false);
    };

    const onEditCreatedPipe = (editor: EditorType) => {
      onEditCreated && onEditCreated(editor);
      editorRef.current = editor;
    };

    const aiWriteMailActionPipe = (type: 'write' | 'retouch' | 'select') => {
      const content = getCurrentMailText(type);
      if (type === 'retouch') {
        if (content === null || content?.length === 0) {
          setAiWriteVisible(false);
          toast.error('请先输入正文，再进行AI润色');
          return;
        }
      }
      setAiWriteType(type);
      if (type === 'select') setAiWriteType('retouch');
      setContent(content);
      setAiWriteVisible(true);
      aiWriteMailAction && aiWriteMailAction(type);
    };

    const closeTips = () => {
      setAIWriteContentionShow(false);
    };

    const AIWriteContentionShowAction = (pos: { left: number; top: number }) => {
      setAttentionPos(pos);
      setAIWriteContentionShow(true);
    };

    useEffect(() => {
      setRefreshCount(refreshCount + 1);
    }, [aiWriteType]);

    return (
      <>
        <Component
          {...rest}
          ref={ref}
          onEditCreated={onEditCreatedPipe}
          aiWriteMailAction={aiWriteMailActionPipe}
          AIWriteContentionShowAction={AIWriteContentionShowAction}
        />
        {AIWriteContentionShow && (
          <LxPopover top={attentionPos.top} left={attentionPos.left} visible={AIWriteContentionShow} setVisible={closeTips}>
            <AIWriteAttention closeTips={closeTips} />
          </LxPopover>
        )}
        {aiWriteVisible && (
          <AiWriteMail
            key={refreshCount}
            source={source}
            onUse={aiWriteMailUse}
            type={aiWriteType}
            originalContent={content}
            editorRef={editorRef}
            visible={aiWriteVisible}
            onClose={() => {
              setAiWriteVisible(false);
            }}
            aiInsertContent={getAiWriteResult}
          />
        )}
        <Modal
          width={400}
          centered
          visible={aiWriteRemindVisible}
          maskClosable={false}
          onCancel={onAiWriteRemindCancel}
          destroyOnClose={true}
          footer={null}
          closable={false}
        >
          <div className={style.mailRemindContent}>
            <div className={style.mailRemindLeft}>
              <WarnIcon />
            </div>
            <div>
              <p className={style.mailRemindText}>检测到写信页已有内容，AI生成内容将插入到写信页内容后</p>
              <div className={style.mailRemindFooter}>
                <Checkbox onChange={changeAiWriteTempRemind} checked={insertAiWriteRemindChecked}>
                  {getIn18Text('BUZAITIXING')}
                </Checkbox>
                <div className={style.mailRemindBtns}>
                  <Button style={{ marginRight: '16px' }} onClick={onAiWriteRemindCancel}>
                    {getIn18Text('QUXIAO')}
                  </Button>
                  <Button type="primary" onClick={insertAiWriteTemplate}>
                    {getIn18Text('QUEDINGCHARU')}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Modal>
      </>
    );
  };

  return React.forwardRef((props, ref) => <AiWriteMailWrapped {...props} ref={ref} />);
};

export default HOCAiWriteMail;
