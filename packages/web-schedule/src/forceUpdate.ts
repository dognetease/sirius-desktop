import { useState, useCallback } from 'react';

const useForceUpdate = () => {
  const [, dispatch] = useState<{}>(Object.create(null));

  // Turn dispatch(required_parameter) into dispatch().
  const memoizedDispatch = useCallback((): void => {
    dispatch(Object.create(null));
  }, [dispatch]);
  return memoizedDispatch;
};

export default useForceUpdate;
