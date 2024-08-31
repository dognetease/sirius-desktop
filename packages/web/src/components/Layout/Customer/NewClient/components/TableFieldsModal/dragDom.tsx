import React, { useRef } from 'react';
import { useDrag, useDrop } from 'react-dnd';

interface comsProps {
  itemData?: any;
  id?: string;
  index: number;
  onDragChange: (originIndex: string, tagrgeIndex: string) => void;
}

const type = 'DraggableBodyRow';
const DragDomWrap: React.FC<comsProps> = ({ index, itemData, onDragChange, children }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [, drop] = useDrop({
    accept: 'DraggableBodyRow',
    hover(item: { id: string }) {
      if (!ref.current) {
        return;
      }
      const dragIndex = item.id;
      const hoverIndex = itemData.value;
      // Don't replace items with themselves
      console.log('children-hover', dragIndex, hoverIndex);
      if (dragIndex === hoverIndex) {
        return;
      }
      onDragChange(dragIndex, hoverIndex);
      // item.id = hoverIndex; // 解决抖动问题
    },
  });
  const [{ isDragging }, drag] = useDrag({
    type: 'DraggableBodyRow',
    item: () => {
      return { id: itemData.value };
      //   return { dragIndex: index }
    },
    collect: (monitor: any) => ({
      isDragging: monitor.isDragging(),
    }),
    end() {
      console.log('children-hover-end');
    },
  });
  // const [, drop] = useDrop({
  //     accept: 'SidebarTabItem',
  //     hover(item: { id: string}) {
  //       if (!ref.current) {
  //         return;
  //       }
  //       const dragIndex = itemData.vlaue;
  //       const hoverIndex = item.id;
  //       if (dragIndex === hoverIndex) {
  //         return
  //       }
  //       console.log('children-end', dragIndex, hoverIndex);
  //        // Don't replace items with themselves
  //        onDragChange(dragIndex, hoverIndex);
  //     },
  //   });

  //   const [{ isDragging }, drag] = useDrag({
  //     type: 'SidebarTabItem',
  //     item: () => {
  //       return { id: itemData.vlaue }
  //     },
  //     collect: (monitor: any) => ({
  //       isDragging: monitor.isDragging(),
  //     }),
  //     end() {
  //         console.log('children-end');
  //     }
  //   });

  // const [, drop] = useDrop({
  //     accept: type,
  //     hover(item: { id: string}) {
  //         if (!ref.current) {
  //           return;
  //         }
  //         console.log('hover', item)
  //          // Don't replace items with themselves
  //     },
  // collect: monitor => {
  //     const { index: dragIndex } = monitor.getItem() || {};
  //     if (dragIndex === index) {
  //       return {};
  //     }
  //     return {
  //       isOver: monitor.isOver(),
  //       dropClassName: dragIndex < index ? ' drop-over-downward' : ' drop-over-upward',
  //     };
  //   },
  // drop: (item: any) => {
  //     const originIndex = item.index;
  //     console.log('item-drag-drap-item', originIndex, 'target-index', index);
  //     if (originIndex !== index) {
  //         onDragChange(originIndex, index);
  //     }
  // }
  // })

  drop(drag(ref));
  return (
    <div ref={ref} style={{ opacity: isDragging ? 0.5 : 1 }}>
      {children}
    </div>
  );
};

export default DragDomWrap;
