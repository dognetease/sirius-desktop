import React from 'react';
import './index.scss';
import { Modal, Button } from 'antd';
import TranslateIconTrue from '@/images/icons/translate_icon_true.svg';
import { useGetProductAuth } from '@web-common/hooks/useGetProductAuth';
import { ReactComponent as CloseIcon } from '@/images/icons/close_modal.svg';
import { getIn18Text } from 'api';
interface Props {
  visible: boolean;
  closeModal: () => void;
}
const Img = <img src={TranslateIconTrue} alt="arrow-right" />;
const TranslateModal: React.FC<Props> = props => {
  const { visible, closeModal } = props;
  const {
    productVersionInfo: { productVersionId },
  } = useGetProductAuth();
  return (
    <Modal
      visible={visible}
      closable
      centered
      width={452}
      title={getIn18Text('FANYIGONGNENGSHENG')}
      wrapClassName="translate-modal"
      onCancel={closeModal}
      closeIcon={<CloseIcon className="dark-invert" />}
      footer={[
        <span className="footer-tip" style={{ marginRight: '16px' }}>
          {getIn18Text('QINGLIANXININDE')}
        </span>,
        <Button key="submit" type="primary" size="small" onClick={closeModal}>
          {getIn18Text('ZHIDAOLE')}
        </Button>,
      ]}
    >
      <div className="translate-body">
        <div className="translate-container">
          <div className={`name`}>
            <div className="item">{getIn18Text('GONGNENGBANBEN')}</div>
            <div className="item">{getIn18Text('ZHONGYINGWENHUYI')}</div>
            <div className="item">{getIn18Text('ZIDONGSHIBIEYU')}</div>
            <div className="item">{getIn18Text('SHOUDONGXUANZEFAN')}</div>
          </div>
          <div className={`product ${productVersionId === 'free' ? 'select' : ''}`}>
            <div className="productName">{getIn18Text('MIANFEIBAN')}</div>
            <div className="item">{Img}</div>
            <div className="item"></div>
            <div className="item"></div>
          </div>
          <div className={`product ${productVersionId === 'ultimate' ? 'select' : ''}`}>
            <div className="productName">{getIn18Text('QIJIANBAN')}</div>
            <div className="item">{Img}</div>
            <div className="item">{Img}</div>
            <div className="item">{getIn18Text('FUFEI')}</div>
          </div>
          <div className={`product ${productVersionId === 'sirius' ? 'select' : ''}`}>
            <div className="productName">{getIn18Text('ZUNXIANGBAN')}</div>
            <div className="item">{Img}</div>
            <div className="item">{Img}</div>
            <div className="item">{Img}</div>
          </div>
        </div>
      </div>
    </Modal>
  );
};
export default TranslateModal;
