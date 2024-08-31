import React, { useState, useMemo, useEffect } from 'react';
import { MailEntryModel, MailFileAttachModel } from 'api';
import classnames from 'classnames';
import IconCard from '@web-common/components/UI/IconCard';
import { useActions, ReadMailActions } from '@web-common/state/createStore';
import styles from './index.module.scss';
import { getIn18Text } from 'api';
interface Props {
  content: MailEntryModel;
}
const HeaderAttachment: React.FC<Props> = ({ content }) => {
  const [attachments, setAttachments] = useState<MailFileAttachModel[]>([]);
  const [firstAttach, setFirstAttach] = useState<{
    name: string;
    suffix: string;
  }>({ name: '', suffix: '' });
  const { updateScrollToAttachments } = useActions(ReadMailActions);
  useEffect(() => {
    if (!content) {
      return;
    }
    let list = content?.entry?.attachment || [];
    list = list?.filter(item => item.fileType !== 'ics' && !item.inlined);
    if (list && list.length) {
      setAttachments(list);
      getName(list[0].fileName);
    } else {
      setAttachments([]);
    }
  }, [content]);
  const getName = (fileName: string) => {
    const nameSplit = fileName.split('.');
    const suffix = nameSplit.pop();
    setFirstAttach({
      name: nameSplit.join('.'),
      suffix: `${suffix}`,
    });
  };
  return (
    <>
      {!!attachments.length && (
        <div className={classnames(styles.attachmentHeader)}>
          <span className={classnames(styles.title)}>
            {getIn18Text('FUJIAN')}
            {attachments.length}
            {getIn18Text('GE')}
          </span>
          {/* fileType */}
          <span className={classnames(styles.name)}>
            （ <IconCard type={firstAttach.suffix} width="12px" height="12px" /> {firstAttach.name}
          </span>
          <span className={classnames(styles.endText)}>
            .{firstAttach.suffix}
            {attachments.length > 1 && getIn18Text('DENG')} ）
          </span>
          <span
            className={classnames(styles.check)}
            onClick={e => {
              e.stopPropagation();
              updateScrollToAttachments(content?.id);
            }}
            data-test-id="attachment-check"
          >
            {getIn18Text('CHAKANFUJIAN')}
          </span>
        </div>
      )}
    </>
  );
};
export default HeaderAttachment;
