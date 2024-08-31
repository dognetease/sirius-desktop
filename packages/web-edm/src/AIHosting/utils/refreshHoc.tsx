import React, { FC, useState } from 'react';

export const refreshHoc = <T extends any>(Comp: FC<T>) => {
  let refresh: (refresh: boolean) => void;

  const Wrap: FC<T> = props => {
    const [show, setShow] = useState(true);
    refresh = setShow;

    return <>{show && <Comp {...props} />}</>;
  };

  return {
    comp: Wrap,
    refresh() {
      if (refresh) {
        refresh(false);
        setTimeout(() => {
          refresh(true);
        }, 100);
      }
    },
  };
};
