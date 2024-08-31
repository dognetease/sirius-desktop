import { ModalProps } from 'antd';
import classnames from 'classnames';
import React from 'react';
import { ProductTagEnum } from 'api';
import SiriusModal from '@web-common/components/UI/Modal/SiriusModal';
import eventcontentStyles from '../EventContent/eventcontent.module.scss';
import SubscribeContent from './Content';
import styles from './subscribemodal.module.scss';
import ProductAuthTag from '@web-common/components/UI/ProductAuthTag/ProductAuthTag';
import { getIn18Text } from 'api';
interface SubscribeModalProps extends ModalProps {
  onSubscribe?(): void;
}
const SubscribeModal: React.FC<SubscribeModalProps> = ({ onSubscribe, ...rest }) => (
  <SiriusModal
    zIndex={1040}
    centered
    maskClosable={false}
    destroyOnClose
    width={680}
    footer={null}
    className={classnames(eventcontentStyles.modal, styles.modal)}
    closeIcon={<i className={classnames('dark-invert', eventcontentStyles.icon, eventcontentStyles.close)} />}
    bodyStyle={{ padding: 0 }}
    {...rest}
  >
    <div className={styles.header}>
      <ProductAuthTag tagName={ProductTagEnum.CALENDAR_SHARING_SUBSCRIBE}>{getIn18Text('DINGYUERILI')}</ProductAuthTag>
    </div>
    <SubscribeContent onSubscribe={onSubscribe} />
  </SiriusModal>
);
export default SubscribeModal;
