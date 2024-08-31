import { useState, useEffect } from 'react';

export default (tableList, fieldName: string, fieldNameTwo?: string) => {
  let [prevDisabled, setPrevDisabled] = useState<boolean>(false);
  let [nextDisabled, setNextDisabled] = useState<boolean>(false);
  const [currentId, setCurrentId] = useState<string>('');
  const [clueId, setClueId] = useState<string>('');
  const getPrevCompanyId = () => {
    const index = tableList.findIndex(item => item[fieldName] == currentId);
    const tempId = tableList[index - 1][fieldName];
    if (fieldNameTwo) {
      const tempClueId = tableList[index - 1][fieldNameTwo];
      setClueId(tempClueId);
    }
    setCurrentId(tempId);
  };

  /**
   * 详情数据操作下一条
   */
  const getNextCompanyId = () => {
    const index = tableList.findIndex(item => item[fieldName] == currentId);
    const tempId = tableList[index + 1][fieldName];
    if (fieldNameTwo) {
      const tempClueId = tableList[index - 1][fieldNameTwo];
      setClueId(tempClueId);
    }
    setCurrentId(tempId);
  };

  const isLast = id => {
    const index = tableList.findIndex(item => item[fieldName] == id);
    if (index === tableList.length - 1) {
      setNextDisabled(true);
    } else {
      setNextDisabled(false);
    }
  };
  const isFirst = id => {
    const index = tableList.findIndex(item => item[fieldName] == id);
    if (index === 0) {
      setPrevDisabled(true);
    } else {
      setPrevDisabled(false);
    }
  };
  /**
   *  id 变更需要检查
   * */
  useEffect(() => {
    if (currentId) {
      isFirst(currentId);
      isLast(currentId);
    }
  }, [currentId]);
  return {
    currentId,
    setCurrentId,
    clueId,
    setClueId,
    prevDisabled,
    nextDisabled,
    getPrevCompanyId,
    getNextCompanyId,
  };
};
