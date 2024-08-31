import React from 'react';
import style from './infoBox.module.scss';
import classnames from 'classnames';
import EllipsisTooltip from '@/components/Layout/Customer/components/ellipsisTooltip/ellipsisTooltip';
import Select from '@/components/Layout/Customer/components/UI/Select/customerSelect';
import { getIn18Text } from 'api';
interface Props {
  className?: string;
  label: string;
  content?: string | number;
  isClick?: boolean;
  onClick?: (companyName: string) => void;
  index: number;
  isNumber?: boolean;
  recordCRY?: string;
  onChangeUsdRY?: (key: string) => void;
  onChangeRecordCountRY?: (key: string) => void;
  isContact?: boolean;
}
const defaultOptions = [
  {
    value: 'last_one',
    lable: getIn18Text('JINYINIAN'),
  },
  {
    value: 'last_two',
    lable: getIn18Text('JINLIANGNIAN'),
  },
  {
    value: 'last_three',
    lable: getIn18Text('JINSANNIAN'),
  },
  {
    value: 'all',
    lable: getIn18Text('QUANBU'),
  },
];
const InfoBox = ({ className, index, label, content, isClick, isNumber, onClick, recordCRY, onChangeUsdRY, onChangeRecordCountRY, isContact }: Props) => {
  return (
    <div
      className={classnames(style.box, className, {
        [style.hover]: isClick && content,
      })}
    >
      <div className={style.header}>
        <div className={style.title}>{label}：</div>
        {/* {!isContact && index === 1 && (
          <Select value={usdRY} onChange={e => onChangeUsdRY && onChangeUsdRY(e as string)} size="small" style={{ width: 85, backgroundColor: 'yellow' }}>
            {defaultOptions.map((item, index) => {
              return (
                <Select.Option key={index} value={item.value}>
                  {item.lable}
                </Select.Option>
              );
            })}
          </Select>
        )}
        {!isContact && index === 2 && (
          <Select
            value={recordCRY}
            size="small"
            onChange={e => onChangeRecordCountRY && onChangeRecordCountRY(e as string)}
            style={{ width: 85, backgroundColor: 'yellow' }}
          >
            {defaultOptions.map((item, index) => {
              return (
                <Select.Option key={index} value={item.value}>
                  {item.lable}
                </Select.Option>
              );
            })}
          </Select>
        )} */}
      </div>
      <div
        className={classnames(style.nums, { [style.link]: isClick && content, [style.number]: isNumber })}
        onClick={() => {
          isClick && content && onClick && onClick(content as string);
        }}
      >
        {content ? <EllipsisTooltip>{content}</EllipsisTooltip> : '-'}
      </div>
    </div>
  );
};
InfoBox.defaultProps = {
  isClick: false,
};
export default InfoBox;
