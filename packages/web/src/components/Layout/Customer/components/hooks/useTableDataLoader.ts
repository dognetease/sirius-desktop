import { useState, useEffect, useRef } from 'react';
export default (api, path, searchParam) => {
  const [tableList, setTableList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSHowSkeleton, setIsSHowSkeleton] = useState(true);
  const [current, setCurrent] = useState(1);
  const [hasClue, setHasClue] = useState(false);
  const [total, setTotal] = useState<number>(0);
  const lastCalledTime = useRef(Date.now());
  useEffect(() => {
    setLoading(true);
    setCurrent(searchParam.page);
    requestTableData();
    console.log('请求参数....', searchParam);
  }, [searchParam]);
  const requestTableData = () => {
    const calledTime = Date.now();
    lastCalledTime.current = calledTime;
    api[path](searchParam).then(data => {
      if (calledTime === lastCalledTime.current) {
        console.log('data', data);
        setIsSHowSkeleton(false);
        const { content, total_size, original_size } = data;
        if (original_size > 0) {
          setHasClue(true);
          setTotal(total_size);
          setTableList(content);
        } else {
          setHasClue(false);
        }
        setLoading(false);
        console.log('请求数据-table-api', data);
      }
    });
  };
  return {
    tableList,
    loading,
    total,
    hasClue,
    isSHowSkeleton,
    requestTableData,
    current,
  };
};
