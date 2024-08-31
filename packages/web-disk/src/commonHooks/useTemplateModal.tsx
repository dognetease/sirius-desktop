import React from 'react';
import { useTemplateModal as useTemplateModalInner } from '../components/TemplateModal/useTemplateModal';
import { TemplateModal } from '../components/TemplateModal';
import { DOC_VALUES } from '../components/TemplateModal/definition';

export const useTemplateModal = (dirId: number): [JSX.Element, (show: boolean, docType?: DOC_VALUES) => void] => {
  const { templateModalVisible, docType, hideTemplateModal, showTemplateModal, createSuccessHandle } = useTemplateModalInner(() => {});
  const setTemplateModalVisible = React.useCallback(
    (show: boolean, docType?: DOC_VALUES) => {
      if (show) {
        showTemplateModal(docType ?? 'all');
      } else {
        hideTemplateModal();
      }
    },
    [hideTemplateModal, showTemplateModal]
  );
  const templateModal = React.useMemo(
    () => (
      <TemplateModal
        visible={templateModalVisible}
        curDirId={dirId}
        spaceKind="personal"
        docType={docType}
        onCancel={hideTemplateModal}
        onSuccess={createSuccessHandle}
        scene="tabs"
      />
    ),
    [dirId, templateModalVisible]
  );
  return [templateModal, setTemplateModalVisible];
};
