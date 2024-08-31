import React, { useReducer, Dispatch } from 'react';
import { FFMSApi, apiHolder, apis, FFMSRate } from 'api';
import { useMount } from 'ahooks';
const ffmsApi = apiHolder.api.requireLogicalApi(apis.ffmsApi) as FFMSApi;

interface GlobalContextType {
  state: {
    hasFollow: boolean;
    discountType: string;
    departurePortOptions: FFMSRate.Option[];
  };
  dispatch: Dispatch<{ type: string; payload: any }>;
}

const initState = {
  hasFollow: false,
  discountType: '',
  departurePortOptions: [],
};

const reducer = (state: any, action: { type: string; payload: any }) => {
  switch (action.type) {
    case 'followStatus':
    case 'changeDiscountType':
    case 'updateDeparturePort':
      return { ...state, ...action.payload };
    default:
      return state;
  }
};

export const GlobalContext = React.createContext<GlobalContextType>({ state: initState } as unknown as GlobalContextType);

function GlobalProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initState);
  let value = { state, dispatch };

  // const getFollowInfo = () => {
  //   ffmsApi.getFfBookingStatus().then(res => {
  //     dispatch({
  //       type: 'followStatus',
  //       payload: {
  //         hasFollow: res?.redDot === true,
  //       },
  //     });
  //   });
  // };

  const getFfmsDiscountType = () => {
    ffmsApi.getFfmsDiscountType().then(res => {
      dispatch({
        type: 'changeDiscountType',
        payload: {
          discountType: res?.discountType,
        },
      });
    });
  };

  const getDeparturePort = () => {
    ffmsApi.ffPermissionsDeparturePort().then(res => {
      let options = (res || []).map(item => {
        return {
          label: `${item.enName} ${item.cnName} ${item.countryCnName}`,
          value: item.code,
        };
      });
      dispatch({
        type: 'updateDeparturePort',
        payload: {
          departurePortOptions: options,
        },
      });
    });
  };

  // useInterval(() => {
  //   getFollowInfo();
  // }, 1000 * 60 * 5);

  useMount(() => {
    // getFollowInfo();
    getFfmsDiscountType();
    getDeparturePort();
  });
  return <GlobalContext.Provider value={value}>{children}</GlobalContext.Provider>;
}

export default GlobalProvider;
