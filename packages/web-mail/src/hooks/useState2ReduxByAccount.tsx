/*
 * 功能：根据redux中的当前选中的账号，返回对应账号下的状态
 * stateName 必须在 mailReducer 中的 mainAccountState 中才可使用
 */

import { MailActions, useActions, useAppSelector } from '@web-common/state/createStore';

const useState2ReduxByAccount = (stateName: string, reducerName = '') => {
  let accountId = useAppSelector(state => state.mailReducer.selectedKeys.accountId);
  // 如果账号是主账号id或者id为null
  let resState = useAppSelector(state => (accountId ? state.mailReducer.childAccountStateMap[accountId][stateName] : state.mailReducer.mainAccountState[stateName]));
  let reducer = useActions(MailActions)?.setStateByAccount;

  const setter = val => {
    reducer({
      stateName,
      payload: val,
    });
  };
  return [resState, setter];
};
export default useState2ReduxByAccount;
