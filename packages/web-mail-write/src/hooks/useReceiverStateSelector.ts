import { useRef } from 'react';
import isEqual from 'lodash/isEqual';
import { useAppSelector } from '@web-common/state/createStore';

export default () => {
  const ref = useRef<string[]>([]);
  const rece = useAppSelector(state => state.mailReducer.currentMail.receiver);
  if (rece) {
    const result = [...new Set(rece.map(e => e.contact.contact.accountName))];
    if (!isEqual(ref.current, result)) {
      ref.current = result;
    }
  }
  return ref.current;
};
