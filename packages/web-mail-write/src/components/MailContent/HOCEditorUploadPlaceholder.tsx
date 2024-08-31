/* eslint-disable react/jsx-props-no-spreading */
/*
 * @Author: your name
 * @Date: 2021-12-13 17:20:44
 * @LastEditTime: 2022-02-25 11:39:53
 * @LastEditors: Please set LastEditors
 * @Description: 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 * @FilePath: /dev-wlj/packages/@web-common/components/Layout/Write/components/MailContent/HOCEditorExtend.tsx
 */
import React, { useEffect, useRef, useState } from 'react';
import { apiHolder as api, apis, DataTrackerApi } from 'api';
import { Editor as EditorType } from '@web-common/tinymce';
import debounce from 'lodash/debounce';
import { useAppSelector } from '@web-common/state/createStore';

const trackApi = api.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;

const HOCEditorUploadPlaceholder = (Component: typeof React.Component) => {
  // 1. 编辑器初始化时候判断 当前写信类型 草稿箱再次编辑 和 邮件再次编辑 不要展示placeholder
  // 2. 切换邮件(窗口复用) 根据写信类型 控制是否展示placeholder
  const UploadPlaceholder = props => {
    // eslint-disable-next-line react/prop-types
    const { forwardedRef, onEditCreated, ...rest } = props;
    const writeLetterProp = useAppSelector(state => state.mailReducer.currentMail?.entry?.writeLetterProp);
    const currentMail = useAppSelector(state => state.mailReducer.currentMail);
    const currentMailId = useAppSelector(state => state.mailReducer.currentMail?.cid);
    const writeLetterPropRef = useRef('');
    const writeFromRef = useRef('');
    const [editorInstance, seteditorInstance] = useState(null);

    const showPlaceholderByWriteType = debounce(() => {
      if (!editorInstance) return;
      let showPlaceholder = true;
      if (
        ['editDraft', 'edit'].includes(writeLetterPropRef.current) ||
        ['template'].includes(writeFromRef.current) ||
        currentMail.extraOperate === 'questionApply' ||
        currentMail.entry?.withoutPlaceholder
      ) {
        showPlaceholder = false;
      }
      editorInstance?.fire('updatePlaceholder', { show: showPlaceholder });
    }, 300);

    useEffect(() => {
      writeLetterPropRef.current = writeLetterProp;
      writeFromRef.current = currentMail.form;
      // 获值时编辑器实例可能尚未初始化完成
      if (editorInstance) {
        editorInstance?.fire('recoverSplitIcon');
        showPlaceholderByWriteType();
      }
    }, [writeLetterProp, currentMailId, editorInstance]);

    const inputMessageBodyTrack = debounce(() => {
      trackApi.track('pcMail_inputMessageBody_writeMailPage');
    }, 5000);
    const editorSetup = ed => {
      ed.on('input delete', inputMessageBodyTrack);
      seteditorInstance(ed);
      onEditCreated(ed);
    };

    return <Component {...rest} onEditCreated={editorSetup} ref={forwardedRef} />;
  };

  return React.forwardRef((props, ref) => <UploadPlaceholder {...props} forwardedRef={ref} />);
};

export default HOCEditorUploadPlaceholder;
