import React, { FC, useState } from 'react';
import { Checkbox, Button } from 'antd';
import { SecondSendStrategy } from 'api';

import { ReactComponent as PeopleIcon } from '@/images/icons/edm/yingxiao/people.svg';
import { getContentWithoutSign } from '../../send/utils/getMailContentText';
import styles from './DoubleTrack.module.scss';
import { getIn18Text } from 'api';

const EmailOpTypeLabel = {
  0: getIn18Text('DAKAI'),
  1: getIn18Text('HUIFU'),
  2: getIn18Text('WEIDAKAI'),
  3: getIn18Text('DAKAIWEIHUIFUv16'),
  4: getIn18Text('WEIHUIFU'),
  100: getIn18Text('WUTIAOJIAN'),
};

export const html2string = (content: string) => {
  const node = document.createElement('div');
  node.innerHTML = content;
  return node.innerText;
};

export const StrategyItem: FC<
  SecondSendStrategy & {
    op(
      /**
       * 0 删除；1 详情；2选中
       */
      type: 0 | 1 | 2,
      /**
       * 索引
       */
      index: number
    ): void;
    itemIndex: number;
  }
> = props => {
  const [checked, setChecked] = useState(false);
  const {
    isRecommend = false,
    isEdited = false,
    isAiWrite = false,
    conditionContent: { emailOpDays, emailOpType },
    isSelected = false,
  } = props.triggerCondition!;
  const { emailSubjects } = props.sendSettingInfo;
  const { emailContent } = props.contentEditInfo;
  const { op, itemIndex } = props;

  return (
    <div className={`${styles.strategyItem} ${isSelected ? styles.selectedItem : ''}`} onClick={() => op(2, itemIndex)}>
      <div className={styles.strategyItemTitle}>
        <div className={styles.itemLeft}>
          <PeopleIcon />
          <span
            style={{
              marginLeft: 6,
            }}
          >
            {emailOpDays}
            {getIn18Text('ri')}
            {EmailOpTypeLabel[emailOpType]}
          </span>
          {isRecommend && (isAiWrite || !isEdited) && <div className={styles.recommendBox}>{getIn18Text('TUIJIAN')}</div>}
        </div>
        <Checkbox className={styles.myCheckbox} checked={isSelected} />
      </div>
      {emailSubjects != null && emailSubjects[0] && emailSubjects[0].subject.length > 0 && (
        <div className={styles.strategyItemInfo}>
          {getIn18Text('ZHUTI：')}
          {emailSubjects[0].subject}
        </div>
      )}
      {emailContent != null && (
        <div className={styles.strategyItemInfo}>
          {getIn18Text('NEIRONG：')}
          {getContentWithoutSign(emailContent)}
        </div>
      )}
      <div className={styles.btnBox}>
        {!isRecommend && (
          <Button
            type="dashed"
            onClick={e => {
              e.stopPropagation();
              op(0, itemIndex);
            }}
          >
            {getIn18Text('SHANCHU')}
          </Button>
        )}
        <Button
          type="dashed"
          style={{
            marginLeft: 8,
          }}
          onClick={e => {
            e.stopPropagation();
            op(1, itemIndex);
          }}
        >
          {getIn18Text('CHAKANXIANGQING')}
        </Button>
      </div>
    </div>
  );
};
