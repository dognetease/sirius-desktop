import React, { useImperativeHandle, useState } from 'react';
import styles from './item.module.scss';
import { UIContactModel } from '../../data';
import { contactHeaderheight, itemHeight } from './item';

// import { fixScssProperty } from '../../../../../utils/util';

// const styles = fixScssProperty(style)

// export const contactHeaderheight = 70

export const fixedContactHeaderHeight = 60;

export interface StickyHeaderProps {
  list: UIContactModel[];
  // listRef: React.RefObject<VirtualList>;
  // scrollTop: number;
  showTag?: boolean;
}

const StickyHeader = React.forwardRef<{ update(i: number): void }, StickyHeaderProps>(({ list, showTag }, ref) => {
  const [scrollTop, setScrollTop] = useState<number>(0);
  useImperativeHandle(
    ref,
    () => ({
      update: (scrollTop: number) => {
        setScrollTop(scrollTop);
      },
    }),
    []
  );
  if (!showTag) {
    return null;
  }
  const headersItem: { index: number; item: UIContactModel }[] = [];
  list.forEach((e, i) => {
    if (e.contact.labelPoint) {
      headersItem.push({
        index: i,
        item: e,
      });
    }
  });

  return (
    <>
      {headersItem.map(({ item, index }, i) => {
        const offsetTop = index * itemHeight + i * contactHeaderheight;
        if (offsetTop > scrollTop) {
          return null;
        }
        return (
          <div key={item.contact.contactLabel} className={styles.itemFixedHeader} style={{ zIndex: index + 1, height: fixedContactHeaderHeight }}>
            {/^[a-zA-Z]+$/.test(item.contact.contactLabel) ? item.contact.contactLabel : '#'}
          </div>
        );
      })}
    </>
  );
});

export default StickyHeader;
