import React, { useState } from 'react';
import { Button } from 'antd';
import { IBaseModalType } from '../baseType';
import { ModalHeader } from '../../components/ModalHeader/index';
import styles from './index.module.scss';
import { ReactComponent as WarnIcon } from '../../assets/warnIcon.svg';
import classnames from 'classnames';
import { apiHolder, apis, AddressBookApi } from 'api';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import message from '@web-common/components/UI/Message/SiriusMessage';
import { getIn18Text } from 'api';
const addressBookApi = apiHolder.api.requireLogicalApi(apis.addressBookApiImpl) as unknown as AddressBookApi;
export interface IDeleteContactsProps extends IBaseModalType {
  contacts: number[];
}
export function DeleteContacts(props: IDeleteContactsProps) {
  const { visible, onClose, onError, onSuccess, contacts, id } = props;
  const [loading, setLoading] = useState(false);
  const onDelete = () => {
    setLoading(true);
    addressBookApi
      .addressBookAdd2Recycle({
        addressIdList: contacts,
      })
      .then(() => {
        message.success(`已删除${contacts.length}个联系人到 [回收站]`);
        onSuccess && onSuccess(id);
      })
      .catch(err => {
        message.error(getIn18Text('SHANCHUSHIBAI\uFF0CQINGZHONGSHI'));
        onError && onError(id, err);
      })
      .finally(() => setLoading(false));
  };
  return (
    <Modal
      width={424}
      visible={visible}
      title={
        <div className={styles.deleteHeader}>
          <ModalHeader
            title={
              <div className={styles.deleteHeaderMain}>
                <div className={styles.icon}>
                  <WarnIcon />
                </div>
                <div>{`确定删除${contacts.length}个联系人到 [回收站] ？`}</div>
              </div>
            }
            onClick={() => onClose(id)}
          />
          <div className={styles.deleteHeaderTip}>可至 [回收站] 还原已删除联系人，进入 [回收站] 超过30天，将彻底清除无法还原</div>
        </div>
      }
      footer={[
        [
          <Button onClick={() => onClose(id)} className={classnames(styles.btn, styles.cancel)}>
            {getIn18Text('QUXIAO')}
          </Button>,
          <Button onClick={onDelete} className={classnames(styles.btn, styles.deleteBtn)} loading={loading} type="primary" danger>
            {getIn18Text('QUEDING')}
          </Button>,
        ],
      ]}
      closable={false}
      maskClosable={false}
      onCancel={() => onClose(id)}
      className={styles.delete}
    ></Modal>
  );
}
