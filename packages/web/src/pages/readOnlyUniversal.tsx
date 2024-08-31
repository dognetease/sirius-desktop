import React, { useCallback, useState } from 'react';
import { PageProps } from 'gatsby';
import useMsgCallback from '@web-common/hooks/useMsgCallback';
import ReadOnlyUniversalWindow from '@web-mail/components/ReadMailWindow/ReadOnlyUniversalWindow';
import { getParameterByName } from '@web-common/utils/utils';
import { useCommonErrorEvent } from '@web-common/hooks/useEventObserver';
import SiriusLayout from '@/layouts';
import PageContentLayout from '@/layouts/Main/pageContentLayout';
import '@/styles/global.scss';

const ReadMailPage: React.FC<PageProps> = props => {
  const { location } = props;
  const [mailId, setMailId] = useState(() => getParameterByName('id', location.search) || '');
  const [mailAccount, setMailAccount] = useState(() => getParameterByName('account', location.search) || '');

  const handleInitPage = useCallback(ev => {
    const { mid: curMailId } = ev?.eventData;
    const _account = ev?._account || '';
    setMailId(curMailId);
    setMailAccount(_account);
  }, []);

  useMsgCallback('initPage', handleInitPage);
  useCommonErrorEvent('readMailErrorOb');

  /**
   * 窗口关闭前，清除id以恢复状态
   */
  useMsgCallback('electronClose', () => {
    setMailId('');
  });

  return (
    <SiriusLayout.ContainerLayout isLogin={false}>
      <PageContentLayout>
        <ReadOnlyUniversalWindow id={mailId} mailAccount={mailAccount} />
      </PageContentLayout>
    </SiriusLayout.ContainerLayout>
  );
};

export default ReadMailPage;
