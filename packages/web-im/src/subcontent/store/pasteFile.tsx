import React, { createContext, useContext, useState } from 'react';

interface PasteFileContextApi {
  onFileChange(files: File[] | null): void;
  files: File[] | Blob[];
}
export const PasteFileContext = createContext({} as PasteFileContextApi);

export const PasteFileProvider: React.FC<any> = props => {
  const [files, setFiles] = useState<File[]>([]);
  const onFileChange = files => {
    setFiles([...files]);
  };

  return (
    <PasteFileContext.Provider
      value={{
        onFileChange,
        files,
      }}
    >
      {props.children}
    </PasteFileContext.Provider>
  );
};
