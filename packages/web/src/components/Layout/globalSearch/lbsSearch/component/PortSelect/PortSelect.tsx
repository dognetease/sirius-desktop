import { CommonlyUsePortType, EdmCustomsApi, TCustomsPort, apiHolder, apis } from 'api';
import debounce from 'lodash/debounce';
import React, { useMemo, useRef, useState } from 'react';
// import { EnhanceSelect, InMultiOption, InSingleOption } from '@web-common/components/UI/Select';
// import { EnhanceProps } from '@web-common/components/UI/Select/enhanceSelect';
import { EnhanceSelect, InSingleOption, EnhanceSelectProps } from '@lingxi-common-component/sirius-ui/Select';
import styles from './port.module.scss';
import uniqBy from 'lodash/uniqBy';
import { getGroupPorts } from '@/components/Layout/CustomsData/customs/ForwarderSearch/ForwarderSearch';
import { useForwarderCommonlyUsedPort, useForwarderHotPort } from '@/components/Layout/CustomsData/customs/docSearch/hooks/usePortListHook';

const edmCustomsApi = apiHolder.api.requireLogicalApi(apis.edmCustomsApiImpl) as EdmCustomsApi;

export interface DebounceSelectProps<ValueType = any> extends Omit<EnhanceSelectProps<ValueType | ValueType[]>, 'options' | 'children'> {
  debounceTimeout?: number;
}

const commonPortParam = [CommonlyUsePortType.Collection];

const PortSelect: React.FC<DebounceSelectProps> = ({ onChange, debounceTimeout = 800, ...props }) => {
  const [fetching, setFetching] = useState(false);
  const [options, setOptions] = useState<Array<{ label: string; value: string; count?: number }>>([]);
  const pureHotPortsOverSea = useForwarderHotPort(1);
  const [overseaPorts] = useForwarderCommonlyUsedPort(commonPortParam);

  const groupPorts = React.useMemo(() => {
    return getGroupPorts({
      hot: pureHotPortsOverSea,
      collect: overseaPorts,
    });
  }, [pureHotPortsOverSea, overseaPorts]);

  const fetchRef = useRef(0);

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
  }, [options, groupPorts]);

  const handleChange: DebounceSelectProps['onChange'] = (a, b) => {
    onChange?.(a, b);
    setOptions([]);
  };

  return (
    // optionLabelProp = "tag" 和 option.props.tag 配合使用
    <EnhanceSelect dropdownMatchSelectWidth={false} filterOption={false} onSearch={debounceFetcher} fetching={fetching} onChange={handleChange} showSearch {...props}>
      {options.map(node => (
        <InSingleOption key={node.value} value={node.value} tag={node.label || node.value}>
          <div className={styles.labelFlex}>
            {node.label && <span>{node.label}</span>}
            {node.value && <span>{node.value}</span>}
            {node.count && <span className={styles.num}>{node.count}</span>}
          </div>
        </InSingleOption>
      ))}
      {processedGroupPorts?.map(gps => (
        <EnhanceSelect.OptGroup key={gps.label} label={gps.label}>
          {gps.ports.map(node => (
            <InSingleOption key={node.name} value={node.name} tag={node.nameCn || node.name}>
              <div className={styles.labelFlex}>
                {node.nameCn && <span className={styles.text}>{node.nameCn}</span>}
                {node.name && <span className={styles.text}>{node.name}</span>}
                {node.recordCnt && <span className={styles.num}>{node.recordCnt}</span>}
              </div>
            </InSingleOption>
          ))}
        </EnhanceSelect.OptGroup>
      ))}
    </EnhanceSelect>
  );
};

export default PortSelect;
