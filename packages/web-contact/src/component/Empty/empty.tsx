import { Button } from 'antd';
import message from '@web-common/components/UI/Message/SiriusMessage';
import classNames from 'classnames';
import React, { useState } from 'react';
import styles from './empty.module.scss';
import { getIn18Text } from 'api';
export interface ContactEmptyProps {
  onRefresh?(): Promise<any>;
  text: React.ReactNode;
  renderContent?(): React.ReactNode;
  imgClassName?: string;
  className?: string;
  style?: React.CSSProperties;
}
const ContactEmpty: React.FC<ContactEmptyProps> = ({ onRefresh, text, renderContent, imgClassName, className, style }) => {
  const [loading, setLoading] = useState<boolean>(false);
  const handleRefresh = async () => {
    if (onRefresh) {
      setLoading(!0);
      const error = await onRefresh();
      setLoading(!!0);
      if (error) {
        message.error({
          content: error,
          duration: 1,
        });
      }
    }
  };
  const renderRefresh = () => {
    if (!onRefresh) {
      return null;
    }
    if (loading) {
      return <span className={styles.emptyRefeshIcon} />;
    }
    return (
      <Button type="link" onClick={handleRefresh}>
        {getIn18Text('SHUAXIN')}
      </Button>
    );
  };
  return (
    <div style={style} className={classNames(styles.emptyContainer, className)}>
      <div className={classNames('sirius-empty sirius-empty-search', styles.emptyImg, imgClassName)} />
      <p>{text}</p>
      {renderRefresh()}
      {renderContent ? renderContent() : null}
    </div>
  );
};
export default ContactEmpty;
