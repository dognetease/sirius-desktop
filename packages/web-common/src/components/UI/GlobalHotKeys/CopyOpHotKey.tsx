import React from 'react';
import { GlobalHotKeysProps, GlobalHotKeys } from 'react-hotkeys';

export const CopyOpKey = 'copy';

const copyOpKeyMap = {
  [CopyOpKey]: ['command+c', 'ctrl+c'],
};

const CopyOpHotKey: React.FC<
  GlobalHotKeysProps & {
    copyHandler: (e?: KeyboardEvent) => void;
  }
> = ({ handlers, allowChanges, children, keyMap, copyHandler }) => (
  <GlobalHotKeys
    keyMap={{
      ...copyOpKeyMap,
      ...keyMap,
    }}
    handlers={{
      ...handlers,
      [CopyOpKey]: copyHandler,
    }}
    allowChanges={allowChanges}
  >
    {children}
  </GlobalHotKeys>
);

export default CopyOpHotKey;
