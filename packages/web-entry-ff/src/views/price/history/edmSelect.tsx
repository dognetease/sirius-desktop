import React, { useEffect, useCallback, useState } from 'react';
import { apiHolder, apis, FFMSApi } from 'api';
import classnames from 'classnames';
import { EnhanceSelect, EnhanceSelectProps } from '@web-common/components/UI/Select';
import style from './edmSelect.module.scss';

interface Props extends EnhanceSelectProps<string> {
  onInit?: (val: string) => void;
  freightHistoryId: string;
}

const ffmsApi = apiHolder.api.requireLogicalApi(apis.ffmsApi) as FFMSApi;
export const EdmSelect: React.FC<Props> = props => {
  const { freightHistoryId, onInit, ...restProps } = props;
  const [options, setOptions] = useState<Array<{ label: string; value: string }>>([]);
  const [total, setTotal] = useState(0);

  const fetchEdmList = useCallback(async () => {
    if (!freightHistoryId) {
      return;
    }
    const res = await ffmsApi.getEdmJobList(freightHistoryId);
    setOptions(
      (res?.content || []).map(item => ({
        label: item.edmSubject,
        value: item.edmEmailId,
      }))
    );
    setTotal(res?.content?.length || 0);
  }, [freightHistoryId]);

  useEffect(() => {
    if (onInit) {
      onInit(options?.[0]?.value || '');
    }
  }, [options]);

  useEffect(() => {
    fetchEdmList();
  }, [fetchEdmList]);

  return (
    <div className={style.wrapper}>
      <div className={style.cell}>
        <div className={style.label}>任务名称: </div>
        <div className={style.value}>
          <EnhanceSelect showSearch optionFilterProp="label" options={options} style={{ width: 285 }} {...restProps} />
        </div>
      </div>
      <div className={style.cell}>
        <div className={style.label}>共推送次数: </div>
        <div className={classnames(style.value, style.number)}>{total}次</div>
      </div>
    </div>
  );
};
