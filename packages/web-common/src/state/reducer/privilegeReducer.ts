import { createAsyncThunk, createSelector, createSlice } from '@reduxjs/toolkit';
import { AccessModel, apiHolder, apis, EdmRoleApi, ModulePrivilege, RoleListItem, RoleModel, MenuItem as IMenuItem, MenuItem, inWindow } from 'api';
import { setV1v2 } from '@web-common/hooks/useVersion';
import { versionConflictHandler } from '@web-common/utils/waimao/menuVersion';

const roleApi = apiHolder.api.requireLogicalApi(apis.edmRoleApiImpl) as EdmRoleApi;
const systemApi = apiHolder.api.getSystemApi();
const storageApi = apiHolder.api.getDataStoreApi();

export type ResourceLabel = 'EDM' | 'CONTACT' | 'COMMERCIAL' | 'CHANNEL' | 'WORKBENCH';
export interface IModulePrivilege {
  resourceLabel: ResourceLabel;
  resourceName: string;
  funcPrivileges: AccessModel[];
  dataPrivilege?: AccessModel;
}
enum Version {
  UNKNOWN = '', // 未知
  FREE = 'FREE', // 体验版
  FASTMAIL = 'FASTMAIL', // 外贸版
  WEBSITE = 'WEBSITE', // 建站版
  FASTMAIL_AND_WEBSITE = 'FASTMAIL_AND_WEBSITE', // 外贸和建站版
  FASTMAIL_EXPIRED = 'FASTMAIL_EXPIRED', // 外贸过期版
}
export interface PrivilegeState {
  enableFastMail?: boolean;
  roles: RoleModel[];
  roleList: RoleListItem[];
  menus: IMenuItem[];
  menuReady: boolean;
  visibleMenuLabels: Record<string, boolean>;
  modules: Record<string, IModulePrivilege>;
  loading: boolean;
  version: 'FREE' | 'PAY' | 'FASTMAIL_EXPIRED' | 'FASTMAIL_AND_WEBSITE' | 'WEBSITE' | 'FASTMAIL' | Version;
  versionName: string;
  productMenus: IMenuItem[];
  moduleAccessRange: Record<string, string[]>;
  moduleAccessIds: Record<string, string[]>;
  /**
   * 是否为外贸旗舰版
   */
  ultimateVersion?: boolean;
}

const enableFastMail = systemApi.getCurrentUser()?.prop?.enable_fastmail;
const initState: PrivilegeState = {
  enableFastMail: enableFastMail ? enableFastMail === 'true' : undefined,
  roles: [],
  roleList: [],
  menus: [],
  menuReady: false,
  visibleMenuLabels: {},
  modules: {},
  loading: false,
  version: '',
  versionName: '',
  productMenus: [],
  moduleAccessRange: {},
  moduleAccessIds: {},
  ultimateVersion: false,
};

function retryReq<T>(asyncFunc: () => Promise<T>, retryTimes: number, intervalFn: (count: number) => number) {
  let count = 0;
  const req = (resolve: (value: T) => void, reject: (reason: any) => void) => {
    console.log('retryReq', count);
    asyncFunc().then(
      data => {
        resolve(data);
      },
      err => {
        count++;
        if (count > retryTimes) {
          reject(err);
        }
        setTimeout(() => req(resolve, reject), intervalFn(count));
      }
    );
  };
  return function () {
    return new Promise<T>((resolve, reject) => {
      req(resolve, reject);
    });
  };
}

function retryReqAndFallbackStorage<T>(asyncFunc: () => Promise<T>, retryTimes: number, intervalFn: (count: number) => number, key: string) {
  const doReq = retryReq(asyncFunc, retryTimes, intervalFn);
  const getFromStorage = (key: string) => {
    const str = storageApi.getSync(key, {
      noneUserRelated: false,
    }).data;
    if (str) {
      try {
        return JSON.parse(str).data;
      } catch (e) {
        return undefined;
      }
    }
  };
  return doReq()
    .then(res => {
      storageApi.put(
        key,
        JSON.stringify({
          data: res,
          time: +new Date(),
        }),
        {
          noneUserRelated: false,
        }
      );
      return res;
    })
    .catch(err => {
      const fallbackValue = getFromStorage(key);
      console.warn(err);
      if (fallbackValue === undefined) {
        throw new Error(`请求重试${retryTimes}次失败`);
      }
      return fallbackValue as T;
    });
}

export const isEnableFastmailAsync = createAsyncThunk('product/privilege', async () => {
  const productId = 'fastmail';
  const doReq = () => {
    // if (Math.random() > 0.3) {
    //  return Promise.reject('mock fastmail fail');
    // }
    return roleApi.getProductPrivilege('fastmail').then(flag => {
      storageApi.setUserProp(`enable_${productId}`, flag ? 'true' : 'false', true);
      return flag;
    });
  };
  const wrapRetryReq = retryReq<boolean>(doReq, 10, count => count * 1000);
  return wrapRetryReq();
});

export const getPrivilegeAsync = createAsyncThunk('privileges/getAll', async () => {
  const key = 'wm_privileges_all';
  return retryReqAndFallbackStorage<ModulePrivilege[]>(
    () => roleApi.getCurrentPrivilege(),
    3,
    () => 1000,
    key
  );
});

export const getVersionAsync = createAsyncThunk('privileges/getVersion', async () => {
  return roleApi.getVersion({
    productId: 'fastmail',
    productVersionId: 'professional',
  });
});

export enum VersionEnum {
  v1 = 'OLD',
  v2 = 'NEW',
  NONE = 'NONE',
}

export const getMenuVersion = createAsyncThunk('privileges/getMenuVersion', async () => {
  return roleApi.getMenuVersion().then(res => {
    let isChanged = res?.menuVersion !== VersionEnum[(localStorage.getItem('v1v2') || 'NONE') as keyof typeof VersionEnum];

    // local cache no exist , eg : login
    if (!localStorage.getItem('v1v2')) {
      isChanged = false;
    }

    if (res?.menuVersion === 'NEW') {
      setV1v2('v2');
      // localStorage.setItem('v1v2', 'v2');
    } else if (res?.menuVersion === 'OLD') {
      setV1v2('v1');
      // localStorage.setItem('v1v2', 'v1');
    } else {
      setV1v2('NONE');
      // localStorage.setItem('v1v2', 'NONE');
    }

    // 其他端修改后，本端需要重新加载
    if (isChanged) {
      versionConflictHandler();
    }

    return res;
  });
});

// 是否为免费版用户
export const getIsFreeVersionUser = createSelector(
  (state: PrivilegeState) => {
    const version = state?.version;
    return version === 'FREE' || version === Version.FREE;
    // return version === 'FREE' || version === Version.FREE || version === Version.FASTMAIL_EXPIRED;
  },
  (isFreeVersionUser: boolean) => isFreeVersionUser
);
// 是否为付费版用户
export const getIsPayVersionUser = createSelector(
  (state: PrivilegeState) => {
    return state.version === 'PAY' || state.version === Version.FASTMAIL || state.version === Version.FASTMAIL_AND_WEBSITE;
  },
  (isPayVersionUser: boolean) => isPayVersionUser
);

export const getMyRolesAsync = createAsyncThunk('roles/getAll', async () => {
  return roleApi.getRoleList();
});

export const getMenuSettingsAsync = createAsyncThunk('menus/getAll', async () => {
  const key = 'wm_menu_setting';
  return retryReqAndFallbackStorage(
    () => {
      if (['NONE', undefined, null].includes(window?.localStorage.getItem('v1v2'))) {
        return roleApi.getMenuList();
      } else {
        return roleApi.getMenuListNew().then(res => res?.menuItems);
      }
    },
    3,
    () => 1000,
    key
  );
});

export const getModuleDataPrivilegeAsync = createAsyncThunk('module/data/privilege', async (resourceLabel: string) => {
  return roleApi.getModuleDataRange(resourceLabel);
});

const privilegeSlice = createSlice({
  name: 'privilegeReducer',
  initialState: initState,
  reducers: {},
  extraReducers(builder) {
    builder
      .addCase(getPrivilegeAsync.pending, state => {
        state.loading = true;
      })
      .addCase(getPrivilegeAsync.rejected, state => {
        state.loading = false;
      })
      .addCase(getPrivilegeAsync.fulfilled, (state, action) => {
        state.modules = groupByModule(action.payload);
        state.loading = false;
      });
    builder
      .addCase(getMyRolesAsync.fulfilled, (state, action) => {
        state.roles = action.payload.myRoles;
        state.roleList = action.payload.roles;
      })
      .addCase(getMenuSettingsAsync.fulfilled, (state, action) => {
        state.menus = action.payload;
        state.menuReady = true;
        state.visibleMenuLabels = buildMap(action.payload);
      })
      .addCase(getModuleDataPrivilegeAsync.fulfilled, (state, action) => {
        state.moduleAccessRange[action.payload.resourceLabel] = action.payload.accessRangeList;
        state.moduleAccessIds[action.payload.resourceLabel] = action.payload.accIds || [];
      });
    builder.addCase(isEnableFastmailAsync.fulfilled, (state, action) => {
      state.enableFastMail = action.payload;
    });
    builder.addCase(getVersionAsync.fulfilled, (state, action) => {
      state.version = action.payload.version;
      state.versionName = action.payload.versionName;
      state.productMenus = action.payload.productMenus;
      state.ultimateVersion = action.payload.ultimateVersion;
    });
  },
});

export const getModuleAccessSelector = createSelector(
  (state: PrivilegeState, resourceLabel: string, accessLabel: string) => {
    // 地址簿下，只有导出功能做权限控制，其他直接通过
    if ((resourceLabel === 'ADDRESS_BOOK' && accessLabel !== 'EXPORT') || (resourceLabel === 'ADDRESS_OPEN_SEA' && accessLabel !== 'EXPORT')) {
      return true;
    }
    const privilege = state.modules[resourceLabel];
    if (!privilege) {
      return false;
    }
    if (accessLabel.indexOf('|') > -1) {
      let labels = accessLabel.split('|');
      return labels.some(key => privilege.funcPrivileges.some(i => i.accessLabel === key));
    }
    let labels = accessLabel.split('+');
    if (labels.length === 1) {
      return privilege.funcPrivileges.some(i => i.accessLabel === accessLabel);
    } else {
      return labels.every(key => privilege.funcPrivileges.some(i => i.accessLabel === key));
    }
  },
  (hasPermisson: boolean) => hasPermisson
);

// export const getModuleMenuSelector = createSelector(
//   (state: PrivilegeState, moduleLabel: string) => {
//     const module =  state.menus.find(m => m.menuLabel === moduleLabel);
//     return buildMap(module ? [module] : []) ;
//   },
//   (map: Record<string, boolean>) => map,
// );

export const getIsSomeMenuVisbleSelector = createSelector(
  (state: PrivilegeState, moduleLabels: string[]) => {
    if (state && !state.menuReady) {
      return true;
    }
    return moduleLabels?.some(label => state && state.visibleMenuLabels[label] === true);
  },
  (visible: boolean) => visible
);

export const isOwnerDataPrivilegeSelector = createSelector(
  (state: PrivilegeState, resourceLabel: string) => {
    return state.moduleAccessRange[resourceLabel] && state.moduleAccessRange[resourceLabel].every(accessRange => accessRange === 'OWNER');
  },
  (flag: boolean) => flag
);

export const privilegeActions = privilegeSlice.actions;
export default privilegeSlice.reducer;

function groupByModule(privileges: ModulePrivilege[]) {
  const groups: Record<string, IModulePrivilege> = {};
  privileges.forEach(item => {
    groups[item.resourceLabel] = {
      resourceLabel: item.resourceLabel as ResourceLabel,
      resourceName: item.resourceName,
      dataPrivilege: item.accessList.find(i => i.accessType === 'DATA'),
      funcPrivileges: item.accessList.filter(i => i.accessType !== 'DATA'),
    };
  });
  return groups;
}

const buildMap = (menus: IMenuItem[], map?: Record<string, boolean>) => {
  map = map || {};
  for (let i = 0, l = menus.length; i < l; i++) {
    const menu = menus[i];
    if (menu.subMenuItems?.length) {
      buildMap(menu.subMenuItems, map);
    }
    map[menu.menuLabel] = !!menu.showMenu;
  }
  return map;
};

if (inWindow()) {
  (window as any).privilegeApi = {
    print() {
      return {
        menu: storageApi.getSync('wm_menu_setting').data,
        privilege: storageApi.getSync('wm_privileges_all').data,
      };
    },
    getState() {},
  };
}
