import React from 'react';
import { Provider } from 'react-redux';
import store from '../web-common/src/state/createStore';

export default ({ element }) => {
  // const store = createStore()
  return <Provider store={store}> {typeof window !== 'undefined' ? element : null} </Provider>;
};
