import React, { useMemo, useState, useEffect } from 'react';
import { apiHolder, apis, AutoMarketApi, AutoMarketTaskActionContent } from 'api';
import { getIn18Text } from 'api';

interface Props {
  rules: AutoMarketTaskActionContent.UPDATE_CUSTOMER;
}

interface FieldsMap {
  name: string;
  selectMap: Record<string, string> | null;
}

const autoMarketApi = apiHolder.api.requireLogicalApi(apis.autoMarketApiImpl) as unknown as AutoMarketApi;
export const UpdateCustomerInfo: React.FC<Props> = props => {
  const { rules = [] } = props;
  const [loading, setLoading] = useState(true);
  const [fieldsMap, setFieldsMap] = useState<Record<string, FieldsMap>>({});

  async function handleUpdateCustomerFieldsFetch() {
    setLoading(true);
    const res = await autoMarketApi.getCustomerUpdateFields();
    const map = (res?.customerUpdateActionItems || []).reduce((pre, cur) => {
      let fieldInfo: FieldsMap = { name: '', selectMap: null };
      fieldInfo.name = cur.fieldShowName;
      if (cur?.fieldValues?.length) {
        const selectMap = cur.fieldValues.reduce((selectMap, cur) => {
          selectMap[cur.value] = cur.label;
          return selectMap;
        }, {} as Record<string, string>);
        fieldInfo.selectMap = selectMap;
      }
      pre[cur.fieldName] = fieldInfo;
      return pre;
    }, {} as Record<string, FieldsMap>);
    setFieldsMap(map);
    setLoading(false);
  }

  useEffect(() => {
    handleUpdateCustomerFieldsFetch();
  }, []);

  const text = useMemo(() => {
    if (loading) {
      return getIn18Text('JIAZAIZHONG..');
    }
    const ruleDisplay: string[] = [];
    rules.forEach(rule => {
      const name = fieldsMap[rule.fieldName]?.name || '';
      let value = rule.updateValue;
      if (fieldsMap?.[rule.fieldName]?.selectMap) {
        value = fieldsMap[rule.fieldName].selectMap?.[rule.updateValue] || '';
      }
      if (name) {
        ruleDisplay.push(`将${name}添加${value}`);
      }
    });
    return ruleDisplay.map(value => (
      <>
        <div>{value}</div>
      </>
    ));
  }, [fieldsMap, rules, loading]);

  return <div>{text}</div>;
};
