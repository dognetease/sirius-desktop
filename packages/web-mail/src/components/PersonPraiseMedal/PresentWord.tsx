import React, { useState, useRef, useEffect } from 'react';
import moment from 'moment';
import { Tooltip } from 'antd';
import { PraiseLetter } from 'api';
import styles from './index.module.scss';
import { ReactComponent as IconArrowUp } from '@/images/icons/arrow-up-1.svg';
import { ReactComponent as IconArrowDown } from '@/images/icons/arrow-down-1.svg';
import { getIn18Text } from 'api';
interface Props {
  praiseLetter: PraiseLetter;
}
const PresentWord: React.FC<Props> = props => {
  const { praiseLetter } = props;
  const preRef = useRef<HTMLPreElement>(null);
  const operatorWrapRef = useRef<HTMLDivElement>(null);
  const operatorRef = useRef<HTMLDivElement>(null);
  const [tipVisible, setOverTipVisible] = useState(false);
  // 颁奖词是否超过最大行数
  const [overMaxLineClam, setOverMaxLineClam] = useState(false);
  // 颁奖词展开icon切换
  const [expandToggle, setExpandToggle] = useState(false);
  // 颁奖词最大行数
  const maxLineClamp = 12,
    today = moment(),
    yesterday = moment().subtract(1, 'days');
  useEffect(() => {
    if (preRef?.current) {
      if (preRef.current.offsetHeight > 22 * maxLineClamp) {
        setOverMaxLineClam(true);
        setExpandToggle(true);
      } else {
        setOverMaxLineClam(false);
        setExpandToggle(false);
      }
    }
    if (operatorWrapRef?.current && operatorRef?.current) {
      if (operatorRef?.current.scrollWidth > operatorWrapRef?.current.scrollWidth) {
        setOverTipVisible(true);
      } else {
        setOverTipVisible(false);
      }
    }
  }, []);
  const toggleIcon = () => {
    setExpandToggle(!expandToggle);
  };
  return (
    <div className={styles.praiseLetter}>
      <div className={styles.time}>
        {moment(praiseLetter.timestamp).isSame(today, 'day')
          ? getIn18Text('JINTIAN')
          : moment(praiseLetter.timestamp).isSame(yesterday, 'day')
          ? getIn18Text('ZUOTIAN')
          : moment(praiseLetter.timestamp).format('YYYY.MM.DD')}
      </div>
      <div className={styles.presentationWords}>
        <div>
          <span>{getIn18Text('BANJIANGCI\uFF1A')}</span>
          <pre
            ref={preRef}
            style={
              expandToggle
                ? {
                    display: '-webkit-box',
                    WebkitBoxOrient: 'vertical',
                    WebkitLineClamp: maxLineClamp,
                    overflow: 'hidden',
                  }
                : {}
            }
          >
            {praiseLetter.presentationWords}
          </pre>
        </div>
        {overMaxLineClam ? <div className={styles.svgWrap}>{expandToggle ? <IconArrowDown onClick={toggleIcon} /> : <IconArrowUp onClick={toggleIcon} />}</div> : null}
      </div>
      <div className={styles.presenter}>
        <span>{getIn18Text('BANJIANGREN\uFF1A')}</span>
        <span>{praiseLetter.presenter}</span>
      </div>
      <div className={styles.operator}>
        <span>{getIn18Text('CAOZUOREN\uFF1A')}</span>
        <Tooltip title={tipVisible ? `${praiseLetter.operator?.name}(${praiseLetter.operator?.email})` : null} getPopupContainer={node => node.parentElement!}>
          <div className={styles.operatorName} ref={operatorWrapRef}>
            <div ref={operatorRef}>
              {praiseLetter.operator?.name}({praiseLetter.operator?.email})
            </div>
          </div>
        </Tooltip>
      </div>
    </div>
  );
};
export default PresentWord;
