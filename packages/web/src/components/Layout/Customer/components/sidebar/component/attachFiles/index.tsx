import React from 'react';
import { Dropdown } from 'antd';
import { getTrail } from '@web-disk/utils';
import IconCard from '@web-common/components/UI/IconCard';
import style from './index.module.scss';
import { EllipsisText } from '../../../ellipsisText/ellipsisText';

interface AttachmentItem {
  name: string;
}
export interface AttachFilesProps<T extends AttachmentItem> {
  showNum: number;
  data: T[];
  onClickItem?: (item: T) => void;
  itemKey?: (a: T) => (string | number) | string;
}

interface OverlayProps<T extends AttachmentItem> {
  attachments: T[];
  onClickItem?: (item: T) => void;
  keyGen: (a: T, idx: number) => string | number;
}
const RemainOverlay = <T extends AttachmentItem>({ attachments, onClickItem, keyGen }: OverlayProps<T>) => (
  <div className={style.dropdownOverlay}>
    {attachments.map((a, idx) => {
      const fileType = getTrail(a.name);
      return (
        <div className={style.attachmentItem} onClick={() => onClickItem && onClickItem(a)} key={keyGen(a, idx)}>
          <span className={style.attachmentIcon}>
            <IconCard type={fileType as any} width={16} height={16} />
          </span>
          <div className={style.fileName}>{a.name}</div>
        </div>
      );
    })}
  </div>
);

export const AttachFiles = <T extends AttachmentItem>(props: AttachFilesProps<T>) => {
  const { showNum, data, onClickItem, itemKey } = props;

  const attachments = data.slice(0, showNum);
  const remainAttachments = data.slice(showNum);

  const getKey = (a: T, idx: number) => {
    if (!itemKey) {
      return idx;
    }
    if (typeof itemKey === 'string') {
      return a[itemKey];
    }
    return itemKey(a);
  };
  if (data.length === 0) {
    return null;
  }
  return (
    <div className={style.attachments}>
      {attachments.map((a, idx) => {
        const fileType = getTrail(a.name);
        return (
          <div className={style.attachmentItem} onClick={() => onClickItem && onClickItem(a)} key={getKey(a, idx)}>
            <span className={style.attachmentIcon}>
              <IconCard type={fileType as any} width={16} height={16} />
            </span>
            <EllipsisText text={a.name} footerLength={fileType.length} className={style.fileName} />
          </div>
        );
      })}
      {remainAttachments.length > 0 && (
        <Dropdown overlay={<RemainOverlay attachments={remainAttachments} onClickItem={onClickItem} keyGen={getKey} />} placement="bottomRight">
          <div className={style.moreAttachment}>+{remainAttachments.length}</div>
        </Dropdown>
      )}
    </div>
  );
};
