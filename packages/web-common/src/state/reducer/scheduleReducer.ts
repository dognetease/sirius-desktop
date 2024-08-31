import { ScheduleModel, ZoneItem } from 'api';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import moment from 'moment';
import { ScheduleState } from '../state';
import { saveCatalogUnChecked } from '@web-schedule/service';
import { ScheduleInsertForm } from '@web-schedule/components/CreateBox/ScheduleForm';
import { EnumRange } from '@web-schedule/data';
import { thunksStore } from '@web-mail/types';
import { thunkHelperFactory } from '@web-mail/util';
import { AsyncThunkConfig } from 'state/createStore';

export interface ScheduleSyncEvent {
  type: 'delete' | 'add' | 'update' | 'all';
  data?: ScheduleInsertForm | ScheduleModel;
  opRange?: EnumRange;
}
export const SCHEDULED_POINT_FORMAT = 'YYYY-MM-DD';
const initState: ScheduleState = {
  scheduleEventList: [],
  catalogList: [],
  scheduleSync: null,
  scheduleEvent: null,
  unSelectedCatalogIds: [],
  miniSelectedDay: moment(),
  scheduledDate: [],
  weekFirstDay: 0,
  weekNumbersVisible: true,
  creatDirectStartTime: moment(),
  creatDirectEndTime: moment(),
  activeStartDate: new Date(),
  activeEndDate: new Date(),
  scheduleEditFrom: '',
  scheduleNoticeLastUpdateTime: new Date(Date.now() - 60 * 60 * 1000),
  settingZoneList: [],
  showSecondaryZone: false,
  lastSelectTimezone: null,
};
const ReducerName = 'scheduleReducer';
const Thunks: thunksStore = {};
const ReducersList: (() => void)[] = [];
const thunkHelper = thunkHelperFactory(ReducerName, Thunks, ReducersList);

// export type ScheduleState = Record<string, ScheduleState>;
const scheduleSlicer = createSlice({
  name: ReducerName,
  initialState: initState,
  reducers: {
    syncSchedule: (state, action: PayloadAction<ScheduleSyncEvent | null | undefined>) => {
      state.scheduleSync = action.payload || { type: 'all' };
    },
    changeScheduleEvent: (state, action: PayloadAction<ScheduleModel | null | undefined>) => {
      state.scheduleEvent = action.payload;
    },
    updateCatlogList: (state, action: PayloadAction<ScheduleState['catalogList']>) => {
      state.catalogList = action.payload;
    },
    setScheduledDateList: (state, action: PayloadAction<string[]>) => {
      state.scheduledDate = action.payload;
    },
    toggleSelectedCatalogIds: (state, action: PayloadAction<string>) => {
      const set = new Set(state.unSelectedCatalogIds);
      if (set.has(action.payload)) {
        set.delete(action.payload);
      } else {
        set.add(action.payload);
      }
      saveCatalogUnChecked(Array.from(set));
      state.unSelectedCatalogIds = Array.from(set);
    },
    updateUnSelectedCatalogIds: (state, action: PayloadAction<string[]>) => {
      state.unSelectedCatalogIds = Array.from(action.payload);
    },
    setScheduleEventList: (state, action: PayloadAction<ScheduleState['scheduleEventList']>) => {
      state.scheduleEventList = action.payload;
    },
    setMiniSelectedDay: (state, action: PayloadAction<ScheduleState['miniSelectedDay']>) => {
      state.miniSelectedDay = action.payload;
    },
    setCreatDirectStartTime: (state, action: PayloadAction<ScheduleState['creatDirectStartTime']>) => {
      state.creatDirectStartTime = action.payload;
    },
    setCreatDirectEndTime: (state, action: PayloadAction<ScheduleState['creatDirectEndTime']>) => {
      state.creatDirectEndTime = action.payload;
    },
    setWeekFirstDay: (state, action: PayloadAction<number>) => {
      state.weekFirstDay = action.payload;
    },
    setWeekNumbersVisible: (state, action: PayloadAction<boolean>) => {
      state.weekNumbersVisible = action.payload;
    },
    setActiveStartDate: (state, action: PayloadAction<Date>) => {
      state.activeStartDate = action.payload;
    },
    setActiveEndDate: (state, action: PayloadAction<Date>) => {
      state.activeEndDate = action.payload;
    },
    setScheduleEditFrom: (state, action: PayloadAction<string>) => {
      state.scheduleEditFrom = action.payload;
    },
    setSettingZoneList: (state, action: PayloadAction<number[]>) => {
      state.settingZoneList = action.payload;
    },
    setShowSecondaryZone: (state, action: PayloadAction<boolean>) => {
      state.showSecondaryZone = action.payload;
    },
    setLastSelectTimezone: (state, action: PayloadAction<ZoneItem>) => {
      state.lastSelectTimezone = action.payload;
    },
  },
});
thunkHelper({
  name: 'updateSchduleList',
  request: (params: { data: ScheduleModel[]; requestParams: { start: Date; end: Date }; isAsyncData?: boolean }, thunkAPI: AsyncThunkConfig) => {
    const { dispatch } = thunkAPI;
    const rootState = thunkAPI.getState().scheduleReducer;
    // redux存的是数字类型，转成string
    const unselectedCatalogIds = rootState.unSelectedCatalogIds.map(item => String(item));
    const {
      data,
      requestParams: { start, end },
      isAsyncData = false,
    } = params;
    console.log('updateSchduleList params', start, end, isAsyncData);
    // console.log('updateSchduleList unselectedCatalogIds', unselectedCatalogIds,  data.filter((item: ScheduleModel) => {
    //   return unselectedCatalogIds.includes(String(item?.catalogInfo?.catalogId));
    // }))
    // 过滤未选择的日历id对应数据
    const selectedCatalogData = data.filter((item: ScheduleModel) => {
      return !unselectedCatalogIds.includes(String(item?.catalogInfo?.catalogId));
    });
    // const state = thunkAPI.getState().scheduleReducer;
    // if (isAsyncData) {
    //   dispatch(scheduleSlicer.actions.setScheduleEventList(data));
    // } else {

    dispatch(scheduleSlicer.actions.setScheduleEventList(selectedCatalogData));
    dispatch(Thunks.updateScheduledDateList({ data: selectedCatalogData }));
    // }
  },
  rejected: (state: ScheduleState, action) => {
    const error = action?.error?.message || action.payload || action.error;
    console.warn('updateSchduleList err0r', error);
  },
});

thunkHelper({
  name: 'updateScheduledDateList',
  request: (params: { data?: ScheduleModel[] }, thunkAPI: AsyncThunkConfig) => {
    const { dispatch } = thunkAPI;
    const rootState = thunkAPI.getState().scheduleReducer;
    const { scheduleEventList, unSelectedCatalogIds } = rootState;
    // redux存的是数字类型，转成string
    const unselectedCatalogIds = unSelectedCatalogIds.map(item => String(item));
    const scheduledDateList: string[] = [];

    scheduleEventList.forEach(e => {
      if (unselectedCatalogIds.indexOf(String(e.catalogInfo?.catalogId)) === -1) {
        scheduledDateList.push(moment(e.scheduleInfo.start).format(SCHEDULED_POINT_FORMAT));
      }
    });
    dispatch(scheduleSlicer.actions.setScheduledDateList(scheduledDateList));
    // }
  },
  rejected: (state: ScheduleState, action) => {
    const error = action?.error?.message || action.payload || action.error;
    console.warn('updateSchduleList err0r', error);
  },
});

export const { actions } = scheduleSlicer;
export const ScheduleThunks = Thunks;
export default scheduleSlicer.reducer;
