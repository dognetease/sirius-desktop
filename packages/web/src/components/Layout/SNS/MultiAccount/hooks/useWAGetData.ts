import { useEffect, useState } from 'react';
import { useLocation } from '@reach/router';
import { useSessionStorageState } from 'ahooks';
import qs from 'querystring';

interface TaskProps {
  keyWord: string;
  taskId: string;
  groupId: string;
  time: string;
}

export default () => {
  const location = useLocation();
  const [sessionKey, setSessionKey] = useState<string>('');
  const [sessionWhatsAppNumbers, setWhatsAppNumbers] = useState<string[]>([]);
  const [taskParmas, setTaskParams] = useState<TaskProps>({});
  useEffect(() => {
    const moduleName = location.hash.substring(1).split('?')[0];
    if (moduleName !== 'edm' && moduleName !== 'intelliMarketing') {
      return;
    }
    const params = qs.parse(location.hash.split('?')[1]);
    if (params.key) {
      setSessionKey(params.key as string);
      const numbers = sessionStorage.getItem(params.key as string)!;
      setWhatsAppNumbers(JSON.parse(numbers) || []);
    }
    if (params.taskId || params.groupId) {
      setWhatsAppNumbers([]);
      sessionStorage.removeItem(sessionKey);
      setTaskParams({
        keyWord: params.keyWord,
        taskId: params.taskId,
        groupId: params.groupId,
        time: params.time,
      });
    }
  }, [location]);

  const initData = () => {
    setTaskParams({});
    setWhatsAppNumbers([]);
    sessionStorage.removeItem(sessionKey);
  };

  return { sessionWhatsAppNumbers, taskParmas, initParams: initData };
};
