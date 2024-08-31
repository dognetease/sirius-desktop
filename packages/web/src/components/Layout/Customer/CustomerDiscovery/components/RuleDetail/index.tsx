import React from 'react';
import { Popover } from 'antd';
import { CustomerManualTask } from 'api';
import { TaskRuleExpMap } from '../../context';
import { DateFormat } from '../../../components/dateFormat';
import style from './style.module.scss';
import { getIn18Text } from 'api';
export interface Props {
  rule: string;
}
export const RuleDetail: React.FC<Props> = props => {
  const { rule, children } = props;
  const renderRuleDetail = () => {
    try {
      // 目前ruleContent是JSON格式
      const ruleObj: CustomerManualTask = JSON.parse(rule);
      return (
        <div className={style.ruleDetail}>
          <div className={style.title}>{getIn18Text('RENWUGUIZE')}</div>
          <div className={style.label}>{getIn18Text('YOUJIANSHUJUFANWEI\uFF1A')}</div>
          <div className={style.value}>{ruleObj.dataRange === 'personal' ? getIn18Text('GERENYOUJIAN') : getIn18Text('QIYEYOUJIAN')}</div>
          <div className={style.label}>{getIn18Text('SHAIXUANTIAOJIAN')}</div>
          {(ruleObj.conditionList || []).map((condition, index) => (
            <div className={style.value}>
              <span className={style.index}>{index + 1}.</span>
              {condition.fieldName}
              {TaskRuleExpMap[condition.op as string]}
              <span className={style.highlight}>{condition.value}</span>
            </div>
          ))}
          <div className={style.label}>{getIn18Text('SHAIXUANSHIJIANFANWEI\uFF1A')}</div>
          <div className={style.value}>
            <DateFormat value={ruleObj.startDate} format="YYYY-MM-DD" />
            <span className={style.dateSpl}>{getIn18Text('ZHI')}</span>
            <DateFormat value={ruleObj.endDate} format="YYYY-MM-DD" />
          </div>
        </div>
      );
    } catch (e) {
      return null;
    }
  };
  return (
    <div className={style.wrapper}>
      {children ? (
        <Popover content={renderRuleDetail()} trigger="hover" placement="rightTop">
          {children}
        </Popover>
      ) : (
        renderRuleDetail()
      )}
    </div>
  );
};
