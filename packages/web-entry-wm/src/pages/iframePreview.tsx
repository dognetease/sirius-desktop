import React, { useState } from 'react';
import { PageProps } from 'gatsby';
import { SystemEvent } from 'api';
import SiriusLayout from '../layouts';
import { useEventObserver } from '@web-common/hooks/useEventObserver';

const IframePreview: React.FC<PageProps> = () => {
  const [iframeSrc, setIframeSrc] = useState<string>('');

  useEventObserver('initPage', {
    name: 'iframePreview',
    func: (event: SystemEvent) => {
      if (event && event.eventData) {
        setIframeSrc(event.eventData.iframeSrc);
      }
    },
  });

  return (
    <SiriusLayout.ContainerLayout isLogin={true}>
      <iframe src={iframeSrc} width="100%" height="100%" frameBorder={0} />
    </SiriusLayout.ContainerLayout>
  );
};

export default IframePreview;
