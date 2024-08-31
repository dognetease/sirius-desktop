import React, { useState } from 'react';
import { PageProps } from 'gatsby';
import { SystemEvent } from 'api';
import DocPage from '@web-disk/docPage';
import { useCommonErrorEvent, useEventObserver } from '@web-common/hooks/useEventObserver';

const Unitable: React.FC<PageProps> = props => {
  // type=folder&id=19000000001588&from=PERSONAL&parentResourceId=19000000001554&spaceId=504685414
  useCommonErrorEvent('sheetErrorOb', ev => {});
  useEventObserver('initPage', {
    name: 'sheetPageInitOb',
    func: (ev: SystemEvent) => {
      if (ev && ev.eventData) {
        setHash(ev.eventData);
      }
    },
  });

  const [hash, setHash] = useState<string>(props.location.hash);
  return <DocPage hash={hash} type="unitable" extheme />;
};

export default Unitable;
