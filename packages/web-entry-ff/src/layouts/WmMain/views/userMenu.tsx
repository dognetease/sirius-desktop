import React from 'react';
import WaimaoCustomerService from '@web-common/components/UI/WaimaoCustomerService';
import styles from './userMenu.module.scss';

import { useAppSelector } from '@web-common/state/createStore';
import { getIsSomeMenuVisbleSelector } from '@web-common/state/reducer/privilegeReducer';
import { getIn18Text } from 'api';

interface UserMenuProps {
  handleClick: (type: string) => void;
}

const UserMenu: React.FC<UserMenuProps> = (props: UserMenuProps) => {
  const { handleClick } = props;

  const visibleSystemTask = useAppSelector(state => getIsSomeMenuVisbleSelector(state.privilegeReducer, ['TASK_CENTER']));

  const userMenuData = [
    {
      label: getIn18Text('ZHANGHAOYUANQUAN'), // 账号与安全
      show: true,
      click: () => handleClick('account'),
    },
    {
      label: '我的任务', // 系统任务
      show: visibleSystemTask,
      click: () => handleClick('systemTask'),
    },
    {
      label: '新手任务', // 新手任务
      show: false, // 0415 再打开新手任务
      click: () => handleClick('noviceTask'),
    },
    /*{
		label:  getIn18Text('BANGZHUZHONGXINWM'),
		show: true,
		click: () => handleClick('help')
	}, {
		label: getIn18Text('WENTIFANKUI'),
		show: true,
		click: () => handleClick('feedback')
	}, */ {
      label: getIn18Text('WENTIFANKUI'),
      show: true,
      click: () => handleClick('feedbackUploadLog'),
    },
    {
      // label: getIn18Text('LIANXIKEFU'),
      label: <WaimaoCustomerService />,
      show: true,
    },
    {
      label: getIn18Text('GUANLIHOUTAI'),
      show: true,
      click: () => handleClick('backend'),
    },
    {
      label: getIn18Text('HUIDAOJIUBAN'),
      show: true,
      click: () => handleClick('oldVersion'),
    },
    {
      label: getIn18Text('GUANYU'),
      show: true,
      click: () => handleClick('about'),
    },
    {
      label: getIn18Text('XIAZAIKEHUDUAN'),
      show: true,
      click: () => {
        const downLoadUrl = 'https://sirius-config.qiye.163.com/api/pub/client/waimao/download';
        window.location.href = downLoadUrl;
      },
    },
  ];

  return (
    <ul className={styles.container}>
      <div className={styles.uMenu}>
        {/* {
					userMenuData.filter(item => item.show).map(menu => {
						return <li onClick={menu.click}>{menu.label}</li>
					})
				} */}
      </div>
      <li className={styles.logout} onClick={() => handleClick('logout')}>
        {getIn18Text('TUICHUDENGLU')}
      </li>
    </ul>
  );
};

export default UserMenu;
