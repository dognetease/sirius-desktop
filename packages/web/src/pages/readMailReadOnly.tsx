import React, { useCallback, useState } from 'react';
import { PageProps } from 'gatsby';
import useMsgCallback from '@web-common/hooks/useMsgCallback';
import ReadOnlyWindow from '@web-mail/components/ReadMailWindow/ReadOnlyWindow';
// import { isTreeNode } from '@web-mail/common/tree/rc-tree/src/util';
// import { MailBoxIcon } from '@web-common/components/UI/Icons/icons';
import { getParameterByName } from '@web-common/utils/utils';
import { useCommonErrorEvent } from '@web-common/hooks/useEventObserver';
import SiriusLayout from '@/layouts';
import PageContentLayout from '@/layouts/Main/pageContentLayout';
import '@/styles/global.scss';

// const eventApi = api.getEventApi();
const ReadMailPage: React.FC<PageProps> = props => {
  const { location } = props;
  const [from, setFrom] = useState('');
  const [teamId, setTeamId] = useState(() => getParameterByName('teamId', location.search) || '');
  const [mailId, setMailId] = useState(() => getParameterByName('id', location.search) || '');
  const [mailAccount, setMailAccount] = useState(() => getParameterByName('account', location.search) || '');
  const [handoverEmailId, setHandoverEmailId] = useState(() => getParameterByName('handoverEmailId', location.search) || '');

  const handleInitPage = useCallback(ev => {
    const { mid: curMailId, teamId: tid, handoverEmailId: hid } = ev?.eventData;
    const _account = ev?._account || '';
    // 是否来自推送卡片的点击
    setMailId(curMailId);
    setTeamId(tid);
    setMailAccount(_account);
    setHandoverEmailId(hid);
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
        <ReadOnlyWindow mailAccount={mailAccount} id={mailId} from={from} teamId={teamId} handoverEmailId={handoverEmailId} />
      </PageContentLayout>
    </SiriusLayout.ContainerLayout>
  );
};

export default ReadMailPage;
