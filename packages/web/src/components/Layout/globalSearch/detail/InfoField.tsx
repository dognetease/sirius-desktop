import React, { FC, ReactElement, ReactNode, useCallback, useMemo } from 'react';
import { Popover } from 'antd';
import EllipsisTooltip from '../../Customer/components/ellipsisTooltip/ellipsisTooltip';
import style from './companyDetail.module.scss';

export const InfoField: FC<{
  info: string;
  getHerf?: (s: string) => string;
  onClick?: () => void;
  popover?: ReactNode;
  suffix?: ReactNode;
}> = ({ info, getHerf, onClick, popover, suffix }) => {
  const BaseComp = useMemo(() => {
    if (info && getHerf?.(info)) {
      return (
        <a href={getHerf(info)} target="_blank" rel="noreferrer" onClick={onClick}>
          {info}
        </a>
      );
    }
    return info || '-';
  }, [onClick, info, getHerf]);
  const wrapperWithPopover = useCallback(
    (child: ReactNode) => {
      if (popover) {
        return (
          <Popover content={popover} trigger="hover">
            {child}
          </Popover>
        );
      }
      return (child || '') as ReactElement;
    },
    [popover]
  );
  return (
    <span className={style.fieldWrapper}>
      <EllipsisTooltip>{wrapperWithPopover(BaseComp)}</EllipsisTooltip>
      {suffix || ''}
    </span>
  );
};
