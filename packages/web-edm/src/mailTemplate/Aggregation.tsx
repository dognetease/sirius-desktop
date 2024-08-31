import React, { FC, useState, useEffect, useCallback } from 'react';
import classnames from 'classnames/bind';
import { TemplateConditionRes, apiHolder, apis, DataTrackerApi } from 'api';
import { Select } from 'antd';

import styles from './Aggregation.module.scss';
import { OverflowItem } from './TemplateList';
import { getIn18Text } from 'api';

const realStyle = classnames.bind(styles);
const { Option } = Select;
const trackApi: DataTrackerApi = apiHolder.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;

const TrackEnum: Record<string, string> = {
  updateTime: 'update',
  replyRate: 'reply_rate',
  openRate: 'open_rate',
  usedCount: 'usage',
};

export const TrackTypeEnum: Record<0 | 1, string> = {
  0: getIn18Text('WENBENMOBAN'),
  1: getIn18Text('TUWENMOBAN'),
};

const sort = 1; // 目前只有倒序
type AggregationFilter = TemplateConditionRes['tabList'][0];
export const Aggregation: FC<{
  tagList?: AggregationFilter['tagList'];
  orderList?: AggregationFilter['orderList'];
  typeList?: AggregationFilter['typeList'];
  activeKey?: string;
  setActiveTagId: (activeTagId: number) => void;
  setActiveOrder: (order: { index: string; sort: number }) => void;
  setActiveType: (activeType: number) => void;
  fromPage: number;
}> = props => {
  const { tagList = [], orderList = [], typeList = [], activeKey, setActiveOrder, setActiveTagId, setActiveType, fromPage } = props;

  return (
    <div
      className={realStyle({
        aggregationBox: true,
        aggregationBox1: fromPage === 2,
      })}
    >
      {/* 分组 */}
      {tagList.length > 0 && (
        <div
          style={{
            marginBottom: 16,
          }}
        >
          <AggregationSelect
            fromPage={fromPage}
            activeKey={activeKey}
            key={activeKey}
            defaultValue={tagList[0].tagId}
            title={getIn18Text('FENZU')}
            data={tagList.map(tag => ({
              label: tag.tagName,
              value: tag.tagId,
            }))}
            onchange={value => {
              setActiveTagId(value as number);
            }}
          />
        </div>
      )}
      {/* 排序 */}
      {orderList.length > 0 && (
        <AggregationSelect
          fromPage={fromPage}
          activeKey={activeKey}
          key={activeKey}
          defaultValue={orderList[0].orderId}
          title={getIn18Text('PAIXU')}
          data={orderList.map(order => ({
            label: order.orderName,
            value: order.orderId,
          }))}
          onchange={value => {
            setActiveOrder({
              index: value as string,
              sort,
            });
            if (TrackEnum[value as any] != null) {
              trackApi.track('pc_markting_edm_template__ subsequence_click', {
                subsequence_style: TrackEnum[value as any],
              });
            }
          }}
        />
      )}
      {/* 类型 */}
      {typeList.length > 0 && (
        <div
          style={{
            marginTop: 16,
          }}
        >
          <AggregationSelect
            fromPage={fromPage}
            activeKey={activeKey}
            key={activeKey}
            defaultValue={typeList[0].typeId}
            title={getIn18Text('LEIXING')}
            data={typeList.map(type => ({
              label: type.typeName,
              value: type.typeId,
            }))}
            onchange={value => {
              setActiveType(value as number);
              trackApi.track('pc_markting_edm_template_type_click', {
                template_type: TrackTypeEnum[value as 0 | 1],
              });
            }}
          />
        </div>
      )}
    </div>
  );
};

type AggregationSelectProps<T = unknown> = {
  title: string;
  data: Array<{
    label: string;
    value: T;
  }>;
  defaultValue: unknown;
  onchange?: (value: T) => void;
  activeKey?: string;
  fromPage: number;
};

type Item = {
  label: string;
  value: unknown;
}[];
const lineCount = 8;
const AggregationSelect: FC<AggregationSelectProps> = props => {
  const { title, data, defaultValue, onchange, activeKey, fromPage } = props;
  const [curValue, setCurValue] = useState<unknown>(defaultValue);
  const [line1, setLine1] = useState<Item>([]);
  const [line2, setLine2] = useState<Item>([]);
  const [line3, setLine3] = useState<Item>([]);

  useEffect(() => {
    setCurValue(defaultValue);
  }, [defaultValue]);

  useEffect(() => {
    const line1 = data.slice(0, lineCount);
    let line2 = data.slice(lineCount);
    let line3: Item = [];

    if (line2.length > lineCount) {
      line3 = line2.slice(lineCount - 1);
      line2 = line2.slice(0, lineCount - 1);
    }

    setLine1(line1);
    setLine2(line2);
    setLine3(line3);
  }, [data]);

  return (
    <div className={styles.aggregationLine}>
      <div className={styles.aggregationLabel}>{title}</div>
      <div className={styles.aggregationSelect}>
        <div className={styles.aggregationSelectLine}>
          {line1.map((item, index) => (
            <OverflowItem
              key={(item.value as string) + activeKey}
              onClick={() => {
                setCurValue(item.value);
                onchange && onchange(item.value);
              }}
              className={realStyle({
                selectItem: true,
                selectItemSelected: curValue === item.value,
                selectItemWhilte: fromPage === 2,
              })}
              value={item.label}
            />
          ))}
        </div>
        <div className={`${styles.aggregationSelectLine} ${styles.aggregationSelectLine1}`}>
          {line2.map((item, index) => (
            <OverflowItem
              key={(item.value as string) + activeKey}
              onClick={() => {
                setCurValue(item.value);
                onchange && onchange(item.value);
              }}
              className={realStyle({
                selectItem: true,
                selectItemSelected: curValue === item.value,
                selectItemWhilte: fromPage === 2,
              })}
              value={item.label}
            />
          ))}
          {line3.length > 0 && (
            <div
              key={100}
              className={realStyle({
                selectItem: true,
                selectItemSelect: true,
                selectItemSelected: line3.some(lineItem => lineItem.value === curValue),
                selectItemWhilte: fromPage === 2,
              })}
            >
              <Select
                className={styles.aggregationSelectBox}
                placeholder={getIn18Text('GENGDUO')}
                value={line3.some(line => line.value === curValue) ? (curValue as number) : undefined}
                bordered={false}
                onChange={value => {
                  setCurValue(value);
                  onchange && onchange(value);
                }}
                style={{
                  width: 82,
                  height: 30,
                }}
              >
                {line3.map(lineItem => (
                  <Option className={styles.aggregationOption} key={lineItem.value as number} value={lineItem.value as number}>
                    {lineItem.label}
                  </Option>
                ))}
              </Select>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
