import React, { useRef, ReactElement, useEffect } from 'react';
import { AutoScroll } from './scroll.js';
import './scroll.scss';

const CustomScrollTable: React.FC<any> = ({ children }) => {
  const child = React.Children.only(children) as ReactElement;
  const tableRef = useRef<HTMLInputElement>(null);
  console.log('xxxref', tableRef.current);
  useEffect(() => {
    if (tableRef.current) {
      const scrollTableBox = tableRef.current.querySelector('.customs-scroll .ant-table-content');
      console.log('xxxxscrollTableBox', scrollTableBox);

      new AutoScroll(scrollTableBox);
    }
  }, [tableRef.current]);
  return <div ref={tableRef}>{React.cloneElement(child)}</div>;
};
export default CustomScrollTable;
