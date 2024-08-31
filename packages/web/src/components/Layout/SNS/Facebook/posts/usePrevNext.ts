import { useState, useEffect } from 'react';

export default (tableList: string[]) => {
  let [prevDisabled, setPrevDisabled] = useState<boolean>(true);
  let [nextDisabled, setNextDisabled] = useState<boolean>(true);
  const [currentId, setCurrentId] = useState<string>('');

  const getPrevCompanyId = () => {
    const index = tableList.findIndex(id => id === currentId);
    setCurrentId(tableList[index - 1]);
  };

  const getNextCompanyId = () => {
    const index = tableList.findIndex(id => id === currentId);
    setCurrentId(tableList[index + 1]);
  };

  const isLast = (currentId: string) => {
    const index = tableList.findIndex(id => id === currentId);
    if (index === tableList.length - 1 || index < 0) {
      setNextDisabled(true);
    } else {
      setNextDisabled(false);
    }
  };
  const isFirst = (currentId: string) => {
    const index = tableList.findIndex(id => id === currentId);
    if (index === 0 || index < 0) {
      setPrevDisabled(true);
    } else {
      setPrevDisabled(false);
    }
  };
  useEffect(() => {
    if (currentId) {
      isFirst(currentId);
      isLast(currentId);
    }
  }, [currentId]);
  return {
    currentId,
    setCurrentId,
    prevDisabled,
    nextDisabled,
    getPrevCompanyId,
    getNextCompanyId,
  };
};
