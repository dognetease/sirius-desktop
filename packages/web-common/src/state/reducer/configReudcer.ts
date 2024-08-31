import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface VideoDrawerPropBase {
  videoId: string;
  source: string;
  scene: string;
  startTime?: number;
}

export interface VideoDrawerProp extends VideoDrawerPropBase {
  visible: boolean;
}

export interface WorktableReducer {
  videoDrawerProp: VideoDrawerProp;
}

const initState: WorktableReducer = {
  videoDrawerProp: { visible: false, videoId: '', source: '', scene: '' },
};

const configReducer = createSlice({
  name: 'configReducer',
  initialState: initState,
  reducers: {
    showVideoDrawer: (state, action: PayloadAction<VideoDrawerPropBase>) => {
      state.videoDrawerProp = {
        ...action.payload,
        visible: true,
      };
    },
    closeVideoDrawer: state => {
      state.videoDrawerProp = { ...state.videoDrawerProp, visible: false };
    },
    resetVideoDrawer: state => {
      state.videoDrawerProp = { visible: false, videoId: '', source: '', scene: '' };
    },
  },
});

export const { actions } = configReducer;
export default configReducer.reducer;
