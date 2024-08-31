import React, { useState, useEffect } from 'react';
import { getIn18Text } from 'api';
import { Modal } from 'antd';
import { apiHolder, apis, apiHolder as api, ContactApi, OrgApi, InvolvedRecordsModel, MailEntryModel, MailApi as MailApiType, ContactModel } from 'api';
import AvatarTag from '@web-common/components/UI/Avatar/avatarTag';
import ItemCard from '../ItemCard';
import './index.scss';
const contactApi = apiHolder.api.requireLogicalApi(apis.contactApiImpl) as unknown as ContactApi & OrgApi;
const mailApi = api.api.requireLogicalApi(apis.mailApiImpl) as MailApiType;
const pageSize = 20;
interface Props {
  visible: boolean;
  onClose(): void;
  content: MailEntryModel;
  involvedRecords: InvolvedRecordsModel[];
  count: number;
}
const StatusModal: React.FC<Props> = ({ visible, onClose, involvedRecords, content, count }) => {
  const [contactsMap, setContactsMap] = useState<Record<string, ContactModel[]>>({});
  const [contentCode, setContentCode] = useState('default');
  const [totalList, setTotalList] = useState<InvolvedRecordsModel[]>(involvedRecords);
  const getContact = async (records: InvolvedRecordsModel[]) => {
    const emailList = records.map(item => {
      return item.acc_email;
    });
    try {
      const res = await contactApi.doGetContactByEmail({ emails: emailList });
      setContactsMap(res);
      setContentCode('SUCCESS');
    } catch (e) {
      setContentCode('Error');
    }
  };
  const onScrollCapture = (e: React.SyntheticEvent) => {
    e.persist();
    if (count <= totalList.length) return; // 如果count === 总数，说明已经加载完毕
    const container = document.querySelector('.thumb-up-container');
    if (container) {
      if (container.scrollHeight - container.scrollTop - container.clientHeight < 300) {
        getCurrentList({});
      }
    }
  };
  const getCurrentList = ({ init }: { init?: boolean }) => {
    let page = 0;
    if (!init) page = Math.floor(totalList.length / pageSize) + 1;
    mailApi
      .getThumbUpInfo(content.id, content.entry.tid || '', page)
      .then(data => {
        if (data.involvedRecords && data.involvedRecords.length > 0) {
          const mergeList = [...totalList, ...data.involvedRecords];
          setTotalList(mergeList);
        }
      })
      .catch(err => {
        console.error('getThumbUpInfo error', err);
      });
  };
  const renderItem = (record: InvolvedRecordsModel) => {
    let contact = contactsMap[record.acc_email] || [];
    if (contact.length === 0) {
      const newContact = mailApi.buildRawContactItem({
        item: record.acc_email,
        email: record.acc_email,
        type: 'to',
        name: record.nick_name,
      });
      contact.push(newContact.contact);
    } else {
      let enterpriseContact = contact.filter(item => {
        return item?.contact?.type === 'enterprise';
      });
      if (enterpriseContact.length >= 1) {
        contact = enterpriseContact;
      }
    }
    const model = contact[0];
    return (
      <div className="thumb-item" key={record.acc_id}>
        <ItemCard contact={model} type="avatar" trigger="click" domName="body" placement="left">
          <div
            style={{
              marginRight: '12px',
              marginLeft: '4px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <AvatarTag
              size={32}
              user={{
                name: model?.contact?.contactName,
                avatar: model?.contact?.avatar,
                color: model?.contact?.color,
              }}
            />
          </div>
        </ItemCard>

        <div className="thumb-item-div">
          <span className="thumb-item-name">{record.nick_name} </span>
          <span className="thumb-item-email">{contactApi.doGetModelDisplayEmail(model)}</span>
        </div>
      </div>
    );
  };
  useEffect(() => {
    if (!visible) return;
    getContact(involvedRecords);
  }, [visible]);
  return (
    <>
      <Modal footer={null} visible={visible} width={480} title={getIn18Text('DIANZANXIANGQING')} wrapClassName="thumb-up-modal" onCancel={onClose}>
        <div className="thumb-up-container" style={{ height: '100%', overflowY: 'scroll' }} onScrollCapture={onScrollCapture}>
          <div>
            {contentCode === 'SUCCESS' &&
              totalList?.length > 0 &&
              totalList.map(record => {
                return renderItem(record);
              })}
          </div>
        </div>
      </Modal>
    </>
  );
};
export default StatusModal;
