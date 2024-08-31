import { DependencyList, useState, useEffect } from 'react';

interface PromiseState<T> {
  status: 'idle' | 'pending' | 'fulfilled' | 'rejected';
  value: T | null;
  error: Error | null;
}

const useAsyncEffect = <T>({ excute, deps, condition = [!0] }: { excute: () => Promise<T>; condition?: Array<boolean>; deps: DependencyList }) => {
  const [state, setState] = useState<PromiseState<T>>({
    status: 'idle',
    value: null,
    error: null,
  });

  useEffect(() => {
    if (condition.every(e => e)) {
      setState({ status: 'pending', value: null, error: null });
      excute()
        .then(value => setState({ status: 'fulfilled', value, error: null }))
        .catch((error: Error) => setState({ status: 'rejected', value: null, error }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  // chose the shape you prefer for the return type,
  // here are some examples:
  // return [state.value, state.status === 'pending', state.error]
  return {
    ...state,
    loading: state.status === 'pending',
  };
};

export default useAsyncEffect;
