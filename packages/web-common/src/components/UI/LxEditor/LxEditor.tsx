/*
 * @Author: your name
 * @Date: 2021-10-29 18:01:22
 * @LastEditTime: 2021-11-01 11:58:51
 * @LastEditors: Please set LastEditors
 * @Description: In User Settings Edit
 * @FilePath: /dev-wlj/packages/@web-common/components/UI/LxEditor/LxEditor.tsx
 */
import React, { useEffect, useState } from 'react';
import { Editor, IAllProps } from './reactTinymce';
import { editorConfig } from '@/components/Layout/editorConfig';
import { Editor as EditorType } from '@web-common/tinymce';

import { useAppDispatch } from '@web-common/state/createStore';
import { apiHolder as api, apis, ProductAuthApi, PerformanceApi, conf as config } from 'api';
import HOCEditorGrammar from './HOCEditorGrammar';
import HOCEditorEmoji from './HOCEditorEmoji';
import HOCAiWriteMail from './HOCAiWriteMail';
import HOCEditorPreview from './HOCEditorPreview';
import HOCToolbarTip from './HOCToolbarTip';
import HOCCaptureScreen from './HOCCaptureScreen';

declare type Props = IAllProps & {
  uniqueClass?: string;
  onEditCreated: (e: EditorType) => void;
  grammarAction: (e: EditorType) => void;
  previewAction: (e: EditorType) => void;
  mouseoverToolbar: (e: EditorType) => void;
  mouseoutToolbar: (e: EditorType) => void;
  captureScreenAction: (e: EditorType) => void;
  insertEmojiAction: (emojiIconPosition: DOMRect, callback: (emoji: any) => {}) => void;
  aiWriteMailAction?: (type: 'write' | 'retouch') => void;
  AIWriteContentionShowAction?: React.Dispatch<boolean>;
  source?: 'market' | 'general';
};
const productAuthApi = api.api.requireLogicalApi(apis.productAuthApiImpl) as ProductAuthApi;
const performanceApi = api.api.requireLogicalApi(apis.performanceImpl) as PerformanceApi;

const contextPath = config('contextPath') as string;
const env = process.env.NODE_ENV;
const isProd = config('stage') === 'prod';
const tinymceENV = env !== 'production' || !isProd ? 'tinymce' : 'tinymce-min-27.5';
const eventsOut = (ed: EditorType) => {
  // 将编辑器的事件冒泡到主页面 qwe
  const eventsMap = {
    MouseEvents: ['mousedown', 'click'],
  };
  Object.keys(eventsMap).forEach(key => {
    const events = eventsMap[key];
    events.forEach(eventName => {
      ed.on(eventName, () => {
        if (document) {
          const event = document.createEvent(key);
          event.initEvent(eventName, true, false);
          document.body.dispatchEvent(event);
        }
      });
    });
  });
};

const LxEditor = React.forwardRef(
  (
    {
      init = {},
      uniqueClass,
      grammarAction,
      insertEmojiAction,
      onEditCreated,
      aiWriteMailAction,
      AIWriteContentionShowAction,
      mouseoverToolbar,
      mouseoutToolbar,
      captureScreenAction,
      previewAction,
      ...rest
    }: Props,
    ref
  ) => {
    const orgToolbar =
      init.toolbar ||
      `undo redo lxformatpainter removeformat $split fontselect fontsizeselect
  bold italic underline forecolor backcolor $split bullist numlist $split alignleftSplit
  dentSplit $split lxTable lximg link lxemoji $split preview print code`;
    const [productVersion, setProductVersion] = useState('');
    const [toolbar, setToolbar] = useState(orgToolbar);
    useEffect(() => {
      productAuthApi.doGetProductVersion().then(res => {
        if (res.productVersionId !== 'sirius') {
          setToolbar(pre => {
            const preStr = JSON.stringify(pre).replace('$split lxgrammar', '');
            return JSON.parse(preStr);
          });
        }
        setProductVersion(res.productVersionId);
      });
    }, []);
    const config = {
      tinymceScriptSrc: contextPath + `/${tinymceENV}/tinymce.js?version=${window.siriusVersion}`,
      init: {
        ...editorConfig,
        ...init,
        grammarAction,
        previewAction,
        insertEmojiAction,
        aiWriteMailAction,
        mouseoverToolbar,
        mouseoutToolbar,
        captureScreenAction,
        performanceApi,
        AIWriteContentionShowAction,
        init_instance_callback: (editor: EditorType) => {
          eventsOut(editor);
          onEditCreated && onEditCreated(editor);
          init.init_instance_callback && init.init_instance_callback(editor);
        },
        toolbar,
        automatic_uploads: false,
      },
      ...rest,
    };
    return (
      <div className={uniqueClass}>
        {!!productVersion && (
          <Editor
            // eslint-disable-next-line react/jsx-props-no-spreading
            {...config}
          />
        )}
      </div>
    );
  }
);

export default HOCEditorPreview(HOCEditorEmoji(HOCEditorGrammar(HOCToolbarTip(HOCAiWriteMail(HOCCaptureScreen(LxEditor))))));
