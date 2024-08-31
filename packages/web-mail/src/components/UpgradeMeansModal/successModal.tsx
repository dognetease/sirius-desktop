import React from 'react';
import { Modal, Button } from 'antd';
import './index.scss';
import ReadListIcons from '@web-common/components/UI/Icons/svgs/ReadListSvgs';
import { getIn18Text } from 'api';
interface Props {
  visible: boolean;
  onClose: (origin?: string) => void;
}
const SuccessModal: React.FC<Props> = ({ visible, onClose }) => {
  return (
    <>
      <Modal
        className="UpgradeMeansSuccessModal"
        width={480}
        visible={visible}
        destroyOnClose={true}
        footer={[
          <Button
            key="submit"
            type="primary"
            onClick={() => {
              onClose();
            }}
          >
            {getIn18Text('ZHIDAOLE')}
          </Button>,
        ]}
        onCancel={() => onClose()}
      >
        <div className="container">
          <div className="icon">
            <ReadListIcons.UpgradeInfoReceiveSvg />
          </div>

          <div className="content">{getIn18Text('ZILIAOYITIJIAO')}</div>
        </div>
      </Modal>
    </>
  );
};
export default SuccessModal;
