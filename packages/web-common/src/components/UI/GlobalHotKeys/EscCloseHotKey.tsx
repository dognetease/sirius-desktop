import { apiHolder } from 'api';
import React from 'react';
import { GlobalHotKeysProps, GlobalHotKeys } from 'react-hotkeys';

const electronClose = () => {
  apiHolder.api.getSystemApi().closeWindow();
};

export const EscKey = 'ESC';

const escCloseKeyMap = {
  [EscKey]: 'esc',
};

const escCloseHandlers = {
  [EscKey]: electronClose,
};

const EscCloseHotKey: React.FC<GlobalHotKeysProps> = ({ handlers, allowChanges, children, keyMap }) => (
  <GlobalHotKeys
    keyMap={{
      ...escCloseKeyMap,
      ...keyMap,
    }}
    handlers={{
      ...escCloseHandlers,
      ...handlers,
    }}
    allowChanges={allowChanges}
  >
    {children}
  </GlobalHotKeys>
);

export default EscCloseHotKey;
