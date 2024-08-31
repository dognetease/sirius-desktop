import React, { useEffect, useState, useRef, useCallback, useImperativeHandle } from 'react';
import { ContentEditor, ContentEditorProps } from './contentEditor';
import { uniq, debounce, isNumber } from 'lodash';
import { GPTReport, getIn18Text } from 'api';
import style from './contentRoot.module.scss';
import { guardString } from '../utils';
import { message } from 'antd';
import SiriusModal from '@web-common/components/UI/Modal/SiriusModal';
import { edmDataTracker } from '../tracker/tracker';

import Button from '@web-common/components/UI/Button';
import { checkContentSize } from './utils/checkContentSize';
import cloneDeep from 'lodash/cloneDeep';
import TongyongJiantouZuo from '@web-common/images/newIcon/tongyong_jiantou_zuo.svg';
import WarnIcon from '@web-common/components/UI/Icons/svgs/ErrorSvg';

import AddIcon from '@/images/icons/edm/yingxiao/edm-write-conent-new.svg';

import ClearIcon from '@/images/icons/edm/yingxiao/edm-content-preview-clear.svg';
import EditIcon from '@/images/icons/edm/yingxiao/edm-content-preview-edit.svg';

import { EditorObservable } from '@web-common/tinymce';
import { ListType, MailTemplateListV2, MailTemplateListV2Interface } from '../mailTemplate/MailTemplateListV2/MailTemplateListV2';
import { TemplateListV2 } from '../mailTemplate/TemplateListV2';
import { TaskList } from '../mailTemplate/TaskList';
import useState2SalesPitchReduxMock from '@/components/Layout/EnterpriseSetting/salesPitch/utils/useState2ReduxMock';

export interface Props extends ContentEditorProps {
  onUseAi?: (_: GPTReport) => void;
  qs?: Record<string, string>;
  visible: boolean;
  contentOnChange?: (_: string) => void;
  editorRef?: React.MutableRefObject<string | EditorObservable | undefined>;
  onTypeChange?: (_: ContentType) => void;
}

export type ContentType = 'write' | 'template';

export interface TemplateInfo {
  use?: boolean;
  id?: string;
  type?: ListType;
  changed?: boolean;
}

export interface ContentRootInterface {
  fetchAllowSend: () => boolean;
  fetchTemplateInfo: () => TemplateInfo;
}

export const ContentRoot = React.forwardRef<ContentRootInterface, Props>((props, ref) => {
  const {
    onUseAi,
    qs,
    isCopyHeader,
    setUseContentAssistant,
    configEmailSubject,
    visible,
    attachmentList,
    content,
    signature = '',
    canShowHistoryModal,
    onReady,
    editorRef,
    writeFlow = false,
    onTypeChange,
  } = props;

  const [type, setType] = useState<ContentType>('template');
  const [allowSend, setAllowSend] = useState(true);

  const [previewData, setPreviewData] = useState('');
  const [originalData, setOriginalData] = useState('');

  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [showTemplateMoreModal, setShowTemplateMoreModal] = useState(false);

  const recentTemplateRef = useRef<MailTemplateListV2Interface>();

  const listInfoRef = useRef<{ id?: number; title?: string; listType?: ListType }>();

  const [useTemplate, setUseTemplate] = useState<TemplateInfo>({ use: false });

  const [curListType, setCurListType] = useState<ListType>();

  useEffect(() => {
    setPreviewData(content || '');
  }, [content]);

  const checkContent = useCallback(
    debounce((content: string) => {
      if (guardString(content)) {
        const result = checkContentSize(content);
        setAllowSend(result);
        if (!result) {
          message.error(getIn18Text('YOUJIANNEIRONGZUIDUOZHI'));
        }
      }
    }, 300),
    []
  );

  useEffect(() => {
    onTypeChange && onTypeChange(type);
  }, [type]);

  useEffect(() => {
    checkContent(previewData);
  }, [previewData]);

  useEffect(() => {
    if (qs?.cphd === '1') {
      setPreviewData('');
    }
  }, [qs]);

  // 话术库相关---------------
  // 控制话术库抽屉的visible
  const [, setEdmTemplateOuterDrawerVisible] = useState2SalesPitchReduxMock('edmTemplateOuterDrawerVisible');
  // 跟单话术库，点击使用
  const [edmTemplateSalesPitch, setEdmTemplateSalesPitch] = useState2SalesPitchReduxMock('edmTemplateSalesPitch');

  // 如果点击的话术库变化，则插入新的话术库
  useEffect(() => {
    if (edmTemplateSalesPitch && edmTemplateSalesPitch.discourseContent) {
      // 插入话术内容
      editorRef?.current?.insertContent(edmTemplateSalesPitch.discourseContent || '');
      // 1秒后清除
      setTimeout(() => {
        setEdmTemplateSalesPitch(null);
      }, 1000);
    }
  }, [edmTemplateSalesPitch?.discourseContent]);
  // 话术库相关---------------

  const exitConfirmComp = () => {
    return (
      <SiriusModal closable={true} width={400} visible={showExitConfirm} footer={null} onCancel={() => setShowExitConfirm(false)}>
        <div className={style.saveConfirmHeader}>
          <WarnIcon style={{ marginRight: 8, verticalAlign: -4 }} />
          已编辑内容尚未保存，是否确认返回？
        </div>
        <div className={style.secondBtns}>
          <Button btnType="minorLine" onClick={onSave}>
            保存内容并返回
          </Button>
          <Button
            onClick={() => {
              setShowExitConfirm(false);
              resetOriginalData();
              setType('template');
            }}
            btnType="primary"
            key="save"
          >
            确认返回
          </Button>
        </div>
      </SiriusModal>
    );
  };

  const onSave = () => {
    let content = getEditorContent();
    setPreviewData(content);
    setShowExitConfirm(false);
    setType('template');
  };

  const getEditorContent = () => {
    let content = editorRef?.current?.getContent() || '';
    return content;
  };

  const resetOriginalData = () => {
    setPreviewData(originalData);
    editorRef?.current?.setContent(originalData || signature);
  };

  const contentEditorComp = () => {
    return (
      <div className={style.writeWrap} style={{ display: type === 'write' ? undefined : 'none' }}>
        <div
          className={style.back}
          onClick={() => {
            setShowExitConfirm(true);
          }}
        >
          <img src={TongyongJiantouZuo} />
          返回内容库
        </div>
        <ContentEditor
          onUseAi={report => {
            onUseAi && onUseAi(report);
          }}
          isCopyHeader={isCopyHeader}
          readonly={false}
          setUseContentAssistant={setUseContentAssistant}
          configEmailSubject={configEmailSubject}
          emailSubject={props.qs?.emailSubject}
          visible={type === 'write'}
          ref={editorRef}
          writeFlow={true}
          attachmentList={attachmentList}
          content={qs?.cphd === '1' ? '' : cloneDeep(previewData)}
          signature={signature}
          canShowHistoryModal={canShowHistoryModal}
          contentOnChange={() => {}}
          onReady={info => {
            onReady && onReady();
            if (info) {
              let content = getEditorContent();
              setPreviewData(content || '');
              onUseTemplate(info.templateId, info.templateContent);
            }
          }}
          salespitchActionAction={() => {
            // 点击跟单话术库
            setEdmTemplateOuterDrawerVisible(true);
          }}
        />
      </div>
    );
  };

  const refreshRecent = () => {
    recentTemplateRef.current?.refresh(false);
  };

  useEffect(() => {
    if (showTemplateMoreModal === false) {
      refreshRecent();
    }
  }, [showTemplateMoreModal]);

  useImperativeHandle(ref, () => ({
    fetchAllowSend() {
      return allowSend;
    },
    fetchTemplateInfo() {
      return {
        ...useTemplate,
        type: curListType,
      };
    },
  }));

  const RecentTemplateModalComp = () => {
    return (
      <SiriusModal
        className={style.modal}
        width={900}
        title={listInfoRef.current?.title || '内容库'}
        destroyOnClose
        footer={null}
        centered
        maskClosable={false}
        visible={showTemplateMoreModal}
        onCancel={() => {
          refreshRecent();
          setShowTemplateMoreModal(false);
        }}
      >
        {listInfoRef.current?.listType !== 'task' && (
          <TemplateListV2
            isFormWrite
            listType={listInfoRef.current?.listType}
            tabId={listInfoRef.current?.id || 0}
            onUse={(id, content) => {
              setShowTemplateMoreModal(false);
              onUseTemplate(id, content);
              setCurListType(listInfoRef.current?.listType);
            }}
          />
        )}
        {listInfoRef.current?.listType === 'task' && (
          <TaskList
            isFormWrite
            onUse={(id, content) => {
              setShowTemplateMoreModal(false);
              onUseTemplate(id, content);
              setCurListType('task');
            }}
          />
        )}
      </SiriusModal>
    );
  };

  const onUseTemplate = (templateId?: string, content?: string) => {
    // 如果是模板, 就把退订链接和签名拼在最后, 如果是最近任务选择(没有模板id), 那就完全用组件给的内容
    if (guardString(templateId)) {
      setUseTemplate({ use: true, id: templateId });
      let html = document.createElement('div');
      html.innerHTML = (content || '') + signature;
      // editorRef?.current?.resetContent(content || '');
      setPreviewData(html.innerHTML || '');
    } else {
      setUseTemplate({ use: false, id: undefined });
      setPreviewData(content || '');
      edmDataTracker.track('pc_markting_edm_taskCreate_contentSet', {
        type: 'useTask',
      });
    }
  };

  const RecentTemplateComp = () => {
    return (
      <div className={style.templateRoot}>
        <MailTemplateListV2
          ref={recentTemplateRef}
          onUse={(id, content, listType) => {
            onUseTemplate(id, content);
            setCurListType(listType);
          }}
          showMore={(title, listType, id) => {
            listInfoRef.current = {
              id,
              title,
              listType,
            };
            setShowTemplateMoreModal(true);
            edmDataTracker.track('pc_markting_edm_taskCreate_contentSet', {
              type: 'more',
            });
          }}
          isFormWrite
        />
      </div>
    );
  };

  const WriteEmptyComp = () => {
    return (
      <div className={style.writeEmpty}>
        <div className={style.action}>
          <img
            className={style.icon}
            src={AddIcon}
            onClick={() => {
              setOriginalData(previewData);
              setType('write');
              edmDataTracker.track('pc_markting_edm_taskCreate_contentSet', {
                type: 'newContent',
              });
            }}
          />
          <div className={style.title}>新建邮件内容</div>
        </div>
      </div>
    );
  };

  const WritePreviewComp = () => {
    return (
      <div className={style.writePreview}>
        <div dangerouslySetInnerHTML={{ __html: previewData || '' }}></div>
      </div>
    );
  };

  const WriteActionComp = () => {
    return (
      <div className={style.actionCover}>
        <div
          className={style.actionButton}
          onClick={() => {
            setOriginalData(previewData);
            setType('write');
            setPreviewData(signature);
            edmDataTracker.track('pc_markting_edm_taskCreate_contentSet', {
              type: 'changeNew',
            });
            let info: TemplateInfo = {
              ...useTemplate,
              changed: true,
            };
            setUseTemplate(info);
          }}
        >
          <img src={ClearIcon} />
          <div className={style.title}>清除并新建邮件</div>
        </div>
        <div
          className={style.actionButton}
          onClick={() => {
            setOriginalData(previewData);
            setType('write');
            edmDataTracker.track('pc_markting_edm_taskCreate_contentSet', {
              type: 'editContent',
            });
            let info: TemplateInfo = {
              ...useTemplate,
              changed: true,
            };
            setUseTemplate(info);
          }}
        >
          <img src={EditIcon} />
          <div className={style.title}>编辑邮件内容</div>
        </div>
      </div>
    );
  };

  const WriteContentComp = () => {
    return (
      <div className={style.writeRoot}>
        <div className={style.content}>
          {!guardString(previewData) && WriteEmptyComp()}
          {guardString(previewData) && WritePreviewComp()}
        </div>
        {guardString(previewData) && WriteActionComp()}
      </div>
    );
  };

  let WriteMode = type === 'write';

  return (
    <>
      <div
        className={style.root}
        style={{
          display: visible ? 'flex' : 'none',
          ...(!WriteMode
            ? {
                overflow: 'hidden',
              }
            : {}),
        }}
      >
        {!WriteMode && RecentTemplateComp()}
        {!WriteMode && WriteContentComp()}
        {contentEditorComp()}
      </div>
      {exitConfirmComp()}
      {RecentTemplateModalComp()}
    </>
  );
});
