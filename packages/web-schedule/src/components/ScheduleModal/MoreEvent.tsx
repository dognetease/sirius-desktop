import { Popover } from 'antd';
import { FreeBusyModel } from 'api';
import React, { useState } from 'react';
import styles from './moreEvent.module.scss';
import EventCell from './EventCell';
import { getIn18Text } from 'api';
interface MoreEventProps {
  num: number;
  events: FreeBusyModel['freeBusyItems'];
  judgePast?: boolean;
}
const MoreEvent: React.FC<MoreEventProps> = ({ num, events, judgePast = true }) => {
  const [visible, setVisible] = useState(false);
  const eventNum = events.length - num + 1;
  // 内容
  const renderContent = () => {
    return (
      <>
        <div
          style={{
            height: 44,
            lineHeight: '44px',
            padding: '0 8px',
            fontSize: '12px',
            color: 'rgba(38, 42, 51, 0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {getIn18Text('QUANBURICHENG')}
          <span
            onClick={() => {
              setVisible(false);
            }}
            className={styles.close}
          />
        </div>
        {events.map(i => (
          <div className={styles.eventOuter} key={i.scheduleId}>
            <EventCell event={i} judgePast={judgePast} />
          </div>
        ))}
      </>
    );
  };
  const onVisibleChange = visible => {
    setVisible(visible);
  };
  return (
    <>
      <Popover
        arrowPointAtCenter
        destroyTooltipOnHide
        getPopupContainer={() => document.body}
        placement="bottom"
        trigger="click"
        content={renderContent}
        visible={visible}
        onVisibleChange={onVisibleChange}
        overlayInnerStyle={{
          width: 220,
          maxHeight: 280,
          padding: '0 8px 16px 12px',
        }}
      >
        <div className={styles.eventOuter} style={{ textAlign: 'left' }}>
          <span className={styles.moreTitle}>
            {getIn18Text('HAISHENG')}
            {eventNum}
            {getIn18Text('GERICHENG')}
          </span>
        </div>
      </Popover>
    </>
  );
};
export default MoreEvent;
