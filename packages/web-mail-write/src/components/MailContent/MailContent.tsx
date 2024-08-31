/*
 * @Author: your name
 * @Date: 2021-11-25 16:15:03
 * @LastEditTime: 2022-01-26 15:04:04
 * @LastEditors: Please set LastEditors
 * @Description: 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 * @FilePath: /dev-wlj/packages/@web-common/components/Layout/Write/components/MailContent/MailContent.tsx
 */
import HOCEditorUploadPlaceholder from './HOCEditorUploadPlaceholder';
import HOCEditorPaste from './HOCEditorPaste';
import WrappedContent from './WrappedContent';
import HOCEditorExtend from './HOCEditorExtend';
import HOCUploadAttachmentWithFiles from '../UploadAttachment/HOCUploadAttachmentWithFiles';

export default HOCUploadAttachmentWithFiles(HOCEditorUploadPlaceholder(HOCEditorPaste(HOCEditorExtend(WrappedContent))));
