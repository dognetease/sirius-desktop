import React, { useEffect, useState, useRef } from 'react';
import { getIn18Text } from 'api';
export default (breadRef, bread, contentWidth) => {
  const [ellipsisIndex, setEllipsisIndex] = useState<number[]>([]);
  // 当可用宽度或内容发生改变的时候，触发
  useEffect(() => {
    setEllipsisIndex([]);
  }, [bread, contentWidth]);
  // 将面包屑挨个设为...直到不溢出
  useEffect(() => {
    // 包起来 以免无限循环
    try {
      const breadCur: any = breadRef.current;
      if (breadCur.scrollWidth > breadCur.clientWidth) {
        const l = ellipsisIndex.length;
        // 面包屑文字转换为省略号时，最多转换到倒数第二层
        if (l + 1 >= bread.length - 1) return;
        setEllipsisIndex([...ellipsisIndex, l + 1]);
      }
    } catch (error) {
      console.log(getIn18Text('SHEZHIMIANBAOXIE'), error);
    }
  }, [ellipsisIndex]);
  if (!contentWidth) return { ellipsisIndex: [] };
  return {
    ellipsisIndex,
  };
};
