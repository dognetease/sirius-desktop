import React, { useState } from 'react';

interface ContextApi {
  currentIdClient: string;
  setCurrentIdClient: React.Dispatch<string>;
}
export const Context = React.createContext<ContextApi>({} as ContextApi);
export const Provider: React.FC<any> = props => {
  const [currentIdClient, setCurrentIdClient] = useState('');
  return (
    <Context.Provider
      value={{
        currentIdClient,
        setCurrentIdClient,
      }}
    >
      {props.children}
    </Context.Provider>
  );
};
