import { createAsyncThunk, createSelector, createSlice, PayloadAction } from '@reduxjs/toolkit';
// import { AccessModel, apiHolder, apis, EdmRoleApi, ModulePrivilege, RoleListItem, RoleModel, MenuItem as IMenuItem } from 'api';
// const roleApi = apiHolder.api.requireLogicalApi(apis.edmRoleApiImpl) as EdmRoleApi;
// const systemApi = apiHolder.api.getSystemApi();
// const storageApi = apiHolder.api.getDataStoreApi()
import { apiHolder, apis, CustomerApi, resCompanyRules as companySettingType, resCompanyRules, BaseInfoRes as BaseSelectType } from 'api';
import { cloneDeep } from 'lodash';
const customerApi = apiHolder.api.requireLogicalApi(apis.customerApiImpl) as CustomerApi;

interface mapSetting {
  [propName: string]: string;
}
type keyType = keyof companySettingType;

const mapSetting: mapSetting = {
  company_name: 'company_name',
  email: 'email',
  company_domain: 'company_domain',
  landline_telephone: 'telephone',
  email_suffix: 'email_suffix',
  telephone: 'telephones',
  whats_app: 'whats_app',
  home_page: 'home_page',
};

export const getCompanyCheckRules = createAsyncThunk('customerField/getSetting', async () => {
  return customerApi.companyCheckRules();
});

export const updateCompanyCheckRules = createAsyncThunk('customerField/updateSetting', async (params: resCompanyRules) => {
  return customerApi.updateCompanyCheckRules(params);
});

export const getBaseSelectAsync = createAsyncThunk(
  'getBaseSelectAsync',
  async () => {
    return customerApi.getBaseInfo().then(res => {
      let businessStages = res.business_stage.map(item => {
        return {
          value: Number(item.stage),
          label: item.name,
          type: item.type,
        };
      });
      // @ts-ignore
      delete res.area;
      return {
        ...res,
        businessStages,
      } as BaseSelectType;
    });
  },
  {
    condition(_, api) {
      // 缓存1分钟
      console.log('customerReducer', api.getState());
      return +new Date() - (api.getState() as any).customerReducer.baseSelectUpdateTime > 60 * 1000;
    },
  }
);

export const getAreaSelectAsync = createAsyncThunk(
  'getAreaSelectAsync',
  async () => {
    return customerApi.getGlobalArea().then(res => {
      return {
        area: res.area,
      } as BaseSelectType;
    });
  },
  {
    condition(_, api) {
      // 缓存1分钟
      return +new Date() - (api.getState() as any).customerReducer.areaUpdateTime > 10 * 60 * 1000;
    },
  }
);

export const getFieldState = createSelector(
  (state: initialStateType) => {
    let data = (state?.globalField || []).reduce((previousValue, item) => {
      let key = mapSetting[item.field];
      return {
        ...previousValue,
        [key as any]: item.checked,
      };
    }, {});
    return data;
  },
  (data: mapSetting) => data
);

export interface initialStateType {
  name: string;
  baseSelect: BaseSelectType;
  baseSelectUpdateTime: number;
  areaUpdateTime: number;
  globalField: {
    field: string;
    name: string;
    checked: number;
    disabled?: boolean;
  }[];
}

let customerInitialState: initialStateType = {
  name: 'edm-global-init',
  baseSelect: {} as BaseSelectType,
  baseSelectUpdateTime: 0,
  areaUpdateTime: 0,
  globalField: [
    {
      field: 'company_name',
      name: '客户名称',
      checked: 0,
      disabled: false,
    },
    {
      field: 'email',
      name: '邮箱',
      checked: 0,
      disabled: false,
    },
    {
      field: 'company_domain',
      name: '公司域名',
      checked: 0,
    },
    {
      field: 'landline_telephone',
      name: '座机电话',
      checked: 0,
    },
    // {
    //   field: 'email_suffix',
    //   name: '邮箱后缀',
    //   checked: 0,
    // },
    {
      field: 'telephone',
      name: '电话',
      checked: 0,
    },
    {
      field: 'whats_app',
      name: 'WhatsApp',
      checked: 0,
    },
    {
      field: 'home_page',
      name: '个人主页',
      checked: 0,
    },
  ],
};

const handerSetting = (originData: initialStateType['globalField'], data: companySettingType) => {
  let newConfig = cloneDeep(originData);
  newConfig.forEach(ele => {
    let key = ele.field;
    if (key) {
      ele.checked = data[key as keyType] as number;
    }
  });
  return newConfig;
};

const customerSlice = createSlice({
  name: 'privilegeReducer',
  initialState: customerInitialState,
  reducers: {
    setGlobalField: (state, action: PayloadAction<any>) => {
      state.globalField = action.payload;
    },
    setBaseSelect: (state, action: PayloadAction<any>) => {
      state.baseSelect = action.payload;
    },
  },
  extraReducers(builder) {
    builder
      .addCase(getCompanyCheckRules.fulfilled, (state, action) => {
        state.globalField = handerSetting(customerInitialState.globalField, action.payload);
      })
      .addCase(updateCompanyCheckRules.fulfilled, (state, action) => {
        console.log('xxxx-builder-update', state, action.payload);
        // state.globalField = handerSetting(state.globalField, action.payload);
      })
      .addCase(getBaseSelectAsync.fulfilled, (state, action) => {
        state.baseSelect = {
          ...state.baseSelect,
          ...action.payload,
        };
        state.baseSelectUpdateTime = +new Date();
      })
      .addCase(getAreaSelectAsync.fulfilled, (state, action) => {
        state.baseSelect = {
          ...state.baseSelect,
          ...action.payload,
        };
        state.areaUpdateTime = +new Date();
      });
  },
});
const { reducer, actions } = customerSlice;

export { actions };
export default reducer;
