/*
 * @Author: your name
 * @Date: 2022-03-18 09:59:23
 * @LastEditTime: 2022-03-21 11:44:29
 * @LastEditors: Please set LastEditors
 * @Description: 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 * @FilePath: /dev-wlj/packages/web/src/components/Layout/Write/components/SendMail/TaskMailModal.tsx
 */
import React, { useState } from 'react';
import { Modal, Button, message } from 'antd';
import classnames from 'classnames';
import { apis, apiHolder as api, MailApi, MailEntryModel } from 'api';
import styles from './taskMail.module.scss';
import WarnIcon from '@web-common/components/UI/Icons/svgs/WarnSvg';
import { MailActions, useActions, ContactActions, useAppSelector } from '@web-common/state/createStore';
import { getIn18Text } from 'api';
interface Props {
  isModalVisible: boolean;
  setIsModalVisible: (val: boolean) => void;
  showTaskMail: () => void;
}
const TaskMailModal: React.FC<Props> = (props: Props) => {
  const { isModalVisible, setIsModalVisible, showTaskMail } = props;
  const ContactActionss = useActions(ContactActions);
  const { doModifyReceiver } = useActions(MailActions);
  const continueSend = (e: React.MouseEvent) => {
    ContactActionss.doFocusSelector(getIn18Text('ZHENGWEN'));
    doModifyReceiver({ receiverType: 'bcc', receiver: [] });
    setIsModalVisible(false);
    showTaskMail();
  };
  return (
    <>
      <Modal
        wrapClassName="modal-dialog"
        onCancel={() => {
          setIsModalVisible(false);
        }}
        visible={isModalVisible}
        footer={null}
        closable={false}
      >
        <div className="modal-content" style={{ marginTop: '10px' }}>
          <div className="modal-icon">
            <WarnIcon />
          </div>
          <div className="modal-text">
            <div className={classnames('desc', styles.taskModalDesc)}>{getIn18Text('JIANCEDAONINTIAN')}</div>
            <div className={classnames('btns', styles.taskModalBtns)}>
              <div>
                <Button
                  className="cancel"
                  onClick={() => {
                    setIsModalVisible(false);
                  }}
                >
                  {getIn18Text('QUXIAO')}
                </Button>
                <Button
                  danger
                  onClick={e => {
                    continueSend(e);
                  }}
                >
                  {getIn18Text('SHANCHUBINGJIXU')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
};
export default TaskMailModal;
