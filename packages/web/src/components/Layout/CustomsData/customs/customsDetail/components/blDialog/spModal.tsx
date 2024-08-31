import { CustomsRecord, api, EdmCustomsApi, apis } from 'api';
import { Modal, ModalProps } from 'antd';
import React, { useEffect, useState } from 'react';
import CustomsRecordDetail from '../../../docSearch/component/CustomsRecordDetail/CustomsRecordDetail';

const edmCustomsApi = api.requireLogicalApi(apis.edmCustomsApiImpl) as EdmCustomsApi;

interface SpModalProps extends ModalProps {
  id?: string;
}

const SpModal: React.FC<SpModalProps> = ({ id, visible, ...rest }) => {
  const [record, setRecord] = useState<CustomsRecord>();
  useEffect(() => {
    if (id && visible) {
      edmCustomsApi.doGetCustomsDetailInfoById(id).then(setRecord);
    }
  }, [id, visible]);

  return (
    <Modal footer={null} width={820} visible={visible} {...rest}>
      <div className="sirius-scroll" style={{ height: 500, marginTop: 16, paddingRight: 8 }}>
        <CustomsRecordDetail record={record} />
      </div>
    </Modal>
  );
};

export default SpModal;
