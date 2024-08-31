/*
 * 功能：根据redux中的当前选中的账号，返回对应账号下的TreeState
 * stateName 必须在 mailReducer 中的 mainAccountState 中才可使用
 * warn: 已废弃，错误的抽象，没有时机作用
 */

import { MailActions, useActions, useAppSelector } from '@web-common/state/createStore';
import { isMainAccount } from '../util';

const useTreeState2ReduxByAccount = (stateName: string) => {
  let accountId = useAppSelector(state => state.mailReducer.selectedKeys.accountId);
  // 如果账号是主账号id或者id为null
  let resState = useAppSelector(state => {
    // return  !!accountId || !isMainAccount(accountId)
    return false ? state.mailReducer.mailTreeStateMap[accountId][stateName] : state.mailReducer.mailTreeStateMap.main[stateName];
  });
  let reducer = useActions(MailActions)?.setStateByAccount;

  const setter = val => {
    reducer({
      stateName,
      payload: val,
    });
  };
  return [resState, setter];
};
export default useTreeState2ReduxByAccount;
