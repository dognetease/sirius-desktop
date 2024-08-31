import React, { useCallback, useEffect, useMemo, useState } from 'react';
import debounce from 'lodash/debounce';
import './index.scss';

type TriggerMethod = 'hover' | 'click';

interface Props {
  itemHeight: number;
  trigger?: TriggerMethod;
  selected: number;
  onSelect: (index: number) => void;
}

const SlideList: React.FC<Props> = ({ children, itemHeight, onSelect, trigger, selected }) => {
  const [top, setTop] = useState(0);

  if (!Array.isArray(children)) {
    return <></>;
  }

  const debounceOnSelect = useCallback(
    debounce((index: number) => {
      onSelect(index);
    }, 300),
    []
  );

  const onTrigger = (index: number, method: TriggerMethod) => {
    if (!trigger || trigger === method) {
      setTop(itemHeight * index);
      debounceOnSelect(index);
    }
  };

  const bgBlockStyle = useMemo(
    () => ({
      top,
      height: itemHeight,
    }),
    [top, itemHeight]
  );

  useEffect(() => {
    setTop(itemHeight * selected);
  }, [selected]);

  return (
    <div className="slide-list-container">
      {children.map((child, index) => (
        <div className="slide-list-item" key={index} onClick={() => onTrigger(index, 'click')} onMouseEnter={() => onTrigger(index, 'hover')}>
          {child}
        </div>
      ))}
      <div className="slide-list-bg-block" style={bgBlockStyle} />
    </div>
  );
};

export default SlideList;
