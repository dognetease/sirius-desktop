import { useState, useEffect, useRef } from 'react';

export default (selectedRowKeys, ...rest) => {
  // 依赖的数据
  let [y, setY] = useState<string>('');
  let tableRef = useRef<HTMLDivElement>(null);
  const handleResize = () => {
    let bottomHeight = 0;
    if (selectedRowKeys.length) {
      bottomHeight = 60;
    }
    let topHeight = tableRef.current?.getBoundingClientRect().top || 126;
    let otherHeight = topHeight + 102 + bottomHeight; // 44(头部) 56（分页） 2（边框线）
    console.log('otherHeight-table', topHeight, otherHeight);
    const y = `calc(100vh - ${otherHeight}px)`;
    return y;
  };
  // 延时计算
  useEffect(() => {
    setTimeout(() => {
      setY(handleResize);
    }, 300);
  }, [selectedRowKeys, ...rest]);

  return {
    tableRef,
    y,
  };
};
