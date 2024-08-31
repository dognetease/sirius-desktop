import React from 'react';
import { Button } from 'antd';
import classnames from 'classnames';
import style from '@web-edm/edm.module.scss';
import localStyle from './index.module.scss';
import useWaLogin from '../components/waLogin';
import useWASend, { useTaskBulkSend } from '../hooks/useWASend';

const GroupHistory = () => {
  const { isLogin, login, addGroup } = useWaLogin();
  const { bulkSend } = useTaskBulkSend();
  const { waBulkSend } = useWASend('testkey');
  return (
    <div className={classnames(style.container, localStyle.container)}>
      <Button onClick={login}>{isLogin ? '登录' : '未登录'}</Button>
      <Button
        onClick={() =>
          addGroup(
            [
              'https://chat.whatsapp.com/6uZc524v7xh3lpwdmUmqR1',
              'https://chat.whatsapp.com/25J6Ws04q726EaonmPCmWk',
              'https://chat.whatsapp.com/IEjSQDOv0VvHjHRHVNBhLS',
              'https://chat.whatsapp.com/6XDTMCHgVDMGhXr8lgtgvu',
              'https://chat.whatsapp.com/HqRZlcL6dlc5sxn5QZEYPG',
            ],
            '加群关键词'
          )
        }
      >
        加群测试
      </Button>
      <Button onClick={() => bulkSend('加群关键词', '380057157946654797', '2347039827936-1536253807@g.us', '2023-10-27')}> 任务群发 </Button>
      <Button onClick={() => waBulkSend(['8615510008313'])}> 数据群发 </Button>
      <div> 加群历史 </div>
    </div>
  );
};

export default GroupHistory;
