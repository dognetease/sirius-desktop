import React, { useState, useCallback } from 'react';
import style from './Fold.module.scss';
import { getIn18Text } from 'api';
interface Props {
  lineHeight?: number; // 每行高度
  foldNum?: number; // 收起时候最多展示行数
}
const Fold: React.FC<Props> = props => {
  const { lineHeight = 20, foldNum = 3 } = props;
  const [isFold, setIsFold] = useState<boolean>(true); // 是否为收起状态
  const [isExceed, setIsExceed] = useState<boolean>(false); // 文本是否超出最多行数
  const measuredRef = useCallback(
    node => {
      if (node !== null) {
        const height = node.getBoundingClientRect().height;
        setIsExceed(height - lineHeight * foldNum > 5); // 大于 5 而不是大于 0，是因为需要为判断留一定的buffer
      }
    },
    [props.children]
  );
  const foldClick = () => {
    setIsFold(!isFold);
  };
  return (
    <div style={{ height: isExceed && isFold ? lineHeight * foldNum + 'px' : '', overflowY: 'hidden' }} className={style.foldBox}>
      <div style={{ lineHeight: lineHeight + 'px' }} ref={measuredRef}>
        {props.children}
        <span className={style.foldOperate} onClick={foldClick} hidden={!isExceed}>
          {getIn18Text('SHOUQI')}
        </span>
      </div>
      <p style={{ lineHeight: lineHeight + 'px' }} className={style.unfoldOperate} onClick={foldClick} hidden={!isExceed || !isFold}>
        {getIn18Text('ZHANKAI')}
      </p>
    </div>
  );
};
export default Fold;
