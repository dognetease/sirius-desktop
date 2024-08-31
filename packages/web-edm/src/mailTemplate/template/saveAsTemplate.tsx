import React, { FC, useContext, useEffect } from 'react';
import { Modal } from 'antd';
import { useAppSelector, useActions, MailTemplateActions } from '@web-common/state/createStore';
import { ViewMail } from '@web-common/state/state';
import { TemplateAddModal } from './index';
import styles from '../NewTamplateModal.module.scss';
import { TemplateInfoModal, MailTemplateApi, apiHolder, apis } from 'api';
import { setTemplateContent } from '../template-util';
import { navigate } from 'gatsby';
const templateApi = apiHolder.api.requireLogicalApi(apis.mailTemplateImplApi) as unknown as MailTemplateApi;
export const SaveAsTemplateModal: FC<{
  templateInfo?: TemplateInfoModal;
}> = props => {
  const { templateInfo } = props;
  const showAddTemplatePop = useAppSelector(state => state.mailTemplateReducer.showAddTemplatePop); // 是否展示”新增模板“弹窗
  const { changeShowAddTemplatePop } = useActions(MailTemplateActions);

  const doUseTemplate = (templateId: string) => {
    if (templateId === '') return;
    templateApi.doSaveMailTemplateUseTime({ templateId: templateId, time: new Date().getTime() });
    // 获取模板详情，唤起写信
    templateApi.doGetMailTemplateDetail({ templateId: templateId }).then(res => {
      if (res.success && res.data) {
        setTemplateContent(res.data.content, templateId);
        navigate('#edm?page=write&from=template');
      }
    });
  };
  return (
    <Modal
      centered
      className={styles.templateModal}
      onCancel={() => changeShowAddTemplatePop({ isShow: false })}
      closeIcon={<></>}
      footer={null}
      visible={showAddTemplatePop}
      width={984}
      destroyOnClose
      closable
      bodyStyle={{ padding: '0px!important' }}
    >
      <TemplateAddModal
        templateId=""
        templateInfo={templateInfo}
        content={templateInfo?.content || ''}
        doUseTemplate={doUseTemplate}
        goMailTemplate={() => changeShowAddTemplatePop({ isShow: false })}
      />
    </Modal>
  );
};
