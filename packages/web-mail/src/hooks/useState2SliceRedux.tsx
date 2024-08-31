/*
 * 功能：将redux中的值以useState的方式转接到组件中
 * 支持redux中的类型提示
 * 支持默认的redux写入，简单写法不用再传入reducerName了
 */
import { useCallback, createContext, useContext } from 'react';
import { shallowEqual } from 'react-redux';
import { MailActions, useActions, useAppSelector } from '@web-common/state/createStore';
import { CustomerMailState } from '@web-mail/state/slice/customerMailReducer/types';
import { customerReducers } from '@web-mail/state/slice/customerMailReducer/reducers';
import { SubordinateMailState } from '@web-mail/state/slice/subordinateMailReducer/types';
import { subordinateReducers } from '@web-mail/state/slice/subordinateMailReducer/reducers';
import useCreateCallbackForEvent from './useCreateCallbackForEvent';
import { tabId } from '@web-common/state/reducer/mailTabReducer';
import { useMyCustomerList } from '@web-common/hooks/useContactModel';
import { formatCustomerTreeData } from '@web-mail/utils/slice';
import { CustomerBoxModel, CustomerTreeData } from '@web-mail/types';

type CustomerKeys = keyof CustomerMailState;
type SubordinateKeys = keyof SubordinateMailState;
type CustomerReducerKeys = keyof typeof customerReducers;
type SubordinateReducerKeys = '' | keyof typeof subordinateReducers;

// 主context，默认值为主页前
export const ctSliceContext = createContext<string>(tabId.readCustomer);

export const SdSliceContext = createContext<string>(tabId.subordinate);

export const useState2CustomerSlice = <T extends CustomerKeys>(stateName: T, reducerName?: CustomerReducerKeys, sliceId?: string) => {
  const sliceId_context = useContext(ctSliceContext);
  const resSliceId = sliceId ? sliceId : sliceId_context;
  const state = useAppSelector(state => state.mailReducer.customer[resSliceId][stateName], shallowEqual);
  const reducer = (useActions(MailActions) as any)[reducerName || 'doUpdateSliceAny_cm'];

  const setter = useCallback(
    (val: CustomerMailState[T] | ((state: CustomerMailState[T]) => CustomerMailState[T])): void => {
      if (reducer) {
        if (typeof val === 'function') {
          reducer(reducerName ? { sliceId: resSliceId, data: val(state) } : { sliceId: resSliceId, name: stateName, data: val(state) });
        } else {
          reducer(reducerName ? { sliceId: resSliceId, data: val } : { sliceId: resSliceId, name: stateName, data: val });
        }
      } else {
        console.error('REDUCER IS NOT VALID', stateName, reducerName);
      }
    },
    [reducer, stateName, reducerName, resSliceId]
  );

  const setterRef = useCreateCallbackForEvent(setter);

  return [state, setterRef] as [CustomerMailState[T], typeof setter];
};

export const useState2SubordinateSlice = <T extends SubordinateKeys>(stateName: T, reducerName?: SubordinateReducerKeys, sliceId?: string) => {
  const sliceId_context = useContext(SdSliceContext);
  const resSliceId = sliceId ? sliceId : sliceId_context;
  const state = useAppSelector(state => state.mailReducer.subordinate[resSliceId][stateName], shallowEqual);
  const reducer = (useActions(MailActions) as any)[reducerName || 'doUpdateSliceAny_sd'];

  const setter = useCallback(
    (val: SubordinateMailState[T] | ((state: SubordinateMailState[T]) => SubordinateMailState[T])): void => {
      if (reducer) {
        if (typeof val === 'function') {
          reducer(reducerName ? { sliceId: resSliceId, data: val(state) } : { sliceId: resSliceId, name: stateName, data: val(state) });
        } else {
          reducer(reducerName ? { sliceId: resSliceId, data: val } : { sliceId: resSliceId, name: stateName, data: val });
        }
      } else {
        console.error('REDUCER IS NOT VALID', stateName, reducerName);
      }
    },
    [reducer, stateName, stateName, resSliceId]
  );
  const setterRef = useCreateCallbackForEvent(setter);

  return [state, setterRef] as [SubordinateMailState[T], typeof setter];
};

export const useCustomerSliceTreeList = (sliceId?: string): CustomerTreeData[] => {
  const sliceId_context = useContext(ctSliceContext);
  const resSliceId = sliceId ? sliceId : sliceId_context;
  const idList = useAppSelector(state => state.mailReducer.customer[resSliceId].customerTreeIdList, shallowEqual);
  const customerList = useMyCustomerList(idList);
  const data: CustomerBoxModel[] = customerList.map(v => {
    return {
      orgName: v.orgName,
      id: v.id,
      lastMailTime: v.lastMailTime,
      contacts: v.contactList,
      managerList: v.managerList,
    };
  });
  const newTreeList = formatCustomerTreeData(data);
  console.log('useCustomerSliceTreeList idList', idList);
  console.log('useCustomerSliceTreeList newTreeList', newTreeList);
  return newTreeList;
};
