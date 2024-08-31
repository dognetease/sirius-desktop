import React from 'react';
import { ReactComponent as ThumbUpIcon } from '@/images/icons/disk/notification_thumb_up.svg';
import { ReactComponent as ThumbUpHighlightIcon } from '@/images/icons/disk/notification_thumb_up_highlight.svg';
import styles from './index.module.scss';

interface LikeProps {
  liked?: boolean;
  text?: string;
  onClick?: () => void;
}

export function Like({ liked, text, onClick }: LikeProps) {
  return (
    <div className={styles['like']}>
      <div className={styles['like__thumb_up']} onClick={onClick}>
        {liked ? <ThumbUpHighlightIcon /> : <ThumbUpIcon />}
      </div>
      {text ? <div className={styles['like__text']}>{text}</div> : null}
    </div>
  );
}
