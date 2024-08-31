import React, { useRef } from 'react';
import TitleRightContextMenu from '@web-common/components/UI/ContextMenu/TextContextMenu';

const TitleWithContextMenu: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, ...props }) => {
  const ref = useRef<HTMLDivElement>(null);
  return (
    <TitleRightContextMenu targetNode={ref.current}>
      {/* eslint-disable-next-line react/jsx-props-no-spreading */}
      <div ref={ref} {...props}>
        {children}
      </div>
    </TitleRightContextMenu>
  );
};
export default TitleWithContextMenu;
