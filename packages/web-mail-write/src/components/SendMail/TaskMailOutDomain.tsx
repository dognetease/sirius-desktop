import React, { useState, useEffect } from 'react';
import { Button, Modal } from 'antd';
import { apiHolder as api, DataTrackerApi, apis } from 'api';
import classnames from 'classnames';
import { MailBoxEntryContactInfoModel } from 'api';
import ErrorIcon from '@web-common/components/UI/Icons/svgs/ErrorSvg';
import style from './index.module.scss';
import { stringMap } from '@web-mail/types';
import { getIn18Text } from 'api';
interface Props {
  setVisible: (val: boolean) => void;
  visible: boolean;
  receiver: MailBoxEntryContactInfoModel[];
  confirm: () => void;
  currentMailMailListMap: stringMap;
}
const trackApi: DataTrackerApi = api.api.requireLogicalApi(apis.dataTrackerApiImp) as unknown as DataTrackerApi;
const SendErrorContect: React.FC<Props> = ({ visible, setVisible, receiver, confirm, currentMailMailListMap }) => {
  const [person, setPerson] = useState<MailBoxEntryContactInfoModel[]>([]);
  const [mailList, setMailList] = useState<MailBoxEntryContactInfoModel[]>([]);
  useEffect(() => {
    if (receiver && receiver.length) {
      const person: MailBoxEntryContactInfoModel[] = [];
      const mailList: MailBoxEntryContactInfoModel[] = [];
      receiver.forEach(item => {
        // const position = item?.contact.contact.position;
        // const isMailList = position && position.length === 1 && position[0].toString() === '邮件列表';
        const isMailList =
          item.contactItem.type === 'external' ? currentMailMailListMap.mail[item?.contactItem.contactItemVal] : currentMailMailListMap.id[item?.contact.contact.id];
        if (isMailList) {
          mailList.push(item);
          return;
        }
        person.push(item);
      });
      setPerson(person);
      setMailList(mailList);
    }
  }, [receiver]);
  const trackClickBtn = (buttonName: string) => {
    trackApi.track('pcMail_click_button_outDomainRemind_writeMailPage', { buttonName });
  };
  const content = receiver.length > 0 && (
    <div className={classnames(style.errorContect)}>
      {receiver.map(item => (
        <div className={classnames(style.outDomain)}>
          {item.contact.contact.contactName}（{item.contact.contact.accountName}）
        </div>
      ))}
    </div>
  );
  return (
    <Modal
      wrapClassName="modal-dialog"
      onCancel={() => {
        setVisible(false);
      }}
      visible={visible}
      footer={null}
    >
      <div className="modal-content" style={{ marginTop: '10px' }}>
        <div className="modal-icon">
          <ErrorIcon className="error-icon" />
        </div>
        <div className="modal-text">
          <div className="title">{getIn18Text('RENWUYOUJIANZAN11')}</div>
          <div className={style.subTitle}>
            {getIn18Text('GONG')}
            {!!person.length && `${person.length}个企业外邮箱地址`}
            {!!person.length && !!mailList.length && '，'}
            {!!mailList.length && `${mailList.length}个邮件列表`}：
          </div>
          {content}
          <div className="btns">
            <div />
            <div>
              <Button
                className="cancel"
                onClick={() => {
                  trackClickBtn(getIn18Text('QUXIAO'));
                  setVisible(false);
                }}
              >
                {getIn18Text('QUXIAO')}
              </Button>
              <Button
                className="cancel"
                onClick={() => {
                  confirm();
                  trackClickBtn(getIn18Text('SHANCHUBINGJIXU'));
                  setVisible(false);
                }}
              >
                {getIn18Text('SHANCHUCUOWUYOU')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};
export default SendErrorContect;
