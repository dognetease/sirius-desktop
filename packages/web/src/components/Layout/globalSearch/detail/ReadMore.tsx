import React, { useEffect, useRef, useState } from 'react';
import classnames from 'classnames';
import { getIn18Text } from 'api';
interface ReadMoreTogglerProps {
  lines: number;
}
export const ReadMoreToggler: React.FC<ReadMoreTogglerProps> = ({ children, lines }) => {
  const [readMore, setReadMore] = useState(false);
  const [isParagraphExceed, setIsParagraphExceed] = useState(false);
  const paragraphRef = useRef<HTMLParagraphElement>(null);
  const [paragraphCollapseHeight, setParagraphCollapseHeight] = useState<number>();
  const [paragraphScrollHeight, setParagraphScrollHeight] = useState<number>();
  const isOverflow = isParagraphExceed && !readMore;
  const toggleHandler = () => {
    setReadMore(!readMore);
  };
  const calculateHeight = () => {
    if (!paragraphRef.current) {
      return;
    }
    // dynamically set the current div line-height
    const elementStyle = window.getComputedStyle(paragraphRef.current);
    const calculatedLineHeight = elementStyle.getPropertyValue('line-height');
    // remove px from line-height value
    const lineHeight = parseInt(calculatedLineHeight, 10);
    // isoverflow calculations
    // const definedMobileBreakLines = mobileBreakLines ?? 5
    // const definedDesktopBreakLines = desktopBreakLines ?? 3
    // const calculatedAcceptableLines = (isMobileBreakpoint ? definedMobileBreakLines : definedDesktopBreakLines)
    const calculatedParagraphHeight = lines * lineHeight;
    setParagraphCollapseHeight(calculatedParagraphHeight);
    const scrollHeight = paragraphRef.current?.scrollHeight;
    setParagraphScrollHeight(scrollHeight);
    const isParagraphHeightGreater = calculatedParagraphHeight < scrollHeight;
    setIsParagraphExceed(isParagraphHeightGreater);
  };
  useEffect(() => {
    calculateHeight();
    // eslint-disable-next-line
  }, [children, paragraphRef.current]);
  return (
    <div>
      <p
        className={classnames('sirius-readmore', isOverflow && 'sirius-readmore-overflow', readMore && 'sirius-readmore-active')}
        style={{ height: readMore ? `${paragraphScrollHeight}px` : `${paragraphCollapseHeight}px` }}
        ref={paragraphRef}
      >
        {children}
      </p>
      {isParagraphExceed && (
        <span onClick={toggleHandler} className="sirius-readmore__button">
          {/* <Caret collapse={isOverflow} /> */}
          {readMore ? getIn18Text('SHOUQI') : getIn18Text('ZHANKAI')}
        </span>
      )}
    </div>
  );
};
