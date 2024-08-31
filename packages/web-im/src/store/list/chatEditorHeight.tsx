import React, { useEffect, useState } from 'react';
import { apiHolder } from 'api';

const storeApi = apiHolder.api.getDataStoreApi();

interface ChatEditorHeightProps {
  state: number;
  setHeight(h: number): void;
}
const Context = React.createContext({} as ChatEditorHeightProps);
const Provider: React.FC<any> = props => {
  const [height, _setHeight] = useState(94);
  useEffect(() => {
    storeApi.get('im.richEditorHeight').then(h => {
      const { data } = h;
      Number.isSafeInteger(parseInt(data)) && _setHeight(Number(data));
    });
  }, []);
  const setHeight = h => {
    _setHeight(h);
    storeApi.put('im.richEditorHeight', h);
  };
  return (
    <Context.Provider
      value={{
        state: height,
        setHeight,
      }}
    >
      {props.children}
    </Context.Provider>
  );
};

export default { Context, Provider };
