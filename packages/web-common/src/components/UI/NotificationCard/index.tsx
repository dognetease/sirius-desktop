import React, { useState, useEffect } from 'react';
import styles from './index.module.scss';
import classNames from 'classnames';

type NotificationCardAnimMode = 'bottomRight';

interface NotificationCardProps {
  style?: React.CSSProperties;
  containerCls?: string;
  children?: React.ReactNode;
  animMode?: NotificationCardAnimMode;
  show: boolean;
}

const NotificationCard: React.FC<NotificationCardProps> = props => {
  const { style = {}, containerCls = '', animMode = 'bottomRight', show } = props;
  const [playShowAnim, setPlayShowAnim] = useState(false);
  const [playAnimReverse, setPlayAnimReverse] = useState(false);

  const getModeClassName = (mode: NotificationCardAnimMode, isReverse = false) => {
    const mapping = {
      bottomRight: styles.notificationCardBackInUp,
      bottomRightReverse: styles.notificationCardBackInUpReverse,
    };

    return isReverse ? mapping[`${mode}Reverse`] : mapping[mode];
  };

  useEffect(() => {
    setPlayShowAnim(show);
    setPlayAnimReverse(!show);
  }, [show]);
  // 'global-marketing-modal',
  return (
    <div
      className={classNames([
        styles.commonNotificationCard,
        containerCls,
        playShowAnim && getModeClassName(animMode),
        playAnimReverse && getModeClassName(animMode, true),
      ])}
      style={{ ...style }}
    >
      {props.children}
    </div>
  );
};

export default NotificationCard;
