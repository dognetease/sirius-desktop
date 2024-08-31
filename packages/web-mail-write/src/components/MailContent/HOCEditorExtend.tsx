/* eslint-disable react/jsx-props-no-spreading */
/*
 * @Author: your name
 * @Date: 2021-12-13 17:20:44
 * @LastEditTime: 2022-01-06 17:32:01
 * @LastEditors: Please set LastEditors
 * @Description: 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 * @FilePath: /dev-wlj/packages/@web-common/components/Layout/Write/components/MailContent/HOCEditorExtend.tsx
 */
import React, { ReactNode, useEffect, useRef, useState } from 'react';
import { apiHolder as api, apis, DataTrackerApi } from 'api';
import { Editor as EditorType } from '@web-common/tinymce';
import UploadAttachment from '../UploadAttachment';
import {
  ContactActions,
  DiskAttActions,
  MailActions,
  MailConfigActions,
  MailTemplateActions,
  useActions,
  useAppDispatch,
  useAppSelector,
} from '@web-common/state/createStore';
import { MAIL_EDITOR_CONTAINER_CLASS } from './editor-config';

const trackApi = api.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;

const HOCEditorExtend = (Component: ReactNode) => {
  const UploadPlaceholder = props => {
    // eslint-disable-next-line react/prop-types
    const { forwardedRef, onEditCreated, ...rest } = props;
    const dispatch = useAppDispatch();
    const bodyObserverRef = useRef(null);
    const uploadAttachmentRef = useRef<{
      upload(fileList: File[]): any;
    }>(null);

    // observe editor size for overflow-x
    // extract the horizontal scrollbar that was part of editor to the outside
    // 为了写信横向滚动条
    const bodyObserver = (ed: EditorType) => {
      const editorBody = ed.getBody();
      const container = document.querySelector(`.${MAIL_EDITOR_CONTAINER_CLASS}`);
      // 编辑器iframe外面的容器，把滚动条提到iframe外面，让横向滚动条始终在外面
      const overflowContainer = document.querySelector(`.${MAIL_EDITOR_CONTAINER_CLASS} .tox-tinymce`);
      if (!container) return;
      const resizeOb = new ResizeObserver(entries => {
        // for (let entry of entries) {}
        const offsetWidth = editorBody.scrollWidth;
        if (overflowContainer && container) {
          const containerWidth = container.clientWidth;
          // 有个padding 32
          let width = offsetWidth;
          if (containerWidth > width) {
            width = containerWidth;
          }
          overflowContainer.style.width = width + 'px';
          // 编辑器内容body宽度时候和可用页面宽度相等
          editorBody.style.width = containerWidth + 'px';
        }
      });
      bodyObserverRef.current = resizeOb;
      resizeOb.observe(editorBody);
      resizeOb.observe(container);
    };

    useEffect(() => {
      return () => {
        bodyObserverRef.current && bodyObserverRef.current.disconnect();
      };
    }, []);

    // const toolbarObserver = (ed: EditorType) => {
    //   const toolbarEle = document.querySelector(`.${MAIL_EDITOR_CONTAINER_CLASS} .tox-editor-header`);
    //   if (!toolbarEle) return;
    //   const toolbarOb = new ResizeObserver(entries => {
    //     console.log('entriesentriesentries', ed);
    //   });
    //   toolbarOb.observe(toolbarEle);
    // };

    const editorSetup = (ed: EditorType) => {
      bodyObserver(ed);
      onEditCreated(ed);
      // toolbarObserver(ed);
    };

    return (
      <>
        <UploadAttachment ref={uploadAttachmentRef} />
        <Component onEditCreated={editorSetup} {...rest} ref={forwardedRef} uploadAttachment={uploadAttachmentRef.current?.upload} />
      </>
    );
  };

  return React.forwardRef((props, ref) => <UploadPlaceholder {...props} forwardedRef={ref} />);
};

export default HOCEditorExtend;
