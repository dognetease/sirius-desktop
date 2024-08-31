import React, { useEffect, useState } from 'react';
import { PageProps } from 'gatsby';
import { api, wait } from 'api';
import ReadOnlyWindow from '@web-mail/components/ReadMailWindow/ReadOnlyWindow';
// import { isTreeNode } from '@web-mail/common/tree/rc-tree/src/util';
// import { MailBoxIcon } from '@web-common/components/UI/Icons/icons';
import { getParameterByName } from '@web-common/utils/utils';
import { useCommonErrorEvent } from '@web-common/hooks/useEventObserver';
import SiriusLayout from '@/layouts';
import PageContentLayout from '@/layouts/Main/pageContentLayout';
import '@/styles/global.scss';

const eventApi = api.getEventApi();
const ReadMailPage: React.FC<PageProps> = props => {
  const { location } = props;
  const [from, setFrom] = useState('');
  const [teamId, setTeamId] = useState(() => getParameterByName('teamId', location.search) || '');
  const [mailId, setMailId] = useState(() => getParameterByName('id', location.search) || '');
  // todo: 接口待联调，可能需要解析参数
  useEffect(() => {
    const id = eventApi.registerSysEventObserver('initPage', {
      func: ev => {
        const { mid: curMailId, teamId: tid } = ev?.eventData;
        // 是否来自推送卡片的点击
        setMailId(curMailId);
        setTeamId(tid);
      },
    });

    return () => {
      eventApi.unregisterSysEventObserver('initPage', id);
    };
  }, []);

  useCommonErrorEvent('readMailErrorOb');

  return (
    <SiriusLayout.ContainerLayout isLogin={false}>
      <PageContentLayout
        style={{
          height: '100%',
        }}
      >
        <ReadOnlyWindow id={mailId} from={from} teamId={teamId} />
      </PageContentLayout>
    </SiriusLayout.ContainerLayout>
  );
};

export default ReadMailPage;
