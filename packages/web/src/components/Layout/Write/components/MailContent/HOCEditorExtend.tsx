/* eslint-disable react/jsx-props-no-spreading */
/*
 * @Author: your name
 * @Date: 2021-12-13 17:20:44
 * @LastEditTime: 2022-01-06 17:32:01
 * @LastEditors: Please set LastEditors
 * @Description: 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 * @FilePath: /dev-wlj/packages/web/src/components/Layout/Write/components/MailContent/HOCEditorExtend.tsx
 */
import React, { ReactNode, useEffect, useRef, useState } from 'react';
import { apiHolder as api, apis, DataTrackerApi } from 'api';
import { useAppSelector } from '@/state/createStore';

const trackApi = api.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;

const HOCEditorExtend = (Component: ReactNode) => {
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

    const showPlaceholderByWriteType = ed => {
      let showPlaceholder = true;
      if (['editDraft', 'edit'].includes(writeLetterPropRef.current) || ['template'].includes(writeFromRef.current)) {
        showPlaceholder = false;
      }
      const instance = ed || editorInstance;
      instance?.fire('updatePlaceholder', { show: showPlaceholder });
    };

    useEffect(() => {
      writeLetterPropRef.current = writeLetterProp;
      writeFromRef.current = currentMail.form;
      editorInstance?.fire('recoverSplitIcon');
      showPlaceholderByWriteType();
    }, [writeLetterProp, currentMailId]);

    const editorSetup = ed => {
      ed.on('input delete', () => {
        trackApi.track('pcMail_inputMessageBody_writeMailPage');
      });
      seteditorInstance(ed);
      onEditCreated(ed);
      showPlaceholderByWriteType(ed);
    };

    return <Component {...rest} onEditCreated={editorSetup} ref={forwardedRef} />;
  };

  return React.forwardRef((props, ref) => <UploadPlaceholder {...props} forwardedRef={ref} />);
};

export default HOCEditorExtend;
