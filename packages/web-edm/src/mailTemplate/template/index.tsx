import React, { useState, useEffect } from 'react';
import { MailTemplateEditor } from './editor';
import { PreviewContent } from '../../components/preview/privew';
import Group from './group/group';
import ManageGroup from './group/manageGroup';
import DeleteConfirm from './group/confirmModal';
import classes from './index.module.scss';
import { Input, Button, Tooltip, message } from 'antd';
import { ReactComponent as IconClose } from '@/images/icons/edm/template-group-close.svg';
import { navigate } from '@reach/router';
import { setTemplateContent } from '../template-util';
import { useAppSelector, useActions, MailTemplateActions } from '@web-common/state/createStore';
import { apiHolder as api, apis, MailTemplateApi, TemplateByIdDetail, DataTrackerApi, TemplateInfoModal } from 'api';
import { getIn18Text } from 'api';
import { edmDataTracker } from '../../tracker/tracker';

let editorInstance: any;
let editMailReq: any = {
  templateName: '',
};
const templateApi = api.api.requireLogicalApi(apis.mailTemplateImplApi) as unknown as MailTemplateApi;
const trackApi: DataTrackerApi = api.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;
interface PropsModel {
  templateId: string;
  goMailTemplate: (refresh?: boolean) => void;
  templateInfo?: TemplateInfoModal;
  content?: string; // 默认的content
  doUseTemplate?: (id: string) => void;
  successLabel?: string;
}

const MaxNameLength = 50;

/** 新建邮件模板Modal */
export const TemplateAddModal = (props: PropsModel) => {
  const { changeShowTemplateList } = useActions(MailTemplateActions);
  const { templateId, goMailTemplate, templateInfo, content, doUseTemplate, successLabel } = props;
  const [templateTitle, setTemplateTitle] = useState<string>('');
  const [templateName, setTemplateName] = useState<string>('');
  const [originTagIds, setOriginTagIds] = useState<number[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const [manageVisible, setManageVisible] = useState<boolean>(false);
  const [showConfirm, setShowConfirm] = useState<boolean>(false); // 是否展示关闭时候的二次确认弹窗
  const [previewContent, setPreviewContent] = useState('');
  const [isModified, setIsModified] = useState<boolean>(false);
  const changeName = (e: React.ChangeEvent<HTMLInputElement>) => {
    let { value } = e.target;
    if (value.length > MaxNameLength) {
      message.error({
        content: getIn18Text('QINGSHURU50'),
      });
      value = value.slice(0, MaxNameLength);
    }
    setTemplateName(value);
  };

  useEffect(() => {
    // 设置默认值
    if (content && editorInstance) {
      editorInstance.setContent(content);
    }
  }, [content]);

  const doSaveMailTemplate = () => {
    if (!templateName.trim() || templateName.length > 50) {
      message.error({
        content: templateName.length > 50 ? getIn18Text('MUBANMINGCHENGZUIDKSR50GZF！') : getIn18Text('QINGSHURUMOBANMINGCHENG!'),
      });
      return;
    }
    let params = {
      templateId: templateId || '',
      templateName,
      templateCategory: 'LX-WAIMAO',
      content: editorInstance?.getContent() || '',
      tagIdList: selectedTagIds,
    };
    if (templateId && Object.keys(editMailReq).length > 0) {
      const { bcc, to, cc, subject } = editMailReq as TemplateByIdDetail;
      params = Object.assign(params, { subject, to, bcc, cc });
    }
    templateApi.doSaveMailTemplate(params).then(res => {
      if (res.success && res.data) {
        const content1 = (
          <>
            {successLabel ? <span>{successLabel}</span> : <span>{getIn18Text('BAOCUNCHENGGONG')}</span>}
            {templateInfo && templateInfo.from === 'taskMail' && (
              <span
                style={{ marginLeft: '8px', color: '#4C6AFF', cursor: 'pointer' }}
                onClick={() => {
                  doUseTemplate && doUseTemplate(res.data?.templateId || '');
                }}
              >
                {getIn18Text('QUSHIYONGMUBAN')}
              </span>
            )}
          </>
        );
        message.success({
          content: content1,
        });
        goMailTemplate(true);
        trackApi.track('pc_markting_edm_template_newobject_click', {
          operation: !templateId ? 'newobject' : 'edit',
          method: content ? getIn18Text('CONGYINGXIAORENWUXUANZE') : getIn18Text('SHOUDONGXINJIAN'),
        });
        if (templateInfo && templateInfo.from === 'taskMail') {
          trackApi.track('pc_markting_edm_taskdetail_save_as_template_click');
        }
      } else {
        message.error({
          content: res.message || getIn18Text('BAOCUNSHIBAI\uFF01'),
        });
      }
    });
  };

  const doGetMailTemplateDetail = (needStatistics: boolean = false) => {
    if (!templateId) return;
    editMailReq = {
      templateName: '',
    };
    templateApi.doGetMailTemplateDetail({ templateId: templateId as string, needStatistics }).then(res => {
      if (res.success && res.data) {
        const { templateName, content, tagList } = res.data;
        editMailReq = res.data;
        const tagIds = tagList.map(tag => {
          return tag.tagId as number;
        });
        setTemplateName(templateName);
        editorInstance.setContent(content);
        setOriginTagIds(tagIds);
        setSelectedTagIds(tagIds);
      }
    });
  };

  const getEditorInstance = (editor: any) => {
    editorInstance = editor;
    // 设置默认值
    if (content && editorInstance) {
      editorInstance.setContent(content);
    }

    if (!!templateInfo && Object.keys(templateInfo).length > 0) {
      setOriginAttrs(templateInfo);
    }
    if (!!templateId) {
      doGetMailTemplateDetail(false);
    }
  };

  const setOriginAttrs = (templateInfo: TemplateInfoModal) => {
    for (const key in templateInfo) {
      switch (key) {
        case 'title':
          const title = getIn18Text('BAOCUNWEIMUBAN');
          setTemplateTitle(title);
          break;
        case 'content':
          editorInstance.setContent(templateInfo['content']);
          break;
        case 'templateName':
          setTemplateName(templateInfo[key] as string);
          break;
        case 'tagIds':
          setOriginTagIds(templateInfo[key] as number[]);
          setSelectedTagIds(templateInfo[key] as number[]);
          break;
      }
    }
  };

  const handleSelectedIds = (ids: number[]) => {
    setSelectedTagIds(ids);
  };

  const beforeClose = () => {
    if (isModified || editMailReq.templateName !== templateName || content) {
      setShowConfirm(true);
      return;
    }
    goMailTemplate(false);
  };

  // todo 关闭
  const handleDeleteConfirm = () => {
    goMailTemplate(false);
    setShowConfirm(false);
    if (content) {
      changeShowTemplateList && changeShowTemplateList({ isShow: false });
    }
  };

  const previewInEdit = () => {
    edmDataTracker.templatePageOp('preview', '');
    if (!editorInstance) return;
    const html = editorInstance.__getPreviewHtml__ ? editorInstance.__getPreviewHtml__(editorInstance) : editorInstance.getContent();
    let title = '';
    if (templateName) {
      title = `<h1 style="font-size: 16px; padding: 30px 0 20px; font-weight:500; margin:0">${templateName}</h1>`;
    }
    setPreviewContent(`${title}${html}`);
  };

  useEffect(() => {
    let title = getIn18Text('XINJIANZIDINGYIMOBAN');
    if (content !== '') {
      title = getIn18Text('BAOCUNWEIYOUJIANMUBAN');
    }
    if (templateId) {
      title = getIn18Text('BIANJIMOBAN');
    } else {
      if (!!templateInfo && Object.keys(templateInfo).length > 0) {
        title = getIn18Text('BAOCUNWEIYOUJIANMUBAN');
      }
    }
    setTemplateTitle(title);
  }, [templateId, templateInfo]);

  return (
    <>
      <div className={`${classes.template} add-mail-template-modal`}>
        <div className={classes.header}>
          <div className={classes.title}>{templateTitle}</div>
          <div className={classes.close}>
            <IconClose style={{ cursor: 'pointer' }} onClick={beforeClose} />
          </div>
        </div>
        <div className={classes.nav}>
          <div className={classes.templateName}>
            <span className={classes.label}>{getIn18Text('MOBANMINGCHENG:')}</span>
            <Input className={classes.input} placeholder={getIn18Text('QINGSHURUMOBANMINGCHENG')} value={templateName} onChange={changeName} />
          </div>
          <div className={classes.line}></div>
          <div className={classes.group}>
            {/* 选择分组 */}
            <Group
              originTagIds={originTagIds}
              manageVisible={manageVisible}
              sendSelectedIds={ids => {
                handleSelectedIds(ids);
              }}
              manageGroup={() => {
                setManageVisible(true);
              }}
            />
          </div>
        </div>

        <div className={classes.container}>
          <MailTemplateEditor
            changeMailContent={() => {
              setIsModified(true);
            }}
            getEditorInstance={getEditorInstance}
          />
        </div>
        <div className={classes.footer}>
          <Button style={{ marginRight: '12px' }} onClick={beforeClose}>
            {getIn18Text('QUXIAO')}
          </Button>
          <Tooltip title={!templateName ? getIn18Text('TIANJIAMOBANMINGCHENGCAIKEYULAN') : ''}>
            <Button style={{ marginRight: '12px' }} onClick={previewInEdit} disabled={!templateName}>
              {getIn18Text('YULAN')}
            </Button>
          </Tooltip>

          <Button type="primary" onClick={doSaveMailTemplate} disabled={!templateName}>
            {getIn18Text('BAOCUNMOBAN')}
          </Button>
        </div>
      </div>
      <ManageGroup
        visible={manageVisible}
        closeModal={() => {
          setManageVisible(false);
        }}
      />
      <DeleteConfirm showConfirm={showConfirm} setShowConfirm={setShowConfirm} handleConfirm={handleDeleteConfirm} />
      <PreviewContent content={previewContent} onCancel={() => setPreviewContent('')} />
    </>
  );
};

export default TemplateAddModal;
