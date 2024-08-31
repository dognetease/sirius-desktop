import React, { useMemo } from 'react';
import message from '@web-common/components/UI/Message/SiriusMessage';
import style from './index.module.scss';
import { useAppSelector, MailTemplateActions, useActions } from '@web-common/state/createStore';
import { ViewMail } from '@web-common/state/state';
import { replaceCurrentMailContent } from './utils';
import { getIn18Text } from 'api';
import { remWaittingId } from '@web-mail-write/util';

interface Props {
  isContentChanged: boolean;
}
interface PropsClone {
  isContentChanged: boolean;
}
// eslint-disable-next-line max-statements
const SaveAsTemplateComp: React.FC<Props> = (props: Props) => {
  const { isContentChanged } = props;
  const { currentMail } = useAppSelector(state => state.mailReducer);
  const currentMailId = useAppSelector(state => state.mailReducer.currentMail.cid);
  const subAccountExpired = useMemo(() => currentMail?.subAccountExpired, [currentMail]);
  const { doWriteTemplate, changeShowAddTemplatePop } = useActions(MailTemplateActions);
  // 写信中添加的图片不能保存为模板
  const replaceCurrentMailContentImg = (content: string) => {
    const document = new DOMParser().parseFromString(content, 'text/html');
    const imgEls = document.querySelectorAll('img');
    if (imgEls.length > 0) {
      imgEls.forEach(imgEl => {
        const src = imgEl.getAttribute('src');
        if (src && src.indexOf('js6/s') > -1) {
          imgEl.parentNode!.removeChild(imgEl);
        }
      });
      // @ts-ignore
      message.warn({
        content: getIn18Text('XIEXINYETUPIAN'),
        duration: 5,
      });
    }
    return document.documentElement.innerHTML;
  };
  const saveAsTemplate = () => {
    if (subAccountExpired) return;
    remWaittingId(currentMailId, true);
    if (currentMail.receiver.length === 0 && !currentMail.entry.title && !isContentChanged) {
      // @ts-ignore currentMail writeLetterProp
      message.warn({
        content: getIn18Text('QINGZHISHAOSHURU11'),
      });
      return;
    }
    const replaceTargets = ['.mail-signature', '.mail-signature-ent', '#divNeteaseBigAttach', '#divNeteaseSiriusCloudAttach', '.pre-mail-content'];
    let content = replaceCurrentMailContent(currentMail.entry.content.content, replaceTargets);
    content = replaceCurrentMailContentImg(content);
    const replacedCurrentMail: ViewMail = {
      ...currentMail,
      conference: undefined,
      entry: {
        ...currentMail.entry,
        content: {
          ...currentMail.entry.content,
          content,
        },
      },
    };
    replacedCurrentMail.id = '';
    doWriteTemplate(replacedCurrentMail);
    setTimeout(() => {
      changeShowAddTemplatePop({ isShow: true, source: 'write', isModified: !!isContentChanged });
    }, 200);
  };
  return (
    <>
      {currentMail && currentMail.entry && ['common', 'reply', 'forward'].includes(currentMail.entry.writeLetterProp as string) && (
        <div id="saveAsTemplateComp" className={`${style.btn} ${style.saveAsTemplate} ${subAccountExpired ? 'disabled' : ''}`} onClick={saveAsTemplate}>
          {getIn18Text('BAOCUNWEIMOBAN')}
        </div>
      )}
    </>
  );
};
export default SaveAsTemplateComp;
export const SaveAsTemplateCompClone: React.FC<PropsClone> = (props: PropsClone) => {
  const { currentMail } = useAppSelector(state => state.mailReducer);
  const subAccountExpired = useMemo(() => currentMail?.subAccountExpired, [currentMail]);

  const ckAction = (e: React.MouseEvent) => {
    if (subAccountExpired) return;
    e.stopPropagation();
    document.getElementById('saveAsTemplateComp')?.click();
  };
  return (
    <>
      {currentMail && currentMail.entry && ['common', 'reply', 'forward'].includes(currentMail.entry.writeLetterProp as string) && (
        <div className={`${style.btn} ${style.saveAsTemplate} ${subAccountExpired ? 'disabled' : ''}`} onClick={e => ckAction(e)}>
          {getIn18Text('BAOCUNWEIMOBAN')}
        </div>
      )}
    </>
  );
};
