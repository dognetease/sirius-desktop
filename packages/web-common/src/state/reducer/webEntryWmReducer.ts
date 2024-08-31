import { TopMenuPath, TopMenuType } from '../../conf/waimao/constant';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

type Pos = {
  [key: string]: number[];
};

type ModulePage = {
  [key: string]: string;
};

interface IPinnedMenu {
  label: string;
  value: string;
}

export interface IWebEntryWmState {
  topMenu: any;
  // posMap: Pos;
  lastPageInModule: ModulePage;
  cachedTabs: { tab: string; page: string; query: any }[];
  pinnedMenus: IPinnedMenu[];
}

const initialState: IWebEntryWmState = {
  topMenu: [],
  // posMap: {},
  lastPageInModule: {},
  cachedTabs: [],
  pinnedMenus: [],
};

const slice = createSlice({
  name: 'webEntryWmReducer',
  initialState,
  reducers: {
    // updateTopMenu(state, action: PayloadAction<{ topMenu: TopMenuType[]; posMap: Pos }>) {
    //   const { topMenu, posMap } = action.payload;
    //   state.topMenu = topMenu;
    //   state.posMap = posMap;
    // },
    setPageInModuleMap(state, action: PayloadAction<{ mpMap: ModulePage; key: string }>) {
      const { mpMap, key } = action.payload;
      state.lastPageInModule[key] = mpMap[key];
    },
    setCachedTabs(state, action: PayloadAction<{ moduleName: string; page: string; params: any }>) {
      const { moduleName, page, params } = action.payload;
      if (
        [
          'worktable',
          'wmData',
          'intelliMarketing',
          'wm',
          'coop',
          'emailInquiry',
          TopMenuPath.personal,
          TopMenuPath.enterpriseSetting,
          TopMenuPath.site,
          TopMenuPath.systemTask,
          TopMenuPath.noviceTask,
          TopMenuPath.whatsAppRegister,
          TopMenuPath.wa,
        ].indexOf(moduleName) === -1
      )
        return;
      const item = state.cachedTabs.find(item => item.tab === moduleName);
      if (item) {
        item.page = page;
        item.query = params;
        state.cachedTabs = [...state.cachedTabs];
      } else {
        state.cachedTabs = [...state.cachedTabs, { tab: moduleName, page, query: params }];
      }
    },
    updatePinnedMenus(state, action: PayloadAction<{ menus: IPinnedMenu[] }>) {
      const { menus = [] } = action.payload;
      state.pinnedMenus = [...menus];
    },
  },
});

export const WebEntryWmActions = slice.actions;
export default slice.reducer;
