import { getIn18Text } from 'api';
import React from 'react';
import { message } from 'antd';
import style from './priorityMessage.module.scss';

export interface PriorityMessageProps {
  title: string;
  withdraw: Function;
  onClose: Function;
}

class PriorityMessage {
  public antMessage = message;

  private key = 0;

  show(priorityMessageProps: PriorityMessageProps) {
    const { title, withdraw, onClose } = priorityMessageProps;
    this.key = Math.random();
    // 撤回
    const toWithdraw = () => {
      if (withdraw) {
        withdraw();
      }
      this.antMessage.destroy(this.key);
    };

    // 内容
    const cont = () => (
      <div className={style.priorityText}>
        {title}
        <span className={style.withdraw} onClick={toWithdraw}>
          {getIn18Text('CHEHUI')}
        </span>
      </div>
    );

    this.antMessage.open({
      key: this.key,
      className: 'msg-custom-class',
      content: cont(),
      duration: 3,
      onClose: () => {
        onClose && onClose();
      },
    });
  }
}

export default PriorityMessage;
