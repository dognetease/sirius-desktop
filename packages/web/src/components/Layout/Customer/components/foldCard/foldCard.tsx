import React, { useState, useEffect, useRef } from 'react';
import classnames, { Argument as classnamesType } from 'classnames';
import style from './foldCard.module.scss';
import { getIn18Text } from 'api';
interface FoldCardProps {
  className?: classnamesType;
  headerClassName?: classnamesType;
  title?: React.ReactNode;
  folded?: boolean;
  foldHeight?: number;
  foldedText?: string;
  unfoldedText?: string;
  options?: React.ReactNode;
  children?: React.ReactNode;
  onFoldChange?: (folded: boolean) => void;
}
const FoldCard: React.FC<FoldCardProps> = props => {
  const { className, headerClassName, title, options, folded, foldHeight, foldedText, unfoldedText, children, onFoldChange } = props;
  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<string | number>('auto');
  useEffect(() => {
    if (contentRef.current && typeof folded !== 'undefined' && typeof foldHeight !== 'undefined') {
      const resizeObserver = new ResizeObserver(entries => {
        entries.forEach(entry => {
          const { height: offsetHeight } = entry.contentRect;
          if (offsetHeight > foldHeight) {
            setHeight(folded ? foldHeight : offsetHeight);
          } else {
            setHeight(offsetHeight);
          }
        });
      });
      resizeObserver.observe(contentRef.current);
      return () => resizeObserver.disconnect();
    }
    return () => {};
  }, [folded, foldHeight]);
  return (
    <div className={classnames([style.foldCard, className])}>
      <div className={classnames([style.header, headerClassName])}>
        <div className={style.title}>{title}</div>
        <div className={style.options}>
          {options}
          {typeof folded !== 'undefined' && typeof onFoldChange === 'function' && (
            <div className={style.foldTrigger} onClick={() => onFoldChange(!folded)}>
              {folded ? foldedText : unfoldedText}
            </div>
          )}
        </div>
      </div>
      <div className={style.body} style={{ height }}>
        <div ref={contentRef}>{children}</div>
      </div>
    </div>
  );
};
FoldCard.defaultProps = {
  foldedText: getIn18Text('ZHANKAIQUANBU'),
  unfoldedText: getIn18Text('SHOUQI'),
  onFoldChange: () => {},
};
export default FoldCard;
