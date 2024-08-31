import { useRef } from 'react';
import { Moment, isMoment } from 'moment';
import isEqualWith from 'lodash/isEqualWith';
import { useAppSelector } from '@web-common/state/createStore';

interface UseConferenceSelectorType {
  startDate: Moment;
  endDate: Moment;
  startTime: Moment;
  endTime: Moment;
  allDay: boolean;
}

type ValueType = Moment | boolean;

const customizer = (tV: ValueType, sV: ValueType) => {
  if (isMoment(tV) && isMoment(sV)) {
    return tV.isSame(sV);
  }
  return undefined;
};
/**
 * 需要基于moment的实际数值去缓存，以免其他操作引起moments的引用变化，
 * 而实际上表示的时间没有变，导致重复请求、渲染
 *
 * useRecieiverStateSelector同理
 */
function useConferenceSelector() {
  const ref = useRef<UseConferenceSelectorType>();
  const conference = useAppSelector(state => state.mailReducer.currentMail.conference);
  if (conference) {
    const {
      moments: { startDate, endDate, startTime = startDate, endTime = endDate },
      time: { allDay },
    } = conference;
    const result = {
      startDate,
      endDate,
      startTime,
      endTime,
      allDay,
    };
    if (!ref.current || !isEqualWith(ref.current, result, customizer)) {
      ref.current = result;
    }
  }
  return ref.current;
}

export default useConferenceSelector;
