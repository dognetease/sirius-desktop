import { IHotPortCollection, TCustomsPort } from 'api';
import classNames from 'classnames';
import React, { useMemo, useState } from 'react';
import OutsideClickHandler from 'react-outside-click-handler';
import { usePopper } from 'react-popper';
import usePortListHook, { useHotPortList } from '../../hooks/usePortListHook';
import style from './portdroplist.module.scss';

interface PortDropListProps {
  target?: HTMLElement | null;
  blurTarget?: Element | null;
  open?: boolean;
  changeOpen?(open: boolean): void;
  onSelectPort?(name: string, portType?: number): void;
  value?: string;
  type?: 'main' | 'form';
}

type PopperOptionType = Parameters<typeof usePopper>[2];

const formType: PopperOptionType = {
  placement: 'bottom-end',
  modifiers: [
    {
      name: 'offset',
      options: {
        offset: [0, 12],
      },
    },
  ],
};

const mainType: PopperOptionType = {
  placement: 'bottom',
  modifiers: [
    {
      name: 'sameWidth',
      enabled: true,
      fn: ({ state }) => {
        state.styles.popper.width = `${state.rects.reference.width}px`;
      },
      effect: ({ state }) => {
        state.elements.popper.style.width = `${state.elements.reference.getBoundingClientRect().width}px`;
      },
      phase: 'beforeWrite',
      requires: ['computeStyles'],
    },
    {
      name: 'offset',
      options: {
        offset: [0, 12],
      },
    },
  ],
};

export const PortItemList: React.FC<{
  onSelectPort?(item: TCustomsPort): void;
  portList: IHotPortCollection[];
  value?: string;
}> = ({ onSelectPort, portList, value }) => {
  return (
    <div className={style.portListContainer}>
      {portList.map((pc, index, curArr) => (
        <div key={pc.airline}>
          <p className={style.airline}>{pc.airline}</p>
          <div
            className={classNames(style.portList, {
              [style.portListLast]: index === curArr.length - 1,
            })}
          >
            {pc.ports.map(p => (
              <div
                className={classNames(style.portListItem, {
                  [style.portListItemSelected]: value === p.name,
                })}
                key={p.name}
                onClick={() => {
                  onSelectPort?.(p);
                }}
              >
                {p.nameCn ? `${p.nameCn}（${p.name}）` : p.name}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

const PortDropList: React.FC<PortDropListProps> = ({ target, blurTarget, open, changeOpen, onSelectPort, value, type = 'form' }) => {
  const portList = useHotPortList();
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(null);
  const { styles: poperStyles, attributes } = usePopper(target, popperElement, type === 'form' ? formType : mainType);

  if (!open) {
    return null;
  }
  return (
    <OutsideClickHandler
      onOutsideClick={e => {
        const bt = blurTarget || target;
        if (bt?.contains(e.target as HTMLElement)) {
          return;
        }
        changeOpen?.(false);
      }}
    >
      <div
        className={classNames(style.popper, {
          [style.popperMain]: type === 'main',
        })}
        ref={setPopperElement}
        style={{
          ...poperStyles.popper,
        }}
        {...attributes.popper}
      >
        {/* <p className={style.popperTitle}>热门港口</p> */}
        <PortItemList
          portList={portList}
          onSelectPort={p => {
            onSelectPort?.(p.name);
          }}
          value={value}
        />
      </div>
    </OutsideClickHandler>
  );
};

export default PortDropList;
