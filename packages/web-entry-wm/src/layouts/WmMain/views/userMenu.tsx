import React, { useEffect, useState } from 'react';
import WaimaoCustomerService from '@web-common/components/UI/WaimaoCustomerService';
import styles from './userMenu.module.scss';
import { apis, apiHolder, AccountApi, SystemApi, EdmRoleApi, DataTrackerApi } from 'api';
import { useAppSelector, useAppDispatch, useActions } from '@web-common/state/createStore';
import { getIsPayVersionUser } from '@web-common/state/reducer/privilegeReducer';
import { getIsSomeMenuVisbleSelector } from '@web-common/state/reducer/privilegeReducer';
import { getTransText } from '@/components/util/translate';
import { Divider, Popover } from 'antd';

import AvatarTag from '@web-common/components/UI/Avatar/avatarTag';
import { ReactComponent as AddIcon } from '@/images/icons/im/add-icon.svg';
import { actions as LoginActions, doSwitchAccountAsync, doListAccountsAsync } from '@web-common/state/reducer/loginReducer';
import { getIn18Text } from 'api';
import { useVersionCheck } from '../../../../../web-common/src/hooks/useVersion';
import { setV1v2 } from '@web-common/hooks/useVersion';
import { useMount } from 'ahooks';

const accountApi = apiHolder.api.requireLogicalApi(apis.accountApiImpl) as AccountApi;
const systemApi = apiHolder.api.getSystemApi() as SystemApi;
const roleApi = apiHolder.api.requireLogicalApi(apis.edmRoleApiImpl) as EdmRoleApi;
const trackApi: DataTrackerApi = apiHolder.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;

interface UserMenuProps {
  isNewAccount?: boolean;
  visibleAdmin: boolean;
  handleClick: (type: string) => void;
}

const UserMenu: React.FC<UserMenuProps> = (props: UserMenuProps) => {
  const { handleClick, visibleAdmin } = props;
  const isPayVersionUser = useAppSelector(state => getIsPayVersionUser(state.privilegeReducer));
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const version = useAppSelector(state => state.privilegeReducer.version);
  const { accountList, switchingAccount } = useAppSelector(state => state.loginReducer);

  const { localList } = accountList;
  const dispatch = useAppDispatch();
  const { setLoginModalData } = useActions(LoginActions); // 设置登录弹出框
  let v1v2 = useVersionCheck();
  const [showSwitch, setshowSwitch] = useState(true);

  useEffect(() => {
    accountApi.doGetAccountIsAdmin().then(isAdmin => setIsAdmin(isAdmin));
  }, []);
  // 获取账号列表
  useEffect(() => {
    dispatch(doListAccountsAsync(false));
  }, []);

  const visibleSystemTask = useAppSelector(state => getIsSomeMenuVisbleSelector(state.privilegeReducer, ['TASK_CENTER']));
  const visibleEnterpriseSetting = useAppSelector(state => getIsSomeMenuVisbleSelector(state.privilegeReducer, ['ORG_SETTINGS']));

  const userMenuData = [
    {
      label: getIn18Text('ZHANGHAOYUANQUAN'), // 账号与安全
      show: true,
      click: () => handleClick('account'),
    },
    {
      label: '企业设置',
      show: visibleAdmin && version !== 'WEBSITE',
      click: () => handleClick('enterpriseSetting'),
    },
    {
      label: getTransText('WODERENWU'), // 系统任务
      show: version === 'WEBSITE' ? false : visibleSystemTask,
      click: () => handleClick('systemTask'),
    },
    {
      key: 'newbieTask',
      label: getTransText('XINSHOURENWU'), // 新手任务
      show: version === 'WEBSITE' ? false : true,
      click: () => handleClick('noviceTask'),
    } /*{
		label:  getIn18Text('BANGZHUZHONGXINWM'),
		show: true,
		click: () => handleClick('help')
	}, {
		label: getIn18Text('WENTIFANKUI'),
		show: true,
		click: () => handleClick('feedback')
	}, */,
    {
      label: getIn18Text('WENTIFANKUI'),
      show: true,
      click: () => handleClick('feedbackUploadLog'),
    },
    // {
    //   label: getIn18Text('BANGZHUYUFANKUI'),
    //   show: true,
    //   children: [
    //     {
    //       label: getIn18Text('WENTIFANKUI'),
    //       show: true,
    //       click: () => handleClick('feedbackUploadLog'),
    //     },
    //     {
    //       // label: getIn18Text('LIANXIKEFU'),
    //       label: <WaimaoCustomerService />,
    //       show: false,
    //     },
    //   ],
    // },
    {
      label: getIn18Text('YUMINGPEIZHI'),
      show: isAdmin && isPayVersionUser, // 付费用户且是管理员才展示入口
      click: () => handleClick('domainManage'),
    },
    {
      label: getIn18Text('GUANLIHOUTAI'),
      show: true,
      click: () => handleClick('backend'),
    },
    {
      label: getIn18Text('HUIDAOJIUBAN'),
      show: false,
      click: () => handleClick('oldVersion'),
    },
    {
      label: v1v2 === 'v2' ? getIn18Text('QIEHUIJIUBAN') : getIn18Text('QIEHUIXINBAN'),
      show: version === 'WEBSITE' ? false : showSwitch,
      click: () => {
        // localStorage.setItem('v1v2', v1v2 === 'v2' ? 'v1' : 'v2');
        // window?.location.reload();

        roleApi
          .setMenuListNew({
            menuVersion: v1v2 === 'v2' ? 'OLD' : 'NEW',
          })
          .then(() => {
            setV1v2(v1v2 === 'v2' ? 'v1' : 'v2');
            // localStorage.setItem('v1v2', v1v2 === 'v2' ? 'v1' : 'v2');
            window?.location.reload();
          });
      },
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

  // 添加账号
  const addAccount = () => {
    if (!systemApi.isElectron()) {
      dispatch(setLoginModalData({ visible: true }));
    }
  };

  useMount(() => {
    roleApi.getMenuSwitch().then(res => {
      setshowSwitch(!!res?.menuVersionWithoutOldSwitch);
    });
  });

  // 切换账号
  const switchAccount = (id: string) => {
    // 判断下如果是正在切换账号中，则提示
    if (switchingAccount) {
      return;
    }
    dispatch(doSwitchAccountAsync(id));
  };

  return (
    <>
      {/* 账号列表 */}
      <div className={styles.accountContainer}>
        {/* 账号列表 */}
        <div className={styles.list}>
          {localList
            .filter(it => !it.expired)
            .map((it, idx) => {
              return (
                <div className={styles.accountItem} key={idx} onClick={() => switchAccount(it.id || it?.email)}>
                  <div className={styles.avator}>
                    {/* 如果正在切换当前账号。则展示loading */}
                    {switchingAccount === it.id || switchingAccount === it?.email ? (
                      <div className={styles.avatarLoadingWrap}>
                        <div className={styles.avatarLoading}></div>
                      </div>
                    ) : (
                      <AvatarTag
                        size={28}
                        showAccountSelected={it.isCurrentAccount}
                        user={{
                          avatar: it?.avatar,
                          name: it?.nickName,
                          email: it.id || it?.email,
                        }}
                      />
                    )}
                  </div>
                  <div className={styles.right}>
                    <div className={styles.name}>{it?.nickName}</div>
                    <div className={styles.email}>{it.id || it?.email}</div>
                  </div>
                </div>
              );
            })}
        </div>
        {/* 新增按钮 */}
        <div className={styles.addbtn} onClick={addAccount}>
          <div className={styles.avator}>
            <AddIcon />
          </div>
          <div className={styles.right}>{getIn18Text('TIANJIAQITAQIYEZHANG')}</div>
        </div>
      </div>
      <Divider style={{ margin: '4px 20px' }} />
      {/* 其他菜单 */}
      <ul className={styles.container}>
        <div className={styles.uMenu}>
          {userMenuData
            .filter(item => item.show)
            .map(menu => {
              if (menu.children && menu.children.length) {
                return (
                  <li>
                    {menu.label}
                    <ul className={styles.liContainer}>
                      <div className={styles.uMenu} style={{ margin: 0 }}>
                        {menu.children
                          .filter(item => item.show)
                          .map(menu => {
                            return <li onClick={menu.click}>{menu.label}</li>;
                          })}
                      </div>
                    </ul>
                  </li>
                );
              } else {
                return (
                  <li onClick={menu.click}>
                    {menu.label}
                    {menu.key === 'newbieTask' && props.isNewAccount && <div className={styles.newAccount}>新用户</div>}
                  </li>
                );
              }
            })}
        </div>
        <li className={styles.logout} onClick={() => handleClick('logout')}>
          {getIn18Text('TUICHUDENGLU')}
        </li>
      </ul>
    </>
  );
};

export default UserMenu;
