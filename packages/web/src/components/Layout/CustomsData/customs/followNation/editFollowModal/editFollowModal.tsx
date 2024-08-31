import React, { useEffect, useState } from 'react';
import { Tag } from 'antd';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import { apiHolder, apis, EdmCustomsApi, resCustomsFollowCountry } from 'api';
import Toast from '@web-common/components/UI/Message/SiriusMessage';
import NationFlag from '../../../components/NationalFlag';
import { ReactComponent as CloseIcon } from '@/images/icons/customs/close-icon.svg';
const edmCustomsApi = apiHolder.api.requireLogicalApi(apis.edmCustomsApiImpl) as EdmCustomsApi;
import styles from './editFollowModal.module.scss';
import { getIn18Text } from 'api';
interface Props {
  visible: boolean;
  onCancel: () => void;
  onOk: () => void;
  nationList: resCustomsFollowCountry[];
  updateNationList: () => void;
}
const EditFollowModal: React.FC<Props> = ({ visible, onCancel, onOk, nationList, updateNationList }: Props) => {
  const handleOk = () => {
    onOk();
  };
  const handleClose = (id: string) => {
    edmCustomsApi
      .deleteFollowCountry({ countryIdList: [id] })
      .then(res => {
        Toast.success({
          content: getIn18Text('YISHANCHUSHOUCANG'),
        });
        setTimeout(() => updateNationList(), 500);
      })
      .catch(err => {
        console.log('deleteFollowCountry-err: ', err);
      });
  };
  useEffect(() => {
    console.log('nationList', nationList);
    if (nationList.length === 0) onCancel();
  }, [nationList]);
  return (
    <div className={styles.nationModal}>
      <Modal
        title={getIn18Text('BIANJISHOUCANG')}
        closable={true}
        width={438}
        visible={visible}
        onCancel={onCancel}
        bodyStyle={{ paddingLeft: 20, paddingRight: 20 }}
        onOk={handleOk}
        footer={null}
      >
        <div className={styles.item}>
          <div className={styles.nationArea}>
            {nationList.map(item => (
              <Tag key={item.code} closable onClose={() => handleClose(item.id)} closeIcon={<CloseIcon />}>
                <NationFlag name={item.country || item.value || ''} />
              </Tag>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  );
};
export default EditFollowModal;
