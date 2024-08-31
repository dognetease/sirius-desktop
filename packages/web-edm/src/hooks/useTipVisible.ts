import { useState } from 'react';
import dayjs from 'dayjs';

export function useTipVisible(key: string) {
  const canShowToday = () => {
    const times = JSON.parse(localStorage.getItem(key) || '[]');
    if (times.length >= 2) {
      return false;
    }

    if (times.length === 1 && dayjs().isSame(times[0], 'day')) {
      return false;
    }

    return true;
  };

  const [visible, setVisible] = useState(canShowToday());

  const onClose = () => {
    const times = JSON.parse(localStorage.getItem(key) || '[]');

    if (visible && canShowToday()) {
      localStorage.setItem(key, JSON.stringify([...times, dayjs().format('YYYY-MM-DD')]));
    }

    setVisible(false);
  };

  return {
    visible,
    setVisible,
    onClose,
  };
}
