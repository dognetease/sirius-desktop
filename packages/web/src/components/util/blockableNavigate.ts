import { navigate } from '@reach/router';

type Listener = () => Promise<boolean>;
const listeners: Array<Listener> = [];

export const navigateTo = (to: string) => {
  const promises = listeners.map(fn => fn());
  return Promise.all(promises).then(
    ret => {
      const isBlocked = ret.some(i => !i);
      if (!isBlocked) {
        return navigate(to);
      }
      return;
    },
    () => navigate(to)
  );
};

export const listenToNaviate = (fn: Listener) => {
  listeners.push(fn);
  return () => {
    const idx = listeners.indexOf(fn);
    idx > -1 && listeners.splice(idx, 1);
  };
};
