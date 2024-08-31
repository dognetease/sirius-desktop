import React, { useState, useEffect, useCallback } from 'react';
import { Editor as EditorType } from '@web-common/tinymce';
import { useEventObserver } from '@web-common/hooks/useEventObserver';
import { apiHolder as api, isElectron } from 'api';
import throttle from 'lodash/throttle';

const getScreenCapture = api.api.getSystemApi().getScreenCapture;

const HOCCaptureScreen = (Component: typeof React.Component) => {
  const CaptureScreen = (props: any) => {
    const { ref, ...rest } = props;
    const instanceRef = React.useRef<EditorType>(null);

    const captureScreenAction = (editor: EditorType, hideCur: '0' | '1') => {
      if (!editor) return;
      console.log('captureScreenAction--------');
      instanceRef.current = editor;
      console.log('value', hideCur);
      getScreenCapture({ from: 'editorMail', hideCur });
    };

    const handleCaptureScreenAction = useCallback(throttle(captureScreenAction, 5000, { trailing: false }), []);

    useEffect(() => {
      if (isElectron()) {
        console.log('get-capture-screen-data1111');
        window.electronLib.ipcChannelManage.receiveIpcMain({
          channel: 'get-capture-screen-data',
          listener: rest => {
            // window.electronLib.ipcChannelManage.removeListener('get-capture-screen-data');
            console.log('get-capture-screen-data', rest);
            const from = rest.from;
            if (from !== 'editorMail') return;
            (instanceRef.current as any)?.pasteHtml(instanceRef.current, `<img src="${rest.url}" />`);
          },
        });
      }
      return () => {
        if (isElectron()) {
          window.electronLib.ipcChannelManage.removeListener('get-capture-screen-data');
        }
      };
    }, []);

    return (
      <>
        <Component {...rest} ref={ref} captureScreenAction={handleCaptureScreenAction} />
      </>
    );
  };

  return React.forwardRef((props, ref) => <CaptureScreen {...props} ref={ref} />);
};

export default HOCCaptureScreen;
