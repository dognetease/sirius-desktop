import { getIn18Text } from 'api';
/*
 * @Author: your name
 * @Date: 2022-03-18 09:59:23
 * @LastEditTime: 2022-03-18 14:29:50
 * @LastEditors: Please set LastEditors
 * @Description: 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 * @FilePath: /dev-wlj/packages/web/src/components/Layout/Write/components/SendMail/TaskMailModal.tsx
 */
import React, { useState } from 'react';
import { Modal, Button, message } from 'antd';
import classnames from 'classnames';
import { apis, apiHolder as api, MailApi, MailEntryModel } from 'api';
import styles from './index.module.scss';
import WarnIcon from '../../../../UI/Icons/svgs/WarnSvg';
import { MailActions, useActions, useAppSelector } from '@/state/createStore';

interface Props {
  isModalVisible: boolean;
  setIsModalVisible: (val: boolean) => void;
  sendAgainRef: React.MutableRefObject<boolean>;
  sendValidate: (val: React.MouseEvent) => void;
}

const TaskMailModal: React.FC<Props> = (props: Props) => {
  const { isModalVisible, setIsModalVisible, sendValidate, sendAgainRef } = props;

  const { doModifyReceiver } = useActions(MailActions);
  const continueSend = (e: React.MouseEvent) => {
    doModifyReceiver({ receiverType: 'bcc', receiver: [] });
    sendAgainRef.current = true;
    setIsModalVisible(false);
    sendValidate(e);
  };

  return (
    <>
      <Modal
        wrapClassName="modal-dialog"
        width="332"
        onCancel={() => {
          setIsModalVisible(false);
        }}
        visible={isModalVisible}
        footer={null}
        closable={false}
      >
        <div className="modal-content">
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
                  {getIn18Text('setting_system_switch_cancel')}
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
