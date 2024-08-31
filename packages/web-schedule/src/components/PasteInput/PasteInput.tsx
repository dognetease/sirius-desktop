import { InputProps } from 'antd';
import React from 'react';

export const PASTE_FLAG = '_PASTE_FLAG_';

interface HOCInputProp extends InputProps {
  ref?: any;
}

const pasteInputHoc: (Component: any) => React.FC<HOCInputProp> = Component =>
  React.forwardRef((props, ref) => (
    <Component
      {...props}
      ref={ref}
      onPaste={e => {
        e.target[PASTE_FLAG] = PASTE_FLAG;
      }}
      onChange={e => {
        if (props.onChange) {
          props.onChange(e);
        }
        if (PASTE_FLAG in e.target) {
          delete e.target[PASTE_FLAG];
        }
      }}
    />
  ));

export default pasteInputHoc;
