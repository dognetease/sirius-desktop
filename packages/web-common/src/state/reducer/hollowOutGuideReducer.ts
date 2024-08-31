import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { apiHolder as api, DataStoreApi } from 'api';
const storeApi: DataStoreApi = api.api.getDataStoreApi();
export interface Guide {
  guideId: string;
  onStep: number;
  sort: number;
  noneUserRelated: boolean;
  steps: Array<
    | {
        step: number;
        show: boolean;
      }
    | undefined
  >;
}
export interface Remind {
  isShow: boolean;
  type: string;
  [k: string]: any;
}
export interface IHollowOutGuideReducer {
  /** 引导注册队列 */
  guideQueue: Guide[];
  /** 头像红点 */
  avatarRemind: Remind;
}
const changeRemindByLocal = (originData: Remind, key: string): boolean => {
  if (originData.type === 'click') {
    Object.keys(originData).forEach(_ => {
      if (['isShow', 'type'].indexOf(_) === -1) {
        changeRemindByLocal(originData[_], `${key}.${_}`);
      }
    });
    const { data, suc } = storeApi.getSync(key);
    if (suc && data === 'true') {
      originData.isShow = false;
      return false;
    } else {
      originData.isShow = true;
      return true;
    }
  } else if (originData.type === 'auto') {
    let isShow = Object.keys(originData).some(_ => {
      if (['isShow', 'type'].indexOf(_) === -1) {
        return changeRemindByLocal(originData[_], `${key}.${_}`);
      } else {
        return false;
      }
    });
    originData.isShow = isShow;
    return isShow;
  }
  return false;
};
const getInitialState = (): IHollowOutGuideReducer => {
  const initState = {
    guideQueue: [],
    avatarRemind: {
      type: 'auto',
      isShow: true,
      mailSettingRemind: {
        type: 'click',
        isShow: true,
      },
    },
  };
  const remind = ['avatarRemind'];
  remind.forEach((_: string) => {
    const onRemind = initState[_ as keyof IHollowOutGuideReducer];
    changeRemindByLocal(onRemind as Remind, _);
  });
  return initState;
};
const hollowOutGuideSlice = createSlice({
  name: 'hollowOutGuideReducer',
  // initialState: InitialState,
  initialState: getInitialState(),
  reducers: {
    doAddGuide: (state, action: PayloadAction<any>) => {
      const { step, guideId, type, noneUserRelated } = action.payload;
      let sort = 0;
      if (type === '1') {
        // 1：蒙层引导
        sort = 100;
      } else if (type === '2') {
        // 2：气泡图文
        sort = 10;
      } else if (type === '3') {
        // 3：气泡单行引导
        sort = 1;
      }
      const mailDiscussGuideHasShowedStore = storeApi.getSync(guideId, { noneUserRelated: !!noneUserRelated });
      const { data, suc } = mailDiscussGuideHasShowedStore;
      if (suc && data === 'true') {
        return;
      }
      for (let i = 0; i < state.guideQueue.length; i++) {
        let onGuide = state.guideQueue[i];
        if (onGuide.guideId === guideId) {
          if (!onGuide.steps[step - 1]) {
            onGuide.steps[step - 1] = {
              step,
              show: onGuide.onStep === step ? true : false,
            };
          } else {
            console.log('guide', '当前步骤已存在');
          }
          return;
        }
      }
      let guide: Guide = {
        guideId,
        onStep: 1,
        sort,
        noneUserRelated: !!noneUserRelated,
        steps: [],
      };
      guide.steps[step - 1] = {
        step,
        show: step == 1 ? true : false,
      };
      if (sort === 0 || state.guideQueue.length === 0 || sort <= state.guideQueue[state.guideQueue.length - 1].sort) {
        state.guideQueue.push(guide);
        return;
      }
      for (let i = 0; i < state.guideQueue.length; i++) {
        let onGuide = state.guideQueue[i];
        if ((sort = onGuide.sort)) {
          state.guideQueue.splice(i + 1, 0, guide);
          return;
        } else if (sort > onGuide.sort) {
          state.guideQueue.splice(i, 0, guide);
          return;
        }
      }
    },
    doDeleteGuide: (state, action: PayloadAction<any>) => {
      const { step, guideId } = action.payload;
      for (let i = 0; i < state.guideQueue.length; i++) {
        let onGuide = state.guideQueue[i];
        if (onGuide.guideId === guideId) {
          onGuide.steps[step - 1] = undefined;
          if (onGuide.steps.every(step => step === undefined)) {
            state.guideQueue.splice(i, 1);
          }
          return;
        }
      }
    },
    doNextStep: (state, action: PayloadAction<any>) => {
      const { step, guideId } = action.payload;
      if (!state.guideQueue[0] || state.guideQueue[0].guideId !== guideId) {
        // 防止 doNextStep 误触发
        return;
      }
      let onStep = state.guideQueue[0].steps[step - 1];
      let nextStep = state.guideQueue[0].steps[step];
      if (onStep) {
        onStep.show = false;
        state.guideQueue[0].onStep = step + 1;
      }
      if (step >= state.guideQueue[0].steps.length) {
        storeApi.put(guideId, 'true', { noneUserRelated: state.guideQueue[0].noneUserRelated });
        state.guideQueue.shift();
      } else if (nextStep) {
        nextStep.show = true;
      }
    },
    doSkip: (state, action: PayloadAction<any>) => {
      const { guideId } = action.payload;
      if (!state.guideQueue[0] || state.guideQueue[0].guideId !== guideId) {
        return;
      }
      storeApi.put(guideId, 'true', { noneUserRelated: state.guideQueue[0].noneUserRelated });
      state.guideQueue.shift();
    },
    changeRemind: (state, action: PayloadAction<any>) => {
      const key = action.payload.split('.')[0] as keyof IHollowOutGuideReducer;
      storeApi.put(action.payload, 'true');
      let newState = getInitialState();
      (state[key] as Remind) = newState[key] as Remind;
    },
  },
});
export const { actions } = hollowOutGuideSlice;
export default hollowOutGuideSlice.reducer;
