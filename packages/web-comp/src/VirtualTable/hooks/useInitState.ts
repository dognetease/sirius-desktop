import { useReducer } from 'react';

export const OFFSET_RENDER_COUNTS = 4; // 除可视区域外，上下再额外渲染的数量

export const RenderMode = {
  virtual: 0,
  normal: 1,
};

export const initState = {
  rowHeight: 0, // 行高
  rowCounts: 0, // 行数
  scrollHeight: 0, // 滚动的高度
  renderCounts: OFFSET_RENDER_COUNTS, // 可视区域渲染的最大条数
  startIndex: 0, // 渲染的第一条数据的下标
  offsetTop: 0, // 表格的偏移量
  scrollY: 0, // 表格的scroll y
  renderMode: RenderMode.normal,
  enableChangeRowHeight: true,
};

const Actions = {
  setRowHeight: 'rowHeight',
  setRowCounts: 'rowCounts',
  setScrollHeight: 'scrollHeight',
  setRenderCounts: 'renderCounts',
  setStartIndex: 'startIndex',
  setOffsetTop: 'offsetTop',
  setScrollY: 'scrollY',
  setRenderMode: 'renderMode',
  setEnableChangeRowHeight: 'enableChangeRowHeight',
};

const reducer = (
  state: InitState,
  payload: {
    action: ActionsKeys;
    params: InitState[keyof InitState];
  }
): InitState => {
  switch (payload.action) {
    case 'setRowCounts':
      return {
        ...state,
        rowCounts: payload.params as number,
      };
    case 'setRowHeight':
      return {
        ...state,
        rowHeight: payload.params as number,
      };
    case 'setScrollHeight':
      return {
        ...state,
        scrollHeight: payload.params as number,
      };
    case 'setRenderCounts':
      return {
        ...state,
        renderCounts: payload.params as number,
      };
    case 'setStartIndex':
      return {
        ...state,
        startIndex: payload.params as number,
      };
    case 'setOffsetTop':
      return {
        ...state,
        offsetTop: payload.params as number,
      };
    case 'setScrollY':
      return {
        ...state,
        scrollY: payload.params as number,
      };
    case 'setRenderMode':
      return {
        ...state,
        renderMode: payload.params as number,
      };
    case 'setEnableChangeRowHeight':
      return {
        ...state,
        enableChangeRowHeight: payload.params as boolean,
      };
  }
};

export const useInitState = () => {
  const [state, dispatch] = useReducer(reducer, initState);

  return {
    state,
    dispatch,
  };
};

export type UseInitStateReturnType = ReturnType<typeof useInitState>;

export type InitState = typeof initState;

export type ActionsKeys = keyof typeof Actions;
