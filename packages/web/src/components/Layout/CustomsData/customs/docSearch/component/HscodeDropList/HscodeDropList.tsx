import { api, apis, EdmCustomsApi, HScodeItem } from 'api';
import classnames from 'classnames';
import React, { useMemo, useState } from 'react';
import { useDebounce } from 'react-use';
import OutsideClickHandler from 'react-outside-click-handler';
import { PopperProps, usePopper } from 'react-popper';

const CustomsApi = api.requireLogicalApi(apis.edmCustomsApiImpl) as EdmCustomsApi;
import style from './hscodedroplist.module.scss';
import { Options } from '@popperjs/core';

interface HscodeDropListProps {
  onSelect?(hscode: string): void;
  visible?: boolean;
  onChangeVisible?(visible: boolean): void;
  target?: HTMLElement | null;
  blurTarget?: HTMLElement | null;
  searchValue?: string;
  sameWith?: boolean;
  className?: React.CSSProperties;
  placement?: Options['placement'];
  isFouse?: boolean;
}

const HscodeDropList: React.FC<HscodeDropListProps> = ({
  visible,
  onSelect,
  onChangeVisible,
  target,
  blurTarget,
  searchValue,
  className,
  sameWith = true,
  placement = 'bottom',
  isFouse,
}) => {
  const [hscode, setHscode] = useState<Omit<HScodeItem, 'child'>[]>([]);
  const modifiers = useMemo<PopperProps<any>['modifiers']>(() => {
    const sameWidthModifiers: PopperProps<any>['modifiers'] = [
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
    ];
    const offsetModifier: PopperProps<any>['modifiers'] = [
      {
        name: 'offset',
        options: {
          offset: [0, 12],
        },
      },
    ];
    if (sameWith) {
      return [...sameWidthModifiers, ...offsetModifier];
    } else {
      return offsetModifier;
    }
  }, [sameWith]);

  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(null);
  const { styles: poperStyles, attributes } = usePopper(target, popperElement, {
    placement,
    modifiers,
  });
  useDebounce(
    async () => {
      if (searchValue) {
        const result = await CustomsApi.doSearchHscode(searchValue);
        setHscode(result);
        if (isFouse) {
          onChangeVisible?.(result.length > 0);
        }
      }
    },
    300,
    [searchValue]
  );
  if (!visible) {
    return null;
  }
  return (
    <OutsideClickHandler
      onOutsideClick={e => {
        const sourceTarget = blurTarget || target;
        if (sourceTarget?.contains(e.target as HTMLElement)) {
          return;
        }
        onChangeVisible?.(false);
      }}
    >
      <div
        className={classnames(style.popper, className)}
        ref={setPopperElement}
        style={{
          ...poperStyles.popper,
        }}
        {...attributes.popper}
      >
        <p className={style.popperTitle}>相关HS编码</p>
        {hscode.map(e => (
          <div
            onClick={() => {
              onSelect?.(e.hsCode);
              onChangeVisible?.(false);
            }}
            className={style.hscode}
            key={e.hsCode}
          >
            <span className={style.code}>{e.hsCode}</span>
            <span className={style.desc}>{e.desc}</span>
          </div>
        ))}
      </div>
    </OutsideClickHandler>
  );
};

export default HscodeDropList;
