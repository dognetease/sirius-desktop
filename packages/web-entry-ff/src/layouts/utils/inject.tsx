import React from 'react';
import { ReactElement } from 'react';

export function AddExtraProps(ele: ReactElement, extraProps: any) {
  return <ele.type {...extraProps} {...ele.props} />;
}

const addExtraProps = (ele: ReactElement, extraProps: any) =>
  React.cloneElement(ele, {
    ...extraProps,
    ...ele.props,
  });
