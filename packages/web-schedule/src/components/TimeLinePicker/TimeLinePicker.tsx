import React, { useContext, useState, useEffect } from 'react';
import Measure from 'react-measure';
import classnames from 'classnames';
import { TimeLinePickerProps, TimeRange } from 'api';
import { usePopper } from 'react-popper';
import uniqueId from 'lodash/uniqueId';
import { calculateWidth, fixedDateTimeRange, getDurationText, getScacles, isRangeInteract } from './util';
import { GroupContext } from './context';
import styles from './timelinepicker.module.scss';
import SiriusMessage from '@web-common/components/UI/Message/SiriusMessage';
import { getIn18Text } from 'api';
const TimeLinePicker: React.FC<TimeLinePickerProps> = props => {
  const provider = useContext(GroupContext);
  const mergedProps: TimeLinePickerProps = {
    ...provider.props,
    ...props,
  };
  const {
    occupied: propsOccupied,
    forbidden: propsForbidden,
    onChange,
    date,
    value,
    defaultValue,
    renderOccupiedInner,
    renderEnableInner,
    renderForbiddenInner,
    startHour = 7,
    endHour = 23,
    pieceOfHour = 4,
    className,
    onOk,
    ...rest
  } = mergedProps;
  const [width, setWidth] = useState<number>(0);
  const [range, setRange] = useState<TimeRange | undefined>(defaultValue);
  const [referenceElement, setReferenceElement] = useState<any>(null);
  const [popperElement, setPopperElement] = useState<any>(null);
  const [id] = useState(uniqueId('siri_timeline_pick_'));
  const { styles: popStyles, attributes } = usePopper(referenceElement, popperElement, {
    placement: 'top',
    modifiers: [
      {
        name: 'offset',
        options: {
          offset: [0, 8],
        },
      },
    ],
  });
  // const scaleRef = useRef<HTMLDivElement>(null)
  const occupied = fixedDateTimeRange(propsOccupied);
  // const defaultForbiddenRange = getDefaultForbidden(pieceOfHour)
  const fixedPropsForbidden = fixedDateTimeRange(propsForbidden);
  const forbidden = fixedPropsForbidden; /* ? [defaultForbiddenRange, ...fixedPropsForbidden] : [defaultForbiddenRange] */
  /**
   * 点击单位时间段
   * @param eventValue 选中时间段
   * @param event 原始事件
   */
  const handleScaleUnitClick = (eventValue: TimeRange, event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    provider.onIdChange && provider.onIdChange(id);
    if (range !== undefined) {
      const [prevStart, prevEnd] = range;
      const [eventStart, eventEnd] = eventValue;
      const contiueous = prevEnd.diff(prevStart, 'hours', true) > 1 / pieceOfHour;
      if (contiueous) {
        // 已选中时间段是连续时间段
        // case 1: 事件值在已选中事件段内：选中时间段为已选中开始时刻-事件结束时刻
        // case 2: 事件值在已选中时间段外：直接设定事件时段为选中时段
        // 总结： 开始时刻：
        const isInside = eventStart.isBetween(prevStart, prevEnd, undefined, '[]') && eventEnd.isBetween(prevStart, prevEnd, undefined, '[]');
        if (isInside) {
          setRange([prevStart, eventEnd]);
        } else {
          setRange(eventValue);
        }
      } else {
        // 已选中时间段是单位时间段
        // case 1：事件选中的时间段和选中时间段一致
        // case 2: 不一致，预期形成连续时间段
        if (eventStart.isSame(prevStart) && eventEnd.isSame(prevEnd)) {
          setRange(undefined);
          return;
        }
        const nextRange: TimeRange = eventStart.isBefore(prevStart) ? [eventStart, prevEnd] : [prevStart, eventEnd];
        const interact = isRangeInteract(nextRange, occupied) || isRangeInteract(nextRange, forbidden);
        if (interact) {
          SiriusMessage.info({ content: getIn18Text('QINGXUANZELIANXU') });
          return;
        }
        setRange(nextRange);
      }
    } else {
      setRange(eventValue);
    }
    setReferenceElement(event.target);
  };
  /**
   * 当值改变时触发onChange
   */
  useEffect(() => {
    if (onChange && range) {
      onChange(range);
    }
  }, [range, onChange]);
  // useEffect(() => {
  //     if (provider.onIdChange) {
  //     }
  // }, [range, id, provider])
  useEffect(() => {
    if (provider.uniqueId !== id) {
      setRange(undefined);
    }
  }, [provider.uniqueId, id]);
  useEffect(() => {
    const fadeOut = e => {
      let node = e.target;
      while (node && node !== popperElement) {
        node = node.parentNode;
      }
      if (!node) {
        setRange(undefined);
      }
    };
    document.addEventListener('click', fadeOut);
    return () => {
      document.removeEventListener('click', fadeOut);
    };
  }, [popperElement, range]);
  /**
   * 获取基准标尺
   */
  const scales = getScacles({
    startHour,
    endHour,
    pieceOfHour,
    date,
  });
  return (
    <>
      <Measure
        bounds
        onResize={cr => {
          setWidth(cr.bounds?.width || 0);
        }}
      >
        {({ measureRef }) => (
          <div ref={measureRef} className={classnames(styles.scale, className)} {...rest}>
            {scales.map((s, index) => {
              const selectValue = value || range;
              return (
                <div
                  key={index}
                  style={{ width: width / scales.length }}
                  className={classnames(styles.scaleUnit, {
                    [styles.scaleUnitSelect]: selectValue !== undefined && s[0].isBetween(selectValue[0], selectValue[1], undefined, '[)'),
                    [styles.scaleUnitFirst]: index === 0,
                    [styles.scaleUnitLast]: index === scales.length - 1,
                  })}
                  onClick={e => handleScaleUnitClick(s, e)}
                >
                  {renderEnableInner !== undefined && renderEnableInner(s, index)}
                  {width > 0 && (
                    <>
                      {index % pieceOfHour === 0 && <span className={styles.scaleUnitTag}>{s[0].format('HH')}</span>}
                      {index === scales.length - 1 && (
                        <span className={classnames(styles.scaleUnitTag, styles.scaleUnitTagLast)}>{s[0].clone().add(1, 'hours').format('HH')}</span>
                      )}
                    </>
                  )}
                </div>
              );
            })}
            {occupied?.map((s, index) => {
              const { startOverflow, endOverflow, elementWidth, elementLeft } = calculateWidth(s, scales, width, startHour, pieceOfHour);
              return (
                <div
                  key={index}
                  className={classnames(styles.scaleOccupied, {
                    [styles.scaleOccupiedMale]: startOverflow || elementLeft === 0,
                    [styles.scaleOccupiedFemale]: endOverflow || elementLeft === width - elementWidth,
                  })}
                  style={{
                    width: elementWidth,
                    left: elementLeft,
                  }}
                >
                  {renderOccupiedInner !== undefined && renderOccupiedInner(s, index)}
                </div>
              );
            })}
            {forbidden?.map((s, index) => {
              const { startOverflow, endOverflow, elementWidth, elementLeft } = calculateWidth(s, scales, width, startHour, pieceOfHour);
              return (
                <div
                  key={index}
                  className={classnames(styles.scaleForbidden, {
                    [styles.scaleForbiddenMale]: startOverflow,
                    [styles.scaleForbiddenFemale]: endOverflow,
                  })}
                  style={{
                    width: elementWidth,
                    left: elementLeft,
                  }}
                >
                  {renderForbiddenInner !== undefined && renderForbiddenInner(s, index)}
                </div>
              );
            })}
          </div>
        )}
      </Measure>
      {range !== undefined && (
        <div ref={setPopperElement} style={popStyles.popper} className={styles.popper} {...attributes.popper}>
          <p className={styles.title}>{getIn18Text('NINXUANZEDESHI')}</p>
          <p className={styles.content}>{getDurationText(range)}</p>
          <div className={styles.footer}>
            <button
              className={styles.default}
              onClick={() => {
                setRange(undefined);
              }}
            >
              {getIn18Text('QUXIAO')}
            </button>
            <button
              className={styles.primary}
              onClick={() => {
                onOk && onOk(range);
              }}
            >
              {getIn18Text('QUEDING')}
            </button>
          </div>
        </div>
      )}
    </>
  );
};
export default TimeLinePicker;
