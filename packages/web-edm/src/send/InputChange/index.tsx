// 这个组件主要是用来拦截 input change
import React, { Children, PropsWithChildren, FC, ReactElement, cloneElement } from 'react';

export const InputChange: FC<
  PropsWithChildren<{
    inputChange: () => void;
    children: ReactElement;
    onChange?: React.ChangeEventHandler<HTMLInputElement>;
  }>
> = props => {
  const { onChange, children, inputChange } = props;

  return (
    <>
      {React.cloneElement(children, {
        ...props,
        onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
          inputChange();
          onChange && onChange(e);
        },
      })}
    </>
    // <>{
    //   Children.map(children, (child, index) =>
    //     cloneElement(child, {
    //       ...props,
    //       onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
    //         inputChange();
    //         onChange && onChange(e);
    //       },
    //     })
    //   )
    // }</>
  );
};
