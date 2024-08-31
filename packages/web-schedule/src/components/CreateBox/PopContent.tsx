import { Button, Radio } from 'antd';
import { ScheduleModel } from 'api';
import React, { FC, useState } from 'react';
import { EnumRange, InviteType } from '../../data';
import styles from './createbox.module.scss';
import { getIn18Text } from 'api';
export interface RangeContentProps {
  onConfirm?(e: EnumRange): void;
  onChange?(e: EnumRange): void;
  onCancel?(): void;
  item?: ScheduleModel;
  updateAllText?: string;
  updateThisText?: string;
  updateThisAndFutureText?: string;
  cancelText?: string;
  okText?: string;
  defaultRange?: EnumRange;
  hideAll?: boolean;
  hideThis?: boolean;
  hideThisAndFuture?: boolean;
  hideButton?: boolean;
}
export const RangeContent: FC<RangeContentProps> = ({
  onConfirm,
  onCancel,
  item,
  onChange,
  updateThisText = getIn18Text('JINGENGXINBENCI'),
  updateAllText = getIn18Text('GENGXINQUANBURI'),
  updateThisAndFutureText = getIn18Text('GENGXINBENCIJI'),
  okText = getIn18Text('QUEDING'),
  cancelText = getIn18Text('QUXIAO'),
  defaultRange = EnumRange.THIS,
  hideAll = false,
  hideThis = false,
  hideThisAndFuture = false,
  hideButton = false,
}) => {
  const [value, setValue] = useState<number>(hideThis ? EnumRange.ALL : defaultRange);
  // 用户有操作“所有日程”的权限的情况：
  // 1、默认情况，例如受邀日程操作接受、拒绝取消，此时不关心具体日程信息，item不传
  // 2、编辑日程的情况，只有组织者才有操作全部日程、当前以及当前之后所有日程的权利
  // const enableAllOrThisAndFuture = item === undefined || item.scheduleInfo.inviteeType === InviteType.ORGANIZER;
  const handleChange = (e: any) => {
    const { value } = e.target;
    setValue(value);
    if (onChange) {
      onChange(value);
    }
  };
  return (
    <>
      <div className={styles.confirmCheckBox}>
        {/* 自建的循环日程允许修改全部，受邀的只允许修改本条 */}
        <Radio.Group onChange={handleChange} value={value}>
          {!hideThis && (
            <Radio style={{ display: 'block' }} value={EnumRange.THIS}>
              {updateThisText}
            </Radio>
          )}
          {!hideThisAndFuture && (
            <Radio style={{ display: 'block' }} value={EnumRange.THIS_AND_FUTURE}>
              {updateThisAndFutureText}
            </Radio>
          )}
          {!hideAll && (
            <Radio style={{ display: 'block' }} value={EnumRange.ALL}>
              {updateAllText}
            </Radio>
          )}
        </Radio.Group>
      </div>
      {!hideButton && (
        <div className={styles.confirmButtons}>
          <Button onClick={() => onCancel && onCancel()}>{cancelText}</Button>
          <Button type="primary" onClick={() => onConfirm && onConfirm(value)}>
            {okText}
          </Button>
        </div>
      )}
    </>
  );
};
