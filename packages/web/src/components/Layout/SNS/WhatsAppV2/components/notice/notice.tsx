import React from 'react';
import classnames from 'classnames';
import { ReactComponent as InfoIcon } from '@/images/icons/whatsApp/info-circle.svg';
import { ReactComponent as ErrorIcon } from '@/images/icons/whatsApp/error-circle.svg';
import { ReactComponent as WarningIcon } from '@/images/icons/whatsApp/warning-circle.svg';
import style from './notice.module.scss';

interface NoticeProps {
  className?: string;
  style?: React.CSSProperties;
  type: 'info' | 'error' | 'warning';
  showIcon?: boolean;
  children: React.ReactChild | React.ReactChild[];
}

const Notice: React.FC<NoticeProps> = props => {
  const { className, style: styleFromProps, type, showIcon, children } = props;

  return (
    <div className={classnames(style.notice, className, style[type])} style={styleFromProps}>
      {showIcon && (
        <>
          {type === 'info' && <InfoIcon className={style.noticeIcon} />}
          {type === 'error' && <ErrorIcon className={style.noticeIcon} />}
          {type === 'warning' && <WarningIcon className={style.noticeIcon} />}
        </>
      )}
      {children}
    </div>
  );
};

Notice.defaultProps = {
  showIcon: true,
};

export default Notice;
