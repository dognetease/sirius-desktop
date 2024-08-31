import React from 'react';
import { EdmVariableItem } from 'api';
import { Editor as TinyMCEEditor } from '@web-common/tinymce';
export interface SourceCodeModalProps {
  visible: boolean;
  setVisible: (visible: boolean) => void;
  sourceCode: string;
  setSourceCode: (sourceCode: string) => void;
  showVarSelect?: boolean;
  setContent: (val: string) => void;
}

export interface SourceCodeHocProps extends SourceCodeModalProps {
  component: React.ReactNode;
}

export interface OptionItem {
  value: string;
  selected: boolean;
}
