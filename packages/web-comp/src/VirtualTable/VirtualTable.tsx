import { TableProps } from 'antd';
// import SiriusTable from '@web-common/components/UI/Table';
import SiriusTable from '../Table';
import React, { useRef, useEffect, useContext, useMemo, useState } from 'react';
import { VirtualTableContext } from './hooks/useStateContext';
import { OFFSET_RENDER_COUNTS, RenderMode, useInitState } from './hooks/useInitState';

const renderTable: React.FC<any> = props => {
  const { style, children, ...restProps } = props;
  const containerRef = useRef<HTMLDivElement>(null);
  const { dispatch, rowCounts, rowHeight, offsetTop, renderCounts, renderMode } = useContext(VirtualTableContext);
  const [tableScrollHeight, setTableScrollHeight] = useState(0);
  // 获取行数
  useEffect(() => {
    if (Array.isArray(props?.children[1]?.props?.data)) {
      dispatch &&
        dispatch({
          action: 'setRowCounts',
          params: props?.children[1]?.props?.data.length,
        });
    }
  }, [props?.children[1]?.props?.data]);

  const tableHeight = useMemo(() => {
    if (rowHeight) {
      return rowCounts * rowHeight;
    }
    return 0;
  }, [rowCounts, rowHeight]);

  useEffect(() => {
    if (containerRef.current && containerRef.current?.parentNode) {
      (containerRef.current.parentNode as HTMLDivElement).scrollTo(0, 0);
    }
  }, [rowCounts]);

  const handleParentScrollEvent = (ev: any) => {
    try {
      const scrollHeight = (ev.target as HTMLDivElement).scrollTop;
      if (typeof scrollHeight === 'number' && dispatch) {
        setTableScrollHeight(scrollHeight);
      }
    } catch (error) {}
  };
  useEffect(() => {
    if (containerRef.current?.parentNode) {
      const scrollParent = containerRef.current.parentNode;
      scrollParent.addEventListener('scroll', handleParentScrollEvent);
    }

    return () => {
      const scrollParent = containerRef.current?.parentNode || null;
      scrollParent && scrollParent.removeEventListener('scroll', handleParentScrollEvent);
    };
  }, [containerRef.current?.parentNode]);

  // 根据滚动条，调整要渲染的数据行
  useEffect(() => {
    if (rowHeight && dispatch) {
      let nextStartIndex = Math.floor(tableScrollHeight / rowHeight);
      let offsetTop = tableScrollHeight % rowHeight;

      dispatch({
        action: 'setStartIndex',
        params: nextStartIndex,
      });
      dispatch({
        action: 'setOffsetTop',
        params: offsetTop,
      });
    }
  }, [tableScrollHeight, rowHeight, rowCounts, renderCounts]);

  return renderMode === RenderMode.virtual ? (
    <div
      ref={containerRef}
      style={{
        height: tableHeight,
        paddingTop: tableScrollHeight,
        boxSizing: 'border-box',
      }}
      className="virtual-rd-table"
    >
      <table
        {...restProps}
        style={{
          ...style,
          transform: `translateY(-${tableScrollHeight === 0 ? 0 : offsetTop}px)`,
        }}
      >
        {children}
      </table>
    </div>
  ) : (
    <table
      {...restProps}
      style={{
        ...style,
      }}
    >
      {children}
    </table>
  );
};

const renderWrapper: React.FC<any> = props => {
  const { startIndex, renderCounts, renderMode } = useContext(VirtualTableContext);

  const renderChildrenRows = useMemo(() => {
    try {
      if (props.children && Array.isArray(props.children) && (props.children[1] ?? []).length > 0 && renderMode === RenderMode.virtual) {
        const [_, children, ...rest] = props.children;
        const renderRow = (children ?? []).slice(startIndex, Math.min(startIndex + renderCounts, children.length));
        return [_, renderRow, ...rest];
      }
      return props.children;
    } catch (error) {
      console.error(error);
    }
  }, [props.children, startIndex, renderCounts, renderMode]);
  return <tbody {...props}>{renderChildrenRows}</tbody>;
};

const renderRow: React.FC<any> = props => {
  const rowRef = useRef<HTMLElement>(null);
  const { rowHeight, dispatch, enableChangeRowHeight } = useContext(VirtualTableContext);

  useEffect(() => {
    if (rowRef.current?.offsetHeight && dispatch && enableChangeRowHeight) {
      rowRef.current.offsetHeight !== rowHeight &&
        dispatch({
          action: 'setRowHeight',
          params: rowRef.current.offsetHeight,
        });
    }
  }, [rowRef.current, enableChangeRowHeight]);

  return (
    <tr ref={rowRef} {...props}>
      {props.children}
    </tr>
  );
};

const renderCell: React.FC<any> = props => {
  return <td {...props}>{props.children}</td>;
};

export interface VirtualTableExtProps<T> extends TableProps<T> {
  autoSwitchRenderMode?: boolean;
  enableVirtualRenderCount?: number;
  rowHeight?: number;
}
const VirtualTable = <RecordType extends object>(props: VirtualTableExtProps<RecordType>) => {
  const { className = '', scroll, autoSwitchRenderMode = false, enableVirtualRenderCount = 0, rowHeight = -1 } = props;
  const { state, dispatch } = useInitState();

  useEffect(() => {
    if (state.scrollY && state.rowHeight) {
      dispatch({
        action: 'setRenderCounts',
        params: Math.ceil(state.scrollY / state.rowHeight) + OFFSET_RENDER_COUNTS,
      });
    }
  }, [state.scrollY, state.rowHeight]);

  useEffect(() => {
    if (scroll?.y && typeof scroll.y === 'number') {
      dispatch({
        action: 'setScrollY',
        params: scroll.y,
      });
    }
  }, [scroll]);

  useEffect(() => {
    if (rowHeight > -1) {
      dispatch({
        action: 'setRowHeight',
        params: rowHeight,
      });
      dispatch({
        action: 'setEnableChangeRowHeight',
        params: false,
      });
    }
  }, [rowHeight]);

  useEffect(() => {
    if (!autoSwitchRenderMode || state.rowCounts < enableVirtualRenderCount) {
      dispatch({
        action: 'setRenderMode',
        params: RenderMode.normal,
      });
      return;
    }

    if (state.rowCounts >= enableVirtualRenderCount) {
      dispatch({
        action: 'setRenderMode',
        params: RenderMode.virtual,
      });
      return;
    }
  }, [autoSwitchRenderMode, enableVirtualRenderCount, state.rowCounts]);
  return (
    <VirtualTableContext.Provider
      value={{
        ...state,
        dispatch,
      }}
    >
      <SiriusTable
        {...props}
        className={`virtual-table ${className}`}
        pagination={false}
        components={{
          table: renderTable,
          body: {
            wrapper: renderWrapper,
            row: renderRow,
            cell: renderCell,
          },
        }}
      />
    </VirtualTableContext.Provider>
  );
};

export default VirtualTable;
