import { EdmCustomsApi, TCustomsPort, apiHolder, apis } from 'api';
import debounce from 'lodash/debounce';
import React, { useMemo, useRef, useState } from 'react';
// import { EnhanceSelect, InMultiOption } from '@web-common/components/UI/Select';
// import { EnhanceProps } from '@web-common/components/UI/Select/enhanceSelect';
import { EnhanceSelect, InMultiOption, EnhanceSelectProps } from '@lingxi-common-component/sirius-ui/Select';
import styles from './remoteselect.module.scss';
import uniqBy from 'lodash/uniqBy';
import { Tooltip } from 'antd';

const edmCustomsApi = apiHolder.api.requireLogicalApi(apis.edmCustomsApiImpl) as EdmCustomsApi;

export interface DebounceSelectProps<ValueType = any> extends Omit<EnhanceSelectProps<ValueType | ValueType[]>, 'options' | 'children'> {
  debounceTimeout?: number;
  groupPorts?: Array<{
    ports: TCustomsPort[];
    label: string;
  }>;
}

const RemotePortSelect: React.FC<DebounceSelectProps> = ({ groupPorts, onChange, debounceTimeout = 800, ...props }) => {
  const [fetching, setFetching] = useState(false);
  const [options, setOptions] = useState<Array<{ label: string; value: string; count?: number }>>([]);
  const fetchRef = useRef(0);
  const [parmasOption, setParmasOption] = useState<Array<{ label: string; value: string }>>([]);

  const debounceFetcher = useMemo(() => {
    const loadOptions = (value: string) => {
      fetchRef.current += 1;
      const fetchId = fetchRef.current;
      setOptions([]);
      setFetching(true);
      if (!value) {
        setOptions([]);
        return;
      }
      edmCustomsApi
        .doGetForwarderPortSuggest({
          text: value,
        })
        .then(newOptions => {
          if (fetchId !== fetchRef.current) {
            // for fetch callback order
            return;
          }
          setOptions(
            uniqBy(newOptions, 'keyword').map(op => ({
              label: op.keywordCn || op.keyword,
              value: op.keyword,
              count: op.count,
            }))
          );
          setFetching(false);
        });
    };

    return debounce(loadOptions, debounceTimeout);
  }, [debounceTimeout]);

  // 处理重复value的港口
  // 搜索的option有值 直接不展示
  const processedGroupPorts = useMemo(() => {
    if (options && options.length > 0) {
      return [];
    }
    return groupPorts;
    // ?.map(g => ({
    //   ...g,
    //   ports: g.ports.filter(e => !searchedKeys.includes(e.name)),
    // }))
    // .filter(e => e.ports.length > 0);
  }, [options, groupPorts]);

  const handleChange: DebounceSelectProps['onChange'] = (a, b) => {
    setParmasOption(a || []);
    onChange?.(a, b);
    setOptions([]);
  };
  const handleDisAbledOptions = (val: string): boolean => {
    const parmasOptionVal = parmasOption.length > 0 ? parmasOption?.map(item => item?.value) : [];
    if (parmasOption.length === 5) {
      return !parmasOptionVal.includes(val);
    }
    return false;
  };
  return (
    // optionLabelProp = "tag" 和 option.props.tag 配合使用
    <EnhanceSelect
      maxTagPlaceholder={omitValues => {
        return <Tooltip title={omitValues.map(e => (e as any).tag || e.label || e.value).join('、')}>+{omitValues.length}...</Tooltip>;
      }}
      showSearch
      optionLabelProp="tag"
      dropdownMatchSelectWidth={false}
      filterOption={false}
      onSearch={debounceFetcher}
      fetching={fetching}
      onChange={handleChange}
      {...props}
    >
      {options.map(node => (
        <InMultiOption key={node.value} value={node.value} tag={node.label || node.value} disabled={handleDisAbledOptions(node.value)}>
          <div className={styles.labelFlex}>
            {node.label && <span>{node.label}</span>}
            {node.value && <span>{node.value}</span>}
            {node.count && <span className={styles.num}>{node.count}</span>}
          </div>
        </InMultiOption>
      ))}
      {processedGroupPorts?.map(gps => (
        <EnhanceSelect.OptGroup key={gps.label} label={gps.label}>
          {gps.ports.map(node => (
            <InMultiOption key={node.name} value={node.name} tag={node.nameCn || node.name} disabled={handleDisAbledOptions(node.name)}>
              <div className={styles.labelFlex}>
                {node.nameCn && <span className={styles.text}>{node.nameCn}</span>}
                {node.name && <span className={styles.text}>{node.name}</span>}
                {node.recordCnt && <span className={styles.num}>{node.recordCnt}</span>}
              </div>
            </InMultiOption>
          ))}
        </EnhanceSelect.OptGroup>
      ))}
    </EnhanceSelect>
  );
};

export default RemotePortSelect;
