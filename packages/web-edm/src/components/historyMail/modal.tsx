import React from 'react';

import Modal from '@web-common/components/UI/Modal/SiriusModal';
import style from './modal.module.scss';
import defaultImage from '@/images/icons/edm/default-edm-thumb.png';
import { Tooltip } from 'antd';
import { getIn18Text } from 'api';

export interface IHistoryMail {
  id: string;
  usedEmailId: string;
  emailSubject: string;
  emailThumbnail: string;
}
export interface IHistoryActionProps {
  data: Array<IHistoryMail>;
  visible: boolean;
  onCancel?: () => void;
  onSelect?: (item: IHistoryMail) => void;
}
export const HistoryMailModal = (props: IHistoryActionProps) => {
  return (
    <Modal
      title={getIn18Text('YISHIYONGGUODEYOUJIAN')}
      className={style.historyMailModal}
      visible={props.visible}
      footer={null}
      onCancel={props.onCancel}
      width={600}
      getContainer="#edm-write-root"
    >
      <ul className={style.historyMailList}>
        {props.data.map(item => {
          const images = (item.emailThumbnail || '').split(',');
          return (
            <li key={item.id} className={style.item} onClick={() => props.onSelect && props.onSelect(item)}>
              <img src={images[0] || defaultImage} alt={item.emailSubject} width="120" height="120" />
              <Tooltip title={item.emailSubject}>
                <div className={style.title}>{item.emailSubject}</div>
              </Tooltip>
            </li>
          );
        })}
      </ul>
    </Modal>
  );
};
