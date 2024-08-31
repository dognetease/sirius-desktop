import React from 'react';
import { Provider } from 'react-redux';
import store from '../web-common/src/state/createStore';
import ErrorBoundary from '../web-common/src/hooks/ErrorBoundary';

export default ({ element }) => (
  <Provider store={store}>
    <ErrorBoundary name="root">{typeof window !== 'undefined' ? element : null}</ErrorBoundary>
  </Provider>
);
