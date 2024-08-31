// import Modal from 'antd/lib/modal';
import classnames from 'classnames';
import React, { useEffect, useRef, useState } from 'react';
import { usePopper } from 'react-popper';
import Draggable from 'react-draggable';
import { useResizeDetector } from 'react-resize-detector';
import styles from './createbox.module.scss';
import eventcontentStyles from '../EventContent/eventcontent.module.scss';
import { SelectDate } from '../../schedule';
import { ModalClose } from '@web-common/components/UI/Icons/icons';
import EventBody, { EventBodyRef } from './EventBody';
import { ScheduleInsertForm } from './ScheduleForm';
import { ScheduleSyncObInitiator } from '../../data';
import { ContactItem } from '@web-common/utils/contact_util';

interface CreateScheduleBoxProps {
  selectDate?: SelectDate;
  getReferenceElement(): HTMLElement | null;
  onCancel?(e?: any): void;
  onSyncCancel?(): void;
  onTimeRelatedValuesChange?(values: ScheduleInsertForm): void;
  updatePostion?: any;
  defaultContactList?: ContactItem[];
  source?: ScheduleSyncObInitiator;
}

const CreateScheduleBox: React.FC<CreateScheduleBoxProps> = ({
  onCancel,
  selectDate,
  getReferenceElement,
  onSyncCancel,
  onTimeRelatedValuesChange,
  updatePostion,
  defaultContactList,
  source = ScheduleSyncObInitiator.MAIN_MODULE,
}) => {
  const eventBodyRef = useRef<EventBodyRef>(null);
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(null);
  const { width, height } = useResizeDetector({ targetRef: { current: popperElement } });
  const {
    styles: popperStyles,
    attributes,
    update,
  } = usePopper(getReferenceElement(), popperElement, {
    placement: 'right-start',
    modifiers: [
      {
        name: 'preventOverflow',
        options: {
          boundary: document.querySelector('#schduleModule') as any,
          altAxis: !0,
          padding: 8,
        },
      },
      {
        name: 'offset',
        options: {
          offset: [0, 2],
        },
      },
    ],
  });

  const maskRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (width && height && update) {
      update();
    }
  }, [width, height, updatePostion]);

  useEffect(() => {
    const triggerCancel = (e: any) => {
      if (maskRef.current === e.target) {
        eventBodyRef.current?.triggerCancel?.();
      }
    };
    window.addEventListener('mousedown', triggerCancel);
    return () => {
      window.removeEventListener('mousedown', triggerCancel);
    };
  }, [popperElement]);
  return (
    <>
      <div ref={maskRef} className={styles.mask} />
      <Draggable handle=".drag-header" positionOffset={{ x: '-50%', y: '-50%' }}>
        <div
          ref={setPopperElement}
          style={popperStyles.popper}
          className={classnames(eventcontentStyles.modal, styles.modal, {
            [styles.modalCenter]: getReferenceElement() === null,
          })}
          {...attributes.popper}
        >
          <div className={classnames(styles.header, 'sirius-no-drag drag-header')}>
            <ModalClose className={`dark-invert ${styles.close}`} onClick={() => eventBodyRef.current?.triggerCancel?.()} />
          </div>
          <EventBody
            source={source}
            defaultContactList={defaultContactList}
            onTimeRelatedValuesChange={onTimeRelatedValuesChange}
            onSyncCancel={onSyncCancel}
            // defaultexpanded={getReferenceElement() === null}
            onCancel={onCancel}
            selectDate={selectDate}
            ref={eventBodyRef}
          />
        </div>
      </Draggable>
    </>
  );
};

export default CreateScheduleBox;
