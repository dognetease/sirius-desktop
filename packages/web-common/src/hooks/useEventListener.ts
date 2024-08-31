import { useRef, useEffect } from 'react';

const useEventListener = (eventName: string, handler: Function, element: Node | Window | null) => {
  const handlerRef = useRef<Function>();

  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    const isSupported = element && element.addEventListener;
    if (!element || !isSupported) {
      return;
    }
    const eventListener = event => handlerRef.current && handlerRef.current(event);
    element.addEventListener(eventName, eventListener);
    return () => {
      element.removeEventListener(eventName, eventListener);
    };
  }, [eventName, element]);
};

export default useEventListener;
