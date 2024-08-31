import { useContext } from 'react';
import { useAppSelector } from '@web-common/state/createStore';
import { WriteContext } from '@web-setting/Mail/components/CustomTemplate/template_add_modal';

function useRightSideColumnStatusSelector() {
  const { isMailTemplate } = useContext(WriteContext);
  const showStatus = useAppSelector(state =>
    isMailTemplate
      ? [state.mailTemplateReducer.mailTemplateContent.status?.showContact, false]
      : [state.mailReducer.currentMail.status?.showContact, state.mailReducer.currentMail.status?.userBusyFreeShow]
  );
  return showStatus;
}

export default useRightSideColumnStatusSelector;
