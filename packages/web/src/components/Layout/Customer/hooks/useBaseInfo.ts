import { useAppDispatch } from '@web-common/state/createStore';
import { apiHolder, apis, BaseInfoRes as BaseSelectType, CustomerApi, DataStoreApi } from 'api';
import { useEffect, useReducer } from 'react';
import { customerContext, customerAllState, reducer } from '../customerContext';
import { actions } from '@web-common/state/reducer/customerReducer';

const clientApi = apiHolder.api.requireLogicalApi(apis.customerApiImpl) as CustomerApi;
const dataStoreApi = apiHolder.api.getDataStoreApi() as DataStoreApi;
const CUSTOMS_DATA_BASE_INFO = 'CUSTOMS_DATA_BASE_INFO';

type AppDispatchType = ReturnType<typeof useAppDispatch>;
type ActionsType = typeof actions;

interface Params {
  appDispatch: AppDispatchType;
  setBaseSelect: ActionsType['setBaseSelect'];
  state: any;
  dispatch: React.Dispatch<any>;
}

const getGlobalArea = (baseSelect: BaseSelectType, params: Params) => {
  const { dispatch, appDispatch, setBaseSelect } = params;
  if (baseSelect && baseSelect.area) {
    return;
  }
  clientApi.getGlobalArea().then(res => {
    console.log('baseSelect-area', res.area);
    dispatch({
      type: 'setBaseSelect',
      payload: {
        baseSelect: {
          ...baseSelect,
          area: res.area,
        },
      },
    });
    appDispatch(
      setBaseSelect({
        ...baseSelect,
        area: res.area,
      })
    );
    dataStoreApi.put(
      CUSTOMS_DATA_BASE_INFO,
      JSON.stringify({
        ...baseSelect,
        area: res.area,
      }),
      {
        noneUserRelated: false,
      }
    );
  });
};

const commonDispatch = (baseSelect: BaseSelectType, params: Params) => {
  const { state, dispatch, appDispatch, setBaseSelect } = params;
  let area = [] as BaseSelectType['area'];
  if (state.baseSelect && state.baseSelect.area) {
    area = state.baseSelect.area;
  }
  dispatch({
    type: 'setBaseSelect',
    payload: {
      baseSelect: {
        ...baseSelect,
        area,
      },
    },
  });
  appDispatch(setBaseSelect(baseSelect));
  if (!area || !area.length) {
    getGlobalArea(baseSelect, params);
  }
};

/**
 * @description 客户模块获取公共数据相关逻辑
 * @returns
 */
export function useBaseInfo() {
  const [state, dispatch] = useReducer(reducer, customerAllState);
  const appDispatch = useAppDispatch();
  const { setBaseSelect } = actions;

  let baseSelect = {} as BaseSelectType;
  useEffect(() => {
    clientApi
      .getBaseInfo()
      .then(res => {
        let businessStages = res.business_stage.map(item => {
          return {
            value: Number(item.stage),
            label: item.name,
            type: item.type,
          };
        });
        baseSelect = {
          ...res,
          businessStages,
        };
        dataStoreApi.put(CUSTOMS_DATA_BASE_INFO, JSON.stringify(res), {
          noneUserRelated: false,
        });
        commonDispatch(baseSelect, {
          state,
          dispatch,
          setBaseSelect,
          appDispatch,
        });
      })
      .catch(async () => {
        // 没有数据
        if (!baseSelect.gender) {
          const { data } = await dataStoreApi.get(CUSTOMS_DATA_BASE_INFO);
          if (data) {
            const oldData = JSON.parse(data);
            commonDispatch(oldData, {
              state,
              dispatch,
              setBaseSelect,
              appDispatch,
            });
          }
        }
      });
  }, []);
  return {
    state,
    dispatch,
  };
}
