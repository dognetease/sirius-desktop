import React, { useEffect, useState } from 'react';
import { PageProps } from 'gatsby';
import { /* apiHolder, PopUpMessageInfo, */ SystemEvent } from 'api';

// import Alert from '@web-common/components/UI/Alert/Alert';
// import Toast from '@web-common/components/UI/Message/SiriusMessage';
import DocPage from '@web-disk/docPage';
import { useCommonErrorEvent, useEventObserver } from '@web-common/hooks/useEventObserver';

// const eventApi = apiHolder.api.getEventApi();

const Doc: React.FC<PageProps> = props => {
  // type=folder&id=19000000001588&from=PERSONAL&parentResourceId=19000000001554&spaceId=504685414
  useEventObserver('initPage', {
    name: 'sheetPageInitOb',
    func: (ev: SystemEvent) => {
      if (ev && ev.eventData) {
        setHash(ev.eventData);
      }
    },
  });
  const [hash, setHash] = useState<string>(props.location.hash);
  useCommonErrorEvent('docCommonErrorOb');

  return <DocPage hash={hash} type="doc" />;
};

export default Doc;
