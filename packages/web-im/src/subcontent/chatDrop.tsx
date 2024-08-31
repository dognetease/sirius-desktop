import React, { useContext } from 'react';
import message from '@web-common/components/UI/Message/SiriusMessage';
import { FilesDragAndDrop } from '../common/fileDragAndDrop';
import { PasteFileContext } from './store/pasteFile';
import { CurSessionContext } from './store/currentSessioProvider';
import { getIn18Text } from 'api';
import styles from './chatDrop.module.scss';
interface ChatDropApi {
  classnames: string;
}
export const ChatDrop: React.FC<ChatDropApi> = props => {
  const { classnames } = props;
  const onUpload = (error: Error, files: File[]) => {
    if (error instanceof Error) {
      if (error.message === 'FORBIDDEN_FOLDER') {
        return message.error(getIn18Text('BUZHICHIFASONG11'));
      }
      if (error.message === 'EXCEED_COUNT_LIMIT') {
        return message.error(getIn18Text('TUOZHUAIWENJIANCHAO'));
      }
      if (error.message === 'EXCEED_SIZE_LIMIT') {
        return message.error(getIn18Text('BUZHICHIFASONG'));
      }
      return message.error(getIn18Text('FASONGSHIBAI'));
    }
    onFileChange(files);
  };
  const { onFileChange } = useContext(PasteFileContext);
  const { toName } = useContext(CurSessionContext);
  const style = {
    // color: 'rgba(38, 42, 51, 0.9);',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
    background: 'transparent',
    // border: '1px dashed rgba(38, 42, 51, 0.5)',
    borderRadius: '6px',
    position: 'relative',
  };
  const dropComponent = (
    <p style={style} className={styles.drop}>
      {getIn18Text('FASONGGEI&n')}&nbsp;"
      {toName}"
    </p>
  );
  return (
    <FilesDragAndDrop dragClassname={classnames} onUpload={onUpload} dropComponent={dropComponent} maxSize={Math.pow(1024, 3)}>
      {props.children}
    </FilesDragAndDrop>
  );
};
