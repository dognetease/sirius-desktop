import { Col, Row, Button, message } from 'antd';
import React, { useState, useRef, useEffect } from 'react';
import { apiHolder as api, apis, MailTemplateApi, TemplateDataModel } from 'api';
import readWrapper from '@web-mail/components/ReadMail/util';
import classes from './preview.module.scss';
import { ReactComponent as IconClose } from '@/images/icons/edm/template-group-close.svg';
import { ReactComponent as IconLeft } from '@/images/icons/edm/template-group-left.svg';
import { ReactComponent as IconRight } from '@/images/icons/edm/template-group-right.svg';
import { ReactComponent as IconBack } from '@/images/icons/edm/template-group-back.svg';
import { formatViewMail } from '@web-setting/Mail/components/CustomTemplate/util';
import { setTemplateContent } from '../template-util';
import { navigate } from '@reach/router';
import { getIn18Text, apiHolder } from 'api';
interface Props {
  templateId: string;
  allTemplateId: string[];
  closeModal: () => void;
  emitResult?: (data: ViewMail) => void; // 写信页模板点击”使用“的回调
  fromPage?: 2 | 1;
  closeAllModal?: () => void;
  onUse?: (content: string, templateId?: string) => void;
}

const { isMac } = apiHolder.env;
const systemApi = apiHolder.api.getSystemApi();
const isWindows = systemApi.isElectron() && !isMac;

const templateApi = api.api.requireLogicalApi(apis.mailTemplateImplApi) as unknown as MailTemplateApi;
const dataMap = [
  {
    label: getIn18Text('DAKAILV'),
    value: 'openRate',
    color: 'rgba(107, 169, 255, 0.1)',
  },
  {
    label: getIn18Text('HUIFULV'),
    value: 'replyRate',
    color: 'rgba(141, 214, 188, 0.1)',
  },
  {
    label: getIn18Text('SHIYONGSHU'),
    value: 'usedCount',
    color: 'rgba(255, 170, 0, 0.1)',
  },
];

const defaultData = { usedCount: 0, openRate: '0%', replyRate: '0%' };

const Preview: React.FC<Props> = props => {
  const { templateId, allTemplateId, closeModal, emitResult, fromPage = 1, closeAllModal, onUse } = props;
  const [usedData, setUsedData] = useState<TemplateDataModel>(defaultData);
  const [content, setContent] = useState<string>('');
  const [currentId, setCurrentId] = useState<string>('');
  const [templateName, setTemplateName] = useState<string>('');
  const [templateContentType, setTemplateContentType] = useState<number>(0);
  const [templateDesc, setTemplateDesc] = useState<string>('');
  const frameRef = useRef<HTMLIFrameElement>(null);

  const doGetMailTemplateDetail = async (needStatistics: boolean = false) => {
    if (!currentId) return;
    const res = await templateApi.doGetMailTemplateDetail({ templateId: currentId, needStatistics });
    if (res.success && res.data) {
      const { templateName, content, usedCount, openRate, replyRate, templateDesc, templateContentType } = res.data;
      setUsedData({ usedCount: usedCount || 0, openRate: openRate || '0%', replyRate: replyRate || '0%' });
      setContent(content);
      setTemplateName(templateName);
      setTemplateContentType(templateContentType);
      setTemplateDesc(templateDesc);
    }
  };

  const renderData = () => {
    const span = 24 / dataMap.length;
    return (
      <>
        <div className={classes.dataTitle}>
          <div className={classes.dataIcon}></div>
          {getIn18Text('MOBANSHUJU')}
        </div>
        <Row justify="space-between" gutter={16}>
          {dataMap.map(data => {
            return (
              <Col span={span}>
                <div className={classes.dataItem} style={{ background: `${data.color}` }}>
                  <div className={classes.dataLabel}>{data.label}</div>
                  <div className={classes.dataValue}>{usedData[data.value]}</div>
                </div>
              </Col>
            );
          })}
        </Row>
      </>
    );
  };

  const chengeTemplate = (behavior: 'previous' | 'next') => {
    const index = allTemplateId.indexOf(currentId);
    const newTemplateId = behavior === 'previous' ? allTemplateId[index - 1] : allTemplateId[index + 1];
    if (index === -1 || !newTemplateId) {
      message.error({
        content: getIn18Text('MEIYOUGENGDUODEMOBAN\uFF01'),
      });
      return;
    }
    setCurrentId(newTemplateId);
  };

  const applyTemplate = () => {
    templateApi.doSaveMailTemplateUseTime({ templateId: currentId, time: new Date().getTime() });
    // 获取模板详情，唤起写信
    templateApi.doGetMailTemplateDetail({ templateId: currentId }).then(async res => {
      if (res.success && res.data) {
        if (onUse) {
          onUse(res.data.content, templateId);
        } else if (emitResult) {
          const viewMail = await formatViewMail(res.data);
          viewMail.form = 'template';
          emitResult(viewMail);
        } else {
          setTemplateContent(res.data.content, currentId);
          navigate('#edm?page=write&from=template');
          // navigate(`#edm?page=write&tab=0&steps=ContentEditor,SendSetting,BatchSetting`)
        }
      }
    });
  };

  useEffect(() => {
    if (frameRef.current) {
      // 加载正文
      frameRef.current.setAttribute('style', 'padding:10px');
      const doc = frameRef.current.contentDocument;
      doc?.open();
      doc?.write(readWrapper(content || '', true));
      doc?.close();
    }
  }, [content]);

  const closeModalByPage = () => {
    if (fromPage === 2 && closeAllModal) {
      closeAllModal();
    } else {
      closeModal();
    }
  };

  useEffect(() => {
    setCurrentId(templateId);
  }, [templateId]);

  useEffect(() => {
    if (currentId) {
      doGetMailTemplateDetail(false);
    }
  }, [currentId]);

  return (
    <div className={classes.preview}>
      <div className={classes.header} style={isWindows ? {
          paddingTop: 56,
        } : {}}>
        <div className={classes.title}>
          {fromPage === 2 && <IconBack className={classes.icon} onClick={closeModal} />}
          {templateName}
        </div>
        <div>
          <IconClose style={{ cursor: 'pointer' }} onClick={closeModalByPage} />
        </div>
      </div>
      <div className={classes.data}>{renderData()}</div>
      {templateContentType === 1 && !!templateDesc && (
        <div className={classes.templateDesc}>
          <div className={classes.templateDescTitle}>
            <div className={classes.dataIcon}></div>
            {getIn18Text('MOBANJIANJIE')}
          </div>
          {templateDesc}
        </div>
      )}

      <div className={classes.content}>
        <iframe title={getIn18Text('YULAN')} ref={frameRef} width="100%" height="100%" src="about:blank" frameBorder="0" />
      </div>
      <div className={classes.footer}>
        <div className={classes.buttons}>
          {allTemplateId != null && allTemplateId.length > 0 && (
            <>
              <Button
                className={classes.button}
                style={{ marginRight: '12px' }}
                onClick={() => {
                  chengeTemplate('previous');
                }}
              >
                <IconLeft /> {getIn18Text('SHANGYIGE')}
              </Button>
              <Button
                className={classes.button}
                onClick={() => {
                  chengeTemplate('next');
                }}
              >
                {getIn18Text('XIAYIGE')}
                <IconRight />
              </Button>
            </>
          )}
        </div>
        <div>
          <Button type="primary" onClick={applyTemplate}>
            {getIn18Text('SHIYONG')}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Preview;
