/**
 * 可拖拽虚拟卡片列表
 */
import React, { useCallback, forwardRef } from 'react';
import debounce from 'lodash/debounce';
import { DragCardListComProps, CardWrapProps } from '../../../../types';
import CardList from '../CardList/CardList';
import { systemIsWindow } from '@web-mail/util';

const defaultEventHandler = () => {};

function DragCardList<T>(props: DragCardListComProps<T>, ref: React.Ref<any>) {
  const { draggable = true, onDragStart = defaultEventHandler, onDragEnd = defaultEventHandler } = props;

  const debouceDragEnd = useCallback(
    debounce((event, item, index) => {
      onDragEnd && onDragEnd(event, item, index);
    }, 300),
    [onDragEnd]
  );

  const DragCardWrap = useCallback(
    (dragProps: CardWrapProps<T>) => {
      const { data, index, children } = dragProps;
      let cardDragable = typeof draggable === 'function' ? draggable(data, index) : draggable;
      // 过滤不需要透传的属性
      const filterProps = {
        ...dragProps,
        data: undefined,
        index: undefined,
      };
      return (
        <div
          {...filterProps}
          draggable={cardDragable}
          onDragStart={e => {
            e.persist();
            onDragStart(e, data, index);
            // 防止极端情况下，只有开始的情况
            debouceDragEnd(e, data, index);
          }}
          onDrag={e => {
            debouceDragEnd(e, data, index);
          }}
          onDragEnd={e => {
            e.persist();
            debouceDragEnd(e, data, index);
          }}
        >
          {children}
        </div>
      );
    },
    [draggable, onDragStart, debouceDragEnd]
  );

  return (
    <CardList
      ref={ref}
      // eslint-disable-next-line react/jsx-props-no-spreading
      className="u-vlist"
      {...props}
      cardWrap={DragCardWrap}
    />
  );
}

export default forwardRef(DragCardList);
