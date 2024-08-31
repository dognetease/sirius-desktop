// 保存路由隐式传值的state
let state: Record<string, unknown> = {};

export const setHistoryState = (data: Record<string, unknown>) => {
  state = {
    ...state,
    ...data,
  };
};

export const getHistoryState = (): Record<string, unknown> => state;
