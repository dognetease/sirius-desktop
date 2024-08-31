import React, { useState, useEffect } from 'react';
import { ICustomerContactData } from 'api';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import ContactPicker from '../contactPicker';
import style from './contactPickerModal.module.scss';
import { Input } from 'antd';
import { getIn18Text } from 'api';
interface DomainModalProps {
  visible?: boolean;
  title?: React.ReactNode;
  adding?: boolean;
  okText?: string;
  cancelText?: string;
  onOk?: (arg0: string) => void;
  onCancel?: () => void;
}
const DomainModal: React.FC<DomainModalProps> = props => {
  const { visible, title, adding, okText, cancelText, onOk, onCancel } = props;
  const [domains, setDomains] = useState<string>('');
  useEffect(() => {
    !visible && setDomains('');
  }, [visible]);
  let handleInput = e => {
    let ns = e.target.value;
    setDomains(ns);
    console.log('---------------');
    console.log(ns);
  };
  return (
    <Modal
      className={style.contactPickerModal}
      title={title}
      visible={visible}
      width={492}
      onOk={() => onOk && onOk(domains)}
      onCancel={onCancel}
      okText={okText}
      cancelText={cancelText}
      okButtonProps={{
        disabled: !domains.length,
        loading: adding,
      }}
    >
      {/* <ContactPicker
                                    pickedContacts={pickedContacts}
                                    onPickedChange={setPickedContacts}
                                  /> */}
      <Input.TextArea className={style.input} rows={4} onChange={e => handleInput(e)} />
      <p className={style.p} style={{}}>
        {getIn18Text(
          'SHEWEIYUMINGHEIMINGDANHOU\uFF0CYUMINGXIANGTONGDEYOUJIANZAIYOUJIANYINGXIAOZHONGDOUHUIBEIRENWEISHIHEIMINGDANZHONGSHUJU\uFF0CJIANGWUFAXIANGQIFASONGYINGXIAOYOUJIAN\uFF0CQINGJINSHENSHIYONG'
        )}
      </p>
    </Modal>
  );
};
DomainModal.defaultProps = {
  title: getIn18Text('TIANJIAYUMINGZHIHEIMINGDAN'),
  okText: getIn18Text('BAOCUN'),
  cancelText: getIn18Text('QUXIAO'),
};
export default DomainModal;
