import { Descriptions, Switch } from 'antd';
import { CustomsRecord } from 'api';
import React, { useState } from 'react';
import styles from './customs-record-detail.module.scss';
import useUselessHideHook from './useUselessHideHook';
import { getCustomsRecordSorts, getRecordCountry, getRecordType } from './util';
import classnames from 'classnames';

interface CustomsRecordDetailProps {
  record?: CustomsRecord;
  onSearchCompany?(type: 'import' | 'export'): void;
}

const CustomsRecordDetail: React.FC<CustomsRecordDetailProps> = ({ record, onSearchCompany }) => {
  const [hideUseless, setHideUseless] = useUselessHideHook();
  if (!record) {
    return null;
  }
  return (
    <div className={styles.wrapper}>
      <div className={styles.detailTitle}>
        <h2>
          {getRecordCountry(record)}
          {getRecordType(record.recordType, true)}贸易详情
        </h2>
        <div className={styles.switchHide}>
          <Switch checked={hideUseless} onChange={setHideUseless} />
          <span className={styles.switchHideText}>隐藏无信息字段</span>
        </div>
      </div>
      <div>
        {getCustomsRecordSorts(record).map(desc => (
          <Descriptions className={styles.description} key={desc.title} title={desc.title} column={2} bordered>
            {desc.items
              .filter(item => (hideUseless ? !!item.value : true))
              .map((item, index, arr) => {
                const isSingleItemInOneRow = arr.length % 2 === 1 && index === arr.length - 1;
                return (
                  <Descriptions.Item
                    key={item.label}
                    label={item.label}
                    contentStyle={
                      isSingleItemInOneRow
                        ? {
                            width: 'auto',
                          }
                        : undefined
                    }
                    className={styles.descriptionItem}
                  >
                    <span
                      onClick={() => {
                        if (item.searchType && onSearchCompany) {
                          onSearchCompany(item.searchType);
                        }
                      }}
                      className={classnames({
                        [styles.canSearch]: item.searchType,
                      })}
                    >
                      {item.value || '-'}
                    </span>
                  </Descriptions.Item>
                );
              })}
          </Descriptions>
        ))}
      </div>
    </div>
  );
};

export default CustomsRecordDetail;
