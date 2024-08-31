import React, { FC, useState, useEffect, useRef } from 'react';
import { Modal, message } from 'antd';
import { apiHolder, apis, MailTemplateApi } from 'api';
import { useAppSelector, useActions, MailTemplateActions } from '@web-common/state/createStore';
import { ReactComponent as DeleteIcon } from '@/images/icons/modal_close_temp.svg';

import { MailTemplate } from './index';
import { TemplateAddModal } from './template/index';
import { MarketingTemplateList, MarketingTemplateListRefType } from '../components/MarketingTemplateList';
import Preview from './template/preview';
import styles from './NewTamplateModal.module.scss';
import { getIn18Text } from 'api';

const templateApi = apiHolder.api.requireLogicalApi(apis.mailTemplateImplApi) as unknown as MailTemplateApi;

export const NewTamplateModal: FC<{
  emitResult?: any;
  insertContent?: (content: string) => void;
  showMarketing?: boolean;
  templateType?: string;
}> = props => {
  const { emitResult, insertContent, showMarketing, templateType } = props;
  const showTemplateList = useAppSelector(state => state.mailTemplateReducer.showTemplateList); // 是否展示”模板列表“弹窗
  const showTemplateListType = useAppSelector(state => state.mailTemplateReducer.showTemplateListType); // ”模板列表“弹窗类型
  const defaultActiveTab = useAppSelector(state => state.mailTemplateReducer.defaultActiveTab); // 默认展示tab
  const { changeShowTemplateList, changeShowAddTemplatePop, doWriteTemplate, doModifyTemplateName } = useActions(MailTemplateActions);
  const [flag, setFlag] = useState(0);
  const [templateId, setTemplateId] = useState<string>('');
  const [templateIds, setTemplateIds] = useState<string[]>([]);
  const [type, setType] = useState<string>('list');
  const [defaultValue, setDefaultValue] = useState(0);
  const [content, setContent] = useState('');
  const [hideModal, setHideModal] = useState(false);
  const marketingTemplateListRef = useRef<MarketingTemplateListRefType | null>(null);
  const [successLabel, setSuccessLabel] = useState(getIn18Text('BAOCUNCHENGGONG'));

  useEffect(() => {
    if (defaultActiveTab !== 0) {
      setDefaultValue(defaultActiveTab);
    }
    if (defaultActiveTab === -100 && marketingTemplateListRef.current) {
      marketingTemplateListRef.current.setVisible(true);
    }
  }, [defaultActiveTab]);

  const goTemplateAdd = (templateId?: string, content?: string) => {
    setContent(content ?? '');
    setTemplateId(templateId || '');
    setType('edit');
  };

  const goMailTemplate = (refresh?: boolean) => {
    setTemplateId('');
    setType('list');
    // setFlag(2);
    // setTimeout(() => {
    //     changeShowTemplateList({
    //         isShow: showTemplateList,
    //         defaultActiveTab: 2,
    //     });
    // }, 500);
  };

  const openPreviewModal = (id: string, ids: string[]) => {
    setTemplateId(id);
    setTemplateIds(ids);
    setType('preview');
  };

  const addNewTemplate = async (content = '') => {
    try {
      const res = await templateApi.templateQueryLimit();
      if (res.templateLimitVOList.length > 0) {
        const { count, limit } = res.templateLimitVOList[0];
        if (count >= limit) {
          message.error({
            content: getIn18Text('CHAOGUOZUIDAMOBANSHU'),
          });
          return;
        }
      }

      goTemplateAdd('', content);
    } catch (err) {
      goTemplateAdd('', content);
    }
  };

  if (defaultActiveTab === -100 && showMarketing) {
    return (
      <MarketingTemplateList
        from="templateListModal"
        insertContent={(content, needSave, successLabel) => {
          insertContent && insertContent(content);
          setSuccessLabel(successLabel);
        }}
        afterModalClose={() => {
          changeShowTemplateList({ isShow: false });
          setType('list');
        }}
        addNewTemplate={addNewTemplate}
        fromPage={2}
        ref={marketingTemplateListRef}
      />
    );
  }

  return (
    <Modal
      centered
      className={`${styles.templateModal} ${hideModal ? styles.templateModal2 : ''}`}
      onCancel={() => changeShowTemplateList({ isShow: false })}
      closeIcon={<></>}
      footer={null}
      visible={showTemplateList && (!templateType || templateType === showTemplateListType)}
      width={984}
      destroyOnClose
      closable={type === 'list'}
      bodyStyle={{ padding: type === 'list' ? '24px' : '0px!important' }}
      mask={type !== ''}
      afterClose={() => {
        setType('list');
        setHideModal(false);
      }}
    >
      {type === 'list' && (
        <MailTemplate
          defaultActiveTab={defaultValue}
          emitResult={data => {
            if (emitResult) {
              emitResult(data);
            }
          }}
          fromPage={2}
          goTemplateAdd={goTemplateAdd}
          openPreviewModal={openPreviewModal}
          setVisibleModal={visible => setHideModal(visible)}
          insertContent={insertContent}
          showMarketing={showMarketing}
        />
      )}
      {type === 'edit' && (
        <TemplateAddModal
          templateId={templateId}
          goMailTemplate={refresh => {
            changeShowTemplateList({
              isShow: showTemplateList,
              defaultActiveTab: 2,
            });
            goMailTemplate(refresh);
          }}
          successLabel={successLabel}
          content={content}
        />
      )}
      {type === 'preview' && (
        <Preview
          fromPage={2}
          templateId={templateId}
          allTemplateId={templateIds}
          closeModal={() => {
            goMailTemplate(false);
          }}
          closeAllModal={() => {
            goMailTemplate(false);
            changeShowTemplateList({ isShow: false });
          }}
          emitResult={data => {
            if (emitResult) {
              emitResult(data);
            }
          }}
        />
      )}
    </Modal>
  );
};
