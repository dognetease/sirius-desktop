import React, { useState, useMemo } from 'react';
import classnames, { Argument as ClassnamesType } from 'classnames';
import { Popover } from 'antd';
import { OpportunityStageItem } from 'api';
import ClickOutside from './clickOutside';
import style from './stages.module.scss';
import EllipsisTooltip from '@/components/Layout/Customer/components/ellipsisTooltip/ellipsisTooltip';
import { getIn18Text } from 'api';
interface StagesProps {
  className?: ClassnamesType;
  disabled?: boolean;
  checkedStage: number;
  list: OpportunityStageItem[];
  closeRecord?: React.ReactElement;
  onStageChange: (stage: number, type: number) => void;
}
export const DEAL_TYPE = 1;
export const CLOSE_TYPE = 2;
export const REOPEN_TYPE = 3;
const Stages: React.FC<StagesProps> = props => {
  const { className, disabled, checkedStage, list, closeRecord, onStageChange } = props;
  const [presetStage, setPresetStage] = useState<number | null>(null);
  const checkedStageItem = useMemo(() => list.find(item => item.stage === checkedStage) as OpportunityStageItem, [list, checkedStage]);
  const closeStageItem = useMemo(() => list.find(item => item.type === CLOSE_TYPE) as OpportunityStageItem, [list, checkedStage]);
  const reopenStageItem = useMemo(() => list.find(item => item.type === REOPEN_TYPE) as OpportunityStageItem, [list, checkedStage]);
  const stageClosed = checkedStageItem?.type === CLOSE_TYPE;
  const stageDealed = checkedStageItem?.type === DEAL_TYPE;
  const handleStageClick = stage => {
    if (stage !== checkedStage) {
      if (stage !== presetStage) {
        setPresetStage(stage);
      } else {
        const { type } = list.find(item => item.stage === stage) as OpportunityStageItem;
        onStageChange(stage, type);
        setPresetStage(null);
      }
    }
  };
  const handleStageClickOutside = stage => {
    if (stage === presetStage) {
      setPresetStage(null);
    }
  };
  const listFiltered = list.filter(item => ![CLOSE_TYPE, REOPEN_TYPE].includes(item.type));
  return (
    <div className={classnames(style.stages, className)}>
      <div className={style.stagesScrollContent}>
        {listFiltered.map((item, index) => (
          <ClickOutside
            className={classnames(style.stageItem, {
              [style.checked]: item.stage === checkedStage,
              [style.preset]: item.stage === presetStage,
              [style.disabled]: disabled || stageClosed,
            })}
            key={item.stage}
            onClick={() => !disabled && !stageClosed && handleStageClick(item.stage)}
            onClickOutside={() => !disabled && !stageClosed && handleStageClickOutside(item.stage)}
          >
            {item.stage !== presetStage ? (
              <>
                {index < list.indexOf(checkedStageItem) && !stageClosed && <span className={style.achieved} />}
                <span style={{ maxWidth: 80, display: 'inline-block' }}>
                  <EllipsisTooltip>{item.name}</EllipsisTooltip>
                </span>
              </>
            ) : (
              getIn18Text('BIANGENGWEICIJIEDUAN')
            )}
          </ClickOutside>
        ))}
      </div>
      {!stageClosed ? (
        <div
          className={classnames(style.switch, {
            [style.disabled]: disabled || stageDealed,
          })}
          onClick={() => !disabled && !stageDealed && onStageChange(closeStageItem.stage, CLOSE_TYPE)}
        >
          <span className={style.closed} />
          <span>{getIn18Text('GUANBI')}</span>
        </div>
      ) : (
        <div
          className={classnames(style.switch, {
            [style.disabled]: disabled,
          })}
          onClick={() => !disabled && onStageChange(reopenStageItem.stage, REOPEN_TYPE)}
        >
          <span className={style.reopenText}>{getIn18Text('ZHONGXINDAKAI')}</span>
          <span onClick={event => event.stopPropagation()}>
            <Popover title={getIn18Text('GUANBIJILU')} content={closeRecord} placement="bottomRight" overlayClassName={style.recordTable}>
              <span className={style.reopen} />
            </Popover>
          </span>
        </div>
      )}
    </div>
  );
};
export default Stages;
