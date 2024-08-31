import React from 'react';
import { getIn18Text } from 'api';
import { api, apis, ContactAndOrgApi, ContactModel, ExecutorModel } from 'api';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import { ReactComponent as DeleteIcon } from '@/images/icons/modal_close_temp.svg';
import { Tabs } from 'antd';
import AvatarTag from '@web-common/components/UI/Avatar/avatarTag';
import ItemCard from '../ItemCard';
import moment from 'moment';
import './TaskModal.scss';
const { TabPane } = Tabs;
interface Props {
  contactList: Map<string, ContactModel>;
  executorList: ExecutorModel[];
  total: number;
  completed: number;
  showDetailsModal: boolean;
  setShowDetailsModal(isShow: boolean): void;
}
const contactApi = api.requireLogicalApi(apis.contactApiImpl) as ContactAndOrgApi;
/** 新建邮件模板Modal */
const TaskModal: React.FC<Props> = props => {
  const { showDetailsModal, setShowDetailsModal, contactList, executorList, total, completed } = props;
  const closeModal = () => {
    setShowDetailsModal(false);
  };
  const User = (userProps: { executor: ExecutorModel }) => {
    const { executor } = userProps;
    const contact = contactList.get(executor.accId);
    if (!contact) return null;
    return (
      <ItemCard contact={contact} type="avatar" trigger="click" placement="topRight">
        <div className="user-item">
          <div className="user-photo">
            <AvatarTag size={32} user={{ name: contact?.contact?.contactName, avatar: contact?.contact?.avatar, color: contact?.contact?.color }} />
          </div>
          <div className="user-detail">
            <p>{contact?.contact?.contactName}</p>
            <p>{contactApi.doGetModelDisplayEmail(contact)}</p>
          </div>
          <div className="user-time" hidden={!executor.completeTime || executor.status === 0}>
            {moment(executor.completeTime).format('YYYY-MM-DD HH:mm')}
          </div>
        </div>
      </ItemCard>
    );
  };
  const UserBody = (userBodyProps: { stauts: number }) => {
    const { stauts } = userBodyProps;
    return (
      <div className="user-body">
        <div className="user-list">
          {executorList.map(executor => {
            if (executor.status === stauts) {
              return <User executor={executor} />;
            }
            return null;
          })}
        </div>
        <div className="user-blank" hidden={stauts !== 0 || total - completed > 0}>
          <p className="blank-img"></p>
          <p className="blank-txt">{getIn18Text('WUWEIWANCHENGDE')}</p>
        </div>
        <div className="user-blank" hidden={stauts !== 1 || completed > 0}>
          <p className="blank-img"></p>
          <p className="blank-txt">{getIn18Text('ZANWUYIWANCHENG')}</p>
        </div>
        <div className="user-error" hidden>
          <p className="error-txt">{getIn18Text('JIAZAISHIBAI')}</p>
          <p className="error-btn">{getIn18Text('ZHONGSHI')}</p>
        </div>
        <div className="user-nowifi" hidden>
          <p className="nowifi-img"></p>
          <p className="nowifi-txt">{getIn18Text('WANGLUOBUKEYONG')}</p>
          <p className="error-btn">{getIn18Text('ZHONGSHI')}</p>
        </div>
      </div>
    );
  };
  return (
    <Modal
      closeIcon={<DeleteIcon className="dark-invert" />}
      visible={showDetailsModal}
      footer={null}
      title={getIn18Text('ZHIXINGREN')}
      width="400px"
      onCancel={closeModal}
      destroyOnClose
      maskClosable={false}
      className="task-mail-user-modal"
    >
      <Tabs defaultActiveKey={completed >= total ? '1' : '0'} tabBarStyle={{ color: '#7D8085', fontSize: '14px' }}>
        <TabPane tab={`未完成 (${total - completed}人)`} key="0">
          <UserBody stauts={0} />
        </TabPane>
        <TabPane tab={`已完成 (${completed}人)`} key="1">
          <UserBody stauts={1} />
        </TabPane>
      </Tabs>
    </Modal>
  );
};
export default TaskModal;
