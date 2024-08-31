import { createSlice, PayloadAction, createAsyncThunk, compose } from '@reduxjs/toolkit';
import Message from '@web-common/components/UI/Message/SiriusMessage';
import {
  api,
  apis,
  LoginApi,
  util,
  EventApi,
  SystemApi,
  RegisterApi,
  RegisterParams,
  MobileAccountInfo,
  MobileAccountInfoTable,
  AccountApi,
  AccountModel,
  BkLoginInitData,
  ProductAuthApi,
  SystemEvent,
  BkLoginResultData,
  IDemandItem,
  ICurrentAccountAndSharedAccount,
  EdmRoleApi,
  ContactAndOrgApi,
  ContactModel,
} from 'api';
import { config } from 'env_def';
import SiriusModal from '@web-common/components/UI/Modal/SiriusModal';
import { sendLogout, setLoginBlock } from '@web-common/utils/utils';
import { getIn18Text } from 'api';
import { setV1v2 } from '@web-common/hooks/useVersion';
import { cloneDeep } from 'lodash';

const roleApi = api.requireLogicalApi(apis.edmRoleApiImpl) as EdmRoleApi;
const productAuthApi = api.requireLogicalApi(apis.productAuthApiImpl) as ProductAuthApi;
const contactApi = api.requireLogicalApi(apis.contactApiImpl) as ContactAndOrgApi;
const loginApi = api.requireLogicalApi(apis.loginApiImpl) as LoginApi;
const eventApi = api.getEventApi() as EventApi;
const systemApi = api.getSystemApi() as SystemApi;
const registerApi = api.requireLogicalApi(apis.registerApiImpl) as RegisterApi;
const accountApi = api.requireLogicalApi(apis.accountApiImpl) as AccountApi;
const storeApi = api.getDataStoreApi();
const httpImpl = api.getDataTransApi();
export interface UserAccount {
  email: string;
  avatar: string;
  name: string;
  color: string;
  isCurrent?: boolean;
  canLogin: boolean;
}
export interface IUserInfo {
  loginId: string;
  loginAccount: string;
  nickName: string;
  isCorpMailMode?: boolean;
}
interface IRegisterInfo extends RegisterParams {
  isValidate: boolean;
  visible: boolean;
  sid: string;
  registerTime: number;
}
interface IMailBindInfo {
  visible: boolean;
  account: string;
  pwd: string;
}
interface ISettingLoginInfo {
  loginVisible: boolean;
  passResetVisible: boolean;
  currentTabName?: string;
  loginAccount?: string;
}
interface IMobileBindAccountListInfo {
  accountList: MobileAccountInfo[];
  visibleList: boolean;
  visibleAccount: boolean;
  from: 'login' | 'register';
  selectedAccount?: string;
  selectedAccountNode?: string;
}
export interface IValidateCodeProp {
  mobile: string;
  code: string;
}
export interface ILoginReducer {
  loginLoading: boolean;
  loginInfo: IUserInfo;
  accountList: AccountModel;
  switchingAccount: string;
  passPrepareFormVisible: boolean;
  mobileBindAccountListInfo: IMobileBindAccountListInfo;
  visibleSwitchModal: boolean;
  visibleSuccessModal: boolean;
  visibleMobileBindModal: boolean;
  registerResultDialogVisible: boolean;
  goLoginNoConfirm: boolean;
  registerSuccess: boolean;
  registerInfo: IRegisterInfo;
  mailBindModalInfo: IMailBindInfo;
  settingLoginInfo: ISettingLoginInfo;
  serviceList: Array<IDemandItem>;
  sharedAccount: ICurrentAccountAndSharedAccount;
  loginModalData: {
    visible?: boolean;
    account?: string;
    prevAccount?: string;
  };
}
const InitialState: ILoginReducer = {
  loginLoading: false,
  loginInfo: {
    loginId: '',
    loginAccount: '',
    nickName: '',
    isCorpMailMode: systemApi.getIsCorpMailMode(),
  },
  passPrepareFormVisible: false,
  accountList: {
    aliasList: [],
    localList: [],
    mobileList: [],
  },
  switchingAccount: '',
  mobileBindAccountListInfo: {
    accountList: [],
    visibleAccount: false,
    visibleList: false,
    from: 'login',
  },
  settingLoginInfo: {
    loginVisible: false,
    passResetVisible: false,
  },
  // 展示登录弹窗的数据
  loginModalData: {
    visible: false,
  },
  visibleSwitchModal: false,
  visibleSuccessModal: false,
  visibleMobileBindModal: false,
  registerResultDialogVisible: false,
  goLoginNoConfirm: false, // 不需要二次点击，注册后直接进入邮箱
  registerSuccess: false, // 不需要二次点击，注册成功
  serviceList: [],
  registerInfo: {
    visible: false,
    isValidate: false,
    corpName: '',
    domainPrefix: '',
    adminName: '',
    adminAccount: '',
    mobile: '',
    code: '',
    sid: '',
    selfDomain: '',
    registerTime: 0,
  },
  mailBindModalInfo: {
    visible: false,
    account: '',
    pwd: '',
  },
  sharedAccount: {
    unread: false,
    email: '',
    nickName: '',
    alias: [],
    isSharedAccountLogin: false,
    isSharedAccount: false,
    sharedAccounts: [],
  },
};
const LoginSlice = createSlice({
  name: 'loginReducer',
  initialState: InitialState,
  reducers: {
    setSettingLoginInfo: (state, actions: PayloadAction<Partial<ISettingLoginInfo>>) => {
      state.settingLoginInfo = Object.assign(state.settingLoginInfo, actions.payload);
    },
    setMobileBindAccountListInfo: (state, actions: PayloadAction<Partial<IMobileBindAccountListInfo>>) => {
      state.mobileBindAccountListInfo = Object.assign(state.mobileBindAccountListInfo, actions.payload);
    },
    setVisibleSwitchModal: (state, actions: PayloadAction<boolean>) => {
      state.visibleSwitchModal = actions.payload;
    },
    setRegisterResultDialogVisible: (state, actions: PayloadAction<boolean>) => {
      state.registerResultDialogVisible = actions.payload;
    },
    setGoLoginNoConfirm: (state, actions: PayloadAction<boolean>) => {
      state.goLoginNoConfirm = actions.payload;
    },
    setRegisterSuccess: (state, actions: PayloadAction<boolean>) => {
      state.registerSuccess = actions.payload;
    },
    setServiceList: (state, actions: PayloadAction<Array<IDemandItem>>) => {
      state.serviceList = actions.payload;
    },
    setVisibleSuccessModal: (state, actions: PayloadAction<boolean>) => {
      state.visibleSuccessModal = actions.payload;
    },
    setVisibleMobileBindModal: (state, actions: PayloadAction<boolean>) => {
      state.visibleMobileBindModal = actions.payload;
    },
    setRegisterInfo: (state, actions: PayloadAction<Partial<IRegisterInfo>>) => {
      state.registerInfo = Object.assign(state.registerInfo, actions.payload);
    },
    setMailBindModalInfo: (state, actions: PayloadAction<Partial<IMailBindInfo>>) => {
      state.mailBindModalInfo = Object.assign(state.mailBindModalInfo, actions.payload);
    },
    setAccountList: (state, actions: PayloadAction<AccountModel>) => {
      state.accountList = actions.payload;
    },
    doSetLoginInfo: (state, action: PayloadAction<IUserInfo>) => {
      const { loginAccount, loginId, nickName } = action.payload;
      state.loginInfo = {
        loginAccount,
        nickName,
        loginId: compose(btoa, btoa, btoa)(loginId),
      };
    },
    doSetRefreshLoading: (state, action: PayloadAction<boolean>) => {
      state.loginLoading = action.payload;
    },
    doTogglePassPrepareForm: (state, action: PayloadAction<boolean>) => {
      state.passPrepareFormVisible = action.payload;
    },
    setSwitchingAccount: (state, action: PayloadAction<string>) => {
      state.switchingAccount = action.payload;
    },
    setSharedAccount: (state, action: PayloadAction<ICurrentAccountAndSharedAccount>) => {
      state.sharedAccount = action.payload;
    },
    setLoginModalData: (state, action: PayloadAction<Partial<{ visible: boolean; account: string; preAccount: string }>>) => {
      state.loginModalData = {
        ...state.loginModalData,
        ...(action.payload || {}),
      };
    },
  },
  /** 异步操作 */
  // extraReducers: builder => {
  //   builder.addCase(
  //     doListAccountsAsync.fulfilled,
  //     (
  //       state,
  //       action,
  //     ) => {
  //       state.accountList = action.payload;
  //     },
  //   );
  // },
});
export const { actions } = LoginSlice;
/**
 * 获取账户列表
 */
export const doListAccountsAsync = createAsyncThunk('loginReducer/listAccount', async (isCache: boolean | undefined, { dispatch }) => {
  try {
    const data = await accountApi.doGetAccountList(isCache);
    dispatch(actions.setAccountList(data));
  } catch (error) {
    // e.message && Message.error(e.message);
  }
});

/**
 * 同步公共账号
 */
export const doSharedAccountAsync = createAsyncThunk('loginReducer/sharedAccount', async (refresh: boolean | undefined, { dispatch }) => {
  try {
    let data = await accountApi.getSharedAccountsInfoAsync(refresh);
    if (data) {
      const sharedAccounts = data?.sharedAccounts || [];
      // 设置公共账号头像
      let contactInfos: ContactModel[] = [];
      // app 侧边栏左下角头像列表
      // let sideBarDockAccountList = await accountApi.getSidebarDockAccountList(true);
      try {
        contactInfos = await contactApi.doGetContactByItem({ type: 'EMAIL', value: sharedAccounts.map(item => item.email) });
      } catch (error) {
        console.log('error', error);
      }
      const newAccounts = sharedAccounts.map(oldItem => {
        const item = cloneDeep(oldItem);
        const findOne = (contactInfos || []).find(contact => contact?.contact?.accountName === item.email);
        if (findOne?.contact?.avatar) {
          item.avatar = findOne?.contact?.avatar;
        }

        // item.unread = !!sideBarDockAccountList[item.email];
        return item;
      });
      // 更换头像
      data = { ...data, sharedAccounts: newAccounts };
      dispatch(actions.setSharedAccount(data));
    }
  } catch (error) {
    // e.message && Message.error(e.message);
  }
});

// 切换本地保存的账号
const switchLocalAccount = async (id: string) => {
  let pass;
  if (window && window.electronLib) {
    pass = await electronSwitchAccount(id);
  } else {
    pass = await webSwitchAccount(id);
  }
  return pass;
};

//处理切换账号失败
// const handleSwitchAccountFailed = async (id: string) => {
//   SiriusModal.error({
//     title: getIn18Text("ZHANGHAOYISHIXIAO"),
//     content: getIn18Text("ZHANGHAO")+ id + getIn18Text("YIJINGSHIXIAO\uFF0C"),
//     okText: getIn18Text("ZHONGXINDENGLU"),
//     maskClosable: false,
//     onOk: () => {
//       if(systemApi.isElectron()) {
//         loginApi.showCreateAccountPage(id);
//       } else {
//         actions
//       }
//     }
//   });
//   await setAccountExpired(id);
// }

// 设置账号过期
const setAccountExpired = async (id: string) => {
  await accountApi.doUpdateAccountList([
    {
      id,
      expired: true,
    },
  ]);
};

const reloadToMainPage = () => {
  systemApi.reloadToMainPage();
};

// 处理账号切换成功
const handleSwitchAccountSuccessed = async () => {
  if (window && window.electronLib) {
    systemApi.switchLoading(true);
    try {
      await window.electronLib.masterBridgeManage.flush('');
      await window.electronLib.windowManage.closeAllWindowExceptMain(true);
      setTimeout(async () => {
        loginApi.createBKStableWindow();

        if (process.env.BUILD_ISEDM) {
          localStorage.removeItem('v1v2');
          localStorage.removeItem('localVerionPrompt');
          roleApi
            .getMenuVersion()
            .then(res => {
              if (res?.menuVersion === 'NEW') {
                setV1v2('v2');
              } else if (res?.menuVersion === 'OLD') {
                setV1v2('v1');
              } else {
                setV1v2('NONE');
              }

              reloadToMainPage();
            })
            .catch(err => {
              console.log(err);
              reloadToMainPage();
            });
        } else {
          reloadToMainPage();
        }
      }, 200);
    } catch (ex) {
      console.error(`closeAllWindowExceptMain error`, ex);
    }
  } else {
    Message.success(getIn18Text('QIEHUANZHANGHAOCHENGG！'));
    systemApi.switchLoading(true);
    setTimeout(async () => {
      if (process.env.BUILD_ISEDM) {
        localStorage.removeItem('v1v2');
        localStorage.removeItem('localVerionPrompt');
        roleApi
          .getMenuVersion()
          .then(res => {
            if (res?.menuVersion === 'NEW') {
              setV1v2('v2');
            } else if (res?.menuVersion === 'OLD') {
              setV1v2('v1');
            } else {
              setV1v2('NONE');
            }

            reloadToMainPage();
          })
          .catch(err => {
            console.log(err);
            reloadToMainPage();
          });
      } else {
        reloadToMainPage();
      }
    }, 200);
  }
};

// electron 切换账号方式
const electronSwitchAccount = (id: string) => {
  return new Promise<boolean>(async (resolve, reject) => {
    const [account, accountInfo] = await accountApi.doGetAllAccountList();
    const swictAccount = (account || []).filter(item => item.id === id);
    const browserUUId = storeApi.getUUID();
    const sessionName = `memory-${new Date().getTime().toString()}`;
    const { winId } = await systemApi.createWindowWithInitData(
      {
        type: 'bkLogin',
        additionalParams: {
          bkLoginInit: true,
          sessionName,
        },
        manualShow: true,
        sessionName: sessionName,
      },
      {
        eventName: 'initBkLoginPage',
        eventData: {
          account: swictAccount,
          accountInfo,
          browserUUId,
          accountId: id,
        } as BkLoginInitData,
      }
    );
    // 30秒切换超时
    const timer = setTimeout(() => {
      if (config('stage') === 'prod') {
        systemApi.closeSubWindow(winId, false, true);
      } else {
        SiriusModal.error({
          title: getIn18Text('CESHIHUANJINGZHANG'),
        });
      }
      reject();
    }, 30 * 1000);

    const uid = eventApi.registerSysEventObserver('bkStableSwitchAccount', {
      name: 'bkStableSwitchAccount-main',
      func: async (ev: SystemEvent<BkLoginResultData>) => {
        const data = ev.eventData;
        const { currentUser, currentNode, authInfo, pass, accountId, account: _account = [], accountInfo: _accountInfo = [] } = data || {};
        if (accountId && accountId === id) {
          // 关闭后台DB
          if (window.bridgeApi && window.bridgeApi.master) {
            window.bridgeApi.master.forbiddenBbWin4CurrPage();
          }
          httpImpl.setLogoutStatus(true);
          if (currentUser) {
            storeApi.setLastAccount(currentUser);
            if (currentUser.cookies && currentUser.cookies.length) {
              await window.electronLib.appManage.clearCookieStore();
              await window.electronLib.appManage.setCookieStore(currentUser.cookies);
            }
          }
          if (currentNode) {
            storeApi.setCurrentNode(currentNode);
          }
          if (authInfo) {
            productAuthApi.setStoreAuthInfo(authInfo);
          }
          eventApi.unregisterSysEventObserver('bkStableSwitchAccount', uid);
          clearTimeout(timer);
          if (pass) {
            systemApi.closeSubWindow(winId, false, true);
            Promise.all([accountApi.doUpdateAccountList(_account), accountApi.storeAccountInfoList(_accountInfo)])
              .then(() => {
                resolve(true);
              })
              .catch(error => {
                resolve(false);
                console.error('[login_redux] doSwitchAccountAsync error', error);
              });
          } else {
            if (config('stage') !== 'prod') {
              Message.info({ content: getIn18Text('CESHIHUANJINGZHANG') });
            }
            resolve(false);
          }
        }
      },
    });
  });
};

// web 切换账号方式
const webSwitchAccount = async (id: string) => {
  const { pass } = await loginApi.doAutoLogin(id);
  return pass;
};

//  切换公共账号
const switchSharedAccount = (id: string) => {
  return loginApi.switchSharedAccount(id);
};
/**
 * 切换账号
 */
export const doSwitchAccountAsync = createAsyncThunk('loginReducer/switchAccount', async (id: string, { rejectWithValue, dispatch }) => {
  try {
    // 保留切换账号前的登录账号id
    const preAccount = systemApi.getCurrentUser()?.id;
    // 设置正在切换的账号
    dispatch(actions.setSwitchingAccount(id));
    // 切换本地账号
    const pass = await switchLocalAccount(id);
    if (pass) {
      // 处理登录成功的状态
      await handleSwitchAccountSuccessed();
      return true;
    } else {
      // 切换账号失败是否重新登录需要切换的账号
      SiriusModal.error({
        title: getIn18Text('ZHANGHAOYISHIXIAO'),
        content: getIn18Text('ZHANGHAO') + id + getIn18Text('YIJINGSHIXIAO\uFF0C'),
        okText: getIn18Text('ZHONGXINDENGLU'),
        maskClosable: false,
        onOk: () => {
          if (systemApi.isElectron()) {
            loginApi.showCreateAccountPage(id);
          } else {
            dispatch(
              actions.setLoginModalData({
                visible: true,
                account: id,
                preAccount,
              })
            );
          }
        },
        onCancel: async () => {
          // 不登录切换的账号，在web需要重新登录上一个账号
          if (!systemApi.isElectron() && preAccount) {
            const res = await loginApi.doAutoLogin(preAccount);
            if (res.pass) {
              //切换回上一个账号成功
              setLoginBlock(false);
            } else {
              //切换回上一个账号失败
              Message.error(getIn18Text('ZHANGHAOSHIXIAO'));
              sendLogout();
            }
          }
        },
      });
      // 设置账号失效
      await setAccountExpired(id);
    }
    // 设置无正在登录的账号
    dispatch(actions.setSwitchingAccount(''));
    // 刷新账号列表状态
    await dispatch(doListAccountsAsync());
  } catch (error) {
    Message.error(getIn18Text('ZHANGHAOQIEHUANCHAO'));
  }
  return rejectWithValue(getIn18Text('ZHANGHAODENGLUZHUANG11'));
});
/**
 * 切换公共账号
 */
export const doSwitchSharedAccountAsync = createAsyncThunk('loginReducer/switchSharedAccount', async (id: string, { dispatch, rejectWithValue }) => {
  const errorTipText = getIn18Text('SWITCH_SHARED_ACCOUNT_ERROR');
  try {
    dispatch(actions.setSwitchingAccount(id));
    const res = await switchSharedAccount(id);
    dispatch(actions.setSwitchingAccount(''));
    if (!res.success) {
      dispatch(doSharedAccountAsync(true));
      console.error(`switchSharedAccount error`, res.errMsg);
      SiriusModal.error({
        content: errorTipText,
        okText: getIn18Text('ZHIDAOLE'),
        hideCancel: true,
      });
      return;
    }
    return;
  } catch (error) {
    Message.error(errorTipText);
  }
  return rejectWithValue(errorTipText);
});

/**
 * 切换手机关联账号
 */
export const doSwitchMobileAccountAsync = createAsyncThunk('loginReducer/switchMobileAccount', async (id: string, { dispatch }) => {
  const data = await accountApi.doGetMobileAccountInfo(id);
  const { enabledMobileLogin, accountId, lastLoginTime, status } = data[0] as MobileAccountInfoTable;
  const { account, domain } = systemApi.handleAccountAndDomain(accountId) as {
    account: string;
    domain: string;
  };
  if (String(status) !== '0') {
    SiriusModal.error({
      title: getIn18Text('ZHANGHAOWUFADENG'),
      content: getIn18Text('DANGQIANNINDEZHANG'),
      hideCancel: true,
    });
    return;
  }
  if (!enabledMobileLogin) {
    SiriusModal.error({
      title: getIn18Text('ZHANGHAOWUFADENG'),
      content: getIn18Text('DANGQIANNINDEZHANG11'),
      hideCancel: true,
    });
    return;
  }
  if (!lastLoginTime) {
    SiriusModal.info({
      title: getIn18Text('WANGYILINGXIBAN12'),
      content: getIn18Text('BENCIDENGLUXU'),
      onOk: () => {
        dispatch(actions.setMailBindModalInfo({ visible: true, account: accountId }));
      },
    });
    return;
  }
  if (enabledMobileLogin && lastLoginTime) {
    SiriusModal.error({
      title: getIn18Text('QUERENQIEHUANDAO'),
      content: getIn18Text('QIEHUANZHANGHAOHUI'),
      onOk: () => {
        (async () => {
          console.log('[login] SwitchMobileAccount doMobileTokenLogin into:');
          systemApi.switchLoading(true);
          const { pass, errmsg, errCode } = await loginApi.doMobileBindAccountLogin({
            account_name: account,
            domain,
          });
          console.log('[login] SwitchMobileAccount doMobileTokenLogin return:', pass, errmsg, account);
          if (pass) {
            util.reload();
            return;
          }
          systemApi.switchLoading(false);
          Message.info({ content: errmsg || errCode || getIn18Text('WEIZHICUOWU') });
        })();
      },
    });
  }
});
/**
 * 请求手机号验证码登录
 */
export const onRegisterValidateCode = createAsyncThunk('loginReducer/onRegisterValidateCode', async ({ mobile, code }: IValidateCodeProp, { dispatch }) => {
  const { success, isRegister, message, data } = await registerApi.doValidateCode({ mobile, code });
  if (success) {
    if (isRegister && data) {
      // 处理是否选择登录流程
      dispatch(
        actions.setMobileBindAccountListInfo({
          accountList: data,
          visibleList: true,
        })
      );
    } else {
      dispatch(
        actions.setRegisterInfo({
          visible: true,
        })
      );
    }
  } else {
    message && Message.info(message);
  }
});
export const onLoginValidateCode = createAsyncThunk('loginReducer/onLoginValidateCode', async ({ code }: IValidateCodeProp, { dispatch }) => {
  const { success, message, data } = await loginApi.doMobileVerifyCode(code);
  if (success) {
    if (data?.length) {
      const lastLoginAccount = data.find(item => item.token);
      if (lastLoginAccount) {
        const { pass, errmsg } = await loginApi.doMobileTokenLogin({
          domain: lastLoginAccount.domain,
          token: lastLoginAccount.token,
          account_name: lastLoginAccount.accountName,
        });
        if (pass) {
          window.location.assign('/');
        } else {
          Message.info(errmsg);
        }
      } else {
        // 处理是否选择登录流程
        dispatch(
          actions.setMobileBindAccountListInfo({
            accountList: data,
            visibleList: true,
          })
        );
      }
    } else {
      actions.setVisibleSwitchModal(true);
    }
  } else {
    message && Message.info(message);
  }
});
export default LoginSlice.reducer;
