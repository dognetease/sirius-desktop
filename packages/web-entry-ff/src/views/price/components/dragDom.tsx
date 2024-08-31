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
    // drop(item: { id: string }, monitor) {
    //   console.log('item-drop', item);
    // },
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
  drop(drag(ref));
  return (
    <div ref={ref} style={{ opacity: isDragging ? 0.5 : 1 }}>
      {children}
    </div>
  );
};

export default DragDomWrap;
