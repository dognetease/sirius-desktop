import React from 'react';
import ReactDOM from 'react-dom';
import { inWindow } from 'api';
import { useAppSelector } from '@web-common/state/createStore';

const TinymceTooltip: React.FC = () => {
  const { top, left, title } = useAppSelector(state => state.mailReducer.editorTooltip);
  const child = (
    <div className="toolbar-tooltip-wrap">
      <div
        className="toolbar-tooltip"
        style={{
          top,
          left,
        }}
      >
        {title}
      </div>
    </div>
  );
  if (!inWindow()) return <></>;
  return ReactDOM.createPortal(child, document.body);
};

export default TinymceTooltip;
