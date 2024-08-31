import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { DiskTab, RootInfo, getDiskGuideTipsInfo, SpaceStateMap, DiskGuideTipsInfo, DiskStoreTipKey, transDiskPrivileges, DiskPsR, ModulePs } from '@web-disk/disk';
import { IUploadFile } from '@web-disk/upload';

interface UploadTriggerInfo {
  tab: DiskTab;
  triggered: boolean;
}
export interface IDiskReducer {
  curSideTab: DiskTab;
  curRootInfo: RootInfo;
  curContWidth: number;
  curDirId: number | null;
  guideTipsInfo: DiskGuideTipsInfo; // 引导提示的状态
  // 空间状态
  curSpaceState: SpaceStateMap;
  isNewUser: boolean; // 是否是新用户
  curUploadFileItems: IUploadFile[]; // 当前正在上传的文件
  curUploadTriggerInfo?: UploadTriggerInfo;
  diskPs: ModulePs[] | null; // 整体网盘的权限 P 是 privilege 的简写（官方）
  diskPsR: DiskPsR; // 易读的网盘权限对象
}

const InitialState: IDiskReducer = {
  curSideTab: 'recently',
  curRootInfo: {},
  curContWidth: 0,
  curDirId: -7,
  guideTipsInfo: getDiskGuideTipsInfo(),
  curSpaceState: {
    private: 'uninitial',
    public: 'uninitial',
  },
  isNewUser: false,
  curUploadFileItems: [],
  curUploadTriggerInfo: undefined,
  diskPs: null,
  diskPsR: {
    public: [],
    private: [],
  },
};

const diskSlice = createSlice({
  name: 'diskReducer',
  initialState: InitialState,
  reducers: {
    setCurSideTab: (state, action: PayloadAction<DiskTab>) => {
      state.curSideTab = action.payload;
    },
    setCurRootInfo: (state, action: PayloadAction<RootInfo>) => {
      state.curRootInfo = action.payload;
    },
    resetSpaceState: state => {
      state.curSpaceState = {
        private: 'uninitial',
        public: 'uninitial',
      };
    },
    setSpaceState: (state, action: PayloadAction<SpaceStateMap>) => {
      state.curSpaceState = { ...state.curSpaceState, ...action.payload };
    },
    setCurContWidth: (state, action: PayloadAction<number>) => {
      state.curContWidth = action.payload;
    },
    setCurDirId: (state, action: PayloadAction<number | null>) => {
      console.log('test', action);
      state.curDirId = action.payload;
    },
    setGuideTipsInfo: (state, action: PayloadAction<DiskGuideTipsInfo>) => {
      state.guideTipsInfo = action.payload;
    },
    setGuideTipsInfoByKey: <T extends DiskStoreTipKey>(
      state,
      action: PayloadAction<{
        key: DiskStoreTipKey;
        value: DiskGuideTipsInfo[T];
      }>
    ) => {
      state.guideTipsInfo = {
        ...state.guideTipsInfo,
        [action.payload.key]: action.payload.value,
      };
    },
    setIsNewUser: (state, action: PayloadAction<boolean>) => {
      state.isNewUser = action.payload;
    },
    setCurUploadFileItems: (state, action: PayloadAction<IUploadFile[]>) => {
      state.curUploadFileItems = action.payload;
    },
    setCurUploadTriggerInfo: (state, action: PayloadAction<UploadTriggerInfo>) => {
      state.curUploadTriggerInfo = action.payload;
    },
    // 连带设置diskPsR
    setDiskPs: (state, action: PayloadAction<ModulePs[]>) => {
      state.diskPs = action.payload;
      state.diskPsR = transDiskPrivileges(state.diskPs || []);
    },
  },
});

export const { actions } = diskSlice;
export default diskSlice.reducer;
