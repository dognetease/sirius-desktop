import { getIn18Text } from 'api';
import React from 'react';
import { message } from 'antd';
import style from './highMessage.module.scss';

export interface HighMessageProps {
  withdraw: Function;
}

class HighMessage {
  public antMessage = message;

  show(highMessageProps: HighMessageProps) {
    const { withdraw } = highMessageProps;

    // 撤回
    const toWithdraw = () => {
      if (withdraw) {
        withdraw();
      }
    };

    // 内容
    const cont = () => (
      <div className={style.highPriority}>
        {getIn18Text('YISHEZHIJINJILIANXI')}
        <span className={style.withdraw} onClick={toWithdraw}>
          {getIn18Text('CHEHUI')}
        </span>
      </div>
    );

    return this.antMessage.open({
      className: 'msg-custom-class',
      content: cont(),
    });
  }
}

export default new HighMessage();
