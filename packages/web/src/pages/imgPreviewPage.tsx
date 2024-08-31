import React, { useEffect, useState } from 'react';
import { PageProps } from 'gatsby';
import { apiHolder as api, locationHelper } from 'api';
import { handleCopyImg } from '@web-mail/components/ReadMail/util';
import ImagePreview from '@web-common/components/UI/ImagePreview/ImgPreviewContent';
import { useCommonErrorEvent } from '@web-common/hooks/useEventObserver';
import EscCloseHotKey from '@web-common/components/UI/GlobalHotKeys/EscCloseHotKey';
import CopyOpHotKey, { CopyOpKey } from '@web-common/components/UI/GlobalHotKeys/CopyOpHotKey';
import SiriusLayout from '../layouts';

const eventApi = api.api.getEventApi();
const sysApi = api.api.getSystemApi();
if (sysApi.isElectron() && locationHelper.testPathMatch('/imgPreviewPage')) {
  sysApi.addWindowHookConf({
    hooksName: 'onBeforeClose',
    hookObjName: 'imgPreviewPageOb',
    intercept: true,
    observerWinId: -1,
  });
}

const ImgPreviewPage: React.FC<PageProps> = () => {
  const [data, setData] = useState([]);
  const [startIndex, setStartIndex] = useState(-1);
  const [curUrl, setCurUrl] = useState<string>('');
  useCommonErrorEvent('imagePreviewErrorOb');
  useEffect(() => {
    // window.electronLib.windowManage.setTitle('图片预览');
    const eid = eventApi.registerSysEventObserver('initPage', {
      name: 'obImagePreviewInitPage',
      func: ({ eventData }) => {
        console.log('**** init page event received :', eventData);
        setData(eventData.data);
        setStartIndex(eventData.startIndex);
        const { data: _data = [], startIndex: _index = 0 } = eventData || {};
        const windowTitle = `预览-${_data[_index]?.filename || _data[_index]?.name}`;
        window.electronLib.windowManage.setTitle(windowTitle);
      },
    });
    const eid1 = eventApi.registerSysEventObserver('electronClose', {
      name: 'obImagePreviewElectronClose',
      func: () => {
        setData([]);
        setStartIndex(-1);
        sysApi.closeWindow();
      },
    });
    return () => {
      eventApi.unregisterSysEventObserver('initPage', eid);
      eventApi.unregisterSysEventObserver('electronClose', eid1);
    };
  }, []);

  return (
    <EscCloseHotKey>
      <CopyOpHotKey
        allowChanges
        copyHandler={() => {
          if (curUrl) {
            handleCopyImg(undefined, curUrl);
          }
        }}
      >
        <SiriusLayout.ContainerLayout isLogin={false}>
          <ImagePreview data={data} onCurUrlChange={setCurUrl} startIndex={startIndex} />
        </SiriusLayout.ContainerLayout>
      </CopyOpHotKey>
    </EscCloseHotKey>
  );
};

export default ImgPreviewPage;
console.info('---------------------end ImgPreviewPage page------------------');
