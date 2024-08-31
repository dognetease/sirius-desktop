/* eslint-disable jsx-a11y/anchor-is-valid */
import { Moment } from 'moment';
import React from 'react';
import { usePopper } from 'react-popper';
import Icon from '@ant-design/icons/lib/components/Icon';
import { CustomIconComponentProps } from '@ant-design/icons/lib/components/Icon';
import { ReactComponent as InfoErrorCircleOutlineSvg } from '@/images/icons/info-error-circle-outline.svg';
import styles from './meetingroomuntiltip.module.scss';
import { getIn18Text } from 'api';
const InfoErrorCircleOutlineIcon: React.FC<Partial<CustomIconComponentProps>> = props => <Icon component={InfoErrorCircleOutlineSvg} {...props} />;
export type MeetingRoomTipType = 'until_error' | 'all_room_invalid' | 'cur_room_invalid';
interface MeetingRoomUntilTipProps<T = Moment> {
  onOk?(untilDateTime?: T | null): void;
  untilDateTime?: T | (() => T | null);
  getReferenceElement(): HTMLElement | null;
  onReselectMeetingRoom?(): void;
  onReselectDateTime?(): void;
  type?: MeetingRoomTipType;
  offset?: [number | null | undefined, number | null | undefined];
  getBoundaryElment?(): Element | undefined;
}
const MeetingRoomUntilTip: React.FC<MeetingRoomUntilTipProps> = ({
  onOk,
  untilDateTime: untilDateTimeFunc,
  getReferenceElement,
  onReselectMeetingRoom,
  onReselectDateTime,
  type,
  offset,
  getBoundaryElment,
}) => {
  const untilDateTime = typeof untilDateTimeFunc === 'function' ? untilDateTimeFunc() : untilDateTimeFunc;
  const [referenceElement, setReferenceElement] = React.useState<HTMLElement | null>(null);
  const [popperElement, setPopperElement] = React.useState<HTMLElement | null>(null);
  const { styles: poperStyles, attributes } = usePopper(referenceElement, popperElement, {
    placement: 'bottom-start',
    modifiers: [
      {
        name: 'offset',
        options: {
          offset: offset || [-12, 5],
        },
      },
      {
        name: 'preventOverflow',
        options: {
          boundary: getBoundaryElment ? getBoundaryElment() : undefined,
        },
      },
    ],
  });
  React.useEffect(() => {
    if (type) {
      setReferenceElement(getReferenceElement());
    }
  }, [type]);
  if (!type) {
    return null;
  }
  return (
    <div ref={setPopperElement} style={{ zIndex: 1, ...poperStyles.popper }} className={styles.poper} {...attributes.popper}>
      <InfoErrorCircleOutlineIcon style={{ fontSize: 16, marginRight: 8 }} />
      {type === 'until_error' && (
        <>
          <span>{getIn18Text('HUIYISHIZHIZHI')}</span>
          <span>{untilDateTime?.format(getIn18Text('NIANYUERI'))}</span>
          <a
            className={styles.opBtn}
            onClick={e => {
              e.preventDefault();
              onOk && onOk(untilDateTime);
            }}
          >
            {getIn18Text('YIJIANDIAOZHENG')}
          </a>
        </>
      )}
      {type === 'cur_room_invalid' && (
        <>
          <span>{getIn18Text('DANGQIANRICHENGSHI')}</span>
          <a
            className={styles.opBtn}
            onClick={e => {
              e.preventDefault();
              onReselectMeetingRoom && onReselectMeetingRoom();
            }}
          >
            {getIn18Text('ZHONGXINXUANZE')}
          </a>
        </>
      )}
      {type === 'all_room_invalid' && (
        <>
          <span>{getIn18Text('DANGQIANRICHENGXIA')}</span>
          <a
            className={styles.opBtn}
            onClick={e => {
              e.preventDefault();
              onReselectDateTime && onReselectDateTime();
            }}
          >
            {getIn18Text('QUEDING')}
          </a>
        </>
      )}
    </div>
  );
};
export default MeetingRoomUntilTip;
